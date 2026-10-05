// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TimelineExplorer from '../src/components/explorer/TimelineExplorer';
import { loadLocalContent } from '../src/content/local';
import { loadDossierContent } from '../src/content/dossier';
import { buildAtlasData } from '../src/content/atlas-data';
import {
  createMemorySource,
  AtlasLoadError,
  type AtlasSource,
} from '../src/application/data-source';
import { storeChoice, type ProgressChoice } from '../src/application/progress';
import type { Dataset } from '../src/domain/schema';
import { attachViewport } from '../src/visualization/viewport';
import type { Viewport } from '../src/visualization/layout';

const dataset = await loadLocalContent();
const dossier = await loadDossierContent();
let host: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
  // jsdom has no layout engine or native modal presentation; simulate those boundaries only.
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    get: () => 1280,
  });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    get: () => 720,
  });
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
    this.dispatchEvent(new Event('close'));
  };
  if (!globalThis.CSS)
    vi.stubGlobal('CSS', {
      escape: (value: string) => value.replace(/[^a-z0-9-]/gi, ''),
    });
  else if (!CSS.escape)
    CSS.escape = (value: string) => value.replace(/[^a-z0-9-]/gi, '');
  window.history.replaceState(null, '', '/');
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});
// Data arrives asynchronously through the source; wait until the UI is quiet.
async function settle() {
  for (let i = 0; i < 4; i++)
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
}
async function render(
  content: Dataset = dataset,
  choice: ProgressChoice | null | 'keep' = { kind: 'none' },
  source: AtlasSource = createMemorySource(buildAtlasData(content)),
) {
  if (choice !== 'keep') {
    localStorage.clear();
    if (choice) storeChoice(choice);
  }
  await act(async () =>
    root.render(createElement(TimelineExplorer, { source })),
  );
  await settle();
}
async function type(input: HTMLInputElement, value: string) {
  // React tracks the value setter; use the native one so onChange fires.
  Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    'value',
  )!.set!.call(input, value);
  await act(async () => {
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await settle();
}
async function choose(select: HTMLSelectElement, value: string) {
  Object.getOwnPropertyDescriptor(
    HTMLSelectElement.prototype,
    'value',
  )!.set!.call(select, value);
  await act(async () => {
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await settle();
}
function button(label: string) {
  const found = host.querySelector<HTMLButtonElement>(
    `button[aria-label="${label}"]`,
  );
  if (!found) throw new Error(`Missing button: ${label}`);
  return found;
}
async function click(element: HTMLElement) {
  await act(async () => element.click());
  await settle();
}

describe('timeline interaction', () => {
  it('draws every event as a point on a 320 px map and opens a chapter from its name', async () => {
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get: () => 320,
    });
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
      configurable: true,
      get: () => 580,
    });
    await render();
    await click(button('Ver toda la cronología'));
    expect(host.querySelector('[data-level="map"]')).not.toBeNull();
    expect(host.querySelectorAll('[data-event-id]').length).toBeGreaterThan(0);
    expect(host.querySelector('.node-label')).toBeNull();
    expect(host.querySelector('.chapter-card')).toBeNull();
    // A point opens its event straight from the map.
    const point = host.querySelector<HTMLButtonElement>(
      'button[data-event-id]',
    )!;
    await click(point);
    expect(window.location.search).toBe('?id=' + point.dataset['eventId']);
    expect(host.querySelector('.atlas-detail h3')).not.toBeNull();
    await click(button('Cerrar detalle'));
    await click(button('Ver toda la cronología'));
    const chapters = [
      ...host.querySelectorAll<HTMLButtonElement>('.era-label.is-map'),
    ];
    expect(chapters).toHaveLength(4);
    await click(chapters[2]!);
    expect(host.querySelector('[data-level="events"]')).not.toBeNull();
  });
  it('zooms with buttons from the map to details without leaving the timeline', async () => {
    await render();
    expect(host.querySelector('[data-level="events"]')).not.toBeNull();
    expect(host.querySelector('.node-time')).toBeNull();
    for (
      let step = 0;
      step < 12 && !host.querySelector('[data-level="map"]');
      step++
    )
      await click(button('Alejar cronología'));
    expect(host.querySelector('[data-level="map"]')).not.toBeNull();
    // Minor events stay on the map as points; titles wait for the event level.
    expect(
      host.querySelector('[data-event-id="demo-event-03"]'),
    ).not.toBeNull();
    expect(host.querySelector('.node-label')).toBeNull();
    expect(host.querySelector('.chapter-card')).toBeNull();
    for (
      let step = 0;
      step < 12 && !host.querySelector('[data-level="details"]');
      step++
    )
      await click(button('Acercar cronología'));
    expect(host.querySelector('[data-level="details"]')).not.toBeNull();
    expect(host.querySelector('.node-time')).not.toBeNull();
    await click(button('Ver toda la cronología'));
    expect(host.querySelector('.chapter-card')).toBeNull();
    expect(
      host.querySelector('[data-event-id="demo-event-03"]'),
    ).not.toBeNull();
  });
  it('selects a node, follows a connection, restores focus, and responds to history', async () => {
    await render();
    await click(button('Abrir Apertura del refugio'));
    expect(window.location.search).toBe('?id=demo-event-01');
    expect(host.querySelector('.atlas-detail')?.textContent).toContain(
      'Apertura del refugio',
    );
    expect(document.activeElement?.id).toBe('detail-heading');
    await click(
      host.querySelector<HTMLAnchorElement>(
        '.atlas-detail a[href*="demo-event-02"]',
      )!,
    );
    expect(window.location.search).toBe('?id=demo-event-02');
    await act(async () => {
      window.history.replaceState(null, '', '/?id=demo-event-01');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(host.querySelector('.atlas-detail')?.textContent).toContain(
      'Apertura del refugio',
    );
    await click(button('Cerrar detalle'));
    expect(host.querySelector('.atlas-detail')).toBeNull();
    expect(document.activeElement?.getAttribute('data-event-id')).toBe(
      'demo-event-01',
    );
  });
  it('keeps direct links neutral until progress is explicitly changed, and hides them again', async () => {
    window.history.replaceState(null, '', '/evento/?id=demo-event-05');
    await render();
    expect(host.textContent).not.toContain('Hallazgo de la sala interior');
    expect(host.textContent).toContain('Contenido no disponible');
    const choose = async (value: string) => {
      await click(
        [...host.querySelectorAll<HTMLButtonElement>('button')].find((item) =>
          /Revisar progreso|Progreso de lectura/.test(
            item.textContent ?? item.ariaLabel ?? '',
          ),
        ) ?? button('Abrir menú'),
      );
      await click(
        host.querySelector<HTMLInputElement>(`input[value="${value}"]`)!,
      );
      await click(
        host.querySelector<HTMLButtonElement>('.progress-actions button')!,
      );
    };
    await choose('upto:demo-milestone-01');
    expect(host.querySelector('.atlas-detail')?.textContent).toContain(
      'Hallazgo de la sala interior',
    );
    await click(
      button('Progreso de lectura: Hasta Lectura de demostración A. Cambiar'),
    );
    await click(host.querySelector<HTMLInputElement>('input[value="none"]')!);
    await click(
      host.querySelector<HTMLButtonElement>('.progress-actions button')!,
    );
    expect(host.textContent).not.toContain('Hallazgo de la sala interior');
    expect(host.querySelector('[data-event-id="demo-event-05"]')).toBeNull();
    expect(host.querySelector('.atlas-detail')?.textContent).toContain(
      'Contenido no disponible',
    );
  });
  it('provides a list with the same spoiler filtering and works after changing themes', async () => {
    await render();
    await click(button('Mostrar vista de lista'));
    expect(host.querySelectorAll('.atlas-list li')).toHaveLength(13);
    expect(host.querySelector('.atlas-list')?.textContent).not.toContain(
      'Hallazgo de la sala interior',
    );
    await click(button('Abrir menú'));
    // The light «Día» theme is the default; the button switches to «Noche».
    expect(host.querySelector('.atlas-light')).not.toBeNull();
    await click(host.querySelector<HTMLButtonElement>('.theme-button')!);
    expect(host.querySelector('.atlas-light')).toBeNull();
    await click(button('Cerrar menú'));
    await click(button('Mostrar cronología'));
    expect(host.querySelector('.canvas-container.is-hidden')).toBeNull();
  });
  it('supports keyboard panning and leaves browser zoom shortcuts untouched', async () => {
    await render();
    const surface = host.querySelector<HTMLDivElement>('.timeline-surface')!;
    const node = host.querySelector<HTMLButtonElement>(
      '[data-event-id="demo-event-01"]',
    )!;
    const before = parseFloat(node.style.left);
    await act(async () =>
      surface.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'ArrowRight',
          bubbles: true,
          cancelable: true,
        }),
      ),
    );
    expect(parseFloat(node.style.left)).toBeLessThan(before);
    const shortcut = new KeyboardEvent('keydown', {
      key: '+',
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });
    await act(async () => surface.dispatchEvent(shortcut));
    expect(shortcut.defaultPrevented).toBe(false);
  });
});

describe('D3 gesture adapter', () => {
  it('handles wheel and drag, bounds zoom, preserves its anchor and removes listeners', () => {
    let state: Viewport = { x: 0, y: 0, k: 1 };
    const controls = attachViewport(host, (value) => {
      state = value;
    });
    controls.set({ x: 0, y: 0, k: 1 });
    host.dispatchEvent(
      new WheelEvent('wheel', {
        deltaY: -100,
        clientX: 200,
        clientY: 100,
        bubbles: true,
        cancelable: true,
      }),
    );
    expect(state.k).toBeGreaterThan(1);
    expect((200 - state.x) / state.k).toBeCloseTo(200);
    const previous = state.x;
    const mouse = (type: string, clientX: number) => {
      const event = new MouseEvent(type, {
        clientX,
        clientY: 100,
        bubbles: true,
      });
      // Vitest's window proxy is not accepted by jsdom's UIEvent constructor.
      Object.defineProperty(event, 'view', { value: window });
      return event;
    };
    host.dispatchEvent(mouse('mousedown', 100));
    window.dispatchEvent(mouse('mousemove', 170));
    window.dispatchEvent(mouse('mouseup', 170));
    expect(state.x).toBeGreaterThan(previous);
    controls.scale(100);
    expect(state.k).toBe(2.4);
    controls.scale(0.0001);
    expect(state.k).toBe(0.01);
    controls.destroy();
    const final = { ...state };
    host.dispatchEvent(
      new WheelEvent('wheel', { deltaY: -100, bubbles: true }),
    );
    expect(state).toEqual(final);
  });
});

describe('dossier navigation', () => {
  it('keeps the timeline at every zoom at 320 px and shows chapter cards only in the list view', async () => {
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get: () => 320,
    });
    await render(dossier, { kind: 'all' });
    expect(host.querySelector('[data-level="map"]')).not.toBeNull();
    expect(host.querySelectorAll('[data-event-id]')).toHaveLength(
      dossier.events.length,
    );
    expect(host.querySelector('.chapter-card')).toBeNull();
    expect(host.textContent).not.toContain('orrador');
    for (let step = 0; step < 30; step++)
      await click(button('Alejar cronología'));
    expect(host.querySelector('[data-level="map"]')).not.toBeNull();
    expect(host.querySelector('.chapter-card')).toBeNull();
    await click(button('Ver toda la cronología'));
    expect(host.querySelector('.chapter-card')).toBeNull();
    await click(button('Mostrar vista de lista'));
    const cards = [
      ...host.querySelectorAll<HTMLButtonElement>('.chapter-card'),
    ];
    expect(cards).toHaveLength(dossier.eras.length);
    expect(host.querySelectorAll('[data-list-event-id]')).toHaveLength(
      dossier.events.length,
    );
    // jsdom has no layout, so no scrolling either.
    Element.prototype.scrollIntoView ??= () => {};
    await click(cards[1]!);
    expect(document.activeElement?.id).toBe('capitulo-' + dossier.eras[1]!.id);
  });
  it('preserves event context through entity cards, Escape, direct links and history', async () => {
    window.history.replaceState(null, '', '/?id=evt-hiperborea');
    await render(dossier, { kind: 'all' });
    expect(host.querySelector('.atlas-detail')?.textContent).toContain(
      'Hiperbórea, Koitar y Seutervoinen',
    );
    await click(
      host.querySelector<HTMLAnchorElement>(
        '.atlas-detail [data-entity-id="per-koitar"]',
      )!,
    );
    expect(window.location.search).toContain('entity=per-koitar');
    expect(host.querySelector('.atlas-detail h3')?.textContent).toBe('Koitar');
    expect(document.activeElement?.id).toBe('detail-heading');
    await act(async () =>
      host
        .querySelector('.atlas-shell')!
        .dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
        ),
    );
    expect(window.location.search).toBe('?id=evt-hiperborea');
    expect(document.activeElement?.getAttribute('data-entity-id')).toBe(
      'per-koitar',
    );
    await act(async () => {
      window.history.replaceState(null, '', '/?entity=loc-enkanomiya');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(host.querySelector('.atlas-detail h3')?.textContent).toContain(
      'Enkanomiya',
    );
    await click(
      host.querySelector<HTMLAnchorElement>(
        '.atlas-detail a[href="/?id=evt-enkanomiya-watatsumi"]',
      )!,
    );
    expect(window.location.search).toBe('?id=evt-enkanomiya-watatsumi');
    await click(button('Cerrar detalle'));
    expect(document.activeElement?.getAttribute('data-event-id')).toBe(
      'evt-enkanomiya-watatsumi',
    );
  });
  it('opens the complete people directory and handles unknown entity IDs neutrally', async () => {
    await render(dossier, { kind: 'all' });
    await click(button('Abrir menú'));
    const people = [
      ...host.querySelectorAll<HTMLButtonElement>('.atlas-menu button'),
    ].find((item) => item.textContent === 'Personajes')!;
    await click(people);
    expect(host.querySelectorAll('.atlas-list [data-entity-id]')).toHaveLength(
      dossier.entities.filter((entity) => entity.kind === 'character').length,
    );
    await click(
      host.querySelector<HTMLButtonElement>(
        '[data-entity-id="per-vedrfolnir"]',
      )!,
    );
    expect(host.querySelector('.atlas-detail h3')?.textContent).toBe(
      'Vedrfolnir',
    );
    await act(async () => {
      window.history.replaceState(null, '', '/?entity=not-a-person');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(host.querySelector('.atlas-detail')?.textContent).toContain(
      'No se encontró la ficha solicitada.',
    );
  });
});

describe('progress, search and loading', () => {
  const titleOf = (id: string) =>
    dossier.events.find((event) => event.id === id)!.title;

  it('asks for progress on the first visit, shows only permitted content, and remembers the choice', async () => {
    await render(dossier, null);
    const dialog = host.querySelector<HTMLDialogElement>(
      'dialog.progress-dialog',
    )!;
    expect(dialog.open).toBe(true);
    expect(host.textContent).not.toContain(titleOf('evt-cataclismo'));
    expect(host.querySelectorAll('[data-event-id]')).toHaveLength(0);
    await click(
      host.querySelector<HTMLInputElement>(
        'input[value="upto:hito-mondstadt"]',
      )!,
    );
    await click(
      host.querySelector<HTMLButtonElement>('.progress-actions button')!,
    );
    expect(dialog.open).toBe(false);
    expect(
      host.querySelector('[data-event-id="evt-rebelion-decarabian"]'),
    ).not.toBeNull();
    expect(host.querySelector('[data-event-id="evt-cataclismo"]')).toBeNull();
    expect(host.textContent).not.toContain(titleOf('evt-cataclismo'));
    // A new visit keeps the choice and does not ask again.
    await act(async () => root.unmount());
    root = createRoot(host);
    await render(dossier, 'keep');
    expect(
      host.querySelector<HTMLDialogElement>('dialog.progress-dialog')!.open,
    ).toBe(false);
    expect(
      host.querySelector('[data-event-id="evt-rebelion-decarabian"]'),
    ).not.toBeNull();
  });
  it('declining to decide keeps everything hidden without storing a choice', async () => {
    await render(dossier, null);
    await click(
      [
        ...host.querySelectorAll<HTMLButtonElement>('.progress-actions button'),
      ].find((item) => item.textContent === 'Decidir más tarde')!,
    );
    expect(host.querySelectorAll('[data-event-id]')).toHaveLength(0);
    expect(host.textContent).toContain(
      'aún no hay acontecimientos disponibles',
    );
    expect(localStorage.getItem('irminsul-atlas:progress:v2')).toBeNull();
  });
  it('turns an open ficha neutral when progress is lowered, without leaving its text behind', async () => {
    window.history.replaceState(null, '', '/?id=evt-cataclismo');
    await render(dossier, { kind: 'all' });
    expect(host.querySelector('.atlas-detail h3')?.textContent).toBe(
      titleOf('evt-cataclismo'),
    );
    await click(host.querySelector<HTMLButtonElement>('.progress-trigger')!);
    await click(
      host.querySelector<HTMLInputElement>(
        'input[value="upto:hito-mondstadt"]',
      )!,
    );
    await click(
      host.querySelector<HTMLButtonElement>('.progress-actions button')!,
    );
    expect(host.querySelector('.atlas-detail h3')).toBeNull();
    expect(host.querySelector('.atlas-detail')?.textContent).toContain(
      'Contenido no disponible',
    );
    expect(host.textContent).not.toContain(titleOf('evt-cataclismo'));
  });
  it('searches and filters, keeping list and timeline in step and the address restorable', async () => {
    window.history.replaceState(null, '', '/?vista=lista');
    await render(dossier, { kind: 'all' });
    expect(host.querySelectorAll('[data-list-event-id]')).toHaveLength(
      dossier.events.length,
    );
    await click(button('Buscar y filtrar'));
    await type(
      host.querySelector<HTMLInputElement>(
        '.search-panel input[type="search"]',
      )!,
      'KOITAR',
    );
    expect(window.location.search).toContain('q=KOITAR');
    const ids = [
      ...host.querySelectorAll<HTMLElement>('[data-list-event-id]'),
    ].map((item) => item.dataset.listEventId);
    expect(ids).toContain('evt-hiperborea');
    expect(ids.length).toBeLessThan(dossier.events.length);
    await click(button('Mostrar cronología'));
    const nodes = [
      ...host.querySelectorAll<HTMLElement>('[data-event-id]'),
    ].map((item) => item.dataset.eventId);
    // Secondary events appear only when zoomed in; every drawn node is in the list.
    expect(nodes.every((id) => ids.includes(id!))).toBe(true);
    expect(host.querySelector('.search-status')?.textContent).toContain(
      `${ids.length} de ${dossier.events.length}`,
    );
    // Incompatible filters give an explained empty state with a way out.
    await choose(
      host.querySelector<HTMLSelectElement>('.search-panel select')!,
      'era-cierre-cataclismo',
    );
    expect(host.querySelector('.atlas-empty')?.textContent).toContain(
      'Ningún acontecimiento coincide',
    );
    await click(host.querySelector<HTMLButtonElement>('.atlas-empty button')!);
    expect(window.location.search).not.toContain('q=');
    expect(host.querySelector('.atlas-empty')).toBeNull();
  });
  it('restores view and filters from a reloaded address and ignores filters that do not exist', async () => {
    window.history.replaceState(
      null,
      '',
      '/?vista=lista&region=Liyue&capitulo=nope',
    );
    await render(dossier, { kind: 'all' });
    const expected = dossier.events.filter((event) =>
      event.narrativeThread
        ?.split('/')
        .map((part) => part.trim())
        .includes('Liyue'),
    );
    expect(host.querySelectorAll('[data-list-event-id]')).toHaveLength(
      expected.length,
    );
    await click(button('Buscar y filtrar'));
    expect(host.querySelector('.search-status')?.textContent).toContain(
      'capítulo',
    );
  });
  it('lets the reader retry after the atlas or a ficha fails to load', async () => {
    const real = createMemorySource(buildAtlasData(dossier));
    let indexFailures = 1;
    let eventFailures = 1;
    const flaky: AtlasSource = {
      ...real,
      index: () =>
        indexFailures-- > 0
          ? Promise.reject(new AtlasLoadError('sin red'))
          : real.index(),
      event: (id) =>
        eventFailures-- > 0
          ? Promise.reject(
              new AtlasLoadError('Sin conexión con los datos del atlas.'),
            )
          : real.event(id),
    };
    window.history.replaceState(null, '', '/?id=evt-rebelion-decarabian');
    await render(dossier, { kind: 'all' }, flaky);
    expect(host.querySelector('[role="alert"]')?.textContent).toContain(
      'No se pudo cargar el atlas',
    );
    expect(host.querySelector('[data-event-id]')).toBeNull();
    await click(
      host.querySelector<HTMLButtonElement>('[role="alert"] button')!,
    );
    expect(
      host.querySelector('.atlas-detail [role="alert"]')?.textContent,
    ).toContain('Sin conexión');
    await click(
      host.querySelector<HTMLButtonElement>(
        '.atlas-detail [role="alert"] button',
      )!,
    );
    expect(host.querySelector('.atlas-detail h3')?.textContent).toBe(
      titleOf('evt-rebelion-decarabian'),
    );
  });
  it('tells the reader what backs each claim and what remains interpretation or an open question', async () => {
    window.history.replaceState(null, '', '/?id=evt-revolucion-vennessa');
    await render(dossier, { kind: 'all' });
    const claims = [...host.querySelectorAll<HTMLElement>('[data-claim-id]')];
    expect(claims.length).toBeGreaterThanOrEqual(6);
    const tyranny = host.querySelector(
      '[data-claim-id="claim-vennessa-tirania"]',
    )!;
    expect(tyranny.textContent).toContain('Dato explícito');
    expect(tyranny.textContent).toContain(
      'Fuente: Aquila Favonia · historia del arma; ',
    );
    const separate = host.querySelector(
      '[data-claim-id="claim-vennessa-no-decarabian"]',
    )!;
    expect(separate.textContent).toContain('Interpretación');
    expect(separate.textContent).toContain(
      'Sin confirmación directa en el juego',
    );
    // Locators, review state and working notes stay out of the reader's view.
    const detail = host.querySelector('.atlas-detail')!.textContent;
    for (const internal of [
      'Revisión pendiente',
      'Contrastada',
      'sin contrastar',
      'Límites',
      'Párrafo',
      'docs/',
      '(ES)',
      'orrador',
    ])
      expect(detail).not.toContain(internal);
    window.history.replaceState(null, '', '/?id=evt-hiperborea');
    await act(async () => window.dispatchEvent(new PopStateEvent('popstate')));
    await settle();
    expect(
      host.querySelector('[data-claim-id="claim-hiperborea-intervalo"]')
        ?.textContent,
    ).toContain('Cuestión abierta');
  });
  it('lets the reader retry the full-text index without losing the query', async () => {
    const real = createMemorySource(buildAtlasData(dossier));
    let failures = 1;
    const flaky: AtlasSource = {
      ...real,
      search: () =>
        failures-- > 0
          ? Promise.reject(new AtlasLoadError('sin red'))
          : real.search(),
    };
    await render(dossier, { kind: 'all' }, flaky);
    await click(button('Buscar y filtrar'));
    await type(
      host.querySelector<HTMLInputElement>(
        '.search-panel input[type="search"]',
      )!,
      'robafuegos',
    );
    expect(host.querySelector('.search-status')?.textContent).toContain(
      'La búsqueda en el texto completo no está disponible',
    );
    // Name-only results are shown meanwhile and the query is kept.
    expect(window.location.search).toContain('q=robafuegos');
    await click(
      [
        ...host.querySelectorAll<HTMLButtonElement>('.search-status button'),
      ].find((item) => item.textContent === 'Reintentar')!,
    );
    expect(host.querySelector('.search-status')?.textContent).not.toContain(
      'no está disponible',
    );
    expect(window.location.search).toContain('q=robafuegos');
  });
});
