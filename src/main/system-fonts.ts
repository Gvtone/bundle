import { exec } from "node:child_process";

// Enumerates installed font family names via PowerShell/WPF (Windows.Media.Fonts),
// the same technique font-list's win32 backend uses. Inlined directly instead of
// depending on the font-list package: font-list's core.js does a platform-switch
// require("./win32")/require("./darwin")/require("./linux") that Rollup can't
// fully statically inline — it falls back to a real runtime createRequire() call
// relative to wherever main.js physically lives, which can never resolve in a
// packaged app (no accompanying libs/ folder exists inside app.asar). This one
// function is all this app ever used from it, and is trivially bundle-safe on
// its own — no relative requires, no conditional platform branching.
const LIST_FONTS_COMMAND =
  'chcp 65001|powershell -command "chcp 65001|Out-Null;Add-Type -AssemblyName PresentationCore;$families=[Windows.Media.Fonts]::SystemFontFamilies;foreach($family in $families){$name=\'\';if(!$family.FamilyNames.TryGetValue([Windows.Markup.XmlLanguage]::GetLanguage(\'zh-cn\'),[ref]$name)){$name=$family.FamilyNames[[Windows.Markup.XmlLanguage]::GetLanguage(\'en-us\')]}echo $name}"';

function listFontFamilies(): Promise<string[]> {
  return new Promise((resolve, reject) => {
    exec(
      LIST_FONTS_COMMAND,
      { maxBuffer: 1024 * 1024 * 10 },
      (err, stdout) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(
          stdout
            .split("\n")
            .map(line => line.trim())
            .filter(Boolean)
        );
      }
    );
  });
}

// Windows returns multi-word family names CSS-quoted (e.g. `"Arial Rounded MT"`)
// in some enumeration paths — strip that so callers get plain names consistent
// with the app's existing hardcoded FONT_OPTIONS list.
function stripQuotes(name: string): string {
  return name.trim().replace(/^['"]+|['"]+$/g, "");
}

export async function listSystemFonts(): Promise<string[]> {
  const fonts = await listFontFamilies();
  const names = new Set(fonts.map(stripQuotes));
  return [...names].sort((a, b) => a.localeCompare(b));
}
