import { browser } from "../lib/browser-compat.ts";

/** Set up context menu items on extension install. */
browser.runtime.onInstalled.addListener(() => {
  browser.contextMenus.create({
    id: "clip-page",
    title: "Clip Page to Thought.Haus",
    contexts: ["page"],
  });
  browser.contextMenus.create({
    id: "clip-selection",
    title: "Clip Selection to Thought.Haus",
    contexts: ["selection"],
  });
  browser.contextMenus.create({
    id: "clip-link",
    title: "Clip Link as Bookmark",
    contexts: ["link"],
  });
  // clip-image reserved for Phase 4 (screenshot mode)
});

/**
 * Store the desired clip mode and link URL so the popup can read them on open.
 * The popup checks storage on mount and uses these values to pre-select mode.
 */
async function setPopupIntent(mode: string, linkUrl?: string): Promise<void> {
  await browser.storage.local.set({
    clipperIntent: { mode, linkUrl, timestamp: Date.now() },
  });
}

/** Handle context menu clicks — store intent then open popup. */
browser.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return;

  switch (info.menuItemId) {
    case "clip-page":
      await setPopupIntent("article");
      break;
    case "clip-selection":
      await setPopupIntent("selection");
      break;
    case "clip-link":
      await setPopupIntent("bookmark", info.linkUrl);
      break;
  }

  // Open the popup — falls back gracefully if openPopup is unavailable
  try {
    await browser.action.openPopup();
  } catch {
    // openPopup() not supported in this browser — user can click the icon
  }
});

/** Handle keyboard shortcut commands. */
browser.commands.onCommand.addListener(async (command) => {
  if (command === "quick-clip") {
    await setPopupIntent("article");
    try {
      await browser.action.openPopup();
    } catch {
      // openPopup() not supported — user can click the icon
    }
  }
});
