---
name: platform
description: "웹 플랫폼 구축 스킬. Supabase 인증/DB, Polar 결제, 강사 대시보드, 학생 설치 UI를 구현한다. 로그인, OAuth, 결제, 대시보드, 모니터링, 학생 관리, 강사 페이지, Supabase, Polar, UI 구현, 웹 앱이 언급되면 반드시 이 스킬을 사용할 것. 환경 설치 로직이 아닌 웹 서비스 계층의 작업에 트리거된다."
---

# 웹 플랫폼 구축

개발 교육용 환경 세팅 서비스의 웹 플랫폼을 구축하는 스킬.

## 아키텍처

```
[강사 대시보드] ←→ [API Layer] ←→ [Supabase DB/Auth]
                      ↕                    ↕
[학생 설치 UI]  ←→ [설치 API] ←→ [Setup Engine]
                      ↕
                 [Polar 결제]
```

## 1. Supabase 연동

### 인증 (Auth)
- OAuth 제공자: Google, GitHub (강사/학생 모두)
- 역할 구분: `role` 필드로 instructor/student 분리
- RLS 정책: 강사는 자신의 명세만, 학생은 자신의 설치 기록만 접근

### DB 스키마 핵심 테이블

```sql
-- 강사가 생성한 환경 명세
CREATE TABLE specs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  framework TEXT NOT NULL,
  spec_content JSONB NOT NULL,  -- 파싱된 설치 계획
  raw_markdown TEXT,             -- 원본 .md 파일 내용
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 학생의 설치 기록
CREATE TABLE installations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id),
  spec_id UUID REFERENCES specs(id),
  status TEXT CHECK (status IN ('pending', 'installing', 'success', 'failed')),
  log JSONB,                     -- 설치 로그
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- 결제 기록
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  spec_id UUID REFERENCES specs(id),
  polar_payment_id TEXT,
  status TEXT CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Realtime 구독
- 강사 대시보드: `installations` 테이블 구독 → 학생 설치 상태 실시간 반영
- 학생 UI: 자신의 설치 레코드 구독 → 진행률 업데이트

## 2. Polar 결제

- Polar API로 결제 링크 생성
- 웹훅으로 결제 완료 감지 → `payments` 테이블 업데이트
- 결제 완료 후 설치 파일 다운로드 링크 활성화
- sandbox 모드로 개발, 프로덕션 전환은 환경변수로 제어

## 3. 강사 대시보드

### 페이지 구성
1. **명세 관리**: 환경 명세 업로드(.md), 프레임워크 선택, 버전/의존성 기본값 제공
2. **학생 모니터링**: 학생별 설치 상태 (대기/진행중/성공/실패) 실시간 표시
3. **피드백 확인**: 설치 실패 로그 조회, 에러 패턴 요약

### UI 원칙
- 강사가 복잡한 설정 불필요 — 프레임워크 선택하면 기본값 자동 세팅
- 주요 프레임워크(Spring, Django, React) 하드코딩 프리셋 제공
- 버전 선택은 드롭다운으로, 최신 안정 버전이 기본 선택

## 4. 학생 설치 UI

### 페이지 구성
1. **설치 목록**: 강사가 배포한 환경 명세 목록 (결제 상태 표시)
2. **설치 실행**: 원클릭 설치 버튼, 진행 상태 바, 로그 실시간 표시
3. **설치 완료**: 성공/실패 결과, 실패 시 재시도 버튼

### UX 원칙
- "마법같이" — 버튼 하나로 끝나는 경험
- 진행 상태를 시각적으로 명확하게 (단계별 체크마크)
- 실패 시 사용자가 이해할 수 있는 안내 메시지

## 5. API 엔드포인트

```
POST   /api/specs          — 환경 명세 생성
GET    /api/specs/:id      — 명세 조회
POST   /api/install/:specId — 설치 시작 요청
GET    /api/install/:id/status — 설치 상태 조회
POST   /api/payments/create — 결제 링크 생성
POST   /api/webhooks/polar  — 결제 완료 웹훅
```
