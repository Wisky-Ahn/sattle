import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/specs/code/:code — share_code로 명세 조회
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const upperCode = code.toUpperCase();

  const { data, error } = await supabase
    .from("specs")
    .select("*")
    .eq("share_code", upperCode)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "잘못된 초대 코드입니다" }, { status: 404 });
  }

  return NextResponse.json(data);
}
