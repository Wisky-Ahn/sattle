---
name: setup-orchestrator
description: "개발 교육용 환경 세팅 자동화 서비스의 전체 개발 워크플로우를 조율하는 오케스트레이터. 프로젝트 빌드, 기능 구현, 전체 개발 작업 시작, 환경 세팅 서비스 개발이 언급되면 반드시 이 스킬을 사용할 것. 개별 모듈이 아닌 프로젝트 전체를 아우르는 작업에 트리거된다."
---

# Setup Orchestrator — 환경 세팅 서비스 개발 오케스트레이터

개발 교육용 환경 세팅 자동화 서비스의 에이전트 팀을 조율하여 MVP를 구축하는 통합 스킬.

## 실행 모드: 에이전트 팀

## 에이전트 구성

| 팀원 | 에이전트 파일 | 역할 | 스킬 | 주요 출력 |
|------|-------------|------|------|----------|
| setup-engine | `agents/setup-engine.md` | 환경 세팅 엔진 | env-setup | 명세 파서, 설치 스크립트, 검증 스크립트 |
| platform-dev | `agents/platform-dev.md` | 웹 플랫폼 | platform | Supabase 연동, API, UI |
| qa-validator | `agents/qa-validator.md` | 품질 검증 | qa-verify | 테스트 결과, 버그 리포트 |

## 워크플로우

### Phase 1: 준비 및 분석

1. 사용자 요청 분석 — 구현 범위, 우선 프레임워크, 타겟 OS 파악
2. `_workspace/` 디렉토리 생성
3. 프로젝트 요구사항을 `_workspace/00_input/requirements.md`에 정리
4. 기존 코드베이스 탐색 — 이미 구현된 부분 파악

### Phase 2: 팀 구성

1. 팀 생성:
   ```
   TeamCreate(
     team_name: "setup-service-team",
     members: [
       {
         name: "setup-engine",
         agent_type: "general-purpose",
         model: "opus",
         prompt: "당신은 setup-engine 에이전트입니다. agents/setup-engine.md의 역할을 수행합니다. skills/env-setup/skill.md를 읽고 환경 세팅 자동화 엔진을 구현하세요. 명세 파서, 프레임워크별 설치 스크립트 생성기, 에러 처리, 설치 검증 로직을 구현합니다."
       },
       {
         name: "platform-dev",
         agent_type: "general-purpose",
         model: "opus",
         prompt: "당신은 platform-dev 에이전트입니다. agents/platform-dev.md의 역할을 수행합니다. skills/platform/skill.md를 읽고 웹 플랫폼을 구현하세요. Supabase 인증/DB, Polar 결제, 강사 대시보드, 학생 설치 UI를 구현합니다."
       },
       {
         name: "qa-validator",
         agent_type: "general-purpose",
         model: "opus",
         prompt: "당신은 qa-validator 에이전트입니다. agents/qa-validator.md의 역할을 수행합니다. skills/qa-verify/skill.md를 읽고 각 모듈 완성 직후 점진적 QA를 수행하세요. 경계면 교차 비교에 집중합니다."
       }
     ]
   )
   ```

2. 작업 등록:
   ```
   TaskCreate(tasks: [
     # Phase 3-A: 핵심 엔진 (setup-engine)
     { title: "명세 파서 구현", description: "강사 .md 명세를 JSON 설치 계획으로 변환하는 파서 구현", assignee: "setup-engine" },
     { title: "Spring Boot 설치 스크립트", description: "Spring Boot 프레임워크 설치 자동화 스크립트 생성기 구현 (Mac 우선)", assignee: "setup-engine" },
     { title: "Python/Django 설치 스크립트", description: "Python/Django 프레임워크 설치 자동화 스크립트 생성기 구현", assignee: "setup-engine" },
     { title: "React/Next.js 설치 스크립트", description: "React/Next.js 프레임워크 설치 자동화 스크립트 생성기 구현", assignee: "setup-engine" },
     { title: "설치 검증 스크립트", description: "설치 완료 여부를 판단하는 검증 스크립트 구현", assignee: "setup-engine" },

     # Phase 3-B: 웹 플랫폼 (platform-dev, 병렬)
     { title: "Supabase 스키마 및 인증", description: "DB 스키마 생성, RLS 정책, OAuth 인증 구현", assignee: "platform-dev" },
     { title: "Polar 결제 연동", description: "결제 링크 생성, 웹훅 처리, 접근권한 관리", assignee: "platform-dev" },
     { title: "강사 대시보드 UI", description: "명세 업로드, 학생 모니터링, 피드백 확인 페이지", assignee: "platform-dev" },
     { title: "학생 설치 UI", description: "설치 목록, 원클릭 설치, 진행 상태, 결과 페이지", assignee: "platform-dev" },
     { title: "설치 API 엔드포인트", description: "setup-engine과 연동하는 REST API 구현", assignee: "platform-dev" },

     # Phase 3-C: 점진적 QA (qa-validator, 의존성 있음)
     { title: "명세 파서 검증", description: "3개 프레임워크 명세 파싱 검증, 에러 입력 테스트", assignee: "qa-validator", depends_on: ["명세 파서 구현"] },
     { title: "스크립트 생성 검증", description: "생성된 스크립트 문법 검증, 멱등성 테스트, 에러 핸들링 확인", assignee: "qa-validator", depends_on: ["Spring Boot 설치 스크립트"] },
     { title: "API 통합 테스트", description: "API 엔드포인트 검증, 인증 플로우, RLS 정책 테스트", assignee: "qa-validator", depends_on: ["설치 API 엔드포인트"] },
     { title: "경계면 교차 비교", description: "명세→파서→스크립트→검증 전체 체인의 데이터 정합성 검증", assignee: "qa-validator", depends_on: ["설치 검증 스크립트", "설치 API 엔드포인트"] },
   ])
   ```

### Phase 3: 병렬 개발 + 점진적 QA

**실행 방식:** setup-engine과 platform-dev 병렬, qa-validator는 의존 모듈 완성 후 점진적 검증

**팀원 간 통신 규칙:**
- setup-engine은 명세 파서 완성 시 qa-validator에게 SendMessage ("명세 파서 구현 완료, 검증 요청")
- setup-engine은 API 스펙 확정 시 platform-dev에게 SendMessage ("설치 API 스펙 공유")
- platform-dev은 API 엔드포인트 완성 시 qa-validator에게 SendMessage ("API 검증 요청")
- qa-validator는 버그 발견 시 해당 에이전트에게 SendMessage ("버그 발견: [상세]")

**산출물 저장:**

| 팀원 | 출력 경로 |
|------|----------|
| setup-engine | `_workspace/03_setup-engine_parser.md`, `_workspace/03_setup-engine_scripts/` |
| platform-dev | `_workspace/03_platform-dev_schema.sql`, `_workspace/03_platform-dev_api.md` |
| qa-validator | `_workspace/03_qa-validator_report.md` |

**리더 모니터링:**
- TaskGet으로 전체 진행률 확인
- 팀원이 유휴 상태가 되면 알림 수신 → 상태 확인 후 재할당
- setup-engine과 platform-dev의 API 스펙 합의 여부 확인

### Phase 4: 통합 및 최종 검증

1. 모든 팀원의 작업 완료 대기 (TaskGet으로 상태 확인)
2. 각 팀원의 산출물을 Read로 수집
3. 전체 플로우 통합 테스트: 명세 업로드 → 파싱 → 스크립트 생성 → 설치 → 검증 → 피드백
4. 최종 산출물 정리:
   - 소스 코드 (프로젝트 루트)
   - API 문서 (`docs/api.md`)
   - 설치 가이드 (`docs/setup-guide.md`)

### Phase 5: 정리

1. 팀원들에게 종료 요청 (SendMessage)
2. 팀 정리 (TeamDelete)
3. `_workspace/` 디렉토리 보존
4. 사용자에게 결과 요약:
   - 구현된 기능 목록
   - QA 통과율
   - 알려진 제한사항
   - 다음 단계 제안

## 데이터 흐름

```
[리더/오케스트레이터]
    ├── TeamCreate("setup-service-team")
    │
    ├── [setup-engine] ──── 명세 파서 + 설치 스크립트 + 검증 스크립트
    │       │ SendMessage(API 스펙)
    │       ↓
    ├── [platform-dev] ──── Supabase + Polar + UI + API
    │       │ SendMessage(API 완성 알림)
    │       ↓
    └── [qa-validator] ──── 경계면 검증 + 통합 테스트
            │
            ↓
    [리더: 통합] → 최종 산출물
```

## 에러 핸들링

| 상황 | 전략 |
|------|------|
| 팀원 1명 실패/중지 | 리더가 SendMessage로 상태 확인 → 재시작 또는 작업 재할당 |
| setup-engine과 platform-dev API 스펙 불일치 | qa-validator가 경계면 비교로 감지 → 양쪽에 수정 요청 |
| 팀원 과반 실패 | 사용자에게 알리고 진행 여부 확인 |
| 타임아웃 | 현재까지 완성된 부분으로 부분 산출물 생성 |
| 외부 서비스 연동 실패 (Supabase/Polar) | mock 데이터로 대체하고 연동 코드는 보존 |

## MVP 우선순위

시상식(4/15)까지 반드시 완성할 것:
1. 명세 파서 + Spring Boot 설치 스크립트 (핵심 데모)
2. 설치 검증 (빌드 성공 확인)
3. 기본 UI (설치 시작 → 진행 → 완료)

시간 여유 시 추가:
4. 추가 프레임워크 (Django, React)
5. Supabase 인증 + Polar 결제
6. 강사 모니터링 대시보드

## 테스트 시나리오

### 정상 흐름
1. 사용자가 "Spring Boot 환경 세팅 서비스 MVP 구현" 요청
2. Phase 1에서 요구사항 분석 (Spring Boot, Mac, MVP 범위)
3. Phase 2에서 팀 구성 (3명 팀원, 14개 작업)
4. Phase 3에서 setup-engine과 platform-dev 병렬 개발, qa-validator 점진적 검증
5. Phase 4에서 전체 플로우 통합 테스트
6. Phase 5에서 팀 정리, 결과 보고
7. 예상 결과: 동작하는 MVP + QA 보고서 + API 문서

### 에러 흐름
1. Phase 3에서 qa-validator가 경계면 불일치 발견 (파서 JSON과 스크립트 입력 불일치)
2. qa-validator가 setup-engine에게 SendMessage로 버그 보고
3. setup-engine이 파서 출력 스키마 수정
4. qa-validator가 재검증 → 통과
5. 수정된 스펙으로 platform-dev에도 알림
6. 최종 보고서에 "경계면 불일치 1건 발견 및 수정 완료" 명시
