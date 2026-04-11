import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { readFile } from "fs/promises";
import path from "path";
import JSZip from "jszip";

export const runtime = "nodejs";

const LAUNCHER_COMMAND = `#!/bin/bash
# sattle 자동 실행 스크립트
clear
echo ""
echo "  ╔══════════════════════════════════════╗"
echo "  ║   🛠️  sattle 환경 자동 세팅           ║"
echo "  ╚══════════════════════════════════════╝"
echo ""
echo "  잠시만 기다려주세요..."
echo ""

cd "$(dirname "$0")"

APP_PATH=".sattle.app"
CONFIG_PATH=".sattle-config.json"

if [ ! -d "$APP_PATH" ]; then
    echo "  ❌ 앱 파일을 찾을 수 없습니다."
    echo "  ZIP을 다시 다운로드해주세요."
    read -p "아무 키나 누르면 종료합니다..."
    exit 1
fi

xattr -cr "$APP_PATH" 2>/dev/null || true

TEMP_DIR="$HOME/.sattle-temp"
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"

cp -R "$APP_PATH" "$TEMP_DIR/sattle.app"
cp "$CONFIG_PATH" "$TEMP_DIR/devsetup-config.json"
cp "$CONFIG_PATH" "$TEMP_DIR/sattle-config.json"
xattr -cr "$TEMP_DIR/sattle.app" 2>/dev/null || true

echo "  ✓ 준비 완료"
echo ""

open "$TEMP_DIR/sattle.app"

osascript -e 'tell application "Terminal" to close (every window whose name contains "sattle")' 2>/dev/null &
exit 0
`;

// GET /api/download?spec_id=xxx&install_id=yyy
// 베이스 ZIP(DevSetup.app.zip)에 학생별 config.json과 런처를 주입하여 반환
export async function GET(request: NextRequest) {
  const specId = request.nextUrl.searchParams.get("spec_id");
  const installId = request.nextUrl.searchParams.get("install_id");

  if (!specId) {
    return NextResponse.json({ error: "spec_id required" }, { status: 400 });
  }

  try {
    const { data: spec, error } = await supabase
      .from("specs")
      .select("*")
      .eq("id", specId)
      .single();

    if (error || !spec) {
      return NextResponse.json({ error: "spec not found" }, { status: 404 });
    }

    const host = request.headers.get("host") ?? request.nextUrl.host;
    const protocol = request.headers.get("x-forwarded-proto") ?? "https";
    const apiBaseUrl = process.env.NEXT_PUBLIC_APP_URL ?? `${protocol}://${host}`;

    const config = {
      spec_id: specId,
      install_id: installId ?? "",
      api_base_url: apiBaseUrl,
      title: spec.title,
      framework: spec.framework,
      spec_content: spec.spec_content,
    };

    const baseZipPath = path.join(process.cwd(), "public", "DevSetup.app.zip");
    const baseZipBuffer = await readFile(baseZipPath);

    const baseZip = await JSZip.loadAsync(baseZipBuffer);
    const zip = new JSZip();

    // DevSetup.app을 숨김 이름(.sattle.app)으로 리네임하여 복사
    // 학생 Finder에는 "sattle 설치.command" 하나만 보이도록 함
    for (const [entryPath, entry] of Object.entries(baseZip.files)) {
      const renamed = entryPath.replace(/^DevSetup\.app/, ".sattle.app");
      if (entry.dir) {
        zip.folder(renamed);
      } else {
        const content = await entry.async("uint8array");
        zip.file(renamed, content, {
          unixPermissions: entry.unixPermissions ?? undefined,
          date: entry.date,
        });
      }
    }

    zip.file(".sattle-config.json", JSON.stringify(config, null, 2));
    zip.file("sattle 설치.command", LAUNCHER_COMMAND, {
      unixPermissions: 0o755,
    });

    const outputBuffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
      platform: "UNIX",
    });

    return new Response(new Uint8Array(outputBuffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="sattle.zip"`,
        "Content-Length": String(outputBuffer.length),
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("Download error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
