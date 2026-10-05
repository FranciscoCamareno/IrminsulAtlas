import { mkdir, writeFile } from 'node:fs/promises';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type {
  Browser,
  BrowserContextOptions,
  Locator,
  Page,
} from 'playwright-core';
import {
  allProgress,
  desktop,
  launch,
  narrow,
  phone,
  progressKey,
  startServer,
} from './harness';
import type { AtlasIndex } from '../../src/domain/schema';

let server: Awaited<ReturnType<typeof startServer>>;
let browser: Browser;
let index: AtlasIndex;
beforeAll(async () => {
  server = await startServer();
  browser = await launch();
  index = (await (
    await fetch(server.url + '/data/index.json')
  ).json()) as AtlasIndex;
});
afterAll(async () => {
  await browser?.close();
  server?.stop();
});

async function open(options: BrowserContextOptions) {
  const context = await browser.newContext(options);
  await context.addInitScript(
    ([key, value]) => localStorage.setItem(key!, value!),
    [progressKey, allProgress],
  );
  return { context, page: await context.newPage() };
}
const record: Array<Record<string, unknown>> = [];
async function save(name: string) {
  await mkdir('.validation/e2e', { recursive: true });
  await writeFile(
    `.validation/e2e/${name}.json`,
    JSON.stringify(record, null, 2),
  );
}

// Everything a reader could trip over on one open ficha, measured in the browser.
async function inspect(page: Page, id: string) {
  return page.evaluate((eventId) => {
    const detail = document.querySelector('.atlas-detail');
    const heading = detail?.querySelector('h3');
    const clipped = [...(detail?.querySelectorAll('*') ?? [])]
      .filter((element) => {
        const style = getComputedStyle(element);
        return (
          element.scrollWidth > element.clientWidth + 1 &&
          style.overflowX === 'visible'
        );
      })
      .map((element) => element.tagName + '.' + element.className)
      .slice(0, 3);
    const node = document.querySelector<HTMLElement>(
      `[data-event-id="${eventId}"]`,
    );
    const box = node?.getBoundingClientRect();
    const panel = detail?.getBoundingClientRect();
    const centre = box
      ? { x: box.x + box.width / 2, y: box.y + box.height / 2 }
      : null;
    const top = centre ? document.elementFromPoint(centre.x, centre.y) : null;
    return {
      title: heading?.textContent ?? null,
      pageOverflow: document.documentElement.scrollWidth - innerWidth,
      clipped,
      nodeInViewport:
        !!centre &&
        centre.x > 0 &&
        centre.x < innerWidth &&
        centre.y > 0 &&
        centre.y < innerHeight,
      nodeUnderPanel:
        !!centre &&
        !!panel &&
        centre.x >= panel.left &&
        centre.x <= panel.right &&
        centre.y >= panel.top &&
        centre.y <= panel.bottom,
      nodeClickable: !!top && !!node && (top === node || node.contains(top)),
      claims: detail?.querySelectorAll('[data-claim-id]').length ?? 0,
    };
  }, id);
}

// What a reader does when a node is off screen: drag the empty canvas.
async function bringIntoView(page: Page, node: Locator): Promise<number> {
  let drags = 0;
  for (; drags < 12; drags++) {
    const box = await node.boundingBox();
    const view = page.viewportSize()!;
    if (!box) return drags;
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    if (x > 120 && x < view.width - 120 && y > 170 && y < view.height - 150)
      return drags;
    // Empty canvas: a corner far from nodes, labels and controls.
    const start = await page.evaluate(() => {
      for (const [px, py] of [
        [300, 300],
        [900, 300],
        [300, 600],
        [900, 560],
        [650, 200],
      ]) {
        const top = document.elementFromPoint(px!, py!);
        if (top?.classList.contains('timeline-surface')) return [px, py];
      }
      return null;
    });
    if (!start) return drags;
    const dx = Math.max(-420, Math.min(420, view.width / 2 - x));
    const dy = Math.max(-420, Math.min(420, view.height / 2 - y));
    await page.mouse.move(start[0]!, start[1]!);
    await page.mouse.down();
    await page.mouse.move(start[0]! + dx, start[1]! + dy, { steps: 6 });
    await page.mouse.up();
    await page.waitForTimeout(60);
  }
  return drags;
}

describe('reading all events', () => {
  for (const [name, options] of [
    ['desktop', desktop],
    ['phone', phone],
    ['narrow', narrow],
  ] as const) {
    it(`opens every ficha without clipped text, overflow or a hidden node (${name})`, async () => {
      const { context, page } = await open(options);
      const problems: string[] = [];
      for (const event of index.events) {
        await page.goto(`${server.url}/?id=${event.id}`);
        await page.waitForSelector('.atlas-detail h3');
        await page.waitForTimeout(120);
        const result = await inspect(page, event.id);
        record.push({ viewport: name, id: event.id, ...result });
        if (result.title !== event.title)
          problems.push(`${event.id}: título «${result.title}»`);
        if (result.pageOverflow > 0)
          problems.push(
            `${event.id}: desborde de página ${result.pageOverflow}px`,
          );
        if (result.clipped.length)
          problems.push(
            `${event.id}: texto cortado en ${result.clipped.join(', ')}`,
          );
        if (!result.nodeInViewport)
          problems.push(
            `${event.id}: el nodo seleccionado queda fuera de la vista`,
          );
        if (result.nodeUnderPanel)
          problems.push(`${event.id}: la ficha tapa el nodo seleccionado`);
        if (!result.nodeClickable)
          problems.push(
            `${event.id}: el nodo seleccionado está cubierto por otro elemento`,
          );
      }
      await context.close();
      await save('reading-' + name);
      expect(problems).toEqual([]);
    });
  }

  it('reaches every event from the list and, by dragging, from its chapter on the timeline', async () => {
    const { context, page } = await open(desktop);
    await page.goto(server.url + '/?vista=lista');
    await page.waitForSelector('[data-list-event-id]');
    expect(await page.locator('[data-list-event-id]').count()).toBe(
      index.events.length,
    );
    const problems: string[] = [];
    const drags: Record<string, number> = {};
    for (const event of index.events) {
      await page.goto(`${server.url}/`);
      await page.waitForSelector('[data-event-id]');
      await page.selectOption('.chapter-jump select', event.eraId);
      await page.waitForTimeout(100);
      const node = page.locator(`[data-event-id="${event.id}"]`);
      if (!(await node.count())) {
        problems.push(`${event.id}: no aparece al saltar a su capítulo`);
        continue;
      }
      drags[event.id] = await bringIntoView(page, node);
      await node
        .click({ timeout: 4000 })
        .catch(() => problems.push(`${event.id}: el nodo no admite clic`));
      const opened = await page
        .waitForFunction(
          (id) => new URLSearchParams(location.search).get('id') === id,
          event.id,
          { timeout: 2000 },
        )
        .then(
          () => true,
          () => false,
        );
      if (!opened) problems.push(`${event.id}: el clic no abre la ficha`);
    }
    record.push({ viewport: 'desktop', dragsToReach: drags });
    await save('reach');
    await context.close();
    expect(problems).toEqual([]);
  });

  it('keeps the selection and the surrounding view across resize, back and reload', async () => {
    const { context, page } = await open(desktop);
    await page.goto(`${server.url}/?id=evt-remuria`);
    await page.waitForSelector('.atlas-detail h3');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(250);
    expect(await page.locator('.atlas-detail h3').textContent()).toBe(
      index.events.find((event) => event.id === 'evt-remuria')!.title,
    );
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.locator('[data-event-id="evt-remuria"]').waitFor();
    await page.goto(
      `${server.url}/?id=evt-remuria&vista=lista&region=Fontaine`,
    );
    await page.waitForSelector('[data-list-event-id]');
    await page.goBack();
    await page.goForward();
    await page.reload();
    await page.waitForSelector('[data-list-event-id]');
    expect(new URL(page.url()).searchParams.get('region')).toBe('Fontaine');
    await context.close();
  });
});
