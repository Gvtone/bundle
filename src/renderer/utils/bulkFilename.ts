import { sanitizeFilename } from "@/shared/sanitizeFilename";
import type { ExportFormat } from "@/shared/types";

export function buildBulkFilename(
  templateName: string,
  listFieldValuesForRow: string[],
  format: ExportFormat,
  usedNames: Set<string>
): string {
  const parts = [
    templateName,
    ...listFieldValuesForRow.map(v => v.slice(0, 30))
  ];
  const base = sanitizeFilename(parts.join("_"));

  let name = `${base}.${format}`;
  let n = 2;
  while (usedNames.has(name)) {
    name = `${base}_${n}.${format}`;
    n++;
  }

  usedNames.add(name);
  return name;
}
