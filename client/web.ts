import { Platform } from "react-native";
import { isIgnored, resolvePaths, type Row } from "./paths";

interface DomElement {
  textContent: string | null;
  querySelector(selector: string): DomElement | null;
  querySelectorAll(selector: string): ArrayLike<DomElement>;
  getAttribute(name: string): string | null;
  setAttribute(name: string, value: string): void;
  removeAttribute(name: string): void;
  hasAttribute(name: string): boolean;
  appendChild(node: DomElement): void;
  remove(): void;
}
interface Installation { fetchers: Set<Fetcher>; dispose(): void }
declare const document: {
  readonly body: DomElement;
  readonly head: DomElement;
  createElement(tag: string): DomElement;
  querySelectorAll(selector: string): ArrayLike<DomElement>;
  [key: symbol]: Installation | undefined;
};
declare const window: {
  readonly location: { pathname: string };
  getComputedStyle(element: DomElement): { paddingLeft: string };
  requestAnimationFrame(callback: () => void): number;
  cancelAnimationFrame(id: number): void;
  setInterval(callback: () => void, ms: number): number;
  clearInterval(id: number): void;
};
declare const MutationObserver: new (callback: () => void) => {
  observe(target: DomElement, options: { childList: boolean; subtree: boolean }): void;
  disconnect(): void;
};

type Fetcher = (workspaceId: string) => Promise<string[]>;

const TREE = '[data-testid="file-explorer-tree-scroll"]';
const ROW = '[data-testid^="file-explorer-row-"]';
const MARK = "data-git-ignore-fade";
const SHARED = Symbol.for("git-ignore-fade.v1");
const TTL = 15_000;

function mount(): Installation {
  const sheet = document.createElement("style");
  sheet.textContent = `[${MARK}] { opacity: 0.45 !important; }`;
  document.head.appendChild(sheet);
  const fetchers = new Set<Fetcher>();
  const cache = new Map<string, { at: number; set: Set<string> }>();
  const pending = new Set<string>();
  let rootPad: number | null = null;
  let frame = 0;
  let disposed = false;

  function ignoredFor(id: string): Set<string> | null {
    const hit = cache.get(id);
    if ((!hit || Date.now() - hit.at > TTL) && !pending.has(id)) {
      pending.add(id);
      // Each connected host answers only for its own workspaces; the union covers all of them.
      Promise.all([...fetchers].map((f) => f(id).catch(() => [] as string[])))
        .then((lists) => {
          if (disposed) return;
          cache.set(id, { at: Date.now(), set: new Set(lists.flat()) });
          schedule();
        })
        .finally(() => pending.delete(id));
    }
    return hit?.set ?? null;
  }

  function scan() {
    const id = window.location.pathname.match(/\/workspace\/([^/?#]+)/)?.[1];
    const ignored = id ? ignoredFor(decodeURIComponent(id)) : null;
    for (const tree of Array.from(document.querySelectorAll(TREE))) {
      const rows: (Row & { el: DomElement })[] = [];
      for (const el of Array.from(tree.querySelectorAll(ROW))) {
        const testId = el.getAttribute("data-testid") ?? "";
        const index = testId.match(/^file-explorer-row-(\d+)$/)?.[1];
        const name = index && el.querySelector(`[data-testid="${testId}-name"]`)?.textContent;
        if (!index || !name) continue;
        const pad = parseFloat(window.getComputedStyle(el).paddingLeft) || 0;
        rows.push({ el, index: Number(index), name, pad });
      }
      rows.sort((a, b) => a.index - b.index);
      if (rows[0]?.index === 0) rootPad = rows[0].pad;
      const paths = resolvePaths(rows, rootPad);
      rows.forEach(({ el }, i) => {
        const path = paths[i];
        const dim = ignored !== null && path !== null && isIgnored(path, ignored);
        if (dim && !el.hasAttribute(MARK)) el.setAttribute(MARK, "");
        if (!dim && el.hasAttribute(MARK)) el.removeAttribute(MARK);
      });
    }
  }

  function schedule() {
    if (!disposed && !frame) frame = window.requestAnimationFrame(() => { frame = 0; scan(); });
  }

  const observer = new MutationObserver(schedule);
  observer.observe(document.body, { childList: true, subtree: true });
  const timer = window.setInterval(schedule, TTL);
  schedule();

  return {
    fetchers,
    dispose() {
      disposed = true;
      observer.disconnect();
      window.clearInterval(timer);
      if (frame) window.cancelAnimationFrame(frame);
      for (const el of Array.from(document.querySelectorAll(`[${MARK}]`))) el.removeAttribute(MARK);
      sheet.remove();
    },
  };
}

export function installDimming(fetcher: Fetcher): () => void {
  if (Platform.OS !== "web") return () => {};
  const install = (document[SHARED] ??= mount());
  install.fetchers.add(fetcher);
  return () => {
    install.fetchers.delete(fetcher);
    if (install.fetchers.size === 0) {
      install.dispose();
      delete document[SHARED];
    }
  };
}
