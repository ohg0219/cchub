import { config } from '../utils/config.js';

// ─── 타입 (웹과 공유하지 않고 CLI 전용으로 인라인 정의) ───────────

export interface KitSummary {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  install_count: number;
  skills_count: number;
  hooks_count: number;
  agents_count: number;
  has_claude_md: boolean;
  tags: string[];
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
  github_repo: string;
  github_branch: string;
  version: string;
  license: string | null;
  file_tree: FileTreeNode[] | null;
  hooks_meta: HookMeta[];
}

export interface KitsListResponse {
  data: KitSummary[];
  total: number;
  page: number;
  pageSize: number;
}

// ─── 커스텀 에러 ─────────────────────────────────────────────────

export class KitNotFoundError extends Error {
  constructor(slug: string) {
    super(`Kit '${slug}' not found.`);
    this.name = 'KitNotFoundError';
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

// ─── API 함수 ─────────────────────────────────────────────────────

export async function fetchKit(slug: string): Promise<KitDetail> {
  try {
    const res = await fetch(`${config.apiBaseUrl}/api/kits/${slug}`);
    if (res.status === 404) throw new KitNotFoundError(slug);
    if (!res.ok) throw new NetworkError(`Server responded with ${res.status}`);
    const json = await res.json() as { data: KitDetail };
    return json.data;
  } catch (err) {
    if (err instanceof KitNotFoundError || err instanceof NetworkError) throw err;
    throw new NetworkError(`Network error. Check your connection.`);
  }
}

export async function searchKits(query: string, page = 1): Promise<KitsListResponse> {
  try {
    const params = new URLSearchParams({ q: query, page: String(page), pageSize: '10' });
    const res = await fetch(`${config.apiBaseUrl}/api/kits?${params.toString()}`);
    if (!res.ok) throw new NetworkError(`Server responded with ${res.status}`);
    return await res.json() as KitsListResponse;
  } catch (err) {
    if (err instanceof NetworkError) throw err;
    throw new NetworkError(`Network error. Check your connection.`);
  }
}

export async function trackInstall(slug: string): Promise<void> {
  try {
    await fetch(`${config.apiBaseUrl}/api/kits/${slug}/install`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cli_version: config.cliVersion, agent_type: 'claude-code' }),
    });
  } catch {
    // 트래킹 실패는 무시 (설치 자체는 이미 완료된 후)
  }
}
