import { parseFrontMatter, serializeFrontMatter } from "../notes/frontmatter.ts";
import type { FrontMatter } from "../notes/frontmatter.ts";
import type { Message } from "@mariozechner/pi-ai";

export const CONVERSATION_TAG = "noti-agent-conversation";
export const MEMORY_TAG = "noti-agent-memory";
export const COMMAND_TAG = "noti-command";
export const SKILL_TAG = "noti-skill";

const JSON_BLOCK_RE = /```json\s*\n([\s\S]*?)\n```/;

export function parseConversationNote(content: string): {
  frontMatter: FrontMatter;
  messages: Message[];
} {
  const { frontMatter, body } = parseFrontMatter(content);
  const match = body.match(JSON_BLOCK_RE);
  if (!match) {
    return { frontMatter, messages: [] };
  }
  try {
    const messages = JSON.parse(match[1]) as Message[];
    return { frontMatter, messages };
  } catch {
    return { frontMatter, messages: [] };
  }
}

export function serializeConversationNote(
  frontMatter: FrontMatter,
  messages: Message[],
): string {
  const body = `\n<!-- AI conversation. View in the agent sidebar. -->\n\n\`\`\`json\n${JSON.stringify(messages)}\n\`\`\`\n`;
  return serializeFrontMatter(frontMatter, body);
}
