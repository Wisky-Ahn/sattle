"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import SiteHeader from "@/components/SiteHeader";
import { uuidv4 } from "@/lib/uuid";
import type { Spec, Installation } from "@/lib/database.types";

type SetupTool = {
  name: string;
  version?: string;
  category: string;
};

const STEP_NAMES = ["권한 확인", "환경 진단", "AI 에이전트 준비", "환경 세팅 (AI)", "정리"];

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
  const [installStatus, setInstallStatus] = useState<Installation | null>(null);

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

  // Realtime 구독 — 설치 진행 상태 실시간 반영
  useEffect(() => {
    if (!installationId) return;
    const channel = supabase
      .channel(`install-progress-${installationId}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "installations",
        filter: `id=eq.${installationId}`,
      }, (payload) => {
        setInstallStatus(payload.new as Installation);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [installationId]);

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
          total_steps: 5,
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
      <SiteHeader
        rightExtra={<span className="text-sm text-gray-500 font-mono">{code}</span>}
      />

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
              </div>

              <button
                onClick={handleDownload}
                disabled={downloading}
                className="px-8 py-4 bg-blue-600 rounded-xl text-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 w-full max-w-xs mx-auto block shadow-lg shadow-blue-600/20"
              >
                {downloading ? "준비 중..." : "다운로드"}
              </button>

              {/* 실행 가이드 — 강조 */}
              <div className="bg-gradient-to-br from-yellow-500/10 to-transparent border border-yellow-500/30 rounded-xl p-5 space-y-4 text-left">
                <div className="flex items-center gap-2">
                  <span className="text-xl">⚠️</span>
                  <div className="font-semibold text-yellow-400">
                    다운로드 후 실행 방법
                  </div>
                </div>

                <ol className="space-y-3">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center justify-center text-xs font-bold">1</span>
                    <div className="flex-1 text-sm text-gray-300 pt-0.5">
                      다운로드된 <code className="px-1.5 py-0.5 bg-white/10 rounded text-white font-mono text-xs">sattle.zip</code>이 자동으로 압축 해제되면 폴더가 생깁니다
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center justify-center text-xs font-bold">2</span>
                    <div className="flex-1 text-sm text-gray-300 pt-0.5">
                      폴더 안의{" "}
                      <code className="px-1.5 py-0.5 bg-yellow-500/20 border border-yellow-500/40 rounded text-yellow-300 font-mono text-xs font-bold whitespace-nowrap">
                        sattle 설치.command
                      </code>{" "}
                      파일을 <span className="text-white font-semibold">더블클릭</span>하세요
                    </div>
                  </li>
                </ol>

                <div className="flex items-start gap-2 pt-2 border-t border-yellow-500/20">
                  <span className="text-red-400 text-sm">❌</span>
                  <div className="text-xs text-gray-400 leading-relaxed">
                    다른 파일을 실행하면 설치가 동작하지 않습니다.{" "}
                    <span className="text-yellow-300 font-semibold">반드시 .command 파일</span>을 실행해주세요.
                  </div>
                </div>
              </div>

              <div className="text-xs text-gray-500 space-y-1 pt-2">
                <div>macOS 14.0 이상 지원</div>
                <div>설치 완료 후 앱은 자동으로 삭제됩니다</div>
              </div>
            </div>
          )}

          {/* 설치 과정 — 실시간 진행 상태 */}
          <div className="text-left space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-400">설치 과정</h3>
              {installStatus && installStatus.status === "installing" && (
                <span className="text-xs text-blue-400 animate-pulse">실시간 업데이트 중</span>
              )}
              {installStatus?.status === "success" && (
                <span className="text-xs text-green-400">설치 완료</span>
              )}
              {installStatus?.status === "failed" && (
                <span className="text-xs text-red-400">설치 실패</span>
              )}
            </div>
            <div className="space-y-2">
              {STEP_NAMES.map((s, i) => {
                const stepNum = i + 1;
                const currentStep = installStatus?.step ?? 0;
                const status = installStatus?.status;

                let icon = <span className="text-gray-600">○</span>;
                let textColor = "text-gray-500";
                let bgClass = "bg-white/[0.02] border-white/[0.04]";

                if (status === "success") {
                  icon = <span className="text-green-400">✓</span>;
                  textColor = "text-gray-300";
                  bgClass = "bg-green-500/5 border-green-500/20";
                } else if (stepNum < currentStep) {
                  icon = <span className="text-green-400">✓</span>;
                  textColor = "text-gray-300";
                  bgClass = "bg-green-500/5 border-green-500/20";
                } else if (stepNum === currentStep) {
                  if (status === "failed") {
                    icon = <span className="text-red-400">✕</span>;
                    textColor = "text-red-400";
                    bgClass = "bg-red-500/10 border-red-500/30";
                  } else {
                    icon = <span className="text-blue-400 animate-pulse">●</span>;
                    textColor = "text-white";
                    bgClass = "bg-blue-500/10 border-blue-500/30";
                  }
                }

                return (
                  <div key={i} className={`flex items-center gap-3 border rounded-lg px-4 py-2.5 text-sm transition-all ${bgClass}`}>
                    <span className="w-5 text-center">{icon}</span>
                    <span className="text-gray-500 font-mono text-xs">[{stepNum}/5]</span>
                    <span className={textColor}>{s}</span>
                    {stepNum === currentStep && status === "installing" && installStatus?.message && (
                      <span className="ml-auto text-xs text-gray-500 truncate max-w-[200px]">{installStatus.message}</span>
                    )}
                    {stepNum === currentStep && status === "failed" && installStatus?.message && (
                      <span className="ml-auto text-xs text-red-400 truncate max-w-[200px]">{installStatus.message}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
