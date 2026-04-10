"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Installation } from "@/lib/database.types";
import type { SetupTool } from "@/lib/database.types";

type ParseResult = {
  title: string;
  summary: string;
  framework: string;
  spec_content: {
    summary: string;
    tools: SetupTool[];
    verification_commands: string[];
    raw_input: string;
  };
};

export default function InstructorPage() {
  const [activeTab, setActiveTab] = useState<"create" | "monitor">("create");

  // 명세 생성 상태
  const [rawText, setRawText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [shareCode, setShareCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  // 모니터링 상태
  const [installations, setInstallations] = useState<Installation[]>([]);

  const fetchInstallations = useCallback(async () => {
    const { data } = await supabase
      .from("installations")
      .select("*")
      .order("started_at", { ascending: false });
    if (data) setInstallations(data);
  }, []);

  useEffect(() => {
    if (activeTab !== "monitor") return;
    fetchInstallations();
    const channel = supabase
      .channel("installations-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "installations" }, () => {
        fetchInstallations();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeTab, fetchInstallations]);

  // AI 파싱
  const handleParse = async () => {
    if (!rawText.trim()) return;
    setParsing(true);
    setError("");
    setParseResult(null);
    setSaved(false);

    try {
      const res = await fetch("/api/specs/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw_text: rawText }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "파싱 실패");
      }
      const data = await res.json();
      setParseResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류");
    } finally {
      setParsing(false);
    }
  };

  // 저장 (배포)
  const handleSave = async () => {
    if (!parseResult) return;
    setSaving(true);
    try {
      const res = await fetch("/api/specs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parseResult),
      });
      if (res.ok) {
        const data = await res.json();
        setSaved(true);
        setShareCode(data.share_code ?? "");
      }
    } finally {
      setSaving(false);
    }
  };

  const shareLink = shareCode ? `${typeof window !== "undefined" ? window.location.origin : ""}/install/${shareCode}` : "";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 파일 업로드
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setRawText(ev.target?.result as string);
      setParseResult(null);
      setSaved(false);
    };
    reader.readAsText(file);
  };

  const categoryLabel = (cat: string) => {
    const labels: Record<string, string> = {
      ide: "IDE", language: "언어", framework: "프레임워크",
      package: "패키지", system: "시스템", database: "DB", tool: "도구",
    };
    return labels[cat] ?? cat;
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

  const statusColor = (status: string) => {
    switch (status) {
      case "success": return "text-green-400";
      case "installing": return "text-blue-400";
      case "failed": return "text-red-400";
      default: return "text-gray-400";
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "success": return "\u2705";
      case "installing": return "\uD83D\uDD04";
      case "failed": return "\u274C";
      default: return "\u23F3";
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-gray-950/80 backdrop-blur-md border-b border-gray-800/50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight">sattle</Link>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 text-xs bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400">
              강사 대시보드
            </span>
          </div>
        </div>
      </header>

      <div className="pt-28 pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          {/* 탭 */}
          <div className="flex gap-1 mb-10 p-1 bg-white/[0.03] border border-white/[0.06] rounded-xl w-fit">
            <button
              onClick={() => setActiveTab("create")}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === "create"
                  ? "bg-blue-600 shadow-lg shadow-blue-600/20"
                  : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              명세 생성
            </button>
            <button
              onClick={() => setActiveTab("monitor")}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === "monitor"
                  ? "bg-blue-600 shadow-lg shadow-blue-600/20"
                  : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              학생 모니터링
            </button>
          </div>

          {activeTab === "create" && (
            <div className="space-y-8">
              <div>
                <div className="inline-block px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-sm text-blue-400 mb-4">
                  환경 명세 생성
                </div>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                  수업 계획서를 <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">AI가 분석</span>합니다
                </h2>
                <p className="text-gray-400 mt-3">자유 형식으로 작성한 환경 안내문을 입력하세요</p>
              </div>

              {/* 입력 영역 */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <label className="px-4 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm cursor-pointer hover:bg-white/[0.05] transition">
                    파일 업로드 (.md, .txt)
                    <input
                      type="file"
                      accept=".md,.txt,.markdown"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <span className="text-sm text-gray-500">또는 아래에 직접 입력</span>
                </div>

                <textarea
                  value={rawText}
                  onChange={(e) => { setRawText(e.target.value); setParseResult(null); setSaved(false); }}
                  placeholder={`예시:\n\n이번 수업에서는 VS Code를 사용합니다.\nPython 3.11을 설치하고, Django 5.0으로 REST API를 만듭니다.\npip install django djangorestframework\nPostgreSQL도 필요합니다.\n빌드 확인: python manage.py check`}
                  className="w-full h-56 bg-white/[0.03] border border-white/[0.08] rounded-xl px-5 py-4 text-sm font-mono resize-y focus:border-blue-500/50 focus:outline-none focus:bg-white/[0.04] transition placeholder:text-gray-600"
                />

                <button
                  onClick={handleParse}
                  disabled={!rawText.trim() || parsing}
                  className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold transition disabled:opacity-40 shadow-lg shadow-blue-600/20"
                >
                  {parsing ? "AI 분석 중..." : "AI로 분석하기"}
                </button>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* AI 파싱 결과 */}
              {parseResult && (
                <div className="space-y-6">
                  <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-8 space-y-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-2xl font-bold">{parseResult.title}</h3>
                        <p className="text-gray-400 mt-2">{parseResult.summary}</p>
                      </div>
                      <span className="flex-shrink-0 px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-sm text-blue-400 whitespace-nowrap">
                        {parseResult.framework}
                      </span>
                    </div>

                    {/* 도구 목록 */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-3">감지된 설치 항목</h4>
                      <div className="flex flex-wrap gap-2">
                        {parseResult.spec_content.tools.map((tool, i) => (
                          <span
                            key={i}
                            className={`px-3 py-1.5 rounded-lg text-sm ${categoryColor(tool.category)}`}
                          >
                            {categoryLabel(tool.category)}: {tool.name}
                            {tool.version && ` ${tool.version}`}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* 검증 명령 */}
                    {parseResult.spec_content.verification_commands.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-400 mb-3">검증 명령</h4>
                        <div className="bg-gray-950/50 border border-white/[0.04] rounded-lg p-4 font-mono text-sm space-y-1">
                          {parseResult.spec_content.verification_commands.map((cmd, i) => (
                            <div key={i} className="text-green-400">$ {cmd}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 배포 버튼 */}
                  {!saved ? (
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-8 py-3.5 bg-green-600 hover:bg-green-700 rounded-xl font-semibold transition disabled:opacity-40 shadow-lg shadow-green-600/20"
                    >
                      {saving ? "저장 중..." : "학생에게 배포하기"}
                    </button>
                  ) : (
                    <div className="bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/20 rounded-2xl p-6 space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">✨</span>
                        <div className="text-lg font-semibold text-green-400">배포 완료!</div>
                      </div>
                      <p className="text-sm text-gray-400">아래 링크를 학생들에게 공유하세요.</p>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={shareLink}
                          className="flex-1 bg-gray-950/50 border border-white/[0.08] rounded-lg px-4 py-3 text-sm font-mono text-white"
                        />
                        <button
                          onClick={handleCopyLink}
                          className="px-5 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-semibold transition whitespace-nowrap shadow-lg shadow-blue-600/20"
                        >
                          {copied ? "복사됨!" : "링크 복사"}
                        </button>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500">초대 코드:</span>
                        <span className="font-mono font-bold text-blue-400 tracking-widest">{shareCode}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "monitor" && (
            <div className="space-y-8">
              <div>
                <div className="inline-block px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-sm text-blue-400 mb-4">
                  실시간 모니터링
                </div>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                  학생 설치 현황
                </h2>
                <p className="text-gray-400 mt-3">모든 학생의 설치 상태를 실시간으로 확인합니다</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "전체", count: installations.length, color: "text-white", gradient: "from-white/5 to-transparent", border: "border-white/10" },
                  { label: "완료", count: installations.filter(i => i.status === "success").length, color: "text-green-400", gradient: "from-green-500/10 to-transparent", border: "border-green-500/20" },
                  { label: "진행중", count: installations.filter(i => i.status === "installing").length, color: "text-blue-400", gradient: "from-blue-500/10 to-transparent", border: "border-blue-500/20" },
                  { label: "실패", count: installations.filter(i => i.status === "failed").length, color: "text-red-400", gradient: "from-red-500/10 to-transparent", border: "border-red-500/20" },
                ].map((stat) => (
                  <div key={stat.label} className={`p-6 rounded-2xl bg-gradient-to-br ${stat.gradient} border ${stat.border}`}>
                    <div className={`text-3xl font-bold ${stat.color}`}>{stat.count}</div>
                    <div className="text-sm text-gray-400 mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>

              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
                {installations.length === 0 ? (
                  <div className="px-6 py-16 text-center text-gray-500">
                    <div className="text-4xl mb-3 opacity-30">📊</div>
                    <div>아직 설치 기록이 없습니다</div>
                    <div className="text-xs mt-1">학생이 초대 코드로 접속하면 여기에 표시됩니다</div>
                  </div>
                ) : (
                  <div className="divide-y divide-white/[0.04]">
                    {installations.map((inst) => (
                      <div key={inst.id} className="px-6 py-5 flex items-center justify-between hover:bg-white/[0.02] transition">
                        <div className="flex items-center gap-4">
                          <span className="text-xl">{statusIcon(inst.status ?? "pending")}</span>
                          <div>
                            <div className="font-semibold">{inst.student_name ?? inst.student_id?.slice(0, 8) ?? "학생"}</div>
                            <div className="text-sm text-gray-400 mt-0.5">{inst.message ?? "대기 중"}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-semibold ${statusColor(inst.status ?? "pending")}`}>
                            {inst.status === "installing"
                              ? `${inst.step ?? 0}/${inst.total_steps ?? 0}`
                              : inst.status ?? "pending"}
                          </div>
                          {inst.status === "installing" && (inst.total_steps ?? 0) > 0 && (
                            <div className="w-28 h-1.5 bg-white/[0.05] rounded-full mt-2 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
                                style={{ width: `${((inst.step ?? 0) / (inst.total_steps ?? 1)) * 100}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
