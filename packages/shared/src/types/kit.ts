export type KitCategory =
  | 'backend'
  | 'frontend'
  | 'data'
  | 'devops'
  | 'mobile'
  | 'fullstack';

export type AgentType =
  | 'claude-code'
  | 'cursor'
  | 'copilot'
  | 'windsurf'
  | 'cline';

export interface KitComponents {
  skills: number;
  hooks: number;
  agents: number;
  claude_md: boolean;
}

export interface KitInstallTarget {
  skills: string;
  hooks: string;
  agents: string;
  claude_md: string;
}

export interface KitYaml {
  name: string;
  version: string;
  description: string;
  author: string;
  license: string;
  language?: string[];
  category?: KitCategory;
  tags?: string[];
  compatible_agents?: AgentType[];
  requirements?: Record<string, string>;
  components?: KitComponents;
  install?: {
    target?: Partial<KitInstallTarget>;
  };
}

export interface KitAuthor {
  github_username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface KitListItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: KitCategory;
  tags: string[];
  compatible_agents: AgentType[];
  skills_count: number;
  hooks_count: number;
  agents_count: number;
  has_claude_md: boolean;
  install_count: number;
  star_count: number;
  version: string;
  author: KitAuthor;
  created_at: string;
  updated_at: string;
}

export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  children?: FileTreeNode[];
}

export interface HookMeta {
  type: 'PreToolUse' | 'PostToolUse' | 'Notification';
  events: string[];
  description: string;
  matcher?: string[];
  command: string;
}

export interface KitReview {
  id: string;
  rating: number;
  comment: string | null;
  user: {
    github_username: string;
    avatar_url: string | null;
  };
  created_at: string;
}

export interface KitDetail extends KitListItem {
  github_repo: string;
  github_branch: string;
  kit_yaml: KitYaml;
  file_tree: FileTreeNode[];
  hooks_meta: HookMeta[];
  readme_html?: string;
  reviews: {
    total: number;
    average: number;
    items: KitReview[];
  };
}
