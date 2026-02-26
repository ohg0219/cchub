import type { User } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  github_username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export type AuthUser = User;

export interface KitSummary {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: 'backend' | 'frontend' | 'data' | 'devops' | 'mobile' | 'fullstack';
  install_count: number;
  skills_count: number;
  hooks_count: number;
  agents_count: number;
  has_claude_md: boolean;
  tags: string[];
}

export interface LandingStats {
  kitCount: number;
  totalInstalls: number;
  categoryCount: number;
}

export interface FileTreeNode {
  name: string;
  type: 'file' | 'dir';
  path: string;
  kind?: 'skill' | 'hook' | 'agent' | 'claude_md' | 'other';
  children?: FileTreeNode[];
}

export interface HookMeta {
  name: string;
  event: 'PreToolUse' | 'PostToolUse' | 'Notification' | 'Stop';
  matcher?: string;
  description: string;
}

export interface KitDetail extends KitSummary {
  author_id: string;
  github_repo: string;
  github_branch: string;
  version: string;
  license: string | null;
  languages: string[];
  compatible_agents: string[];
  star_count: number;
  kit_yaml: Record<string, unknown> | null;
  file_tree: FileTreeNode[] | null;
  hooks_meta: HookMeta[];
  created_at: string;
  updated_at: string;
}
