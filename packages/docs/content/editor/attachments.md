---
title: Attachments
description: How to add images and files to notes via drag and drop, and how attachments are stored and rendered.
---

## Adding Attachments

You can attach images and files to any note by dragging and dropping them into the editor. The file is copied into your notes storage and a reference is inserted into the note content.

### Images

When you drop an image (PNG, JPG, GIF, etc.) into the editor, it is:

1. Copied to the note's attachment directory.
2. Inserted as a Markdown image reference in the note.
3. Rendered inline in the editor so you can see it immediately.

### Other Files

Non-image files (PDFs, documents, archives, etc.) are stored the same way but rendered as **download cards** in the editor — a styled block showing the filename and a link to open or download the file.

## Attachment Storage

Attachments are stored in per-note subdirectories directly inside your notes folder. Each directory is named after the note's timestamp ID:

```
your-notes-folder/
├── 20240322T131856/                    # Attachments for meeting-notes
│   ├── photo.jpg
│   └── diagram.png
├── 20240915T083012/                    # Attachments for project-plan
│   └── report.pdf
├── 20240322T131856--meeting-notes.md
└── 20240915T083012--project-plan.md
```

This keeps attachments organized and associated with the correct note. For notes without a timestamp format, the directory uses the filename (minus the `.md` extension).

## How It Works in Markdown

In the underlying Markdown file, image attachments are referenced with standard image syntax:

```markdown
![Photo from the event](./20240322T131856/photo.jpg)
```

This means your attachments are accessible even when viewing the Markdown file in another editor — as long as the relative path is intact.

## Deleting Attachments

When you delete a note, its attachment directory (`<noteId>/`) is also cleaned up. Individual attachments can be removed by deleting the image or file reference from the note content.

## Supported Formats

Any file type can be attached. Images that the browser can render (PNG, JPG, GIF, WebP, SVG) are displayed inline. All other file types are shown as downloadable cards with the filename and file type.
