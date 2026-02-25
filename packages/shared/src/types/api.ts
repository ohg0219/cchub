import type { KitCategory, KitListItem } from './kit';

export type ApiSuccess<T> = { data: T; error: null };
export type ApiError = { data: null; error: { code: string; message: string } };
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface KitsListQuery {
  q?: string;
  category?: KitCategory;
  has_hooks?: boolean;
  has_agents?: boolean;
  sort?: 'popular' | 'latest' | 'installs';
  page?: number;
  limit?: number;
}

export interface KitsListResponse {
  items: KitListItem[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface InstallTrackRequest {
  cli_version: string;
  agent_type?: string;
}

export interface InstallTrackResponse {
  install_count: number;
}
