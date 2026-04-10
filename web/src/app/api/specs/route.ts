import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

function generateShareCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 혼동 문자 제외 (O/0, I/1)
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// POST /api/specs — AI 파싱 결과를 저장 + share_code 자동 생성
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, framework, spec_content, instructor_id } = body;

  if (!title || !spec_content) {
    return NextResponse.json({ error: "title and spec_content are required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("specs")
    .insert({
      title,
      framework: framework ?? "Custom",
      spec_content,
      raw_markdown: spec_content.raw_input ?? null,
      instructor_id: instructor_id ?? null,
      share_code: generateShareCode(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// GET /api/specs — 명세 목록 조회
export async function GET() {
  const { data, error } = await supabase
    .from("specs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
