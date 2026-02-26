-- ============================================================
-- file_tree 형식 수정 (배열 + kind/path 필드 추가)
-- ============================================================

UPDATE kits SET file_tree = '[
  {"type":"file","name":"SKILL.md","path":"seeds/spring-boot-enterprise/skills/spring-boot/SKILL.md","kind":"skill"},
  {"type":"file","name":"SKILL.md","path":"seeds/spring-boot-enterprise/skills/mybatis/SKILL.md","kind":"skill"},
  {"type":"file","name":"SKILL.md","path":"seeds/spring-boot-enterprise/skills/java-conventions/SKILL.md","kind":"skill"},
  {"type":"file","name":"CLAUDE.md","path":"seeds/spring-boot-enterprise/CLAUDE.md","kind":"claude_md"}
]'::jsonb
WHERE slug = 'spring-boot-enterprise';

UPDATE kits SET file_tree = '[
  {"type":"file","name":"SKILL.md","path":"seeds/nextjs-fullstack/skills/nextjs-patterns/SKILL.md","kind":"skill"},
  {"type":"file","name":"CLAUDE.md","path":"seeds/nextjs-fullstack/CLAUDE.md","kind":"claude_md"}
]'::jsonb
WHERE slug = 'nextjs-fullstack';

UPDATE kits SET file_tree = '[
  {"type":"file","name":"SKILL.md","path":"seeds/cckit-starter/skills/pdca/SKILL.md","kind":"skill"},
  {"type":"file","name":"SKILL.md","path":"seeds/cckit-starter/skills/skill-maker/SKILL.md","kind":"skill"},
  {"type":"file","name":"AGENT.md","path":"seeds/cckit-starter/agents/code-analyzer/AGENT.md","kind":"agent"},
  {"type":"file","name":"AGENT.md","path":"seeds/cckit-starter/agents/gap-detector/AGENT.md","kind":"agent"},
  {"type":"file","name":"AGENT.md","path":"seeds/cckit-starter/agents/pdca-iterator/AGENT.md","kind":"agent"},
  {"type":"file","name":"AGENT.md","path":"seeds/cckit-starter/agents/report-generator/AGENT.md","kind":"agent"},
  {"type":"file","name":"session-start.js","path":"seeds/cckit-starter/hooks/session-start.js","kind":"hook"},
  {"type":"file","name":"pre-compact.js","path":"seeds/cckit-starter/hooks/pre-compact.js","kind":"hook"},
  {"type":"file","name":"stop.js","path":"seeds/cckit-starter/hooks/stop.js","kind":"hook"},
  {"type":"file","name":"CLAUDE.md","path":"seeds/cckit-starter/CLAUDE.md","kind":"claude_md"}
]'::jsonb
WHERE slug = 'cckit-starter';
