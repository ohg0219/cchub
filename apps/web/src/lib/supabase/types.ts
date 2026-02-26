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
