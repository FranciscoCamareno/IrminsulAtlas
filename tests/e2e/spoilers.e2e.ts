import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Browser } from 'playwright-core';
import {
  allProgress,
  desktop,
  launch,
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

// The files of a static site stay public: what is guaranteed is that no page's
// initial HTML, title or description names hidden content.
describe('spoiler surfaces in the built site', () => {
  it('serves pages whose HTML, title and description reveal no title, name or text', async () => {
    const real = await Promise.all(
      index.events.map(async (event) => [
        event.title,
        (
          (await (
            await fetch(`${server.url}/data/events/${event.id}.json`)
          ).json()) as { body: string }
        ).body.slice(0, 60),
      ]),
    );
    for (const path of [
      '/',
      '/evento/',
      '/lista/',
      '/dossier/guia/',
      '/dossier/historia/',
      '/dossier/lugares/',
      '/dossier/personajes/',
      '/404.html',
    ]) {
      const html = await (await fetch(server.url + path)).text();
      const visible = html.replaceAll('Irminsul', '');
      for (const [title, start] of real) {
        expect(visible, `${path} muestra el título «${title}»`).not.toContain(
          title,
        );
        expect(visible, `${path} muestra texto de «${title}»`).not.toContain(
          start,
        );
      }
      for (const entity of index.entities)
        if (entity.name.length > 5)
          expect(visible, `${path} muestra «${entity.name}»`).not.toContain(
            entity.name,
          );
    }
  });

  it('asks on the first visit, shows neutral content before a choice, and respects a lowered progress', async () => {
    const context = await browser.newContext(desktop);
    const page = await context.newPage();
    await page.goto(server.url + '/?id=evt-cataclismo');
    await page.waitForSelector('dialog.progress-dialog[open]');
    const body = (await page.locator('body').innerText()).toLowerCase();
    for (const event of index.events)
      expect(body).not.toContain(event.title.toLowerCase());
    await page.getByRole('radio', { name: /hasta Mondstadt/ }).check();
    await page.getByRole('button', { name: 'Aplicar' }).click();
    expect(await page.locator('.atlas-detail').textContent()).toContain(
      'Contenido no disponible',
    );
    expect(await page.locator('.atlas-detail').textContent()).not.toContain(
      'Cataclismo',
    );
    await page.getByRole('button', { name: 'Revisar progreso' }).click();
    await page.getByRole('radio', { name: /Mostrar todo/ }).check();
    await page.getByRole('button', { name: 'Aplicar' }).click();
    await page.waitForSelector('.atlas-detail h3');
    // Lowering progress with the ficha open returns it to the neutral state.
    await page.getByRole('button', { name: /Progreso de lectura/ }).click();
    await page.getByRole('radio', { name: /Aún no he jugado/ }).check();
    await page.getByRole('button', { name: 'Aplicar' }).click();
    expect(await page.locator('.atlas-detail h3').count()).toBe(0);
    expect(await page.locator('body').innerText()).not.toContain('Cataclismo');
    await context.close();
  });

  it('keeps the complete dossier documents closed until «Mostrar todo»', async () => {
    const context = await browser.newContext(desktop);
    const page = await context.newPage();
    await page.goto(server.url + '/dossier/historia/');
    await page
      .getByRole('heading', { name: 'Documento con spoilers' })
      .waitFor();
    expect(await page.locator('.dossier-prose').count()).toBe(0);
    await page.getByRole('button', { name: 'Mostrar todo y leer' }).click();
    await page.waitForSelector('.dossier-prose');
    await context.close();
    const stored = await browser.newContext(desktop);
    await stored.addInitScript(
      ([key, value]) => localStorage.setItem(key!, value!),
      [progressKey, allProgress],
    );
    const again = await stored.newPage();
    await again.goto(server.url + '/dossier/historia/#evt-remuria');
    await again.waitForSelector('#evt-remuria');
    await stored.close();
  });
});
