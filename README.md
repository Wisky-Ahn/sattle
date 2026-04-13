<div align="center">

# sattle

**[Live](https://sattle.vercel.app) · [Demo](docs/demo.gif) · [Docs](docs/ai활용리포트.md) · [Issues](https://github.com/Wisky-Ahn/sattle/issues)**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![Swift](https://img.shields.io/badge/Swift-5.9-orange)](https://swift.org)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-000000)](https://sattle.vercel.app)

</div>

---

## What is sattle?

# 개발 교육 환경 세팅, 더 이상 설명하지 마세요.

OpenClaw가 *AI 에이전트*라면, sattle은 *AI 에이전트가 학생의 컴퓨터에서 환경을 자율적으로 구축하도록 만드는 인프라*입니다.

강사는 수업 계획서만 자유롭게 입력하면, AI가 명세를 파싱해 학생용 설치 패키지를 생성합니다. 학생은 ZIP 파일 하나만 받아 더블클릭하면, 기존 환경 진단 → 충돌 정리 → 격리 설치 → 빌드 검증까지 AI 에이전트가 알아서 수행합니다.

![sattle 데모](docs/demo.gif)

---

## sattle은 이런 분께 적합합니다

✅ **개발 교육 강사** — 수업 시간의 절반을 환경 세팅에 쓰는 게 지긋지긋하다
✅ **부트캠프 운영자** — 20명의 학생 환경을 한 번에 통일하고 싶다
✅ **온보딩 담당자** — 신입 개발자에게 동일한 개발 환경을 즉시 제공해야 한다
✅ **학생** — "제 컴퓨터에서만 안 돼요"를 말하기 싫다

---

## Features

### 🧠 AI 명세 파싱
강사가 자유 형식으로 작성한 수업 계획서를 Claude API가 분석해 도구·언어·프레임워크·검증 명령을 자동 추출합니다. 암묵적 의존성도 추론해서 보충합니다.

### 🤖 OpenClaw AI 에이전트 자율 설치
SwiftUI 앱은 UI만 담당하고, 실제 설치는 OpenClaw AI 에이전트가 학생 PC에서 자율적으로 수행합니다. 검증 실패 시 원인을 분석해 자동으로 수정하고 재시도합니다.

### 📦 동적 패키징
학생마다 다른 spec_id, install_id, api_key가 주입된 ZIP 파일이 요청 시점에 JSZip으로 메모리에서 생성됩니다. Vercel 서버리스 환경에서 200~400ms 이내 응답.

### 🎯 초대 코드 흐름
강사가 초대 코드(6자리)를 학생에게 공유하면, 학생은 가입 없이 코드 입력 → 이름 입력 → ZIP 다운로드 → 더블클릭으로 설치 시작.

### 📊 실시간 모니터링
Supabase Realtime의 `postgres_changes` 구독으로 모든 학생의 설치 단계가 강사 대시보드에 즉시 반영됩니다. 누가 어디서 막혔는지 한눈에 파악.

### 🔒 자동 정리
설치 완료 후 OpenClaw, `~/.openclaw/`, API 키, 임시 파일까지 모두 자동 삭제하여 학생 PC를 깨끗하게 유지합니다.

### 🛡️ 격리 설치
글로벌 환경을 건드리지 않고 sdkman, pyenv, nvm 같은 버전 매니저를 통해 격리 설치합니다. 기존 설치된 도구와 충돌하지 않습니다.

### 🎨 네이티브 UX
SwiftUI로 작성된 macOS 네이티브 앱. 도트 진행 표시, 단계별 애니메이션, 상세 로그 뷰까지 갖춘 깔끔한 인터페이스.

### ⚡ 원클릭 실행
Quarantine 우회, ad-hoc 코드사이닝, hidden 앱 번들 + 런처 스크립트 구조로 학생은 `.command` 파일 1개만 더블클릭하면 됩니다.

---

## Problems sattle solves

| Without sattle | With sattle |
|----------------|-------------|
| 강사가 매 수업마다 1시간 30분씩 환경 세팅 설명 | 학생이 ZIP 다운받아 더블클릭 (평균 30초~3분) |
| "제 컴퓨터에서만 안 돼요" 트러블슈팅 무한 반복 | AI가 환경 진단 후 자동으로 충돌 해결 |
| 누가 끝났고 누가 막혔는지 알 수 없음 | 강사 대시보드에 모든 학생 진행률 실시간 표시 |
| 검증 실패 시 학생이 원인 모르고 멈춤 | OpenClaw이 에러 분석 → 자동 수정 → 재시도 |
| 설치 도구가 글로벌 환경 오염 | sdkman/pyenv/nvm으로 격리 설치, 원복 가능 |
| 강사가 학생 OS별로 개별 가이드 작성 | 명세 1개로 모든 학생 환경 통일 |

---

## Why sattle is special

**01. 단순 스크립트 실행기가 아닙니다**
하드코딩된 `brew install` 스크립트는 검증 실패 시 멈춥니다. sattle은 OpenClaw AI 에이전트에 위임해 맥락 기반 자동 복구가 가능합니다.

**02. 강사와 학생이 같은 진실을 봅니다**
Supabase Realtime으로 학생의 설치 단계가 강사 대시보드에 즉시 반영됩니다. "되고 있나요?"라고 물을 필요가 없습니다.

**03. 학생 PC에 흔적을 남기지 않습니다**
설치 완료 후 OpenClaw, API 키, 설정 파일, 임시 디렉토리까지 모두 자동 삭제합니다. 30일짜리 임시 키를 사용해 노출 위험도 최소화.

**04. 명세는 자유 형식입니다**
JSON이나 YAML 같은 정형 포맷이 아닌, 강사가 평소 작성하던 한국어 수업 계획서를 그대로 입력합니다. AI가 알아서 구조화합니다.

---

## What sattle is NOT

- **챗봇이 아닙니다.** 강사는 명세를 입력하고, AI는 학생 PC에서 실행합니다. 대화하지 않습니다.
- **에이전트 프레임워크가 아닙니다.** OpenClaw + Claude API를 활용한 도메인 특화 솔루션입니다.
- **워크플로우 빌더가 아닙니다.** 명세를 그래프로 그리지 않고, 자유 형식 텍스트로 입력합니다.
- **클라우드 IDE가 아닙니다.** 학생의 로컬 macOS에 직접 환경을 구축합니다. 가상 머신 없음.
- **CI/CD 도구가 아닙니다.** 개발 환경 세팅 전용. 빌드/배포 파이프라인은 다른 도구를 사용하세요.
- **유료 SaaS가 아닙니다.** 오픈소스이며, 강사는 자신의 Anthropic API 키로 운영합니다.

---

## How it works

| 01. 명세 파싱 | 02. 패키지 다운로드 | 03. AI 자율 설치 |
|--------------|-------------------|------------------|
| 강사가 수업 계획서를 textarea에 붙여넣기 | 학생이 초대 코드로 접속해 ZIP 다운로드 | OpenClaw 에이전트가 환경 진단 + 격리 설치 + 검증 |
| Claude API가 도구·버전·검증 명령 추출 | 더블클릭으로 `sattle 설치.command` 실행 | 실패 시 원인 분석 → 자동 복구 → 재시도 |
| 6자리 초대 코드 발급 | SwiftUI 앱이 OpenClaw + 설정 자동 배치 | 완료 후 OpenClaw + API 키 자동 삭제 |

---

## Quickstart

### 강사 (웹)

1. [sattle.vercel.app](https://sattle.vercel.app) 접속 → Google 로그인
2. 강사 대시보드에서 수업 계획서 입력
3. 발급된 초대 코드 6자리를 학생에게 공유

### 학생 (macOS)

1. 강사가 공유한 초대 코드로 접속
2. 이름 입력 → ZIP 다운로드
3. ZIP 자동 압축 해제 후 `sattle 설치.command` **더블클릭**
4. macOS 비밀번호 입력 → 30초~3분 대기 → 완료

> **시스템 요구사항**: macOS 14.0 (Sonoma) 이상 / Apple Silicon 또는 Intel

---

## Development

### Requirements
- Node.js 22.16+
- pnpm 9 또는 npm 10+
- Swift 5.9 (macOS 14+)
- Supabase 프로젝트 (PostgreSQL + Realtime + Auth)
- Anthropic API 키

### 웹 플랫폼

```bash
cd web
cp .env.local.example .env.local
# .env.local에 Supabase URL/Key, Anthropic API Key 설정

npm install
npm run dev   # 로컬 개발 서버 (port 3000)
npm run build # 프로덕션 빌드
```

### macOS 설치 앱

```bash
cd installer/DevSetup
swift build -c release         # Release 빌드
./build-app.sh                 # .app 번들 + ZIP 패키징
```

빌드된 `dist/DevSetup.app`을 `web/public/DevSetup.app.zip`으로 복사하면 다음 다운로드부터 새 버전이 적용됩니다.

### 환경 변수

| 변수 | 설명 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 익명 키 |
| `ANTHROPIC_API_KEY` | Claude API 키 (명세 파싱 + 학생 PC OpenClaw 실행용) |

---

## Architecture

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│   강사 UI   │───▶│  Claude API  │───▶│  Supabase   │
│  (Next.js)  │    │   (파싱)     │    │   (specs)   │
└─────────────┘    └──────────────┘    └─────┬───────┘
                                              │
                                              ▼
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│   학생 UI   │───▶│ Download API │───▶│ sattle.zip  │
│  (Next.js)  │    │  (JSZip)     │    │ + config    │
└──────┬──────┘    └──────────────┘    └─────┬───────┘
       │                                      │
       │ Realtime                             ▼
       │ 구독                          ┌─────────────┐
       │                               │ sattle.app  │
       │                               │  (SwiftUI)  │
       │                               └─────┬───────┘
       │                                     │
       │                                     ▼
       │                               ┌─────────────┐
       │                               │  OpenClaw   │
       │                               │ AI 에이전트 │
       │                               └─────┬───────┘
       │                                     │ 자율 설치 + 검증 + 재시도
       │                                     ▼
       │                               ┌─────────────┐
       │                               │  실제 설치  │
       │                               │ (brew/pip/  │
       │                               │  nvm/sdkman)│
       │                               └─────┬───────┘
       │                                     │
       └───── 실시간 반영 ◀──── status API ──┘
```

---

## FAQ

**Q. Windows는 지원하나요?**
A. 현재는 macOS 14+ 전용입니다. Windows 버전(PowerShell + WSL2)은 로드맵에 있습니다.

**Q. Apple Developer 인증서 없이 어떻게 실행되나요?**
A. Ad-hoc 코드사이닝 + `xattr -cr`로 quarantine을 자동 제거합니다. 학생은 별도 보안 설정 없이 더블클릭만으로 실행 가능합니다.

**Q. API 키가 학생 PC로 전달되는데 안전한가요?**
A. 30일짜리 임시 키를 사용하며, 설치 완료 후 OpenClaw + 설정 파일이 모두 자동 삭제됩니다. 노출되어도 30일 후 자동 만료.

**Q. 검증이 실패하면 어떻게 되나요?**
A. OpenClaw AI 에이전트가 에러 메시지를 분석해서 자동 복구를 시도합니다. 예: `go run hello.go`가 실패하면 hello.go 파일을 자동 생성 후 재검증.

**Q. 기존 설치된 도구와 충돌하지 않나요?**
A. sdkman, pyenv, nvm 같은 버전 매니저로 격리 설치합니다. 글로벌 환경을 건드리지 않습니다.

**Q. 학생이 여러 번 설치할 수 있나요?**
A. 가능합니다. OpenClaw 에이전트는 멱등성을 보장하도록 설계되어 있습니다.

---

## Roadmap

- ✅ AI 명세 파싱 (Claude Sonnet 4.6)
- ✅ OpenClaw AI 에이전트 자율 설치
- ✅ Supabase Realtime 모니터링
- ✅ Google OAuth 인증
- ✅ Vercel 프로덕션 배포
- ⚪ Apple Developer Notarization (앱 더블클릭으로 즉시 실행)
- ⚪ Windows 버전 (PowerShell + WSL2)
- ⚪ 강사 클래스룸 (다중 명세 + 학생 그룹 관리)
- ⚪ 환경 스냅샷 + 수업 종료 시 원복
- ⚪ 에러 패턴 학습 (실패한 설치를 분석해서 다음 설치 개선)
- ⚪ Polar 결제 연동 (월 구독제)

---

## Tech Stack

| 영역 | 기술 |
|------|------|
| **웹 프론트엔드** | Next.js 16, React 19, TypeScript, Tailwind CSS 4, Framer Motion, Lucide Icons |
| **웹 백엔드** | Next.js API Routes, Anthropic Claude API |
| **인증 & DB** | Supabase (PostgreSQL + OAuth + Realtime + RLS) |
| **macOS 앱** | SwiftUI, Swift 5.9, Swift Package Manager |
| **AI 에이전트** | OpenClaw (npm 패키지, Node 22+) |
| **패키징** | JSZip (서버리스 호환) |
| **배포** | Vercel (웹), Ad-hoc signing (macOS) |

---

## License

MIT License · 2026 Korea IT Academy

---

<div align="center">

**Built with [Claude Code](https://claude.ai/code) (Opus 4.6 1M context) + 페어 프로그래밍**

[⭐ Star on GitHub](https://github.com/Wisky-Ahn/sattle) · [🌐 Try Live](https://sattle.vercel.app)

</div>
