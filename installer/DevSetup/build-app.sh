#!/bin/bash
#
# DevSetup.app 번들 생성 + 배포용 ZIP/DMG 패키징
# ZIP에는 DevSetup.app + run.command (quarantine 우회용)가 포함됨
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BUILD_DIR="$SCRIPT_DIR/.build-app"
APP_NAME="DevSetup"
APP_BUNDLE="$BUILD_DIR/$APP_NAME.app"
DIST_DIR="$SCRIPT_DIR/dist"

echo "=== DevSetup.app 빌드 ==="

# 1. Release 빌드
echo "[1/5] Swift release 빌드..."
cd "$SCRIPT_DIR"
swift build -c release 2>&1 | tail -3

BINARY="$SCRIPT_DIR/.build/release/DevSetup"
if [ ! -f "$BINARY" ]; then
    echo "❌ 빌드 실패"
    exit 1
fi

# 2. .app 번들 구조 생성
echo "[2/5] .app 번들 생성..."
rm -rf "$APP_BUNDLE"
mkdir -p "$APP_BUNDLE/Contents/MacOS"
mkdir -p "$APP_BUNDLE/Contents/Resources"

cp "$BINARY" "$APP_BUNDLE/Contents/MacOS/$APP_NAME"
chmod +x "$APP_BUNDLE/Contents/MacOS/$APP_NAME"

cat > "$APP_BUNDLE/Contents/Info.plist" << 'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleName</key>
    <string>sattle</string>
    <key>CFBundleDisplayName</key>
    <string>sattle</string>
    <key>CFBundleIdentifier</key>
    <string>com.sattle.installer</string>
    <key>CFBundleVersion</key>
    <string>1.0.0</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleExecutable</key>
    <string>DevSetup</string>
    <key>LSMinimumSystemVersion</key>
    <string>14.0</string>
    <key>NSHighResolutionCapable</key>
    <true/>
</dict>
</plist>
PLIST

echo -n "APPL????" > "$APP_BUNDLE/Contents/PkgInfo"

# 3. Ad-hoc 코드사이닝 (서명 없어도 "손상됨" 에러 줄임)
echo "[3/5] Ad-hoc 코드사이닝..."
codesign --force --deep --sign - "$APP_BUNDLE" 2>&1 | tail -3

# 4. ZIP 패키징 (DevSetup.app + run.command)
echo "[4/5] ZIP 패키징..."
mkdir -p "$DIST_DIR"
ZIP_PATH="$DIST_DIR/$APP_NAME.zip"
rm -f "$ZIP_PATH"

ZIP_STAGING="$BUILD_DIR/zip-staging"
rm -rf "$ZIP_STAGING"
mkdir -p "$ZIP_STAGING"
cp -R "$APP_BUNDLE" "$ZIP_STAGING/"
cp "$SCRIPT_DIR/run.command" "$ZIP_STAGING/"
chmod +x "$ZIP_STAGING/run.command"

# README 추가
cat > "$ZIP_STAGING/README.txt" << 'README'
DevSetup 실행 방법
=================

1. ZIP 파일 압축 해제 (더블클릭)
2. run.command 파일을 더블클릭

터미널이 열리면서 자동으로 DevSetup이 실행됩니다.

⚠️ "DevSetup은 손상되었습니다" 에러가 나는 경우:
   run.command 파일이 macOS 격리를 자동으로 해제합니다.
   run.command 를 반드시 먼저 실행하세요.
README

cd "$ZIP_STAGING" && zip -rq "$ZIP_PATH" . && cd "$SCRIPT_DIR"

echo "✅ $ZIP_PATH 생성 완료"

# 5. DMG 생성 (선택사항, 웹 API 호환용)
echo "[5/5] DMG 패키징..."
DMG_PATH="$DIST_DIR/$APP_NAME.dmg"
rm -f "$DMG_PATH"

DMG_STAGING="$BUILD_DIR/dmg-staging"
rm -rf "$DMG_STAGING"
mkdir -p "$DMG_STAGING"
cp -R "$APP_BUNDLE" "$DMG_STAGING/"
cp "$SCRIPT_DIR/run.command" "$DMG_STAGING/"
chmod +x "$DMG_STAGING/run.command"
ln -s /Applications "$DMG_STAGING/Applications"

hdiutil create -volname "DevSetup" \
    -srcfolder "$DMG_STAGING" \
    -ov -format UDZO \
    "$DMG_PATH" 2>/dev/null

echo "✅ $DMG_PATH 생성 완료"

# 정리
rm -rf "$BUILD_DIR"

echo ""
echo "=== 빌드 완료 ==="
echo "  ZIP: $ZIP_PATH ($(du -h "$ZIP_PATH" | cut -f1))"
echo "  DMG: $DMG_PATH ($(du -h "$DMG_PATH" | cut -f1))"
echo ""
echo "학생 배포: ZIP 권장 (quarantine 우회 스크립트 포함)"
