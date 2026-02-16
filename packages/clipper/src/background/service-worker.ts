import { browser } from "../lib/browser-compat.ts";

/** Set up context menu items on extension install. */
browser.runtime.onInstalled.addListener(() => {
  browser.contextMenus.create({
    id: "clip-page",
    title: "Clip Page",
    contexts: ["page"],
  });
  browser.contextMenus.create({
    id: "clip-selection",
    title: "Clip Selection",
    contexts: ["selection"],
  });
  browser.contextMenus.create({
    id: "clip-link",
    title: "Clip Link as Bookmark",
    contexts: ["link"],
  });
  browser.contextMenus.create({
    id: "clip-image",
    title: "Clip Image",
    contexts: ["image"],
  });
});

/** Handle context menu clicks. */
browser.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return;

  switch (info.menuItemId) {
    case "clip-page":
      await sendClipMessage(tab.id, "article");
      break;
    case "clip-selection":
      await sendClipMessage(tab.id, "selection");
      break;
    case "clip-link":
      // Open popup with bookmark mode pre-selected
      await browser.action.openPopup();
      break;
    case "clip-image":
      // Future: handle image clipping
      break;
  }
});

/** Handle keyboard shortcut commands. */
browser.commands.onCommand.addListener(async (command) => {
  if (command === "quick-clip") {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      await sendClipMessage(tab.id, "article");
    }
  }
});

/** Send a clip request to the content script. */
async function sendClipMessage(tabId: number, mode: string): Promise<void> {
  try {
    await browser.tabs.sendMessage(tabId, { type: "extract", mode });
  } catch {
    // Content script may not be injected yet
    await browser.scripting.executeScript({
      target: { tabId },
      files: ["content.js"],
    });
    await browser.tabs.sendMessage(tabId, { type: "extract", mode });
  }
}
