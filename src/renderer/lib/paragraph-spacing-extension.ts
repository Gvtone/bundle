import { Extension } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    paragraphSpacing: {
      setLineHeight: (value: string | null) => ReturnType;
      setParagraphSpacing: (value: string | null) => ReturnType;
    };
  }
}

export const ParagraphSpacing = Extension.create({
  name: "paragraphSpacing",

  addOptions() {
    return { types: ["paragraph", "heading"] };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          lineHeight: {
            default: null,
            parseHTML: el => el.style.lineHeight || null,
            renderHTML: attrs =>
              attrs["lineHeight"]
                ? { style: `line-height: ${attrs["lineHeight"]}` }
                : {}
          },
          spacingAfter: {
            default: null,
            parseHTML: el => el.style.marginBottom || null,
            renderHTML: attrs =>
              attrs["spacingAfter"]
                ? {
                    style: `margin-top: ${attrs["spacingAfter"]}; margin-bottom: ${attrs["spacingAfter"]}`
                  }
                : {}
          }
        }
      }
    ];
  },

  addCommands() {
    return {
      setLineHeight:
        value =>
        ({ commands }) =>
          this.options.types.every((type: string) =>
            commands.updateAttributes(type, { lineHeight: value })
          ),
      setParagraphSpacing:
        value =>
        ({ commands }) =>
          this.options.types.every((type: string) =>
            commands.updateAttributes(type, { spacingAfter: value })
          )
    };
  }
});
