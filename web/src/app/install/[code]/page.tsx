"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { uuidv4 } from "@/lib/uuid";
import type { Spec } from "@/lib/database.types";

type SetupTool = {
  name: string;
  version?: string;
  category: string;
};

export default function InstallPage({ params }: { params: Promise<{ code: string }> }) {
  const rawCode = use(params).code;
  const code = rawCode.toUpperCase();
  const [spec, setSpec] = useState<Spec | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [step, setStep] = useState<"name" | "download">("name");
  const [installationId, setInstallationId] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/specs/code/${code}`);
      if (!res.ok) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setSpec(data);
      setLoading(false);
    }
    load();
  }, [code]);

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !spec) return;

    setSubmitting(true);
    setSubmitError("");

    try {
      const { data, error } = await supabase
        .from("installations")
        .insert({
          spec_id: spec.id,
          student_id: uuidv4(),
          student_name: studentName.trim(),
          status: "pending",
          step: 0,
          total_steps: 7,
          message: "설치 대기 중",
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      if (!data) throw new Error("데이터 생성 실패");

      setInstallationId(data.id);
      setStep("download");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "알 수 없는 오류";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = () => {
    if (!spec) return;
    setDownloading(true);
    window.open(`/api/download?spec_id=${spec.id}&install_id=${installationId}`, "_blank");
    setTimeout(() => setDownloading(false), 2000);
  };

  const categoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      ide: "bg-purple-500/20 text-purple-400",
      language: "bg-blue-500/20 text-blue-400",
      framework: "bg-green-500/20 text-green-400",
      package: "bg-yellow-500/20 text-yellow-400",
      system: "bg-gray-500/20 text-gray-400",
      database: "bg-orange-500/20 text-orange-400",
      tool: "bg-cyan-500/20 text-cyan-400",
    };
    return colors[cat] ?? "bg-gray-500/20 text-gray-400";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-gray-400">불러오는 중...</div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-5xl">?</div>
          <h1 className="text-2xl font-bold">잘못된 초대 코드입니다</h1>
          <p className="text-gray-400">코드를 다시 확인하거나 강사에게 문의하세요.</p>
          <Link href="/" className="inline-block px-4 py-2 bg-gray-800 rounded-lg text-sm hover:bg-gray-700 transition">
            메인으로
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="fixed top-0 w-full z-50 bg-gray-950/80 backdrop-blur-md border-b border-gray-800/50">
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight">sattle</Link>
          <span className="text-sm text-gray-500 font-mono">{code}</span>
        </div>
      </header>

      <div className="pt-32 pb-20 px-6">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          {/* 헤더 */}
          <div className="space-y-3">
            <h1 className="text-3xl font-bold">{spec?.title}</h1>
            <p className="text-gray-400 text-lg">
              {spec?.spec_content?.summary ?? spec?.framework}
            </p>
          </div>

          {/* 설치 항목 태그 */}
          {spec?.spec_content?.tools && (
            <div className="flex flex-wrap justify-center gap-2">
              {(spec.spec_content.tools as SetupTool[]).map((tool, i) => (
                <span
                  key={i}
                  className={`px-3 py-1.5 rounded-lg text-sm ${categoryColor(tool.category)}`}
                >
                  {tool.name}{tool.version ? ` ${tool.version}` : ""}
                </span>
              ))}
            </div>
          )}

          {/* Step 1: 이름 입력 */}
          {step === "name" && (
            <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700/50 space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">이름을 입력해주세요</h2>
                <p className="text-gray-400 text-sm">
                  강사가 설치 상태를 확인할 때 표시됩니다
                </p>
              </div>

              <form onSubmit={handleNameSubmit} className="space-y-4 max-w-xs mx-auto">
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="이름 입력"
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white text-center text-lg placeholder:text-gray-500 focus:border-blue-500/50 focus:outline-none transition"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!studentName.trim() || submitting}
                  className="w-full px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-lg font-semibold transition disabled:opacity-40"
                >
                  {submitting ? "처리 중..." : "다음"}
                </button>
                {submitError && (
                  <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    {submitError}
                  </div>
                )}
              </form>
            </div>
          )}

          {/* Step 2: 다운로드 */}
          {step === "download" && (
            <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700/50 space-y-6">
              <div className="space-y-2">
                <div className="text-sm text-blue-400">{studentName}님, 환영합니다!</div>
                <h2 className="text-xl font-semibold">환경 자동 세팅</h2>
                <p className="text-gray-400 text-sm">
                  DMG 파일을 다운로드하고 더블클릭하면<br/>
                  자동으로 환경이 설치됩니다.
                </p>
              </div>

              <button
                onClick={handleDownload}
                disabled={downloading}
                className="px-8 py-4 bg-blue-600 rounded-xl text-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 w-full max-w-xs mx-auto block shadow-lg shadow-blue-600/20"
              >
                {downloading ? "준비 중..." : "다운로드"}
              </button>

              <div className="text-xs text-gray-500 space-y-1">
                <div>macOS 14.0 이상 지원</div>
                <div>설치 완료 후 앱은 자동으로 삭제됩니다</div>
              </div>
            </div>
          )}

          {/* 설치 과정 미리보기 */}
          <div className="text-left space-y-3">
            <h3 className="text-sm font-medium text-gray-400">설치 과정</h3>
            <div className="space-y-2">
              {["명세 파싱", "환경 진단", "충돌 정리", "패키지 설치", "프로젝트 생성", "빌드 검증", "결과 보고"].map((s, i) => (
                <div key={i} className="flex items-center gap-3 bg-white/[0.02] border border-white/[0.04] rounded-lg px-4 py-2.5 text-sm">
                  <span className="text-gray-500 font-mono text-xs w-8">[{i + 1}/7]</span>
                  <span className="text-gray-400">{s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
