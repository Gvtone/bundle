import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, type ReactNodeViewProps } from "@tiptap/react";
import type { ComponentType } from "react";

export function createPlaceholderExtension(
  ViewComponent: ComponentType<ReactNodeViewProps>
) {
  return Node.create({
    name: "placeholder",
    group: "inline",
    inline: true,
    atom: true,

    addAttributes() {
      return {
        id: {
          default: null,
          parseHTML: element => element.getAttribute("data-id"),
          renderHTML: attributes => ({ "data-id": attributes["id"] })
        }
      };
    },

    parseHTML() {
      return [{ tag: 'span[data-type="placeholder"]' }];
    },

    renderHTML({ HTMLAttributes }) {
      return [
        "span",
        mergeAttributes(HTMLAttributes, { "data-type": "placeholder" })
      ];
    },

    addNodeView() {
      return ReactNodeViewRenderer(ViewComponent);
    }
  });
}
