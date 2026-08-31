import fontList from "font-list";

// font-list returns Windows font names CSS-quoted when they contain a
// space (e.g. `"Arial Rounded MT"`) — strip that so callers get plain
// names consistent with the app's existing hardcoded FONT_OPTIONS list.
function stripQuotes(name: string): string {
  return name.trim().replace(/^['"]+|['"]+$/g, "");
}

export async function listSystemFonts(): Promise<string[]> {
  const fonts = await fontList.getFonts();
  const names = new Set(fonts.map(stripQuotes));
  return [...names].sort((a, b) => a.localeCompare(b));
}
