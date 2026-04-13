# sattle

개발 교육 환경 자동 세팅 서비스

강사는 수업 계획서만 입력하면, AI가 필요한 도구·버전·의존성을 분석합니다.
학생은 초대 코드로 접속해 원클릭으로 동일한 개발 환경을 구성합니다.

> **Production**: https://sattle.vercel.app

## 데모 영상

https://github.com/Wisky-Ahn/sattle/raw/main/docs/demo.mp4

> 영상이 재생되지 않으면 [여기서 다운로드](docs/demo.mp4)하여 시청할 수 있습니다.

---

## 핵심 기능

### 1. AI 명세 파싱
강사가 자유 형식으로 작성한 수업 계획서를 Claude API가 분석하여 프레임워크, 언어, 도구, 검증 명령을 구조화된 JSON으로 추출합니다.

### 2. 원클릭 설치
학생이 초대 코드로 접속하면 macOS 설치 패키지(ZIP)가 생성됩니다.
`sattle 설치.command`를 더블클릭하면 SwiftUI 앱이 환경을 자동 구성합니다.

### 3. 실시간 모니터링
강사 대시보드에서 모든 학생의 설치 진행 상황을 실시간으로 확인합니다.
Supabase Realtime으로 프로그레스 바, 성공/실패 상태가 즉시 반영됩니다.

---

## 프로젝트 구조

```
sattle/
├── web/                    # Next.js 웹 플랫폼
│   ├── src/app/            # 페이지 & API 라우트
│   │   ├── page.tsx        # 랜딩 페이지
│   │   ├── login/          # OAuth 로그인
│   │   ├── instructor/     # 강사 대시보드
│   │   ├── demo/           # 학생 초대 코드 입력
│   │   ├── install/[code]/ # 학생 설치 페이지
│   │   ├── student/        # 학생 설치 현황
│   │   └── api/            # API 엔드포인트
│   │       ├── specs/      # 명세 CRUD + AI 파싱
│   │       ├── download/   # 설치 ZIP 생성
│   │       └── install/    # 설치 상태 업데이트
│   └── src/components/     # 공유 컴포넌트
├── installer/              # macOS 네이티브 설치 앱
│   └── DevSetup/           # SwiftUI 앱 (SPM)
│       └── Sources/        # ViewModel, Views, Theme
├── specs/                  # 환경 명세 예제
├── docker/                 # Docker 테스트 환경
└── docs/                   # 프로젝트 문서
```

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| **웹 프론트엔드** | Next.js 16, React 19, TypeScript, Tailwind CSS 4, Framer Motion |
| **웹 백엔드** | Next.js API Routes, Anthropic Claude API |
| **인증 & DB** | Supabase (PostgreSQL + OAuth + Realtime) |
| **macOS 앱** | SwiftUI, Swift 5.9, Swift Package Manager |
| **배포** | Vercel (웹), Ad-hoc signing (macOS) |

---

## 시작하기

### 웹 플랫폼

```bash
cd web
cp .env.local.example .env.local
# .env.local에 Supabase URL/Key, Anthropic API Key 설정

npm install
npm run dev
```

### macOS 설치 앱

```bash
cd installer/DevSetup
swift build           # 개발 빌드
./build-app.sh        # 배포용 .app 번들 생성
```

---

## 환경 변수

| 변수 | 설명 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 익명 키 |
| `ANTHROPIC_API_KEY` | Claude API 키 (명세 파싱용) |

---

## 워크플로우

```
강사                        서비스                      학생
 │                           │                          │
 ├─ 수업 계획서 입력 ────────►│                          │
 │                 AI가 도구/버전 추출                   │
 │◄── 초대 코드 발급 ────────┤                          │
 │                           │                          │
 │    초대 코드 전달 ─────────────────────────────────────►│
 │                           │◄── 초대 코드 입력 ────────┤
 │                           │─── ZIP 다운로드 ──────────►│
 │                           │                  .command 실행
 │                           │◄── 설치 진행 상태 보고 ───┤
 │◄── 실시간 모니터링 ───────┤                          │
 │                           │                          │
```

---

## 명세 형식 예시

```markdown
React 프론트엔드 기초 수업

VS Code를 IDE로 사용합니다.
Node.js 20 LTS 필요.
React 19 + Next.js 15 + TypeScript로 진행합니다.
Tailwind CSS, ESLint, Prettier 함께 설치.
빌드 검증: npm run build
```

AI가 위 텍스트에서 자동으로 도구 9개, 설치 명령, 검증 명령을 추출합니다.

---

## 라이선스

2026 Korea IT Academy
