---
name: dev_setup
description: >
  강사의 Markdown 환경 명세를 읽고 macOS에 개발 환경을 자동으로 세팅하는 스킬.
  프레임워크 설치, 버전 관리, 의존성 설정, 빌드 검증까지 전체 과정을 자율 수행한다.
  "환경 세팅", "setup", "설치", "개발환경", "프레임워크 설치", spec 파일 경로가
  언급되면 반드시 이 스킬을 사용할 것.
metadata:
  openclaw:
    emoji: "🛠️"
    os: ["darwin"]
---

# Dev Environment Setup Skill

강사가 제공한 .md 명세 파일을 읽고, macOS 환경에 개발 프레임워크를 자동으로 설치하고 검증한다.

## 명세 파일 형식

강사의 .md 명세는 다음 구조를 따른다:

```markdown
# 환경 명세

## 프레임워크
- name: Spring Boot
- version: 3.2.x

## 언어
- name: Java
- version: 17

## 빌드 도구
- name: Gradle
- variant: Groovy

## 의존성
- Spring Web
- Spring Data JPA
- Lombok

## 검증 명령
- gradle build
```

## 프레임워크별 설치 전략

### Spring Boot
```bash
# 1. sdkman 설치 (없으면)
curl -s "https://get.sdkman.io" | bash
source "$HOME/.sdkman/bin/sdkman-init.sh"

# 2. Java 설치
sdk install java 17.0.9-tem

# 3. Gradle 설치
sdk install gradle 8.5

# 4. 프로젝트 생성 (Spring Initializr)
curl -G https://start.spring.io/starter.tgz \
  -d type=gradle-project \
  -d language=java \
  -d bootVersion=3.2.0 \
  -d dependencies=web,data-jpa,lombok \
  | tar -xzf -

# 5. 검증
./gradlew build
```

### Python / Django
```bash
# 1. pyenv 설치 (없으면)
brew install pyenv
echo 'eval "$(pyenv init -)"' >> ~/.zshrc

# 2. Python 설치
pyenv install 3.11.7
pyenv local 3.11.7

# 3. 가상환경
python -m venv .venv
source .venv/bin/activate

# 4. 의존성
pip install django djangorestframework

# 5. 검증
python -m django check
```

### React / Next.js
```bash
# 1. nvm으로 Node 설치 (없으면)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.nvm/nvm.sh

# 2. Node 설치
nvm install 20
nvm use 20

# 3. 프로젝트 생성
npx create-next-app@latest my-app --typescript --tailwind --app

# 4. 의존성
cd my-app && npm install

# 5. 검증
npm run build
```

## 환경 진단 절차

설치 전 반드시 실행:

```bash
# OS/아키텍처 확인
uname -m  # arm64 = Apple Silicon, x86_64 = Intel

# 기존 설치 감지
which java python3 node brew sdkman pyenv nvm 2>/dev/null

# 버전 확인
java -version 2>&1 | head -1
python3 --version 2>&1
node --version 2>&1

# PATH 분석
echo $PATH | tr ':' '\n'

# 디스크 여유
df -h /

# 환경변수 파일 확인
cat ~/.zshrc 2>/dev/null | grep -E 'export|PATH|JAVA_HOME|PYTHON|NODE|NVM|SDKMAN'
```

## 충돌 해결 전략

| 상황 | 대응 |
|------|------|
| Java 11이 있는데 17 필요 | sdkman으로 17 추가 설치, 프로젝트 로컬로 17 지정 |
| Python 시스템 버전과 충돌 | pyenv로 격리, 시스템 Python 건드리지 않음 |
| brew가 없음 | 자동 설치 (Xcode CLT 포함) |
| PATH에 같은 도구 여러 경로 | 버전 매니저 경로가 우선하도록 ~/.zshrc 조정 |
| 깨진 심볼릭 링크 | `find /usr/local/bin -type l ! -exec test -e {} \; -print`로 감지, 제거 |

## 검증 결과 출력

설치 완료 후 결과를 구조화하여 출력:

```
══════════════════════════════════════
  환경 세팅 완료 보고서
══════════════════════════════════════
프레임워크: Spring Boot 3.2.0
언어: Java 17.0.9 (Temurin)
빌드 도구: Gradle 8.5
──────────────────────────────────────
검증 결과:
  ✅ java -version → 17.0.9
  ✅ gradle -version → 8.5
  ✅ gradle build → BUILD SUCCESSFUL (12.3s)
──────────────────────────────────────
설치 경로: ~/.sdkman/candidates/java/17.0.9-tem
소요 시간: 3분 42초
══════════════════════════════════════
```

## 자동 삭제

환경 세팅 + 검증 완료 후, 사용자에게 결과 보고 후 실행:

```bash
# OpenClaw 자동 삭제
npm uninstall -g openclaw
rm -rf ~/.openclaw
# LaunchAgent 제거
launchctl remove ai.openclaw.gateway 2>/dev/null
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```
