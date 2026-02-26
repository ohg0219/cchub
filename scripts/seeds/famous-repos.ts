export interface SeedRepo {
  owner: string;
  repo: string;
  category: string;
  tags: string[];
  featured?: boolean;
}

/**
 * 실제로 .claude/ 디렉토리 또는 CLAUDE.md가 확인된 레포 목록
 * (조사일: 2026-02-26)
 */
export const FAMOUS_REPOS: SeedRepo[] = [
  // ── Anthropic ────────────────────────────────────────────────
  {
    // CLAUDE.md + .claude/agents + .claude/commands + settings.json
    owner: 'anthropics',
    repo: 'claude-code-action',
    category: 'devops',
    tags: ['claude', 'github-actions', 'ci', 'automation'],
    featured: true,
  },

  // ── Remotion ─────────────────────────────────────────────────
  {
    // CLAUDE.md + .claude/skills(9개) + .claude/commands(7개)
    // 가장 완성도 높은 실제 Claude Code 통합 사례
    owner: 'remotion-dev',
    repo: 'remotion',
    category: 'frontend',
    tags: ['video', 'react', 'typescript', 'remotion'],
    featured: true,
  },

  // ── Cal.com ───────────────────────────────────────────────────
  {
    // CLAUDE.md + .claude/skills(3개) + .claude/rules
    owner: 'calcom',
    repo: 'cal.com',
    category: 'fullstack',
    tags: ['scheduling', 'nextjs', 'prisma', 'typescript'],
    featured: true,
  },

  // ── Vercel Labs ───────────────────────────────────────────────
  {
    // CLAUDE.md 확인됨 (agent-skills 레포)
    owner: 'vercel-labs',
    repo: 'agent-skills',
    category: 'frontend',
    tags: ['vercel', 'nextjs', 'react', 'skills'],
    featured: true,
  },
];
