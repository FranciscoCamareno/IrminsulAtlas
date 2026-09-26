// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TimelineExplorer from '../src/components/explorer/TimelineExplorer';
import { loadLocalContent } from '../src/content/local';
import { attachViewport } from '../src/visualization/viewport';
import type { Viewport } from '../src/visualization/layout';

const dataset = await loadLocalContent();
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
async function render() {
  await act(async () =>
    root.render(createElement(TimelineExplorer, { dataset })),
  );
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
}

describe('timeline interaction', () => {
  it('uses a compact overview at 320 px and opens its epochs', async () => {
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
    expect(host.querySelector('.compact-overview')).not.toBeNull();
    const groups = [...host.querySelectorAll<HTMLButtonElement>('.era-group')];
    expect(groups).toHaveLength(4);
    for (const group of groups) {
      expect(parseFloat(group.style.left)).toBe(160);
      expect(parseFloat(group.style.top)).toBeLessThan(450);
    }
    await click(groups[2]!);
    expect(host.querySelector('[data-level="events"]')).not.toBeNull();
  });
  it('zooms with buttons, reveals secondary nodes, and groups eras on reset', async () => {
    await render();
    expect(host.querySelector('[data-level="events"]')).not.toBeNull();
    expect(host.querySelector('[data-event-id="demo-event-03"]')).toBeNull();
    await click(button('Acercar cronología'));
    await click(button('Acercar cronología'));
    await click(button('Acercar cronología'));
    expect(host.querySelector('[data-level="details"]')).not.toBeNull();
    expect(
      host.querySelector('[data-event-id="demo-event-03"]'),
    ).not.toBeNull();
    await click(button('Ver toda la cronología'));
    expect(host.querySelector('[data-level="eras"]')).not.toBeNull();
    expect(host.querySelectorAll('.era-group')).toHaveLength(4);
    await click(host.querySelector<HTMLButtonElement>('.era-group')!);
    expect(host.querySelector('[data-level="events"]')).not.toBeNull();
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
    window.history.replaceState(
      null,
      '',
      '/evento/?id=demo-event-05&progress=all',
    );
    await render();
    expect(host.textContent).not.toContain('Hallazgo de la sala interior');
    expect(host.textContent).toContain('Contenido no disponible');
    await click(button('Abrir menú'));
    const checkbox = host.querySelector<HTMLInputElement>(
      'input[type="checkbox"]',
    )!;
    await click(checkbox);
    expect(host.querySelector('.atlas-detail')?.textContent).toContain(
      'Hallazgo de la sala interior',
    );
    await click(checkbox);
    expect(host.textContent).not.toContain('Hallazgo de la sala interior');
    expect(host.querySelector('[data-event-id="demo-event-05"]')).toBeNull();
  });
  it('provides a list with the same spoiler filtering and works after changing themes', async () => {
    await render();
    await click(button('Mostrar vista de lista'));
    expect(host.querySelectorAll('.atlas-list li')).toHaveLength(13);
    expect(host.querySelector('.atlas-list')?.textContent).not.toContain(
      'Hallazgo de la sala interior',
    );
    await click(button('Abrir menú'));
    await click(host.querySelector<HTMLButtonElement>('.theme-button')!);
    expect(host.querySelector('.atlas-light')).not.toBeNull();
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
    controls.scale(0.001);
    expect(state.k).toBe(0.08);
    controls.destroy();
    const final = { ...state };
    host.dispatchEvent(
      new WheelEvent('wheel', { deltaY: -100, bubbles: true }),
    );
    expect(state).toEqual(final);
  });
});
