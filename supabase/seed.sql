-- ============================================================
-- CCKit 시드 데이터 (참조용 — 대시보드 SQL Editor에서 실행)
-- ============================================================
-- 실행 전 확인사항:
--   1. schema.sql이 먼저 실행되어 테이블이 존재해야 함
--   2. AUTHOR_UUID를 실제 GitHub OAuth 로그인 후 생성된 profiles.id로 교체
-- ============================================================

-- ─── Step 1: 시드용 서비스 계정 (profiles) ──────────────────
-- 실제 배포 시: GitHub OAuth로 로그인한 cckit-team 계정의 UUID로 교체
-- 로컬 테스트 시: 이 UUID를 그대로 사용 가능 (auth.users 없이도 동작하도록 FK 우회)

-- auth.users에 더미 사용자 삽입 (로컬 개발용)
-- 프로덕션에서는 이 블록 생략하고 실제 OAuth 로그인 사용
INSERT INTO auth.users (
  id, email, created_at, updated_at, email_confirmed_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'team@cckit.dev',
  NOW(), NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (
  id,
  github_username,
  display_name,
  avatar_url,
  bio
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'cckit-team',
  'CCKit Team',
  'https://avatars.githubusercontent.com/u/188052801',
  'Claude Code Starter Kit 공식 킷 제작팀'
) ON CONFLICT (id) DO NOTHING;

-- ─── Step 2: cckit-starter ──────────────────────────────────

INSERT INTO kits (
  slug,
  name,
  description,
  author_id,
  github_repo,
  github_branch,
  version,
  license,
  category,
  languages,
  tags,
  compatible_agents,
  skills_count,
  hooks_count,
  agents_count,
  has_claude_md,
  kit_yaml,
  file_tree,
  is_published
) VALUES (
  'cckit-starter',
  'CCKit Starter',
  'CCKit 마켓플레이스 개발용 PDCA AI 워크플로우 킷 — Skills/Agents/Hooks 포함',
  '00000000-0000-0000-0000-000000000001',
  'https://github.com/cckit-team/cckit',
  'main',
  '1.0.0',
  'MIT',
  'fullstack',
  ARRAY['ko', 'en'],
  ARRAY['pdca', 'workflow', 'claude-code', 'agents', 'hooks'],
  ARRAY['claude-code'],
  2,
  3,
  4,
  true,
  '{
    "name": "cckit-starter",
    "version": "1.0.0",
    "description": "CCKit 마켓플레이스 개발용 PDCA AI 워크플로우 킷 — Skills/Agents/Hooks 포함",
    "author": "cckit-team",
    "license": "MIT",
    "language": ["ko", "en"],
    "category": "fullstack",
    "tags": ["pdca", "workflow", "claude-code", "agents", "hooks"],
    "compatible_agents": ["claude-code"],
    "components": {"skills": 2, "hooks": 3, "agents": 4, "claude_md": true}
  }'::jsonb,
  '{
    "tree": [
      {"type": "directory", "name": "skills", "children": [
        {"type": "directory", "name": "pdca"},
        {"type": "directory", "name": "skill-maker"}
      ]},
      {"type": "directory", "name": "agents", "children": [
        {"type": "file", "name": "code-analyzer/AGENT.md"},
        {"type": "file", "name": "gap-detector/AGENT.md"},
        {"type": "file", "name": "pdca-iterator/AGENT.md"},
        {"type": "file", "name": "report-generator/AGENT.md"}
      ]},
      {"type": "directory", "name": "hooks", "children": [
        {"type": "file", "name": "session-start.js"},
        {"type": "file", "name": "pre-compact.js"},
        {"type": "file", "name": "stop.js"}
      ]},
      {"type": "file", "name": "CLAUDE.md"},
      {"type": "file", "name": "kit.yaml"}
    ]
  }'::jsonb,
  true
) ON CONFLICT (slug) DO NOTHING;

-- ─── Step 3: spring-boot-enterprise ─────────────────────────

INSERT INTO kits (
  slug,
  name,
  description,
  author_id,
  github_repo,
  github_branch,
  version,
  license,
  category,
  languages,
  tags,
  compatible_agents,
  skills_count,
  hooks_count,
  agents_count,
  has_claude_md,
  kit_yaml,
  file_tree,
  is_published
) VALUES (
  'spring-boot-enterprise',
  'Spring Boot Enterprise',
  'Java Spring Boot + MyBatis + Thymeleaf 엔터프라이즈 개발용 AI 스타터 킷',
  '00000000-0000-0000-0000-000000000001',
  'https://github.com/cckit-team/cckit',
  'main',
  '1.0.0',
  'MIT',
  'backend',
  ARRAY['ko'],
  ARRAY['java', 'spring-boot', 'mybatis', 'thymeleaf', 'enterprise'],
  ARRAY['claude-code'],
  3,
  0,
  0,
  true,
  '{
    "name": "spring-boot-enterprise",
    "version": "1.0.0",
    "description": "Java Spring Boot + MyBatis + Thymeleaf 엔터프라이즈 개발용 AI 스타터 킷",
    "author": "cckit-team",
    "license": "MIT",
    "language": ["ko"],
    "category": "backend",
    "tags": ["java", "spring-boot", "mybatis", "thymeleaf", "enterprise"],
    "compatible_agents": ["claude-code"],
    "components": {"skills": 3, "hooks": 0, "agents": 0, "claude_md": true}
  }'::jsonb,
  '{
    "tree": [
      {"type": "directory", "name": "skills", "children": [
        {"type": "file", "name": "spring-boot/SKILL.md"},
        {"type": "file", "name": "mybatis/SKILL.md"},
        {"type": "file", "name": "java-conventions/SKILL.md"}
      ]},
      {"type": "file", "name": "CLAUDE.md"},
      {"type": "file", "name": "kit.yaml"}
    ]
  }'::jsonb,
  true
) ON CONFLICT (slug) DO NOTHING;

-- ─── Step 4: nextjs-fullstack ────────────────────────────────

INSERT INTO kits (
  slug,
  name,
  description,
  author_id,
  github_repo,
  github_branch,
  version,
  license,
  category,
  languages,
  tags,
  compatible_agents,
  skills_count,
  hooks_count,
  agents_count,
  has_claude_md,
  kit_yaml,
  file_tree,
  is_published
) VALUES (
  'nextjs-fullstack',
  'Next.js Fullstack',
  'Next.js 15 App Router + TypeScript + Tailwind CSS 풀스택 개발 스타터 킷',
  '00000000-0000-0000-0000-000000000001',
  'https://github.com/cckit-team/cckit',
  'main',
  '1.0.0',
  'MIT',
  'fullstack',
  ARRAY['ko', 'en'],
  ARRAY['nextjs', 'typescript', 'tailwind', 'react', 'app-router'],
  ARRAY['claude-code'],
  1,
  0,
  0,
  true,
  '{
    "name": "nextjs-fullstack",
    "version": "1.0.0",
    "description": "Next.js 15 App Router + TypeScript + Tailwind CSS 풀스택 개발 스타터 킷",
    "author": "cckit-team",
    "license": "MIT",
    "language": ["ko", "en"],
    "category": "fullstack",
    "tags": ["nextjs", "typescript", "tailwind", "react", "app-router"],
    "compatible_agents": ["claude-code"],
    "components": {"skills": 1, "hooks": 0, "agents": 0, "claude_md": true}
  }'::jsonb,
  '{
    "tree": [
      {"type": "directory", "name": "skills", "children": [
        {"type": "file", "name": "nextjs-patterns/SKILL.md"}
      ]},
      {"type": "file", "name": "CLAUDE.md"},
      {"type": "file", "name": "kit.yaml"}
    ]
  }'::jsonb,
  true
) ON CONFLICT (slug) DO NOTHING;

-- ─── 확인 쿼리 ───────────────────────────────────────────────
-- 실행 후 아래 쿼리로 삽입 결과 확인:
-- SELECT slug, name, category, skills_count, is_published FROM kits ORDER BY created_at;
