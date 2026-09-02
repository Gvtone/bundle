import { Extension } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    paragraphSpacing: {
      setLineHeight: (value: string | null) => ReturnType;
      setSpacingBefore: (value: string | null) => ReturnType;
      setSpacingAfter: (value: string | null) => ReturnType;
      setContextualSpacing: (value: boolean) => ReturnType;
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
          spacingBefore: {
            default: null,
            parseHTML: el => el.style.marginTop || null,
            renderHTML: attrs =>
              attrs["spacingBefore"]
                ? { style: `margin-top: ${attrs["spacingBefore"]}` }
                : {}
          },
          spacingAfter: {
            default: null,
            parseHTML: el => el.style.marginBottom || null,
            renderHTML: attrs =>
              attrs["spacingAfter"]
                ? { style: `margin-bottom: ${attrs["spacingAfter"]}` }
                : {}
          },
          // DOCX-export-only — mirrors Word's paragraph "Don't add space
          // between paragraphs of the same style" checkbox (w:contextualSpacing
          // in pPr). No on-screen effect: the editor/PDF preview already
          // collapses adjacent margins via normal CSS behavior regardless of
          // this flag, so there's nothing to render here.
          contextualSpacing: {
            default: true,
            parseHTML: () => null,
            renderHTML: () => ({})
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
      setSpacingBefore:
        value =>
        ({ commands }) =>
          this.options.types.every((type: string) =>
            commands.updateAttributes(type, { spacingBefore: value })
          ),
      setSpacingAfter:
        value =>
        ({ commands }) =>
          this.options.types.every((type: string) =>
            commands.updateAttributes(type, { spacingAfter: value })
          ),
      setContextualSpacing:
        value =>
        ({ commands }) =>
          this.options.types.every((type: string) =>
            commands.updateAttributes(type, { contextualSpacing: value })
          )
    };
  }
});
