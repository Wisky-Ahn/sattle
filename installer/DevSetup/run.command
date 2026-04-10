#!/bin/bash
# DevSetup 실행 스크립트
# macOS Gatekeeper quarantine 속성 제거 후 앱 실행
set -e
cd "$(dirname "$0")"

# quarantine 속성 재귀적 제거
if [ -d "DevSetup.app" ]; then
    xattr -cr DevSetup.app 2>/dev/null || true
    open DevSetup.app
else
    echo "❌ DevSetup.app을 찾을 수 없습니다"
    echo "이 파일은 DevSetup.app과 같은 폴더에 있어야 합니다."
    read -p "아무 키나 누르면 종료합니다..."
fi
