#!/bin/bash
#
# DevSetup Installer — 개발 환경 자동 세팅
# 더블클릭하면 자동으로 실행됩니다.
#
# 이 스크립트가 하는 일:
# 1. macOS 비밀번호 확인 (sudo)
# 2. Node.js 설치 (없으면)
# 3. OpenClaw 설치 + Claude API 키 설정
# 4. OpenClaw가 강사 명세를 읽고 환경 세팅
# 5. 검증 완료 후 OpenClaw 자동 삭제
#

set -euo pipefail

# ============================================================
# 설정 (강사/관리자가 수정하는 영역)
# ============================================================
SPEC_URL=""           # 명세 다운로드 URL (웹 플랫폼 연동 시)
SPEC_FILE=""          # 로컬 명세 파일 경로 (URL이 없을 때)
API_KEY=""            # Claude API 키 (빌드 시 주입)
SETUP_API_URL=""      # 상태 보고 API URL (선택)
INSTALL_ID=""         # 설치 ID (선택)
MODEL="anthropic/claude-sonnet-4-6"

# ============================================================
# 색상 및 유틸리티
# ============================================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color
BOLD='\033[1m'

print_header() {
    echo ""
    echo -e "${BLUE}${BOLD}══════════════════════════════════════${NC}"
    echo -e "${BLUE}${BOLD}  🛠️  DevSetup — 개발 환경 자동 세팅${NC}"
    echo -e "${BLUE}${BOLD}══════════════════════════════════════${NC}"
    echo ""
}

print_step() {
    echo -e "${GREEN}[${1}/${TOTAL_STEPS}]${NC} ${2}"
}

print_warn() {
    echo -e "${YELLOW}⚠️  ${1}${NC}"
}

print_error() {
    echo -e "${RED}❌ ${1}${NC}"
}

print_success() {
    echo -e "${GREEN}✅ ${1}${NC}"
}

report_status() {
    local step="$1" status="$2" message="$3"
    if [ -n "$SETUP_API_URL" ] && [ -n "$INSTALL_ID" ]; then
        curl -s -X POST "$SETUP_API_URL/api/install/$INSTALL_ID/status" \
            -H "Content-Type: application/json" \
            -d "{\"step\": $step, \"total\": $TOTAL_STEPS, \"status\": \"$status\", \"message\": \"$message\"}" \
            >/dev/null 2>&1 || true
    fi
}

TOTAL_STEPS=6

# ============================================================
# 메인 실행
# ============================================================

print_header

# --- Step 0: 스크립트 위치 기준으로 명세 파일 찾기 ---
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ -z "$SPEC_FILE" ] && [ -z "$SPEC_URL" ]; then
    # 같은 디렉토리에서 .md 파일 찾기
    SPEC_FILE=$(find "$SCRIPT_DIR" -maxdepth 1 -name "*.md" -not -name "README*" | head -1)
    if [ -z "$SPEC_FILE" ]; then
        print_error "명세 파일을 찾을 수 없습니다."
        echo "install.command 파일과 같은 폴더에 환경 명세 .md 파일을 넣어주세요."
        echo ""
        read -p "아무 키나 누르면 종료합니다..."
        exit 1
    fi
fi

echo -e "📋 명세 파일: ${BOLD}$(basename "$SPEC_FILE")${NC}"
echo ""

# --- Step 1: sudo 비밀번호 (1회) ---
print_step 1 "관리자 권한 확인"
echo "macOS 비밀번호를 입력해주세요 (환경 설치에 필요합니다)."
echo ""
sudo -v
# sudo 세션 유지 (백그라운드)
(while true; do sudo -n true; sleep 50; kill -0 "$$" 2>/dev/null || exit; done) &
SUDO_PID=$!
trap "kill $SUDO_PID 2>/dev/null; cleanup_on_exit" EXIT
print_success "관리자 권한 확인 완료"
report_status 1 "installing" "관리자 권한 확인 완료"

# --- Step 2: Xcode Command Line Tools ---
print_step 2 "기본 개발 도구 확인"
if ! xcode-select -p &>/dev/null; then
    echo "Xcode Command Line Tools 설치 중..."
    xcode-select --install 2>/dev/null || true
    echo "설치 팝업이 뜨면 '설치'를 눌러주세요. 완료 후 이 스크립트를 다시 실행해주세요."
    read -p "아무 키나 누르면 종료합니다..."
    exit 0
fi
print_success "Xcode CLT 확인 완료"
report_status 2 "installing" "기본 개발 도구 확인 완료"

# --- Step 3: Node.js 설치 ---
print_step 3 "Node.js 확인 및 설치"

install_node() {
    # nvm이 있으면 사용
    if [ -d "$HOME/.nvm" ]; then
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
        if ! nvm ls 22 &>/dev/null; then
            echo "  nvm으로 Node 22 설치 중..."
            nvm install 22
        fi
        nvm use 22
    # fnm이 있으면 사용
    elif command -v fnm &>/dev/null; then
        fnm install 22
        fnm use 22
    # 둘 다 없으면 nvm 설치
    else
        echo "  nvm 설치 중..."
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
        nvm install 22
        nvm use 22
    fi
}

# Node 22+ 확인
NODE_VERSION=$(node --version 2>/dev/null | sed 's/v//' | cut -d. -f1)
if [ -z "$NODE_VERSION" ] || [ "$NODE_VERSION" -lt 22 ]; then
    install_node
fi
print_success "Node.js $(node --version) 준비 완료"
report_status 3 "installing" "Node.js 준비 완료"

# --- Step 4: OpenClaw 설치 + 설정 ---
print_step 4 "OpenClaw AI 에이전트 설치 및 설정"

# OpenClaw 설치
if ! command -v openclaw &>/dev/null; then
    echo "  OpenClaw 설치 중..."
    npm install -g openclaw@latest 2>/dev/null
fi

# 설정 디렉토리 생성
mkdir -p ~/.openclaw/workspace/skills/dev-setup

# API 키 설정
cat > ~/.openclaw/openclaw.json << OCEOF
{
  "env": {
    "ANTHROPIC_API_KEY": "$API_KEY"
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "$MODEL"
      }
    }
  },
  "gateway": {
    "mode": "local"
  }
}
OCEOF
chmod 700 ~/.openclaw
chmod 600 ~/.openclaw/openclaw.json

# AGENTS.md 복사 (스크립트와 같은 디렉토리에서)
if [ -f "$SCRIPT_DIR/config/AGENTS.md" ]; then
    cp "$SCRIPT_DIR/config/AGENTS.md" ~/.openclaw/workspace/AGENTS.md
fi
if [ -f "$SCRIPT_DIR/config/SOUL.md" ]; then
    cp "$SCRIPT_DIR/config/SOUL.md" ~/.openclaw/workspace/SOUL.md
fi
if [ -f "$SCRIPT_DIR/config/SKILL.md" ]; then
    mkdir -p ~/.openclaw/workspace/skills/dev-setup
    cp "$SCRIPT_DIR/config/SKILL.md" ~/.openclaw/workspace/skills/dev-setup/SKILL.md
fi

# doctor 실행 (자동 수정)
openclaw doctor --fix >/dev/null 2>&1 || true

print_success "OpenClaw $(openclaw --version 2>&1 | grep -o '[0-9].*') 설치 완료"
report_status 4 "installing" "OpenClaw 설치 완료"

# --- Step 5: 환경 세팅 실행 ---
print_step 5 "환경 세팅 시작 (AI 에이전트가 자동으로 진행합니다)"
echo ""
echo -e "${BOLD}  OpenClaw가 명세를 읽고 환경을 세팅합니다.${NC}"
echo -e "  잠시 기다려주세요...\n"

# 명세 다운로드 (URL이 있으면)
if [ -n "$SPEC_URL" ]; then
    SPEC_FILE="/tmp/devsetup-spec.md"
    curl -fsSL "$SPEC_URL" -o "$SPEC_FILE"
fi

# 게이트웨이 시작 대기
sleep 3

# OpenClaw 에이전트 실행
openclaw agent --agent main \
    --message "환경 세팅해줘. 명세 파일: $SPEC_FILE" \
    2>&1 | tee /tmp/devsetup-log.txt

report_status 5 "installing" "환경 세팅 완료"

# --- Step 6: 정리 및 결과 ---
print_step 6 "정리"

# 결과 저장
RESULT_FILE="$HOME/dev-setup-result.txt"
cp /tmp/devsetup-log.txt "$RESULT_FILE"

echo ""
echo -e "${GREEN}${BOLD}══════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}  환경 세팅이 완료되었습니다! 🎉${NC}"
echo -e "${GREEN}${BOLD}══════════════════════════════════════${NC}"
echo ""
echo -e "📄 세팅 결과: ${BOLD}$RESULT_FILE${NC}"
echo ""

# OpenClaw 자동 삭제
cleanup_on_exit() {
    kill "$SUDO_PID" 2>/dev/null || true
}

echo "OpenClaw을 삭제합니다..."
npm uninstall -g openclaw 2>/dev/null || true
rm -rf ~/.openclaw 2>/dev/null || true
launchctl remove ai.openclaw.gateway 2>/dev/null || true
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist 2>/dev/null || true
print_success "OpenClaw 삭제 완료"

report_status 6 "success" "환경 세팅 완료, OpenClaw 삭제됨"

echo ""
echo "이 창은 닫아도 됩니다."
read -p "아무 키나 누르면 종료합니다..."
