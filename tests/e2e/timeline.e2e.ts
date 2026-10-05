import { mkdir, writeFile } from 'node:fs/promises';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Browser, Page } from 'playwright-core';
import {
  allProgress,
  desktop,
  launch,
  phone,
  progressKey,
  startServer,
} from './harness';

let server: Awaited<ReturnType<typeof startServer>>;
let browser: Browser;
beforeAll(async () => {
  server = await startServer();
  browser = await launch();
});
afterAll(async () => {
  await browser?.close();
  server?.stop();
});

async function open(options: Parameters<Browser['newContext']>[0]) {
  const context = await browser.newContext(options);
  await context.addInitScript(
    ([key, value]) => localStorage.setItem(key!, value!),
    [progressKey, allProgress],
  );
  const page = await context.newPage();
  await page.goto(server.url + '/');
  await page.waitForSelector('[data-event-id], .chapter-card');
  return { context, page };
}

// Rendered node symbols and labels, in viewport coordinates.
async function boxes(page: Page) {
  return page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('[data-event-id]')].flatMap(
      (node) => {
        const id = node.dataset['eventId']!;
        const parts: Array<[string, Element | null]> = [
          ['símbolo', node.querySelector('.node-symbol')],
          ['etiqueta', node.querySelector('.node-label')],
        ];
        return parts.flatMap(([kind, element]) => {
          const rect = element?.getBoundingClientRect();
          return rect && rect.width > 0
            ? [
                {
                  id,
                  kind: kind!,
                  x: rect.x,
                  y: rect.y,
                  w: rect.width,
                  h: rect.height,
                },
              ]
            : [];
        });
      },
    ),
  );
}
const overlap = (a: Awaited<ReturnType<typeof boxes>>[number], b: typeof a) =>
  a.id !== b.id &&
  a.x < b.x + b.w - 2 &&
  b.x < a.x + a.w - 2 &&
  a.y < b.y + b.h - 2 &&
  b.y < a.y + a.h - 2;

async function zoomPercent(page: Page) {
  const text = await page
    .getByRole('status', { name: 'Nivel de zoom' })
    .textContent();
  return text ? parseInt(text) : null;
}

describe('timeline density and orientation', () => {
  it('has no overlapping symbols or labels at any zoom level in any chapter', async () => {
    const { context, page } = await open(desktop);
    const report: Array<Record<string, unknown>> = [];
    const problems: string[] = [];
    // From the whole-story fit through every detail threshold up to maximum zoom.
    await page.getByRole('button', { name: 'Ver toda la cronología' }).click();
    for (let step = 0; step < 20; step++) {
      const all = await boxes(page);
      const pairs: string[] = [];
      for (let i = 0; i < all.length; i++)
        for (let j = i + 1; j < all.length; j++)
          if (overlap(all[i]!, all[j]!))
            pairs.push(
              `${all[i]!.kind} ${all[i]!.id} × ${all[j]!.kind} ${all[j]!.id}`,
            );
      const zoom = await zoomPercent(page);
      report.push({ step, zoom, nodes: all.length / 2, overlaps: pairs });
      if (pairs.length)
        problems.push(`@${zoom}%: ${pairs.slice(0, 3).join('; ')}`);
      const zoomIn = page.getByRole('button', { name: 'Acercar cronología' });
      if (!(await zoomIn.isEnabled())) break;
      await zoomIn.click();
      await page.waitForTimeout(60);
    }
    await mkdir('.validation/e2e', { recursive: true });
    await writeFile(
      '.validation/e2e/density.json',
      JSON.stringify(report, null, 2),
    );
    await context.close();
    expect(problems).toEqual([]);
  });

  it('keeps the same selection and returns to a comprehensible view from any zoom', async () => {
    const { context, page } = await open(desktop);
    await page.goto(server.url + '/?id=evt-caida-guili');
    await page.waitForSelector('.atlas-detail h3');
    for (let i = 0; i < 4; i++)
      await page.getByRole('button', { name: 'Alejar cronología' }).click();
    expect(new URL(page.url()).searchParams.get('id')).toBe('evt-caida-guili');
    await page.getByRole('button', { name: 'Ver toda la cronología' }).click();
    // The reset leaves the whole story fitted: every chapter marker is on screen.
    const view = page.viewportSize()!;
    const onScreen = await page.evaluate(
      ([width, height]) =>
        [
          ...document.querySelectorAll(
            '[data-event-id], .era-label, .era-group',
          ),
        ].every((element) => {
          const rect = element.getBoundingClientRect();
          return (
            rect.right > 0 &&
            rect.left < width! &&
            rect.bottom > 0 &&
            rect.top < height!
          );
        }),
      [view.width, view.height],
    );
    expect(onScreen).toBe(true);
    expect(await page.locator('.atlas-detail h3').textContent()).toContain(
      'Guili',
    );
    await context.close();
  });

  it('opens a ficha with a tap and pans with a one-finger drag on a phone viewport', async () => {
    const { context, page } = await open(phone);
    // Phone starts on the chapter cards; open the first chapter, then tap a node.
    await page.locator('.chapter-card').first().tap();
    await page.waitForSelector('[data-event-id]');
    const first = page.locator('[data-event-id]').first();
    const id = await first.getAttribute('data-event-id');
    await first.tap();
    await page.waitForSelector('.atlas-detail h3');
    expect(new URL(page.url()).searchParams.get('id')).toBe(id);
    const before = await first.boundingBox();
    // Start the drag on empty canvas: a finger on a node taps it instead.
    const start = await page.evaluate(() => {
      for (let y = 120; y < 330; y += 30)
        for (let x = 30; x < 360; x += 40)
          if (
            document
              .elementFromPoint(x, y)
              ?.classList.contains('timeline-surface')
          )
            return { x, y };
      return null;
    });
    expect(start).not.toBeNull();
    const client = await context.newCDPSession(page);
    const touch = (
      type: 'touchStart' | 'touchMove' | 'touchEnd',
      points: Array<{ x: number; y: number }>,
    ) => client.send('Input.dispatchTouchEvent', { type, touchPoints: points });
    // One finger drags the canvas.
    await touch('touchStart', [start!]);
    for (let step = 1; step <= 8; step++)
      await touch('touchMove', [{ x: start!.x + step * 18, y: start!.y }]);
    await touch('touchEnd', []);
    await page.waitForTimeout(200);
    const after = await first.boundingBox();
    expect(before && after && Math.abs(after.x - before.x) > 60).toBe(true);
    // Two fingers moving apart zoom it.
    const readout = () =>
      page.getByRole('status', { name: 'Nivel de zoom' }).textContent();
    const zoomBefore = parseInt((await readout()) ?? '0');
    const centre = { x: 195, y: 260 };
    await touch('touchStart', [
      { x: centre.x - 20, y: centre.y },
      { x: centre.x + 20, y: centre.y },
    ]);
    for (let step = 1; step <= 8; step++)
      await touch('touchMove', [
        { x: centre.x - 20 - step * 10, y: centre.y },
        { x: centre.x + 20 + step * 10, y: centre.y },
      ]);
    await touch('touchEnd', []);
    await page.waitForTimeout(200);
    expect(parseInt((await readout()) ?? '0')).toBeGreaterThan(zoomBefore);
    await context.close();
  });
});
