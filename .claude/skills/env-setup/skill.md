---
name: env-setup
description: "개발 환경 자동 세팅 엔진 구축 스킬. 강사의 .md 환경 명세를 파싱하고 프레임워크별 설치 스크립트를 생성한다. 환경 세팅, 설치 스크립트, 프레임워크 설치, 명세 파싱, brew, pip, gradle, maven, SDK 설치, 개발 환경 구축, 자동 설치가 언급되면 반드시 이 스킬을 사용할 것. 단순 코드 작성이 아닌 설치 자동화 로직이 필요할 때 트리거된다."
---

# 환경 세팅 자동화 엔진 구축

개발 교육용 프레임워크 환경 세팅을 자동화하는 엔진을 설계하고 구현하는 스킬.

## 서비스 플로우

```
강사 명세(.md) → 파서 → 설치 계획 → 스크립트 생성 → 실행 → 검증 → 피드백
```

## 1. 명세 파서

강사가 제공하는 .md 파일에서 다음 정보를 추출한다:

- **프레임워크**: Spring Boot, Django, React, Android Studio 등
- **언어 및 버전**: Java 17, Python 3.11, Node 20 등
- **의존성**: Lombok, Spring Web, pytest, webpack 등
- **빌드 도구**: Gradle(Groovy/Kotlin), Maven, pip, npm/yarn/pnpm
- **IDE 설정**: VS Code extensions, IntelliJ plugins 등 (선택)

파서 출력은 JSON 형태의 설치 계획(install plan)으로 변환한다:

```json
{
  "framework": "spring-boot",
  "language": { "name": "java", "version": "17" },
  "build_tool": { "name": "gradle", "variant": "groovy" },
  "dependencies": ["lombok", "spring-web", "spring-data-jpa"],
  "ide": { "name": "intellij", "plugins": [] },
  "test_command": "gradle build"
}
```

## 2. 프레임워크별 설치 로직

각 프레임워크의 설치 절차를 모듈화한다. Mac 우선.

### 공통 패턴
1. 사전 조건 확인 (기존 설치 감지, 버전 확인)
2. 패키지 매니저 확인/설치 (brew, sdkman, nvm 등)
3. 런타임/SDK 설치
4. 프로젝트 초기화 (빌드 도구 설정, 의존성 다운로드)
5. 검증 (빌드 실행, 테스트 코드 실행)

### Spring Boot (예시)
```
1. brew install openjdk@17 (또는 sdkman)
2. JAVA_HOME 환경변수 설정
3. gradle/maven wrapper 확인
4. spring initializr로 프로젝트 생성 또는 기존 템플릿 사용
5. gradle build로 검증
```

### Python/Django (예시)
```
1. brew로 python 버전 관리자 설치 (pyenv 또는 UV)
2. 지정 버전 Python 설치
3. 가상환경 생성 및 활성화
4. pip install -r requirements.txt
5. python manage.py check로 검증
```

### React/Next.js (예시)
```
1. nvm 또는 fnm으로 Node.js 설치
2. 패키지 매니저 설정 (npm/yarn/pnpm)
3. npx create-next-app 또는 템플릿 clone
4. npm install
5. npm run build로 검증
```

## 3. 에러 처리 전략

환경 세팅에서 가장 빈번한 에러 유형과 대응:

| 에러 유형 | 감지 방법 | 대응 |
|----------|----------|------|
| 경로 충돌 | which/where 명령으로 기존 설치 감지 | 기존 경로 백업 후 격리 설치 |
| 버전 충돌 | 버전 매니저(sdkman/nvm/pyenv) 활용 | 격리된 버전으로 설치, 글로벌 영향 없음 |
| 권한 부족 | exit code 확인 | sudo 요청 (사전 동의 후) |
| 네트워크 실패 | 다운로드 타임아웃 감지 | 재시도 3회, 미러 서버 시도 |
| 디스크 부족 | df 명령으로 사전 확인 | 필요 용량 안내 후 중단 |
| brew 미설치 | which brew 확인 | 자동 설치 (사용자 동의 후) |

## 4. 관리자 권한 처리

macOS에서 sudo가 필요한 작업:
- 시스템 디렉토리 접근 (/usr/local, /Library)
- brew 최초 설치
- 특정 SDK의 시스템 레벨 설치

처리 방식:
1. 설치 시작 전 필요한 권한 목록을 사용자에게 명시
2. 동의 절차를 거친 후 비밀번호 입력
3. sudo 세션 유지 (sudo -v 갱신)
4. 설치 완료 후 권한 해제

## 5. 설치 검증

설치 완료 판단 기준:
- 빌드 명령 실행 성공 (exit code 0)
- 테스트 코드 실행 성공
- 주요 바이너리 경로 확인 (which/where)
- 버전 출력 일치 확인

검증 결과는 JSON 포맷으로 출력하여 강사에게 피드백:

```json
{
  "status": "success",
  "framework": "spring-boot",
  "checks": [
    { "name": "java_version", "expected": "17", "actual": "17.0.9", "pass": true },
    { "name": "gradle_build", "pass": true, "duration_ms": 12340 }
  ],
  "log_path": "/tmp/setup-log-2026-04-08.log"
}
```

## 6. 스크립트 생성 원칙

- 셸 스크립트(bash/zsh)로 생성 — Mac 기본 환경에서 실행 가능
- 각 단계에 로그 출력 (진행률, 성공/실패)
- set -e로 에러 시 즉시 중단
- 각 단계 사이에 체크포인트 — 실패 시 해당 단계부터 재시작 가능
- 스크립트 최상단에 OS/아키텍처 감지 (Intel/Apple Silicon 분기)
