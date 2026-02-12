import type { Editor } from "@tiptap/core";
import "./link-popover.css";

interface PopoverConfig {
  href: string;
  anchorEl: HTMLElement;
  editor: Editor;
}

let popover: HTMLDivElement | null = null;
let cleanup: (() => void) | null = null;
let currentConfig: PopoverConfig | null = null;

/** Show the link popover anchored to the given element. */
export function showLinkPopover(config: PopoverConfig): void {
  // If already showing for the same anchor, skip
  if (popover && currentConfig?.anchorEl === config.anchorEl) return;

  hideLinkPopover();
  currentConfig = config;

  popover = document.createElement("div");
  popover.className = "link-popover";
  popover.setAttribute("role", "toolbar");
  popover.setAttribute("aria-label", "Link actions");

  buildViewMode(popover, config);
  document.body.appendChild(popover);
  positionPopover(popover, config.anchorEl);

  // Dismiss on click outside
  const onMouseDown = (e: MouseEvent) => {
    if (popover && !popover.contains(e.target as Node)) {
      hideLinkPopover();
    }
  };

  // Dismiss on Escape
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      hideLinkPopover();
      config.editor.commands.focus();
    }
  };

  // Dismiss on editor input (typing in the editor, not the popover input)
  const onTransaction = () => {
    // Only dismiss if the editor's last transaction was user input
    // and we're not in edit mode (which has its own input)
    if (popover && !popover.querySelector(".link-popover-input")) {
      // Check if cursor has left the link
      const { from } = config.editor.state.selection;
      const linkMark = config.editor.state.doc.rangeHasMark(
        from,
        from,
        config.editor.schema.marks.link,
      );
      if (!linkMark) {
        hideLinkPopover();
      }
    }
  };

  // Delay adding listeners to avoid immediate trigger
  requestAnimationFrame(() => {
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    config.editor.on("transaction", onTransaction);
  });

  cleanup = () => {
    document.removeEventListener("mousedown", onMouseDown);
    document.removeEventListener("keydown", onKeyDown);
    config.editor.off("transaction", onTransaction);
  };
}

/** Remove the popover and clean up listeners. */
export function hideLinkPopover(): void {
  if (cleanup) {
    cleanup();
    cleanup = null;
  }
  if (popover) {
    popover.remove();
    popover = null;
  }
  currentConfig = null;
}

/** Whether the popover is currently visible. */
export function isPopoverVisible(): boolean {
  return popover !== null;
}

// ── View mode ───────────────────────────────────────────────────────

function buildViewMode(container: HTMLDivElement, config: PopoverConfig): void {
  container.innerHTML = "";

  // URL display
  const urlSpan = document.createElement("span");
  urlSpan.className = "link-popover-url";
  urlSpan.textContent = config.href;
  urlSpan.title = config.href;
  container.appendChild(urlSpan);

  // Edit button
  const editBtn = makeButton(icon(ICON_PENCIL), "Edit link URL", () => {
    buildEditMode(container, config);
  });
  container.appendChild(editBtn);

  // Copy button
  const copyBtn = makeButton(icon(ICON_COPY), "Copy link URL", () => {
    navigator.clipboard.writeText(config.href);
    copyBtn.innerHTML = "";
    copyBtn.appendChild(icon(ICON_CHECK));
    setTimeout(() => {
      copyBtn.innerHTML = "";
      copyBtn.appendChild(icon(ICON_COPY));
    }, 1500);
  });
  container.appendChild(copyBtn);

  // Open button
  const openBtn = makeButton(icon(ICON_EXTERNAL_LINK), "Open link in new tab", () => {
    window.open(config.href, "_blank", "noopener");
  });
  container.appendChild(openBtn);

  // Unlink button
  const unlinkBtn = makeButton(icon(ICON_UNLINK), "Remove link", () => {
    config.editor.chain().focus().extendMarkRange("link").unsetLink().run();
    hideLinkPopover();
  });
  container.appendChild(unlinkBtn);
}

// ── Edit mode ───────────────────────────────────────────────────────

function buildEditMode(
  container: HTMLDivElement,
  config: PopoverConfig,
): void {
  container.innerHTML = "";

  const input = document.createElement("input");
  input.type = "text";
  input.className = "link-popover-input";
  input.value = config.href;
  container.appendChild(input);

  const applyUrl = () => {
    const newHref = input.value.trim();
    if (newHref) {
      config.editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: newHref })
        .run();
      config.href = newHref;
    }
    buildViewMode(container, config);
    positionPopover(container, config.anchorEl);
  };

  const cancel = () => {
    buildViewMode(container, config);
    positionPopover(container, config.anchorEl);
  };

  // Apply button
  const applyBtn = makeButton(icon(ICON_CHECK), "Apply URL change", applyUrl);
  container.appendChild(applyBtn);

  // Cancel button
  const cancelBtn = makeButton(icon(ICON_X), "Cancel editing", cancel);
  container.appendChild(cancelBtn);

  // Key handlers on input
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      applyUrl();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    }
    // Stop propagation so editor doesn't process these keys
    e.stopPropagation();
  });

  // Prevent mousedown from dismissing popover
  input.addEventListener("mousedown", (e) => e.stopPropagation());

  // Focus and select all text
  requestAnimationFrame(() => {
    input.focus();
    input.select();
  });
}

// ── Icons ───────────────────────────────────────────────────────────

const ICON_PENCIL = '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>';
const ICON_COPY = '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>';
const ICON_CHECK = '<path d="M20 6 9 17l-5-5"/>';
const ICON_EXTERNAL_LINK = '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>';
const ICON_UNLINK = '<path d="m18.84 12.25 1.72-1.71h-.02a5.004 5.004 0 0 0-.12-7.07 5.006 5.006 0 0 0-6.95 0l-1.72 1.71"/><path d="m5.17 11.75-1.71 1.71a5.004 5.004 0 0 0 .12 7.07 5.006 5.006 0 0 0 6.95 0l1.71-1.71"/><line x1="8" x2="8" y1="2" y2="5"/><line x1="2" x2="5" y1="8" y2="8"/><line x1="16" x2="16" y1="19" y2="22"/><line x1="19" x2="22" y1="16" y2="16"/>';
const ICON_X = '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>';

function icon(paths: string): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "16");
  svg.setAttribute("height", "16");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.innerHTML = paths;
  return svg;
}

// ── Helpers ─────────────────────────────────────────────────────────

function makeButton(
  child: SVGSVGElement,
  ariaLabel: string,
  onClick: () => void,
): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.appendChild(child);
  btn.setAttribute("aria-label", ariaLabel);
  btn.addEventListener("mousedown", (e) => e.preventDefault());
  btn.addEventListener("click", onClick);
  return btn;
}

function positionPopover(el: HTMLDivElement, anchor: HTMLElement): void {
  const rect = anchor.getBoundingClientRect();
  const popoverHeight = el.offsetHeight || 36;
  const popoverWidth = el.offsetWidth || 300;
  const gap = 4;

  const spaceBelow = window.innerHeight - rect.bottom;
  const above = spaceBelow < popoverHeight + gap && rect.top > popoverHeight + gap;

  const top = above ? rect.top - popoverHeight - gap : rect.bottom + gap;
  const left = Math.max(4, Math.min(rect.left, window.innerWidth - popoverWidth - 4));

  el.style.top = `${top}px`;
  el.style.left = `${left}px`;
}
