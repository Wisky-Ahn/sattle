#!/bin/bash
# Docker 컨테이너 내에서 OpenClaw 초기 설정을 수행하는 스크립트
# API 키는 환경변수로 주입받음

set -e

source /root/.nvm/nvm.sh
nvm use 22

# OpenClaw 설정 디렉토리 생성
mkdir -p /root/.openclaw/workspace/skills/dev-setup

# openclaw.json 설정
cat > /root/.openclaw/openclaw.json << 'OCEOF'
{
  "env": {
    "ANTHROPIC_API_KEY": "${ANTHROPIC_API_KEY}"
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-sonnet-4-6"
      }
    }
  },
  "gateway": {
    "mode": "local"
  }
}
OCEOF

# 환경변수 치환
sed -i "s|\${ANTHROPIC_API_KEY}|${ANTHROPIC_API_KEY}|g" /root/.openclaw/openclaw.json

# AGENTS.md 복사
cp /workspace/openclaw-config/AGENTS.md /root/.openclaw/workspace/AGENTS.md
cp /workspace/openclaw-config/SOUL.md /root/.openclaw/workspace/SOUL.md
cp /workspace/openclaw-config/skills/dev-setup/SKILL.md /root/.openclaw/workspace/skills/dev-setup/SKILL.md

# 권한 설정
chmod 700 /root/.openclaw
chmod 600 /root/.openclaw/openclaw.json

# doctor 실행
openclaw doctor --fix 2>&1 || true

echo "=== OpenClaw 설정 완료 ==="
openclaw --version
openclaw skills 2>&1 | grep -i "dev_setup" || echo "스킬 로드 확인 필요"
