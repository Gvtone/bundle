import fs from "node:fs/promises";
import path from "node:path";
import { app } from "electron";
import type { Template } from "../shared/types";

function templatesDir() {
  return path.join(app.getPath("userData"), "templates");
}

export async function saveTemplate(template: Template, content: unknown) {
  const dir = path.join(templatesDir(), template.id);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(
    path.join(dir, "meta.json"),
    JSON.stringify(template, null, 2)
  );
  await fs.writeFile(
    path.join(dir, "content.json"),
    JSON.stringify(content, null, 2)
  );
}

export async function listTemplates(): Promise<Template[]> {
  const dir = templatesDir();
  await fs.mkdir(dir, { recursive: true });
  const entries = await fs.readdir(dir);
  const metas = await Promise.all(
    entries.map(async id => {
      const raw = await fs.readFile(path.join(dir, id, "meta.json"), "utf-8");
      return JSON.parse(raw) as Template;
    })
  );
  return metas.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function loadTemplate(
  id: string
): Promise<{ meta: Template; content: unknown }> {
  const dir = path.join(templatesDir(), id);
  const meta = JSON.parse(
    await fs.readFile(path.join(dir, "meta.json"), "utf-8")
  ) as Template;
  const content = JSON.parse(
    await fs.readFile(path.join(dir, "content.json"), "utf-8")
  );
  return { meta, content };
}

export async function deleteTemplate(id: string): Promise<void> {
  const dir = path.join(templatesDir(), id);
  await fs.rm(dir, { recursive: true, force: true });
}
