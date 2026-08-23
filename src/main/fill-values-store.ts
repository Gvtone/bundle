import fs from "node:fs/promises";
import path from "node:path";
import { app } from "electron";
import type { FillValuesSnapshot } from "../shared/types";

function lastValuesDir() {
  return path.join(app.getPath("userData"), "last-values");
}

function lastValuesFile(templateId: string) {
  return path.join(lastValuesDir(), `${templateId}.json`);
}

export async function saveFillValues(
  templateId: string,
  snapshot: FillValuesSnapshot
): Promise<void> {
  await fs.mkdir(lastValuesDir(), { recursive: true });
  await fs.writeFile(
    lastValuesFile(templateId),
    JSON.stringify(snapshot, null, 2)
  );
}

export async function loadFillValues(
  templateId: string
): Promise<FillValuesSnapshot | null> {
  try {
    const raw = await fs.readFile(lastValuesFile(templateId), "utf-8");
    return JSON.parse(raw) as FillValuesSnapshot;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

export async function clearFillValues(templateId: string): Promise<void> {
  await fs.rm(lastValuesFile(templateId), { force: true });
}
