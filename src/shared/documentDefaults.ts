// Default document typography when no explicit style is set — matches
// Microsoft Word's modern "Normal" style so templates look Word-familiar
// out of the box. Consumed by both the main process (DOCX export defaults
// in document-store.ts) and the renderer (toolbar "(Default)" labels in
// EditTemplatePage.tsx; the actual on-screen/PDF rendering values are kept
// in sync manually in theme.css's `.prose.prose-sm` override, since CSS
// can't import these).
export const DEFAULT_FONT_FAMILY = "Calibri";
export const DEFAULT_FONT_SIZE_PT = 11;
export const DEFAULT_LINE_HEIGHT = 1.15;
export const DEFAULT_SPACING_BEFORE_PT = 0;
export const DEFAULT_SPACING_AFTER_PT = 8;
