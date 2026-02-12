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
  const editBtn = makeButton("✎", "Edit link URL", () => {
    buildEditMode(container, config);
  });
  container.appendChild(editBtn);

  // Copy button
  const copyBtn = makeButton("📋", "Copy link URL", () => {
    navigator.clipboard.writeText(config.href);
    copyBtn.textContent = "✓";
    setTimeout(() => {
      copyBtn.textContent = "📋";
    }, 1500);
  });
  container.appendChild(copyBtn);

  // Open button
  const openBtn = makeButton("↗", "Open link in new tab", () => {
    window.open(config.href, "_blank", "noopener");
  });
  container.appendChild(openBtn);

  // Unlink button
  const unlinkBtn = makeButton("✕", "Remove link", () => {
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
  const applyBtn = makeButton("✓", "Apply URL change", applyUrl);
  container.appendChild(applyBtn);

  // Cancel button
  const cancelBtn = makeButton("✕", "Cancel editing", cancel);
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

// ── Helpers ─────────────────────────────────────────────────────────

function makeButton(
  label: string,
  ariaLabel: string,
  onClick: () => void,
): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = label;
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
