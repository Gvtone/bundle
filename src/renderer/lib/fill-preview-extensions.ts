import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { NormalizedFontFamily } from "@/renderer/lib/font-family-extension";
import { FontSize } from "@/renderer/lib/font-size-extension";
import { ParagraphSpacing } from "@/renderer/lib/paragraph-spacing-extension";
import { createPlaceholderExtension } from "@/renderer/lib/placeholder-extension";
import FilledPlaceholderChip from "@/renderer/components/fill-and-preview/FilledPlaceholderChip";

export function createFillPreviewExtensions() {
  return [
    StarterKit,
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    TextStyle,
    NormalizedFontFamily,
    FontSize,
    ParagraphSpacing,
    createPlaceholderExtension(FilledPlaceholderChip)
  ];
}
