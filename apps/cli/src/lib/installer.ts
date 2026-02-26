import fs from 'node:fs/promises';
import path from 'node:path';
import type { KitDetail, FileTreeNode, HookMeta } from './api.js';

export interface InstallOptions {
  skipHooks?: boolean;
  skipAgents?: boolean;
  dryRun?: boolean;
  targetDir?: string;
}

interface ClaudeSettings {
  hooks?: HookEntry[];
  [key: string]: unknown;
}

interface HookEntry {
  type: string;
  event?: string[];
  matcher?: string;
  description?: string;
  command: string;
}

// ─── GitHub Raw URL ─────────────────────────────────────────────

function buildRawUrl(kit: KitDetail, filePath: string): string {
  // https://github.com/{owner}/{repo} → raw URL
  const repoUrl = kit.github_repo.replace('https://github.com/', '');
  const branch = kit.github_branch ?? 'main';
  return `https://raw.githubusercontent.com/${repoUrl}/${branch}/${filePath}`;
}

// ─── 파일 경로 결정 ──────────────────────────────────────────────

function resolveDestPath(
  node: FileTreeNode,
  options: InstallOptions
): string | null {
  const base = options.targetDir ?? process.cwd();

  if (options.skipHooks && node.kind === 'hook') return null;
  if (options.skipAgents && node.kind === 'agent') return null;

  // node.path 에서 종류별 하위 경로 추출 (e.g. "seeds/cchub-starter/skills/pdca/SKILL.md" → "pdca/SKILL.md")
  const getSubPath = (prefix: string) => {
    const idx = node.path.indexOf(prefix);
    return idx !== -1 ? node.path.slice(idx + prefix.length) : node.name;
  };

  switch (node.kind) {
    case 'skill':     return path.join(base, '.claude', 'skills', getSubPath('skills/'));
    case 'hook':      return path.join(base, '.claude', 'hooks', getSubPath('hooks/'));
    case 'agent':     return path.join(base, '.claude', 'agents', getSubPath('agents/'));
    case 'claude_md': return path.join(base, 'CLAUDE.md');
    default:          return null;
  }
}

// ─── 파일 다운로드 ────────────────────────────────────────────────

async function downloadFile(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download: ${url} (${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}

// ─── settings.json 딥 머지 ───────────────────────────────────────

export async function mergeSettings(
  settingsPath: string,
  hooks: HookMeta[],
  dryRun: boolean
): Promise<number> {
  if (hooks.length === 0) return 0;

  let existing: ClaudeSettings = {};
  try {
    const raw = await fs.readFile(settingsPath, 'utf-8');
    existing = JSON.parse(raw) as ClaudeSettings;
  } catch {
    // 파일 없으면 빈 객체로 시작
  }

  const existingHooks: HookEntry[] = existing.hooks ?? [];

  const newHooks: HookEntry[] = hooks.map((h) => ({
    type: h.event,
    matcher: h.matcher,
    description: h.description,
    command: `bash .claude/hooks/${h.name}`,
  }));

  // command 기준 중복 제거
  const merged: HookEntry[] = [...existingHooks];
  let addedCount = 0;
  for (const nh of newHooks) {
    if (!merged.some((e) => e.command === nh.command)) {
      merged.push(nh);
      addedCount++;
    }
  }

  if (!dryRun) {
    const updated: ClaudeSettings = { ...existing, hooks: merged };
    await fs.mkdir(path.dirname(settingsPath), { recursive: true });
    await fs.writeFile(settingsPath, JSON.stringify(updated, null, 2), 'utf-8');
  }

  return addedCount;
}

// ─── 설치 추적 파일 ──────────────────────────────────────────────

interface InstalledRecord {
  slug: string;
  name: string;
  version: string;
  installedAt: string;
  files: string[];
}

interface InstalledManifest {
  version: '1.0';
  kits: InstalledRecord[];
}

async function updateInstalledManifest(
  manifestPath: string,
  kit: KitDetail,
  installedFiles: string[]
): Promise<void> {
  let manifest: InstalledManifest = { version: '1.0', kits: [] };
  try {
    const raw = await fs.readFile(manifestPath, 'utf-8');
    manifest = JSON.parse(raw) as InstalledManifest;
  } catch { /* 없으면 새로 생성 */ }

  // 동일 slug 기록 교체
  manifest.kits = manifest.kits.filter((k) => k.slug !== kit.slug);
  manifest.kits.push({
    slug: kit.slug,
    name: kit.name,
    version: kit.version,
    installedAt: new Date().toISOString(),
    files: installedFiles,
  });

  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
}

// ─── 파일 트리 순회 (재귀) ───────────────────────────────────────

function collectFiles(nodes: FileTreeNode[]): FileTreeNode[] {
  const files: FileTreeNode[] = [];
  for (const node of nodes) {
    if (node.type === 'file') files.push(node);
    if (node.type === 'dir' && node.children) {
      files.push(...collectFiles(node.children));
    }
  }
  return files;
}

// ─── 메인 설치 함수 ──────────────────────────────────────────────

export interface InstallResult {
  installedFiles: string[];
  mergedHooks: number;
  skippedClaudeMd: boolean;
}

export async function installKit(
  kit: KitDetail,
  options: InstallOptions,
  onStep: (msg: string) => void,
  overwriteClaudeMd: boolean
): Promise<InstallResult> {
  const base = options.targetDir ?? process.cwd();
  const rawTree = kit.file_tree;
  const treeArray = Array.isArray(rawTree)
    ? rawTree
    : (rawTree as unknown as { tree?: FileTreeNode[] })?.tree ?? [];
  const fileNodes = collectFiles(treeArray);
  const installedFiles: string[] = [];

  for (const node of fileNodes) {
    const destPath = resolveDestPath(node, options);
    if (!destPath) continue;

    // CLAUDE.md 덮어쓰기 처리
    if (node.kind === 'claude_md') {
      try {
        await fs.access(destPath);
        // 파일 존재
        if (!overwriteClaudeMd) {
          onStep(`CLAUDE.md 건너뜀 (덮어쓰기 거부)`);
          continue;
        }
      } catch { /* 없으면 그냥 진행 */ }
    }

    const rawUrl = buildRawUrl(kit, node.path);
    onStep(destPath.replace(base + path.sep, ''));

    if (!options.dryRun) {
      const content = await downloadFile(rawUrl);
      await fs.mkdir(path.dirname(destPath), { recursive: true });
      // path traversal 방지
      const resolvedDest = path.resolve(destPath);
      const resolvedBase = path.resolve(base);
      if (!resolvedDest.startsWith(resolvedBase)) {
        throw new Error(`Path traversal detected: ${node.path}`);
      }
      try {
        await fs.writeFile(resolvedDest, content);
      } catch (err: unknown) {
        const code = (err as NodeJS.ErrnoException).code;
        if (code === 'EACCES' || code === 'EPERM') {
          throw new Error(`Permission denied: ${resolvedDest}`);
        }
        throw err;
      }
    }

    installedFiles.push(destPath.replace(base + path.sep, ''));
  }

  // settings.json 딥 머지 (hook 파일이 있을 때)
  const hookNodes = fileNodes.filter((n) => n.kind === 'hook');
  let mergedHooks = 0;
  if (!options.skipHooks && hookNodes.length > 0 && kit.hooks_meta.length > 0) {
    const settingsPath = path.join(base, '.claude', 'settings.json');
    mergedHooks = await mergeSettings(settingsPath, kit.hooks_meta, options.dryRun ?? false);
  }

  // 설치 기록 저장
  if (!options.dryRun && installedFiles.length > 0) {
    const manifestPath = path.join(base, '.claude', '.cchub-installed.json');
    await updateInstalledManifest(manifestPath, kit, installedFiles);
  }

  return { installedFiles, mergedHooks, skippedClaudeMd: false };
}

// ─── list 명령용 ─────────────────────────────────────────────────

export async function readInstalledManifest(targetDir?: string): Promise<InstalledManifest> {
  const base = targetDir ?? process.cwd();
  const manifestPath = path.join(base, '.claude', '.cchub-installed.json');
  try {
    const raw = await fs.readFile(manifestPath, 'utf-8');
    return JSON.parse(raw) as InstalledManifest;
  } catch {
    return { version: '1.0', kits: [] };
  }
}
