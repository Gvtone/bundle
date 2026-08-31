import fs from "node:fs/promises";
import path from "node:path";
import { app } from "electron";
import { randomUUID } from "node:crypto";
import type { FillValuesSnapshot, Preset } from "../shared/types";

function presetsDir(templateId: string) {
  return path.join(app.getPath("userData"), "presets", templateId);
}

export async function savePreset(
  templateId: string,
  name: string,
  snapshot: FillValuesSnapshot
): Promise<Preset> {
  const preset: Preset = {
    id: randomUUID(),
    name,
    createdAt: new Date().toISOString(),
    snapshot
  };

  const dir = presetsDir(templateId);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(
    path.join(dir, `${preset.id}.json`),
    JSON.stringify(preset, null, 2)
  );

  return preset;
}

export async function listPresets(templateId: string): Promise<Preset[]> {
  const dir = presetsDir(templateId);
  await fs.mkdir(dir, { recursive: true });
  const entries = await fs.readdir(dir);
  const presets = await Promise.all(
    entries.map(async entry => {
      const raw = await fs.readFile(path.join(dir, entry), "utf-8");
      return JSON.parse(raw) as Preset;
    })
  );
  return presets.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function deletePreset(
  templateId: string,
  presetId: string
): Promise<void> {
  await fs.rm(path.join(presetsDir(templateId), `${presetId}.json`), {
    force: true
  });
}
