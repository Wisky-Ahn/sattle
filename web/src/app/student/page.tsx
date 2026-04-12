"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { uuidv4 } from "@/lib/uuid";
import type { Spec, Installation } from "@/lib/database.types";
import SiteHeader from "@/components/SiteHeader";

type InstallStep = {
  name: string;
  status: "pending" | "running" | "done" | "error";
  message?: string;
};

export default function StudentPage() {
  const [specs, setSpecs] = useState<Spec[]>([]);
  const [selectedSpec, setSelectedSpec] = useState<Spec | null>(null);
  const [installing, setInstalling] = useState(false);
  const [steps, setSteps] = useState<InstallStep[]>([]);
  const [installationId, setInstallationId] = useState<string | null>(null);
  const [downloadReady, setDownloadReady] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/specs");
      const data = await res.json();
      if (Array.isArray(data)) setSpecs(data);
    }
    load();
  }, []);

  // Realtime 구독
  useEffect(() => {
    if (!installationId) return;
    const channel = supabase
      .channel(`install-${installationId}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "installations",
        filter: `id=eq.${installationId}`,
      }, (payload) => {
        updateStepsFromInstallation(payload.new as Installation);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [installationId]);

  const updateStepsFromInstallation = (inst: Installation) => {
    const totalSteps = inst.total_steps ?? 5;
    const currentStep = inst.step ?? 0;

    const defaultNames = ["권한 확인", "환경 진단", "AI 에이전트 준비", "환경 세팅 (AI)", "정리"];
    const stepNames = defaultNames.slice(0, totalSteps);

    const newSteps: InstallStep[] = stepNames.map((name, i) => {
      const stepNum = i + 1;
      if (stepNum < currentStep) return { name, status: "done" };
      if (stepNum === currentStep) {
        if (inst.status === "failed") return { name, status: "error", message: inst.message ?? undefined };
        return { name, status: "running", message: inst.message ?? undefined };
      }
      return { name, status: "pending" };
    });

    if (inst.status === "success") {
      newSteps.forEach(s => s.status = "done");
    }
    setSteps(newSteps);
  };

  const handleInstall = async (spec: Spec) => {
    setSelectedSpec(spec);
    setInstalling(true);
    setDownloadReady(false);

    // installations 레코드 생성
    const { data } = await supabase
      .from("installations")
      .insert({
        spec_id: spec.id,
        student_id: uuidv4(),
        status: "pending",
        step: 0,
        total_steps: 5,
        message: "설치 대기 중",
      })
      .select()
      .single();

    if (data) {
      setInstallationId(data.id);
      updateStepsFromInstallation(data);
      setDownloadReady(true);
    }
  };

  const handleDownloadPackage = () => {
    if (!selectedSpec || !installationId) return;
    // ZIP 다운로드 (sattle.dmg + config.json 포함)
    window.open(`/api/download?spec_id=${selectedSpec.id}&install_id=${installationId}`, "_blank");
  };

  const stepIcon = (status: string) => {
    switch (status) {
      case "done": return "\u2705";
      case "running": return "\uD83D\uDD04";
      case "error": return "\u274C";
      default: return "\u23F3";
    }
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

  const completedSteps = steps.filter((s) => s.status === "done").length;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <SiteHeader />

      <div className="max-w-3xl mx-auto px-6 pt-24 pb-8">
        {!installing ? (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">설치 가능한 환경</h2>
            {specs.length === 0 ? (
              <div className="bg-gray-800 rounded-lg p-8 text-center text-gray-500">
                등록된 환경 명세가 없습니다
              </div>
            ) : (
              <div className="space-y-3">
                {specs.map((spec) => (
                  <div
                    key={spec.id}
                    className="bg-gray-800 rounded-lg p-5 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-lg">{spec.title}</h3>
                        <p className="text-sm text-gray-400 mt-1">
                          {spec.spec_content?.summary ?? spec.framework}
                        </p>
                      </div>
                      <button
                        onClick={() => handleInstall(spec)}
                        className="px-5 py-2 bg-blue-600 rounded-lg font-medium hover:bg-blue-700 transition whitespace-nowrap"
                      >
                        설치 시작
                      </button>
                    </div>

                    {/* 도구 태그 */}
                    {spec.spec_content?.tools && (
                      <div className="flex flex-wrap gap-1.5">
                        {spec.spec_content.tools.map((tool, i) => (
                          <span
                            key={i}
                            className={`px-2 py-0.5 rounded text-xs ${categoryColor(tool.category)}`}
                          >
                            {tool.name}{tool.version ? ` ${tool.version}` : ""}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">환경 세팅 중</h2>
              <button
                onClick={() => { setInstalling(false); setSelectedSpec(null); setInstallationId(null); }}
                className="text-gray-400 hover:text-white text-sm"
              >
                목록으로
              </button>
            </div>

            {selectedSpec && (
              <div className="bg-gray-800 rounded-lg p-4 space-y-3">
                <div>
                  <div className="text-lg font-medium">{selectedSpec.title}</div>
                  <div className="text-sm text-gray-400 mt-1">
                    {selectedSpec.spec_content?.summary ?? selectedSpec.framework}
                  </div>
                  {selectedSpec.spec_content?.tools && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {selectedSpec.spec_content.tools.map((tool, i) => (
                        <span
                          key={i}
                          className={`px-2 py-0.5 rounded text-xs ${categoryColor(tool.category)}`}
                        >
                          {tool.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 다운로드 영역 */}
                {downloadReady && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 space-y-3">
                    <p className="text-sm text-blue-400">
                      설치 패키지를 다운로드하세요. ZIP을 열고 sattle.app을 실행하면 자동으로 환경이 세팅됩니다.
                    </p>
                    <button
                      onClick={handleDownloadPackage}
                      className="px-5 py-2.5 bg-blue-600 rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center gap-2"
                    >
                      <span>설치 패키지 다운로드 (.zip)</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 진행률 */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">진행률</span>
                <span className="text-blue-400">{completedSteps}/{steps.length}</span>
              </div>
              <div className="w-full h-2 bg-gray-800 rounded-full">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: steps.length > 0 ? `${(completedSteps / steps.length) * 100}%` : "0%" }}
                />
              </div>
            </div>

            {/* 단계별 상태 */}
            <div className="space-y-2">
              {steps.map((step, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 p-3 rounded-lg ${
                    step.status === "running" ? "bg-blue-500/10 border border-blue-500/30" : "bg-gray-800"
                  }`}
                >
                  <span className="text-lg mt-0.5">{stepIcon(step.status)}</span>
                  <div>
                    <div className={`font-medium ${step.status === "pending" ? "text-gray-500" : ""}`}>
                      [{i + 1}/{steps.length}] {step.name}
                    </div>
                    {step.message && (
                      <div className="text-sm text-gray-400 mt-0.5">{step.message}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
