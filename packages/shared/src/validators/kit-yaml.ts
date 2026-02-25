import { z } from 'zod';

const slugRegex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
const semverRegex = /^\d+\.\d+\.\d+$/;

export const KitYamlSchema = z.object({
  name: z.string().regex(slugRegex, 'slug 형식이어야 합니다 (소문자, 하이픈, 숫자)'),
  version: z.string().regex(semverRegex, '시맨틱 버전이어야 합니다 (x.y.z)'),
  description: z.string().max(200, '200자 이내여야 합니다'),
  author: z.string().min(1),
  license: z.string().min(1),
  language: z.array(z.string()).optional(),
  category: z
    .enum(['backend', 'frontend', 'data', 'devops', 'mobile', 'fullstack'])
    .optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
  compatible_agents: z
    .array(z.enum(['claude-code', 'cursor', 'copilot', 'windsurf', 'cline']))
    .optional(),
  requirements: z.record(z.string()).optional(),
  components: z
    .object({
      skills: z.number().int().min(0),
      hooks: z.number().int().min(0),
      agents: z.number().int().min(0),
      claude_md: z.boolean(),
    })
    .optional(),
  install: z
    .object({
      target: z
        .object({
          skills: z.string().optional(),
          hooks: z.string().optional(),
          agents: z.string().optional(),
          claude_md: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
});

export type KitYamlInput = z.input<typeof KitYamlSchema>;

export function validateKitYaml(input: unknown) {
  return KitYamlSchema.safeParse(input);
}
