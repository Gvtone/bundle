import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { EditorView } from "@tiptap/pm/view";

export interface PaginationConfig {
  pageHeight: number;
  margins: number;
  gutter: number;
}

interface PaginationBreak {
  pos: number;
  spacerHeight: number;
}

interface PaginationPluginState {
  config: PaginationConfig;
  breaks: PaginationBreak[];
  decorations: DecorationSet;
}

type PaginationMeta =
  | { type: "config"; config: PaginationConfig }
  | { type: "breaks"; breaks: PaginationBreak[] };

const DEFAULT_CONFIG: PaginationConfig = {
  pageHeight: 1056,
  margins: 96,
  gutter: 32
};

const paginationPluginKey = new PluginKey<PaginationPluginState>("pagination");

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    pagination: {
      setPaginationConfig: (config: PaginationConfig) => ReturnType;
    };
  }
  interface Storage {
    pagination: { pageCount: number };
  }
}

function buildSpacerDecoration(pos: number, height: number): Decoration {
  return Decoration.widget(
    pos,
    () => {
      const el = document.createElement("div");
      el.style.display = "block";
      el.style.width = "100%";
      el.style.height = `${height}px`;
      el.contentEditable = "false";
      el.setAttribute("data-pagination-spacer", "true");
      // The gap is a purely on-screen fake-pagination artifact — real
      // print/PDF output paginates natively via the physical page size, so
      // this must not consume space (or show background) in print output.
      el.className = "print:hidden";
      return el;
    },
    { side: -1, key: `pagination-spacer-${pos}-${height}` }
  );
}

function computeBreaks(
  view: EditorView,
  config: PaginationConfig
): PaginationBreak[] {
  // Widget decorations from a previous measurement render as real sibling
  // DOM elements inside view.dom — exclude them, or they throw off the
  // 1:1 index alignment with doc.forEach's top-level nodes below.
  const children = Array.from(view.dom.children).filter(
    el => !el.hasAttribute("data-pagination-spacer")
  ) as HTMLElement[];
  const usableHeight = config.pageHeight - 2 * config.margins;
  const breaks: PaginationBreak[] = [];

  let pageStartTop: number | null = null;
  let childIndex = 0;

  view.state.doc.forEach((_node, offset) => {
    const dom = children[childIndex];
    childIndex += 1;
    if (!dom) return;

    const rect = dom.getBoundingClientRect();
    if (pageStartTop === null) {
      pageStartTop = rect.top;
      return;
    }

    if (rect.bottom - pageStartTop > usableHeight) {
      const leftover = usableHeight - (rect.top - pageStartTop);
      breaks.push({
        pos: offset,
        spacerHeight: Math.max(0, leftover) + 2 * config.margins + config.gutter
      });
      pageStartTop = rect.top;
    }
  });

  return breaks;
}

function breaksEqual(a: PaginationBreak[], b: PaginationBreak[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((br, i) => {
    const other = b[i];
    return other !== undefined &&
      br.pos === other.pos &&
      br.spacerHeight === other.spacerHeight;
  });
}

export const Pagination = Extension.create({
  name: "pagination",

  addStorage() {
    return { pageCount: 1 };
  },

  addCommands() {
    return {
      setPaginationConfig:
        config =>
        ({ tr, dispatch }) => {
          if (dispatch) {
            tr.setMeta(paginationPluginKey, { type: "config", config });
            dispatch(tr);
          }
          return true;
        }
    };
  },

  addProseMirrorPlugins() {
    const extensionStorage = this.storage;

    return [
      new Plugin<PaginationPluginState>({
        key: paginationPluginKey,
        state: {
          init: () => ({
            config: DEFAULT_CONFIG,
            breaks: [],
            decorations: DecorationSet.empty
          }),
          apply(tr, prev) {
            const meta = tr.getMeta(paginationPluginKey) as
              | PaginationMeta
              | undefined;

            if (!meta) {
              return prev.decorations === DecorationSet.empty
                ? prev
                : {
                    ...prev,
                    decorations: prev.decorations.map(tr.mapping, tr.doc)
                  };
            }

            if (meta.type === "config") {
              return { ...prev, config: meta.config };
            }

            const decorations = DecorationSet.create(
              tr.doc,
              meta.breaks.map(b => buildSpacerDecoration(b.pos, b.spacerHeight))
            );
            return { ...prev, breaks: meta.breaks, decorations };
          }
        },
        props: {
          decorations(state) {
            return paginationPluginKey.getState(state)?.decorations;
          }
        },
        view(view) {
          let frame: number | null = null;

          const remeasure = () => {
            frame = null;
            const pluginState = paginationPluginKey.getState(view.state);
            if (!pluginState) return;

            const newBreaks = computeBreaks(view, pluginState.config);
            extensionStorage["pageCount"] = newBreaks.length + 1;

            if (breaksEqual(newBreaks, pluginState.breaks)) return;

            const tr = view.state.tr.setMeta(paginationPluginKey, {
              type: "breaks",
              breaks: newBreaks
            });
            view.dispatch(tr);
          };

          const schedule = () => {
            if (frame !== null) cancelAnimationFrame(frame);
            frame = requestAnimationFrame(remeasure);
          };

          schedule();

          return {
            update: schedule,
            destroy: () => {
              if (frame !== null) cancelAnimationFrame(frame);
            }
          };
        }
      })
    ];
  }
});
