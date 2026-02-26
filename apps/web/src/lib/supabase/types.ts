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
