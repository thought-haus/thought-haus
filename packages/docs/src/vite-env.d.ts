/// <reference types="vite/client" />

declare module "virtual:content/*" {
  export const html: string;
  export const frontmatter: { title: string; description?: string };
  export const headings: { depth: number; text: string; id: string }[];
}
