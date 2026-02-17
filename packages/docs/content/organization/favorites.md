---
title: Favorites
description: How to pin your most important notes as favorites for quick access, with drag-and-drop reordering.
---

## Favoriting Notes

Favorites let you pin frequently accessed notes to the top of the sidebar for quick access. Instead of scrolling through your notes list or searching, favorited notes are always just one click away.

## Adding and Removing Favorites

To favorite a note, use the favorite action (star icon) available in the note's context menu or the editor toolbar. Favorited notes appear in a dedicated **Favorites** section at the top of the sidebar. To unfavorite a note, click the star icon again.

## Reordering Favorites

Favorites can be reordered via **drag and drop** in the sidebar. Grab a favorited note and drag it to your preferred position in the favorites list. This lets you put your most important notes at the very top.

## Persistence

Your favorites list is saved to a file in your notes folder:

```
your-notes-folder/
└── .thoughthouse/
    └── favorites.json
```

This file stores an ordered array of note IDs. Because it's saved in your notes folder (via the storage backend), your favorites persist across browser sessions and are available on any device that has access to the same notes folder.

## How Favorites Differ From Tags

While both favorites and tags help you organize notes, they serve different purposes:

| | Favorites | Tags |
|---|---|---|
| **Purpose** | Quick access to specific notes | Categorization and filtering |
| **Quantity** | A small, curated list | Unlimited, used broadly |
| **Ordering** | Manually ordered via drag-and-drop | Alphabetical in sidebar |
| **Location** | Top of sidebar | Tag section in sidebar |

Use favorites for the handful of notes you access daily. Use tags for broader organization of your entire collection.
