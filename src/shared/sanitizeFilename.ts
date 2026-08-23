export function sanitizeFilename(name: string): string {
  const cleaned = name.replace(/[\\/:*?"<>|]/g, "").trim();
  return cleaned || "document";
}
