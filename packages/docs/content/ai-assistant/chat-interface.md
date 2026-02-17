---
title: Chat Interface
description: How to use the AI assistant panel to chat, manage conversations, and interact with your notes.
---

## Opening the Agent Panel

Open the AI assistant panel in any of these ways:

- Click the **AI** button in the sidebar footer
- Press **Cmd/Ctrl + Shift + A**

The panel appears on the right side of the editor. You can resize it by dragging the left edge (280px minimum, 900px maximum). The width is persisted across sessions.

## Sending Messages

Type your message in the text input at the bottom of the panel and press **Enter** to send. Use **Shift + Enter** to insert a newline without sending.

The placeholder text reads: *"Ask about your notes... (/ for commands, @ for notes)"*

While the assistant is responding, a streaming indicator shows the partial response. You can click the **Stop** button to cancel a response mid-stream.

## Conversation History

Each conversation is saved as a note tagged `th-agent-conversation` with the title "Conversation - \<date\>". Messages are stored as JSON inside the note file.

### Switching Conversations

Use the dropdown at the top of the panel to switch between past conversations. Conversations are listed with the most recent first.

### Starting a New Conversation

Click the **+** button next to the conversation dropdown to start a fresh conversation. The previous conversation is automatically saved.

## Message Display

Messages appear as bubbles in the chat:

- **User messages** appear on the right
- **Assistant messages** appear on the left
- **Tool calls** (when the AI reads or searches notes) appear as collapsible sections showing the tool name and arguments
- **Tool results** appear as collapsible sections showing the returned data
- **Errors** are highlighted in a distinct color

Click a tool call or result header to expand/collapse its details.

## Context

The assistant automatically receives context about:

- The **currently open note** (up to 12,000 characters)
- Any **memory notes** you've created (tagged `th-agent-memory`)
- Available **skills** (notes tagged `th-skill`)
- The current **date and time**

This means the assistant can reference what you're working on without you needing to explicitly share it.
