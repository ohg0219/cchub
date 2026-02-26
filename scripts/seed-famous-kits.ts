/**
 * 유명 기업 GitHub 레포를 파싱하여 Supabase kits 테이블에 upsert합니다.
 *
 * 사용법:
 *   GITHUB_TOKEN=ghp_xxx SUPABASE_SERVICE_ROLE_KEY=xxx pnpm seed
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// apps/web/.env.local 자동 로드
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, '../apps/web/.env.local') });

import { createClient } from '@supabase/supabase-js';
import { FAMOUS_REPOS, type SeedRepo } from './seeds/famous-repos';

// ─── 환경 변수 ───────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('필수 환경 변수 누락: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ─── GitHub API 유틸 ─────────────────────────────────────────────────────────

interface GitHubFile {
  name: string;
  type: 'file' | 'dir';
  path: string;
  content?: string;
}

function buildHeaders(): HeadersInit {
  return {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'cchub-seed/1.0.0',
    ...(GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {}),
  };
}

async function fetchContents(owner: string, repo: string, path: string): Promise<GitHubFile[]> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    { headers: buildHeaders() }
  );
  if (!res.ok) {
    if (res.status === 404) return [];
    if (res.status === 403) {
      console.warn('  GitHub API rate limit 초과. GITHUB_TOKEN을 설정하세요.');
      return [];
    }
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  }
  const data = await res.json() as GitHubFile | GitHubFile[];
  return Array.isArray(data) ? data : [data];
}

async function fetchFileContent(owner: string, repo: string, path: string): Promise<string> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    { headers: buildHeaders() }
  );
  if (!res.ok) return '';
  const data = await res.json() as GitHubFile;
  if (!data.content) return '';
  return Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf-8');
}

function extractReadmeSummary(content: string): string {
  const lines = content.split('\n');
  let inParagraph = false;
  const paragraphLines: string[] = [];
  for (const line of lines) {
    if (line.startsWith('#')) { inParagraph = false; continue; }
    const trimmed = line.trim();
    if (!trimmed) {
      if (inParagraph && paragraphLines.length > 0) break;
      continue;
    }
    inParagraph = true;
    paragraphLines.push(trimmed);
  }
  return paragraphLines.join(' ').slice(0, 300);
}

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ─── 레포 분석 ───────────────────────────────────────────────────────────────

interface FileTreeNode {
  name: string;
  type: 'file' | 'dir';
  path: string;
  kind?: 'skill' | 'hook' | 'agent' | 'claude_md' | 'command' | 'other';
}

interface AnalysisResult {
  name: string;
  description: string;
  hasClaudeMd: boolean;
  skills: string[];
  hooks: string[];
  agents: string[];
  commands: string[];
  fileTree: FileTreeNode[];
}

async function analyzeRepo(owner: string, repo: string): Promise<AnalysisResult> {
  const [rootFiles, claudeFiles, repoInfo] = await Promise.all([
    fetchContents(owner, repo, ''),
    fetchContents(owner, repo, '.claude'),
    fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers: buildHeaders() })
      .then((r) => r.ok ? r.json() as Promise<{ name: string; description: string | null }> : null),
  ]);

  // CLAUDE.md 존재 확인 (루트 또는 .claude/ 안)
  const hasClaudeMd = rootFiles.some((f) => f.name === 'CLAUDE.md') ||
                      claudeFiles.some((f) => f.name === 'CLAUDE.md');

  // README 요약
  const readmeFile = rootFiles.find((f) => /^readme\.md$/i.test(f.name));
  let description = repoInfo?.description ?? '';
  if (readmeFile && !description) {
    const content = await fetchFileContent(owner, repo, readmeFile.path);
    description = extractReadmeSummary(content);
  }

  // .claude 하위 skills/hooks/agents/commands 탐색 (파일 + 디렉토리 모두)
  const [skillFiles, hookFiles, agentFiles, commandFiles] = await Promise.all([
    fetchContents(owner, repo, '.claude/skills'),
    fetchContents(owner, repo, '.claude/hooks'),
    fetchContents(owner, repo, '.claude/agents'),
    fetchContents(owner, repo, '.claude/commands'),
  ]);

  const skills = skillFiles.map((f) => f.name);
  const hooks = hookFiles.map((f) => f.name);
  const agents = agentFiles.map((f) => f.name);
  const commands = commandFiles.map((f) => f.name);

  // file_tree 구성
  const fileTree: FileTreeNode[] = [];

  if (hasClaudeMd) {
    fileTree.push({ name: 'CLAUDE.md', type: 'file', path: 'CLAUDE.md', kind: 'claude_md' });
  }
  for (const f of skillFiles) {
    fileTree.push({ name: f.name, type: f.type, path: f.path, kind: 'skill' });
  }
  for (const f of hookFiles) {
    fileTree.push({ name: f.name, type: f.type, path: f.path, kind: 'hook' });
  }
  for (const f of agentFiles) {
    fileTree.push({ name: f.name, type: f.type, path: f.path, kind: 'agent' });
  }
  for (const f of commandFiles) {
    fileTree.push({ name: f.name, type: f.type, path: f.path, kind: 'command' });
  }

  return {
    name: repoInfo?.name ?? repo,
    description,
    hasClaudeMd,
    skills,
    hooks,
    agents,
    commands,
    fileTree,
  };
}

// ─── upsert ──────────────────────────────────────────────────────────────────

async function upsertKit(seedRepo: SeedRepo, analysis: AnalysisResult): Promise<void> {
  const githubRepoUrl = `https://github.com/${seedRepo.owner}/${seedRepo.repo}`;
  const slug = toSlug(`${seedRepo.owner}-${seedRepo.repo}`);

  const kitData = {
    github_repo: githubRepoUrl,
    name: analysis.name,
    description: analysis.description,
    category: seedRepo.category,
    tags: seedRepo.tags,
    skills_count: analysis.skills.length,
    hooks_count: analysis.hooks.length,
    agents_count: analysis.agents.length,
    has_claude_md: analysis.hasClaudeMd,
    github_branch: 'main',
    version: '1.0.0',
    author_id: null,
    is_published: true,
    install_count: 0,
    file_tree: analysis.fileTree.length > 0 ? analysis.fileTree : null,
    hooks_meta: [],
  };

  // 기존 레코드 확인 후 insert or update
  const { data: existing } = await supabase
    .from('kits')
    .select('id')
    .eq('github_repo', githubRepoUrl)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('kits')
      .update(kitData)
      .eq('id', existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from('kits')
      .insert({ ...kitData, slug, install_count: 0 });
    if (error) throw new Error(error.message);
  }
}

// ─── 메인 ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🌱 CCHub Seed — ${FAMOUS_REPOS.length}개 레포 처리 시작\n`);

  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (const seedRepo of FAMOUS_REPOS) {
    const label = `${seedRepo.owner}/${seedRepo.repo}`;
    process.stdout.write(`  처리 중: ${label} ... `);

    try {
      const analysis = await analyzeRepo(seedRepo.owner, seedRepo.repo);

      const hasContent =
        analysis.hasClaudeMd ||
        analysis.skills.length > 0 ||
        analysis.hooks.length > 0 ||
        analysis.agents.length > 0;

      if (!hasContent) {
        console.log(`⚠️  .claude/ 콘텐츠 없음 (스킵)`);
        skipped++;
        continue;
      }

      await upsertKit(seedRepo, analysis);

      const parts = [];
      if (analysis.hasClaudeMd) parts.push('CLAUDE.md');
      if (analysis.skills.length) parts.push(`skills:${analysis.skills.length}`);
      if (analysis.hooks.length) parts.push(`hooks:${analysis.hooks.length}`);
      if (analysis.agents.length) parts.push(`agents:${analysis.agents.length}`);
      if (analysis.commands.length) parts.push(`commands:${analysis.commands.length}`);
      console.log(`✅  [${parts.join(', ')}]`);
      success++;

      // rate limit 방지 딜레이 (미인증 60req/h)
      if (!GITHUB_TOKEN) await new Promise((r) => setTimeout(r, 1200));

    } catch (err) {
      console.log(`❌  ${err instanceof Error ? err.message : String(err)}`);
      failed++;
    }
  }

  console.log(`\n────────────────────────────`);
  console.log(`✅ 성공: ${success}개`);
  console.log(`⚠️  스킵: ${skipped}개 (.claude/ 없음)`);
  console.log(`❌ 실패: ${failed}개`);
  console.log(`────────────────────────────\n`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
