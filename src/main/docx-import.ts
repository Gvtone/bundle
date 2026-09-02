import JSZip from "jszip";
import mammoth from "mammoth";
import { generateJSON } from "@tiptap/html/server";
import { Window } from "happy-dom";
import path from "node:path";
import { parseSectionProperties } from "./docx-page-layout";
import { resolveImportDefaultFont, wrapWithDefaultFont } from "./docx-default-font";
import { createDocxSchemaExtensions } from "./docx-schema-extensions";
import { DEFAULT_PAGE_LAYOUT } from "../shared/pageLayout";
import type { ImportedDocxTemplate } from "../shared/types";

// A Word "blank line" paragraph mammoth converts to <p> </p> (a single
// space) or similar whitespace-only content was observed parsing
// inconsistently — sometimes ProseMirror's DOMParser stripped the
// whitespace to a clean, content-less paragraph (the correct, fully
// editable representation of a blank line, matching how a brand-new blank
// template starts), sometimes it kept the paragraph as literal " " text,
// which behaves oddly as an editable blank line. Rather than rely on that
// undocumented whitespace-stripping behavior, this normalizes any
// paragraph/heading/list-item whose only content is whitespace (or a now
// fully-stripped dropped image) into a genuinely empty tag before
// generateJSON ever sees it, guaranteeing the same clean result every time.
function normalizeBlankBlocks(html: string): string {
  const window = new Window();
  const document = window.document;
  document.body.innerHTML = html;

  for (const el of document.body.querySelectorAll(
    "p, h1, h2, h3, h4, h5, h6, li"
  )) {
    if (el.textContent?.trim() === "") {
      el.innerHTML = "";
    }
  }

  const normalized = document.body.innerHTML;
  window.close();
  return normalized;
}

// Pure buffer-in/result-out — no filesystem or dialog access here, so this
// is callable directly from a script with an in-memory .docx buffer, and
// from ipc-handlers.ts with a buffer read from whatever file the user
// picked. Errors (corrupt zip, mammoth throwing on malformed OOXML) are
// intentionally left to bubble up uncaught — the IPC handler catches and
// rewraps them into one clean user-facing message.
export async function parseDocxFile(
  buffer: Buffer,
  sourceFilePath: string
): Promise<ImportedDocxTemplate> {
  let skippedImageCount = 0;

  const { value: html } = await mammoth.convertToHtml(
    { buffer },
    {
      // mammoth drops entirely-empty paragraphs by default (a reasonable
      // default for converting docs to *web content*, but wrong for this
      // app — a paragraph with no runs is a real blank line the user typed,
      // and dropping it silently loses document structure on import).
      ignoreEmptyParagraphs: false,
      convertImage: mammoth.images.imgElement(() => {
        skippedImageCount += 1;
        // mammoth's type declares this must return a Promise<ImageAttributes>
        // with a mandatory `src`, but the produced <img> is dropped either
        // way — this app's TipTap schema has no image node at all, so
        // generateJSON() (docx-schema-extensions.ts) discards any <img> tag
        // regardless of its src value.
        return Promise.resolve({ src: "" });
      })
    }
  );

  const zip = await JSZip.loadAsync(buffer);
  const documentXmlFile = zip.file("word/document.xml");
  const documentXml = documentXmlFile
    ? await documentXmlFile.async("text")
    : "";
  const pageLayout = documentXml
    ? parseSectionProperties(documentXml)
    : DEFAULT_PAGE_LAYOUT;

  const stylesXmlFile = zip.file("word/styles.xml");
  const stylesXml = stylesXmlFile ? await stylesXmlFile.async("text") : "";
  const themeXmlFile = zip.file("word/theme/theme1.xml");
  const themeXml = themeXmlFile ? await themeXmlFile.async("text") : undefined;
  const defaultFont = resolveImportDefaultFont(documentXml, stylesXml, themeXml);

  const styledHtml = wrapWithDefaultFont(
    normalizeBlankBlocks(html),
    defaultFont
  );
  const content = generateJSON(styledHtml, createDocxSchemaExtensions());

  const suggestedName = path.basename(
    sourceFilePath,
    path.extname(sourceFilePath)
  );

  return { content, pageLayout, suggestedName, skippedImageCount };
}
