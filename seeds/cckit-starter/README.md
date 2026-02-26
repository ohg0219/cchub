# cckit-starter

> CCKit 마켓플레이스 개발용 PDCA AI 워크플로우 킷

## 소개

Claude Code로 프로젝트를 개발할 때 PDCA(Plan-Design-Do-Check-Act) 사이클을 자동화하는 스타터 킷입니다.
CCKit 프로젝트에서 실제 사용 중인 Skills, Agents, Hooks를 패키징했습니다.

## 포함 구성

| 타입 | 이름 | 설명 |
|------|------|------|
| Skill | pdca | PDCA 사이클 관리 — plan/design/do/analyze/iterate/report |
| Skill | skill-maker | 전문 Skill/Agent 마크다운 파일 생성 |
| Agent | code-analyzer | 코드 품질/보안/성능 이슈 분석 |
| Agent | gap-detector | 설계 문서 vs 구현 코드 Gap 검출 |
| Agent | pdca-iterator | 자동 반복 개선 루프 (Evaluator-Optimizer) |
| Agent | report-generator | PDCA 완료 보고서 자동 생성 |
| Hook | session-start.js | 세션 시작 시 PDCA 상태 로드 |
| Hook | pre-compact.js | 컨텍스트 압축 전 상태 저장 |
| Hook | stop.js | 세션 종료 시 다음 액션 안내 |

## 설치

```bash
npx cckit install cckit-starter
```

설치 후 Claude Code에서 `/pdca plan [feature]` 명령으로 시작하세요.

## 요구사항

- Node.js >= 18
- Claude Code

## 라이선스

MIT
