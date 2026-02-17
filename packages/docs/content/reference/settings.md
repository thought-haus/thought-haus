---
title: Settings
description: All Thought.Haus settings — appearance, storage, and AI configuration.
---

## Opening Settings

Open the settings modal in any of these ways:

- Click the **gear icon** in the sidebar footer
- Press **Cmd/Ctrl + ,**
- Click the **gear icon** in the AI assistant panel header (opens directly to the AI tab)

## Appearance

### Theme

Choose between three theme modes:

| Mode | Description |
|---|---|
| **Light** | Warm-toned light theme |
| **Dark** | Inverted warm-toned dark theme |
| **System** | Follows your operating system's light/dark preference |

The theme preference is stored in `localStorage` and applied immediately. When set to System, the theme updates automatically if you change your OS preference.

## Storage

The storage section shows your current storage configuration:

- **Storage type** — Local Folder or WebDAV
- **Location** — the folder name or WebDAV hostname

### Change Storage

Click **Change Storage** to disconnect from the current storage and return to the onboarding screen. This lets you switch between local folder and WebDAV, or point to a different folder/server.

Disconnecting does **not** delete any notes — it only removes the saved connection from your browser.

## AI

### Provider

Select your AI provider from the dropdown. Available providers include Anthropic, OpenAI, Google Gemini, Groq, Mistral, DeepSeek, and others. Providers requiring server-side authentication are excluded.

### Model

Choose a model from the selected provider. The model list updates automatically when you change providers. The default is Claude Sonnet when using Anthropic.

### API Key

Enter the API key for the selected provider. The key is stored in your browser's `localStorage` — it is only sent directly to the provider's API when you use the AI assistant.

Each provider has its own stored key. Switching providers preserves previously entered keys.

## Other Persisted Settings

Some settings are stored automatically without appearing in the settings modal:

| Setting | Storage | Default |
|---|---|---|
| Sort order (mode + direction) | `localStorage` | Created date, descending |
| Sidebar width | `localStorage` | 300px |
| AI panel width | `localStorage` | 420px |
| Tags section collapsed | `localStorage` | Expanded |
| Property sections collapsed | `localStorage` | Per-note |
| Favorites list | Notes folder (`.thoughthouse/favorites.json`) | Empty |
| Search index | IndexedDB | Rebuilt on each session |
| Directory handle | IndexedDB | Set during onboarding |
| WebDAV credentials | IndexedDB | Set during onboarding |
