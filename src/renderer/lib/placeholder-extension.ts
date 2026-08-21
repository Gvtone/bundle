import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import PlaceholderChip from "@/renderer/components/edit-template/PlaceholderChip";

export const PlaceholderExtension = Node.create({
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
    return ReactNodeViewRenderer(PlaceholderChip);
  }
});
