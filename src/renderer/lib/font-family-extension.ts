import FontFamily from "@tiptap/extension-font-family";

// The official extension deliberately keeps the raw inline `font-family`
// CSS value (quotes and comma-separated fallbacks included) to avoid
// re-encoding issues on serialization. Pasted content commonly carries
// exactly that raw form (e.g. `"Times New Roman", serif`), which breaks
// both the toolbar's font dropdown (never matches a plain option value)
// and DOCX export (docx's `font` property expects a bare name, not CSS
// syntax). Normalize to the first font name, quotes stripped, at parse
// time so every consumer sees a clean value.
function normalizeFontFamily(raw: string): string {
  const first = raw.split(",")[0] ?? raw;
  return first.trim().replace(/^['"]+|['"]+$/g, "");
}

export const NormalizedFontFamily = FontFamily.extend({
  addGlobalAttributes() {
    const parent = this.parent?.() ?? [];
    return parent.map(group => ({
      ...group,
      attributes: {
        ...group.attributes,
        fontFamily: {
          ...group.attributes["fontFamily"],
          parseHTML: (element: HTMLElement) => {
            const raw = element.style.fontFamily;
            return raw ? normalizeFontFamily(raw) : null;
          }
        }
      }
    }));
  }
});
