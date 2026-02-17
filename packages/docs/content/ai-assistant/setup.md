---
title: Setting Up the AI Assistant
description: Configure your AI provider, model, and API key to start using the Thought.Haus AI assistant.
---

## Overview

Thought.Haus includes a built-in AI assistant that can read, search, and create notes on your behalf. The assistant runs entirely in your browser — your API key is stored locally and requests go directly to the provider.

## Opening Settings

Open the AI settings in any of these ways:

- Click the **gear icon** in the AI assistant panel header
- Press **Cmd/Ctrl + ,** to open Settings, then select the **AI** tab
- Click **Settings** in the sidebar footer and switch to the **AI** tab

## Choosing a Provider

Select an AI provider from the **Provider** dropdown. Available providers include:

- **Anthropic** (default) — Claude models
- **OpenAI** — GPT models
- **Google Gemini**
- **Groq**
- **Mistral**
- **DeepSeek**
- And others supported by the underlying AI library

Some providers that require server-side authentication (Amazon Bedrock, Google Vertex, Azure OpenAI) are not available since Thought.Haus runs entirely in the browser.

## Selecting a Model

After choosing a provider, pick a model from the **Model** dropdown. The list updates automatically based on the selected provider. The default is `claude-sonnet-4-5-20250929` when using Anthropic.

## Entering Your API Key

Paste your API key into the **API Key** field. The key is stored in your browser's `localStorage` — it never leaves your machine except when making requests to the provider's API.

Once a valid key is entered, the assistant panel becomes active and you can start chatting.

## Changing Providers

You can switch providers at any time from the AI settings tab. Each provider's API key is stored independently, so switching back retains your previous key. The model selection resets to the first available model when you change providers.
