import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { TablesUpdate } from "@/lib/database.types";

type InstallationUpdate = TablesUpdate<"installations">;

// POST /api/install/:id/status — 설치 상태 업데이트
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { step, total, status, message } = body;

  const updateData: InstallationUpdate = {
    step,
    total_steps: total,
    status,
    message,
  };

  if (status === "installing" && step === 1) {
    updateData.started_at = new Date().toISOString();
  }
  if (status === "success" || status === "failed") {
    updateData.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("installations")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// GET /api/install/:id/status — 설치 상태 조회
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data, error } = await supabase
    .from("installations")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
