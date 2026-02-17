export interface DocPage {
  html: string;
  frontmatter: { title: string; description?: string };
  headings: TOCItem[];
}

export interface TOCItem {
  depth: number;
  text: string;
  id: string;
}

export interface NavItem {
  title: string;
  slug: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}
