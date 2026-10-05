import { mkdir, writeFile } from 'node:fs/promises';
import { cpus } from 'node:os';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type {
  Browser,
  BrowserContextOptions,
  CDPSession,
  Page,
} from 'playwright-core';
import {
  allProgress,
  desktop,
  launch,
  phone,
  progressKey,
  startServer,
} from './harness';
import { densify } from './synthetic';
import type { AtlasIndex, EventDetailFile } from '../../src/domain/schema';

let server: Awaited<ReturnType<typeof startServer>>;
let browser: Browser;
let realIndex: AtlasIndex;
beforeAll(async () => {
  server = await startServer();
  browser = await launch();
  realIndex = (await (
    await fetch(server.url + '/data/index.json')
  ).json()) as AtlasIndex;
});
const report: Record<string, unknown> = {};
afterAll(async () => {
  report['conditions'] = {
    date: new Date().toISOString(),
    node: process.version,
    chromium: browser?.version(),
    cpu: cpus()[0]?.model,
    logicalCpus: cpus().length,
    server: 'servidor estático local con gzip, sin limitación de red',
    mode: 'Chromium sin interfaz; compilación de producción',
  };
  await mkdir('.validation/e2e', { recursive: true });
  await writeFile(
    '.validation/e2e/performance.json',
    JSON.stringify(report, null, 2),
  );
  await browser?.close();
  server?.stop();
});

const percentile = (values: number[], p: number) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.length
    ? sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))]!
    : 0;
};

async function session(
  options: BrowserContextOptions,
  setup?: (page: Page) => Promise<void>,
  throttle = 1,
) {
  const context = await browser.newContext(options);
  await context.addInitScript(
    ([key, value]) => localStorage.setItem(key!, value!),
    [progressKey, allProgress],
  );
  // Layout shift and long tasks are collected from the start of the page.
  await context.addInitScript(() => {
    const w = window as unknown as Record<string, unknown>;
    w['__cls'] = 0;
    w['__long'] = [] as number[];
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as unknown as Array<{
        value: number;
        hadRecentInput: boolean;
      }>)
        if (!entry.hadRecentInput)
          w['__cls'] = (w['__cls'] as number) + entry.value;
    }).observe({ type: 'layout-shift', buffered: true });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries())
        (w['__long'] as number[]).push(entry.duration);
    }).observe({ type: 'longtask', buffered: true });
  });
  const page = await context.newPage();
  const client: CDPSession = await context.newCDPSession(page);
  await client.send('Network.enable');
  let encoded = 0;
  const sizes = new Map<string, number>();
  const urls = new Map<string, string>();
  client.on('Network.responseReceived', (event) =>
    urls.set(event.requestId, event.response.url),
  );
  client.on('Network.loadingFinished', (event) => {
    encoded += event.encodedDataLength;
    sizes.set(
      urls.get(event.requestId) ?? event.requestId,
      event.encodedDataLength,
    );
  });
  if (throttle > 1)
    await client.send('Emulation.setCPUThrottlingRate', { rate: throttle });
  await setup?.(page);
  return { context, page, client, bytes: () => encoded, sizes };
}

async function measureLoad(page: Page, url: string) {
  const started = Date.now();
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForSelector('[data-event-id], .chapter-card');
  const firstContent = Date.now() - started;
  const vitals = await page.evaluate(
    () =>
      new Promise<{ fcp: number | null; lcp: number | null }>((resolve) => {
        let fcp: number | null = null;
        let lcp: number | null = null;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries())
            if (entry.name === 'first-contentful-paint') fcp = entry.startTime;
        }).observe({ type: 'paint', buffered: true });
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) lcp = entry.startTime;
        }).observe({ type: 'largest-contentful-paint', buffered: true });
        setTimeout(() => resolve({ fcp, lcp }), 400);
      }),
  );
  const extra = await page.evaluate(() => ({
    cls: (window as unknown as Record<string, number>)['__cls'],
    longTasks: (window as unknown as Record<string, number[]>)['__long'],
  }));
  return {
    firstContentMs: firstContent,
    ...vitals,
    cls: extra.cls,
    longTaskMs: extra.longTasks,
  };
}

// Frame times while zooming and panning continuously through wheel/drag input.
async function frameTimes(page: Page) {
  return page.evaluate(
    () =>
      new Promise<number[]>((resolve) => {
        const surface =
          document.querySelector<HTMLElement>('.timeline-surface')!;
        const frames: number[] = [];
        let last = performance.now();
        let count = 0;
        const rect = surface.getBoundingClientRect();
        const tick = (now: number) => {
          frames.push(now - last);
          last = now;
          const deltaY = count < 40 ? -120 : 120;
          surface.dispatchEvent(
            new WheelEvent('wheel', {
              deltaY,
              clientX: rect.x + rect.width / 2,
              clientY: rect.y + rect.height / 2,
              bubbles: true,
              cancelable: true,
            }),
          );
          if (++count < 80) requestAnimationFrame(tick);
          else resolve(frames.slice(2));
        };
        requestAnimationFrame(tick);
      }),
  );
}

async function interactions(page: Page, title: string) {
  const out: Record<string, number> = {};
  // Opening a ficha from the list.
  await page.goto(page.url().split('?')[0] + '?vista=lista');
  await page.waitForSelector('[data-list-event-id]');
  let t = Date.now();
  await page.locator('[data-list-event-id]').nth(3).click();
  await page.waitForSelector('.atlas-detail h3');
  out['openFichaMs'] = Date.now() - t;
  // Search: time from typing to an updated, filtered list.
  await page.getByRole('button', { name: 'Buscar y filtrar' }).click();
  const before = await page.locator('[data-list-event-id]').count();
  t = Date.now();
  await page.getByRole('searchbox').fill(title);
  await page.waitForFunction(
    (count) =>
      document.querySelectorAll('[data-list-event-id]').length !== count,
    before,
    { timeout: 10000 },
  );
  out['searchMs'] = Date.now() - t;
  out['resultCount'] = await page.locator('[data-list-event-id]').count();
  return out;
}

describe('performance and limits of the production build', () => {
  it('measures the real corpus: initial transfer, first content, shifts, interactions and zoom', async () => {
    for (const [name, options, throttle] of [
      ['escritorio', desktop, 1],
      ['teléfono (CPU ×4 más lenta)', phone, 4],
    ] as const) {
      const run = await session(options, undefined, throttle);
      const load = await measureLoad(run.page, server.url + '/');
      const initialBytes = run.bytes();
      const initialRequests = [...run.sizes.entries()].map(([url, bytes]) => [
        url.replace(server.url, ''),
        bytes,
      ]);
      await run.page.goto(server.url + '/?id=evt-hiperborea');
      await run.page.waitForSelector('.atlas-detail h3');
      const frames = await frameTimes(run.page);
      const interaction = await interactions(run.page, 'Natlan');
      report[`real · ${name}`] = {
        ...load,
        transferredOnLoadBytes: initialBytes,
        requestsOnLoad: initialRequests,
        frameMs: frames.length
          ? {
              p50: percentile(frames, 0.5),
              p95: percentile(frames, 0.95),
              max: Math.max(...frames),
            }
          : null,
        ...interaction,
      };
      expect(initialBytes).toBeLessThan(180_000);
      expect(load.cls).toBeLessThan(0.1);
      await run.context.close();
    }
  });

  it('keeps the corpus data out of the first load and fetches detail and search on demand', async () => {
    const run = await session(desktop);
    await run.page.goto(server.url + '/');
    await run.page.waitForSelector('[data-event-id]');
    const first = [...run.sizes.keys()].map((url) =>
      url.replace(server.url, ''),
    );
    expect(first.some((url) => url.startsWith('/data/events/'))).toBe(false);
    expect(first.some((url) => url.endsWith('search.json'))).toBe(false);
    await run.page.locator('[data-event-id]').first().click();
    await run.page.waitForSelector('.atlas-detail h3');
    expect(
      [...run.sizes.keys()].some((url) => url.includes('/data/events/')),
    ).toBe(true);
    await run.context.close();
  });

  it('keeps working with a dense synthetic data set (about 10× the corpus)', async () => {
    const copies = 10;
    const details = async (id: string) =>
      (await (
        await fetch(`${server.url}/data/events/${id}.json`)
      ).json()) as EventDetailFile;
    const dense = densify(realIndex, details, copies);
    const run = await session(desktop, async (page) => {
      await page.route('**/data/index.json', (route) =>
        route.fulfill({ json: dense.index }),
      );
      await page.route('**/data/events/sintetico-*.json', async (route) => {
        const id = decodeURIComponent(
          route.request().url().split('/').pop()!.replace('.json', ''),
        );
        await route.fulfill({ json: await dense.detail(id) });
      });
    });
    const load = await measureLoad(run.page, server.url + '/');
    const nodes = await run.page.locator('[data-event-id]').count();
    const frames = await frameTimes(run.page);
    const interaction = await interactions(run.page, 'sintético 7');
    report['sintético denso · escritorio'] = {
      events: dense.index.events.length,
      relations: dense.index.relations.length,
      renderedNodesAtStart: nodes,
      indexBytesIdentity: JSON.stringify(dense.index).length,
      ...load,
      frameMs: {
        p50: percentile(frames, 0.5),
        p95: percentile(frames, 0.95),
        max: Math.max(...frames),
      },
      ...interaction,
    };
    expect(interaction['searchMs']).toBeLessThan(5000);
    await run.context.close();
  });

  it('groups a dense set into markers, keeps the selection individual, and splits groups when zooming in', async () => {
    const details = async (id: string) =>
      (await (
        await fetch(`${server.url}/data/events/${id}.json`)
      ).json()) as EventDetailFile;
    const dense = densify(realIndex, details, 10);
    const run = await session(desktop, async (page) => {
      await page.route('**/data/index.json', (route) =>
        route.fulfill({ json: dense.index }),
      );
      await page.route('**/data/events/sintetico-*.json', async (route) => {
        const id = decodeURIComponent(
          route.request().url().split('/').pop()!.replace('.json', ''),
        );
        await route.fulfill({ json: await dense.detail(id) });
      });
    });
    const selected = dense.index.events.find(
      (event) => event.importance === 'major',
    )!.id;
    await run.page.goto(`${server.url}/?id=${selected}`);
    await run.page.waitForSelector('.atlas-detail h3');
    await run.page
      .getByRole('button', { name: 'Ver toda la cronología' })
      .click();
    for (let step = 0; step < 4; step++)
      await run.page
        .getByRole('button', { name: 'Acercar cronología' })
        .click();
    await run.page.waitForTimeout(200);
    const groups = run.page.locator('.timeline-group');
    const count = await groups.count();
    // The selected node is never swallowed by a group.
    expect(
      await run.page.locator(`[data-event-id="${selected}"]`).count(),
    ).toBe(1);
    if (count > 0) {
      const members = (await groups.allTextContents()).reduce(
        (sum, text) => sum + Number(text),
        0,
      );
      expect(members).toBeGreaterThan(count);
      const before = await run.page
        .getByRole('status', { name: 'Nivel de zoom' })
        .textContent();
      await groups.first().click();
      const after = await run.page
        .getByRole('status', { name: 'Nivel de zoom' })
        .textContent();
      expect(parseInt(after ?? '0')).toBeGreaterThan(parseInt(before ?? '0'));
    }
    report['agrupación densa'] = { groupsAtFit: count };
    await run.context.close();
  });
});
