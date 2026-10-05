import { mkdir, writeFile } from 'node:fs/promises';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import AxeBuilder from '@axe-core/playwright';
import type { Browser, BrowserContextOptions, Page } from 'playwright-core';
import {
  allProgress,
  desktop,
  launch,
  narrow,
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

async function open(options: BrowserContextOptions, stored = true) {
  const context = await browser.newContext(options);
  if (stored)
    await context.addInitScript(
      ([key, value]) => localStorage.setItem(key!, value!),
      [progressKey, allProgress],
    );
  return { context, page: await context.newPage() };
}
const results: Array<Record<string, unknown>> = [];
async function scan(page: Page, label: string) {
  const outcome = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  const found = outcome.violations.map((violation) => ({
    rule: violation.id,
    impact: violation.impact,
    nodes: violation.nodes.length,
    sample: violation.nodes[0]?.target,
    help: violation.help,
  }));
  results.push({ label, passes: outcome.passes.length, violations: found });
  return found;
}
afterAll(async () => {
  await mkdir('.validation/e2e', { recursive: true });
  await writeFile(
    '.validation/e2e/accessibility.json',
    JSON.stringify(results, null, 2),
  );
});

const blocking = (items: Awaited<ReturnType<typeof scan>>) =>
  items.filter(
    (item) => item.impact === 'critical' || item.impact === 'serious',
  );

describe('automated accessibility checks (WCAG 2.2 A/AA rules)', () => {
  for (const light of [false, true]) {
    const theme = light ? 'claro' : 'oscuro';
    it(`has no serious or critical violations across the main flows (${theme} theme)`, async () => {
      const { context, page } = await open(desktop);
      await page.goto(server.url + '/');
      await page.waitForSelector('[data-event-id]');
      if (light) {
        await page.getByRole('button', { name: 'Abrir menú' }).click();
        await page.getByRole('button', { name: /tema claro/ }).click();
        await page.keyboard.press('Escape');
      }
      const found = [...(await scan(page, `cronología (${theme})`))];
      await page.getByRole('button', { name: 'Buscar y filtrar' }).click();
      await page.getByRole('searchbox').fill('Guili');
      found.push(...(await scan(page, `búsqueda abierta (${theme})`)));
      await page.goto(server.url + '/?vista=lista');
      await page.waitForSelector('[data-list-event-id]');
      if (light) {
        await page.getByRole('button', { name: 'Abrir menú' }).click();
        await page.getByRole('button', { name: /tema claro/ }).click();
        await page.keyboard.press('Escape');
      }
      found.push(...(await scan(page, `lista (${theme})`)));
      await page.goto(server.url + '/?id=evt-revolucion-vennessa');
      await page.waitForSelector('[data-claim-id]');
      if (light) {
        await page.getByRole('button', { name: 'Abrir menú' }).click();
        await page.getByRole('button', { name: /tema claro/ }).click();
        await page.keyboard.press('Escape');
      }
      found.push(...(await scan(page, `ficha con afirmaciones (${theme})`)));
      await page.goto(server.url + '/?entity=per-koitar');
      await page.waitForSelector('.atlas-detail h3');
      found.push(...(await scan(page, `ficha de personaje (${theme})`)));
      await context.close();
      expect(blocking(found)).toEqual([]);
    });
  }

  it('has no serious or critical violations in dialogs and the spoiler-gated documents', async () => {
    const first = await open(desktop, false);
    await first.page.goto(server.url + '/');
    await first.page.waitForSelector('dialog.progress-dialog[open]');
    const found = [
      ...(await scan(first.page, 'diálogo de progreso (primera visita)')),
    ];
    await first.context.close();
    const { context, page } = await open(desktop);
    await page.goto(server.url + '/');
    await page.waitForSelector('[data-event-id]');
    await page.getByRole('button', { name: 'Abrir menú' }).click();
    found.push(...(await scan(page, 'menú')));
    await page.goto(server.url + '/dossier/historia/');
    await page.getByRole('heading', { name: 'Historia de Teyvat' }).waitFor();
    await page.waitForSelector('.dossier-prose');
    found.push(...(await scan(page, 'documento del dossier (todo visible)')));
    await context.close();
    const gated = await open(desktop, false);
    await gated.page.goto(server.url + '/dossier/historia/');
    await gated.page
      .getByRole('heading', { name: 'Documento con spoilers' })
      .waitFor();
    found.push(
      ...(await scan(gated.page, 'documento del dossier (bloqueado)')),
    );
    await gated.context.close();
    expect(blocking(found)).toEqual([]);
  });
});

describe('keyboard, focus and motion', () => {
  it('reaches the main controls with Tab, shows focus, and returns focus after Escape', async () => {
    const { context, page } = await open(desktop);
    await page.goto(server.url + '/?vista=lista');
    await page.waitForSelector('[data-list-event-id]');
    const visited = new Set<string>();
    for (let i = 0; i < 14; i++) {
      await page.keyboard.press('Tab');
      const state = await page.evaluate(() => {
        const element = document.activeElement as HTMLElement;
        const style = getComputedStyle(element);
        return {
          label:
            element.getAttribute('aria-label') ??
            element.textContent?.trim().slice(0, 30) ??
            element.tagName,
          visible:
            style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0,
        };
      });
      visited.add(state.label);
      expect(state.visible, `sin foco visible en «${state.label}»`).toBe(true);
    }
    expect([...visited].some((label) => /menú/i.test(label))).toBe(true);
    // Open a ficha from the list with the keyboard and close it with Escape.
    const item = page.locator('[data-list-event-id]').nth(2);
    const id = await item.getAttribute('data-list-event-id');
    await item.focus();
    await page.keyboard.press('Enter');
    await page.waitForSelector('.atlas-detail h3');
    expect(await page.evaluate(() => document.activeElement?.id)).toBe(
      'detail-heading',
    );
    await page.keyboard.press('Escape');
    expect(await page.locator('.atlas-detail').count()).toBe(0);
    expect(
      await page.evaluate(() =>
        document.activeElement?.getAttribute('data-list-event-id'),
      ),
    ).toBe(id);
    // The menu dialog closes with Escape and gives focus back to its button.
    await page.getByRole('button', { name: 'Abrir menú' }).click();
    await page.keyboard.press('Escape');
    expect(
      await page.evaluate(() =>
        document.activeElement?.getAttribute('aria-label'),
      ),
    ).toBe('Abrir menú');
    await context.close();
  });

  it('lets a keyboard user pan and zoom the timeline without a pointer', async () => {
    const { context, page } = await open(desktop);
    await page.goto(server.url + '/');
    await page.waitForSelector('[data-event-id]');
    await page.locator('.timeline-surface').focus();
    const x = async () =>
      (await page.locator('[data-event-id]').first().boundingBox())!.x;
    const before = await x();
    await page.keyboard.press('ArrowLeft');
    expect(await x()).toBeGreaterThan(before);
    const zoom = async () =>
      parseInt(
        (await page
          .getByRole('status', { name: 'Nivel de zoom' })
          .textContent()) ?? '0',
      );
    const zoomBefore = await zoom();
    await page.keyboard.press('+');
    expect(await zoom()).toBeGreaterThan(zoomBefore);
    await page.keyboard.press('Home');
    await context.close();
  });

  it('does not animate when the user prefers reduced motion', async () => {
    const context = await browser.newContext({
      ...desktop,
      reducedMotion: 'reduce',
    });
    await context.addInitScript(
      ([key, value]) => localStorage.setItem(key!, value!),
      [progressKey, allProgress],
    );
    const page = await context.newPage();
    await page.goto(server.url + '/?id=evt-remuria');
    await page.waitForSelector('.atlas-detail h3');
    const moving = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('.atlas-shell *')]
        .filter((element) => {
          const style = getComputedStyle(element);
          const longest = Math.max(
            ...style.transitionDuration
              .split(',')
              .map(
                (value) =>
                  parseFloat(value) * (value.includes('ms') ? 0.001 : 1),
              ),
          );
          const animation = Math.max(
            ...style.animationDuration
              .split(',')
              .map(
                (value) =>
                  parseFloat(value) * (value.includes('ms') ? 0.001 : 1),
              ),
          );
          return longest > 0.01 || animation > 0.01;
        })
        .slice(0, 5)
        .map((element) => element.tagName + '.' + element.className),
    );
    await context.close();
    expect(moving).toEqual([]);
  });
});

describe('reflow and browser zoom', () => {
  for (const [name, options] of [
    ['320 px', narrow],
    ['390 px (teléfono)', phone],
    [
      'zoom del navegador al 200 % (683 × 384)',
      { viewport: { width: 683, height: 384 } },
    ],
    [
      'zoom del navegador al 400 % (342 × 192)',
      { viewport: { width: 342, height: 192 } },
    ],
  ] as const) {
    it(`needs no horizontal scrolling and keeps the controls reachable at ${name}`, async () => {
      const { context, page } = await open(options);
      const problems: string[] = [];
      for (const path of [
        '/',
        '/?vista=lista',
        '/?id=evt-hiperborea',
        '/dossier/historia/',
      ]) {
        await page.goto(server.url + path);
        await page.waitForTimeout(250);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - innerWidth,
        );
        if (overflow > 0)
          problems.push(`${path}: desborde horizontal de ${overflow}px`);
      }
      await page.goto(server.url + '/');
      await page.waitForSelector('[data-event-id], .chapter-card');
      for (const label of [
        'Abrir menú',
        'Buscar y filtrar',
        'Mostrar vista de lista',
      ]) {
        const box = await page
          .getByRole('button', { name: label })
          .boundingBox();
        const view = page.viewportSize()!;
        if (
          !box ||
          box.x < 0 ||
          box.x + box.width > view.width ||
          box.y < 0 ||
          box.y + box.height > view.height
        )
          problems.push(`«${label}» fuera de la ventana`);
        else if (box.width < 24 || box.height < 24)
          problems.push(`«${label}» menor de 24×24 px`);
      }
      await context.close();
      expect(problems).toEqual([]);
    });
  }
});
