#!/bin/bash
#
# 강사용 패키지 빌드 스크립트
# 사용법: ./build-package.sh <API_KEY> <SPEC_FILE> [OUTPUT_DIR]
#
# 결과: 학생에게 배포할 폴더가 생성됨
#   output/
#   ├── install.command    (더블클릭으로 실행)
#   ├── spec.md            (환경 명세)
#   └── config/            (OpenClaw 에이전트 설정)
#

set -euo pipefail

if [ $# -lt 2 ]; then
    echo "사용법: $0 <API_KEY> <SPEC_FILE> [OUTPUT_DIR]"
    echo ""
    echo "예시: $0 sk-ant-xxx specs/spring-boot-example.md ./output"
    exit 1
fi

API_KEY="$1"
SPEC_FILE="$2"
OUTPUT_DIR="${3:-./output}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# 명세 파일 확인
if [ ! -f "$SPEC_FILE" ]; then
    echo "❌ 명세 파일을 찾을 수 없습니다: $SPEC_FILE"
    exit 1
fi

# 출력 디렉토리 생성
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR/config"

# install.command 복사 후 API 키 주입
cp "$SCRIPT_DIR/install.command" "$OUTPUT_DIR/install.command"
sed -i '' "s|^API_KEY=\"\"|API_KEY=\"$API_KEY\"|" "$OUTPUT_DIR/install.command"
chmod +x "$OUTPUT_DIR/install.command"

# 명세 파일 복사
cp "$SPEC_FILE" "$OUTPUT_DIR/$(basename "$SPEC_FILE")"

# config 파일 복사
cp "$SCRIPT_DIR/config/AGENTS.md" "$OUTPUT_DIR/config/AGENTS.md"
cp "$SCRIPT_DIR/config/SOUL.md" "$OUTPUT_DIR/config/SOUL.md"
cp "$SCRIPT_DIR/config/SKILL.md" "$OUTPUT_DIR/config/SKILL.md"

# 강의명 추출
COURSE_NAME=$(head -1 "$SPEC_FILE" | sed 's/^#[[:space:]]*//' | sed 's/환경 명세 — //')

echo ""
echo "✅ 패키지 빌드 완료"
echo ""
echo "  강의: $COURSE_NAME"
echo "  출력: $OUTPUT_DIR/"
echo ""
echo "  $OUTPUT_DIR/"
ls -1 "$OUTPUT_DIR/" | sed 's/^/  ├── /'
echo ""
echo "이 폴더를 zip으로 압축하여 학생에게 배포하세요."
echo "학생은 install.command 파일을 더블클릭하면 자동으로 설치됩니다."
