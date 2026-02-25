-- ============================================================
-- CCKit 데이터베이스 스키마 (참조용 — 대시보드 SQL Editor에서 실행)
-- ============================================================

-- ─── updated_at 자동 갱신 트리거 함수 ───────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── profiles (사용자) ──────────────────────────────────────

CREATE TABLE profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  github_username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url   TEXT,
  bio          TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_read"   ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- ─── kits (스타터 킷) ───────────────────────────────────────

CREATE TABLE kits (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             TEXT UNIQUE NOT NULL
                     CHECK (slug ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$'),
  name             TEXT NOT NULL,
  description      TEXT NOT NULL CHECK (length(description) <= 200),
  author_id        UUID REFERENCES profiles(id) NOT NULL,
  github_repo      TEXT NOT NULL,
  github_branch    TEXT DEFAULT 'main',
  version          TEXT NOT NULL CHECK (version ~ '^\d+\.\d+\.\d+$'),
  license          TEXT,
  category         TEXT NOT NULL
                     CHECK (category IN ('backend','frontend','data','devops','mobile','fullstack')),
  languages        TEXT[] DEFAULT '{ko}',
  tags             TEXT[] DEFAULT '{}'
                     CHECK (array_length(tags, 1) IS NULL OR array_length(tags, 1) <= 10),
  compatible_agents TEXT[] DEFAULT '{claude-code}',

  -- 구성 수 (GitHub 분석 시 자동 계산)
  skills_count     INTEGER DEFAULT 0,
  hooks_count      INTEGER DEFAULT 0,
  agents_count     INTEGER DEFAULT 0,
  has_claude_md    BOOLEAN DEFAULT FALSE,

  -- 통계
  install_count    INTEGER DEFAULT 0,
  star_count       INTEGER DEFAULT 0,

  -- 원본 데이터
  kit_yaml         JSONB,
  file_tree        JSONB,
  hooks_meta       JSONB DEFAULT '[]',

  is_published     BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_kits_category ON kits(category) WHERE is_published;
CREATE INDEX idx_kits_tags ON kits USING GIN(tags) WHERE is_published;
CREATE INDEX idx_kits_install_count ON kits(install_count DESC) WHERE is_published;
CREATE INDEX idx_kits_fts ON kits USING GIN(
  to_tsvector('simple',
    name || ' ' || description || ' ' || array_to_string(tags, ' ')
  )
) WHERE is_published;

CREATE TRIGGER trg_kits_updated_at
  BEFORE UPDATE ON kits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE kits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kits_read"   ON kits FOR SELECT USING (is_published = true);
CREATE POLICY "kits_insert" ON kits FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "kits_update" ON kits FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "kits_delete" ON kits FOR DELETE USING (auth.uid() = author_id);

-- ─── kit_reviews (리뷰) ─────────────────────────────────────

CREATE TABLE kit_reviews (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id     UUID REFERENCES kits(id) ON DELETE CASCADE NOT NULL,
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating     INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment    TEXT CHECK (length(comment) <= 1000),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (kit_id, user_id)  -- 킷당 리뷰 1개
);

ALTER TABLE kit_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews_read"   ON kit_reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert" ON kit_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews_update" ON kit_reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "reviews_delete" ON kit_reviews FOR DELETE USING (auth.uid() = user_id);

-- ─── kit_installs (설치 트래킹, 개인정보 없음) ─────────────

CREATE TABLE kit_installs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id       UUID REFERENCES kits(id) ON DELETE CASCADE NOT NULL,
  installed_at TIMESTAMPTZ DEFAULT NOW(),
  cli_version  TEXT,
  agent_type   TEXT DEFAULT 'claude-code'
);

ALTER TABLE kit_installs ENABLE ROW LEVEL SECURITY;
-- 삽입은 service_role key (Route Handler)에서만, 개인 식별 데이터 없으므로 읽기 허용
CREATE POLICY "installs_read"   ON kit_installs FOR SELECT USING (true);
CREATE POLICY "installs_insert" ON kit_installs FOR INSERT WITH CHECK (true);
