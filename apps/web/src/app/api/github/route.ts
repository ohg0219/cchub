import { NextRequest, NextResponse } from 'next/server';

interface GitHubFile {
  name: string;
  type: 'file' | 'dir';
  path: string;
  content?: string;    // Base64, only for single file requests
  download_url?: string;
}

export interface GitHubAnalysisResult {
  name: string;
  description: string;
  hasKitYaml: boolean;
  skills: string[];
  hooks: string[];
  agents: string[];
  readmeSummary: string;
}

function buildAuthHeaders(): HeadersInit {
  const token = process.env.GITHUB_TOKEN;
  return {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'cchub-web/0.1.0',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function fetchContents(owner: string, repo: string, path: string): Promise<GitHubFile[]> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    { headers: buildAuthHeaders(), next: { revalidate: 300 } }
  );
  if (!res.ok) {
    if (res.status === 404) return [];
    throw new Error(`GitHub API error: ${res.status}`);
  }
  const data = await res.json() as GitHubFile | GitHubFile[];
  return Array.isArray(data) ? data : [data];
}

async function fetchFileContent(owner: string, repo: string, path: string): Promise<string> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    { headers: buildAuthHeaders(), next: { revalidate: 300 } }
  );
  if (!res.ok) return '';
  const data = await res.json() as GitHubFile;
  if (!data.content) return '';
  return Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf-8');
}

function extractReadmeSummary(content: string): string {
  // h1 이후 첫 번째 비어 있지 않은 단락 추출
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

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'url parameter required' }, { status: 400 });
  }

  // SSRF 방지: github.com 도메인만 허용
  if (!url.startsWith('https://github.com/')) {
    return NextResponse.json({ error: 'Only github.com URLs are allowed' }, { status: 400 });
  }

  // owner/repo 파싱
  const match = url.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/.*)?$/);
  if (!match) {
    return NextResponse.json({ error: 'Invalid GitHub URL format' }, { status: 400 });
  }
  const [, owner, repo] = match;

  try {
    // 루트 파일 목록 + .claude 디렉토리 병렬 조회
    const [rootFiles, claudeFiles, repoInfo] = await Promise.all([
      fetchContents(owner, repo, ''),
      fetchContents(owner, repo, '.claude'),
      fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: buildAuthHeaders(),
        next: { revalidate: 300 },
      }).then((r) => r.ok ? r.json() as Promise<{ name: string; description: string | null }> : null),
    ]);

    // kit.yaml 존재 확인 및 파싱
    let kitYamlData: Record<string, string> = {};
    const hasKitYaml = rootFiles.some((f) => f.name === 'kit.yaml') ||
                       claudeFiles.some((f) => f.name === 'kit.yaml');
    if (hasKitYaml) {
      const kitYamlPath = claudeFiles.some((f) => f.name === 'kit.yaml')
        ? '.claude/kit.yaml'
        : 'kit.yaml';
      const raw = await fetchFileContent(owner, repo, kitYamlPath);
      // 간단한 YAML 파싱 (name:, description: 키만 추출)
      for (const line of raw.split('\n')) {
        const m = line.match(/^(name|description):\s*['"]?(.+?)['"]?\s*$/);
        if (m) kitYamlData[m[1]] = m[2];
      }
    }

    // README 요약
    const readmeFile = rootFiles.find((f) => /^readme\.md$/i.test(f.name));
    let readmeSummary = '';
    if (readmeFile) {
      const content = await fetchFileContent(owner, repo, readmeFile.path);
      readmeSummary = extractReadmeSummary(content);
    }

    // .claude 하위 skills/hooks/agents 파일 목록
    const [skillFiles, hookFiles, agentFiles] = await Promise.all([
      fetchContents(owner, repo, '.claude/skills'),
      fetchContents(owner, repo, '.claude/hooks'),
      fetchContents(owner, repo, '.claude/agents'),
    ]);

    const result: GitHubAnalysisResult = {
      name: kitYamlData['name'] ?? repoInfo?.name ?? repo,
      description: kitYamlData['description'] ?? repoInfo?.description ?? '',
      hasKitYaml,
      skills: skillFiles.filter((f) => f.type === 'file').map((f) => f.name),
      hooks: hookFiles.filter((f) => f.type === 'file').map((f) => f.name),
      agents: agentFiles.filter((f) => f.type === 'file').map((f) => f.name),
      readmeSummary,
    };

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('404')) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to analyze repository' }, { status: 500 });
  }
}
