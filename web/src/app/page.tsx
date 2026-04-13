"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";
import SiteHeader from "@/components/SiteHeader";
import { FadeIn, FlipIn, SlideIn, ScaleIn } from "@/components/Animations";
import {
  FileText,
  WandSparkles,
  ChartLine,
  GraduationCap,
  Code2,
  TriangleAlert,
  Clock,
  Search,
  Check,
  ArrowRight,
} from "lucide-react";

export default function LandingPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowser();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">
      <SiteHeader />

      {/* ====== Hero ====== */}
      <section className="relative pt-36 pb-24 px-6 overflow-hidden">
        {/* 배경 글로우 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-500/[0.07] rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          <FadeIn>
            <div className="inline-block px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-sm text-blue-400 mb-8">
              개발 교육을 위한 환경 자동화
            </div>
          </FadeIn>

          <FlipIn delay={0.15}>
            <h1 className="text-6xl md:text-8xl font-bold leading-[1.05] tracking-tighter">
              개발 환경 세팅,<br />
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-[length:200%_auto] animate-[gradient_3s_linear_infinite] bg-clip-text text-transparent">
                더 이상 설명하지 마세요
              </span>
            </h1>
          </FlipIn>

          <FadeIn delay={0.4}>
            <p className="mt-8 text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              원클릭으로 모든 학생의 개발 환경을 동일하게 맞춥니다.<br />
              강사는 명세만 설정하고, 학생은 클릭 한 번으로 바로 시작합니다.
            </p>
          </FadeIn>

          <FadeIn delay={0.55}>
            <div className="mt-10 flex flex-col items-center gap-5">
              <Link
                href="/demo"
                className="group relative px-10 py-4 bg-blue-600 hover:bg-blue-500 rounded-xl text-lg font-semibold transition-all shadow-lg shadow-blue-600/25 hover:shadow-blue-500/40 hover:scale-[1.02]"
              >
                지금 시작하기
                <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">&rarr;</span>
              </Link>
              <Link
                href={authReady && user ? "/instructor" : "/login?next=/instructor"}
                className="text-sm text-gray-500 hover:text-gray-300 transition"
              >
                강사이신가요? <span className="underline underline-offset-4">대시보드로 이동</span>
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ====== 문제 제기 ====== */}
      <section className="relative py-28 px-6 bg-gray-900/40 border-y border-white/[0.04]">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="text-center mb-4">
              <span className="inline-block px-3 py-1 text-xs font-mono text-red-400 bg-red-500/10 border border-red-500/20 rounded-full">
                THE PROBLEM
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-center mb-4 tracking-tight">
              이런 문제, 겪고 있지 않나요?
            </h2>
            <p className="text-center text-gray-500 mb-16 max-w-2xl mx-auto leading-relaxed">
              개발 교육 현장에서 반복되는 3가지 고질병.<br className="hidden md:block" />
              해결하지 못하면 수업 효율이 절반으로 떨어집니다.
            </p>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                Icon: TriangleAlert,
                tag: "환경 불일치",
                title: "학생마다 환경이 달라\n수업이 멈춥니다",
                desc: "macOS Intel/Apple Silicon, Windows 10/11, 설치된 Node 14·18·20·22, JDK 8·11·17 …",
                examples: [
                  '"제 컴퓨터에서만 안 돼요"',
                  '"Node 버전이 달라서 빌드 실패"',
                  '"PATH 꼬여서 다른 java가 잡혀요"',
                ],
                accent: "from-red-500/15 to-transparent",
                border: "border-red-500/20",
                iconColor: "text-red-400",
                iconBg: "bg-red-500/10",
              },
              {
                Icon: Clock,
                tag: "시간 낭비",
                title: "설치 설명에 시간을\n다 쓰고 있습니다",
                desc: "강사는 수업이 아니라 환경 세팅 트러블슈팅 도우미가 됩니다.",
                examples: [
                  "Spring Boot 환경 세팅에 1시간 30분",
                  "Python 가상환경 설명에 30분",
                  "Docker 설치 안내에 40분",
                ],
                accent: "from-orange-500/15 to-transparent",
                border: "border-orange-500/20",
                iconColor: "text-orange-400",
                iconBg: "bg-orange-500/10",
              },
              {
                Icon: Search,
                tag: "가시성 부재",
                title: "누가 어디서 막혔는지\n알 수 없습니다",
                desc: "20명이 동시에 설치하면, 누가 끝났고 누가 멈췄는지 파악이 불가능합니다.",
                examples: [
                  '"저 끝났어요!" — 한 명만',
                  '"저는 안 돼요…" — 침묵',
                  "다음 단계로 넘어가야 하는데 못 넘어감",
                ],
                accent: "from-yellow-500/15 to-transparent",
                border: "border-yellow-500/20",
                iconColor: "text-yellow-400",
                iconBg: "bg-yellow-500/10",
              },
            ].map(({ Icon, tag, title, desc, examples, accent, border, iconColor, iconBg }, i) => (
              <ScaleIn key={i} delay={i * 0.12}>
                <div className={`h-full p-7 rounded-2xl bg-gradient-to-b ${accent} border ${border} hover:border-opacity-40 transition-all`}>
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${iconColor}`} strokeWidth={1.75} />
                    </div>
                    <span className={`text-xs font-mono ${iconColor} opacity-80`}>{tag}</span>
                  </div>
                  <h3 className="text-xl font-bold whitespace-pre-line leading-snug mb-3 tracking-tight">{title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-5">{desc}</p>
                  <div className="pt-4 border-t border-white/[0.06] space-y-2">
                    {examples.map((ex, j) => (
                      <div key={j} className="flex items-start gap-2 text-xs text-gray-500">
                        <span className={`${iconColor} mt-0.5`}>›</span>
                        <span className="leading-relaxed">{ex}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </ScaleIn>
            ))}
          </div>

          <FadeIn delay={0.4}>
            <div className="mt-12 text-center">
              <p className="inline-block px-5 py-2.5 bg-white/[0.03] border border-white/10 rounded-full text-sm text-gray-400">
                <span className="text-white font-semibold">90%의 강사</span>가 매 수업마다 같은 문제를 반복합니다
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ====== How It Works ====== */}
      <section className="relative py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <h2 className="text-3xl md:text-5xl font-bold text-center mb-4 tracking-tight">
              단 3단계로 해결됩니다
            </h2>
            <p className="text-gray-500 text-center mb-20">복잡한 환경 세팅을 자동화합니다</p>
          </FadeIn>

          <div className="space-y-20">
            {[
              {
                step: "01",
                title: "명세 업로드",
                desc: "강사가 수업 계획서를 입력하면 AI가 자동으로 필요한 도구, 버전, 의존성을 분석합니다.",
                Icon: FileText,
                direction: "left" as const,
              },
              {
                step: "02",
                title: "원클릭 설치",
                desc: "학생은 초대 코드로 접속해 파일을 다운로드하고 실행합니다. AI 에이전트가 환경을 자동으로 구성합니다.",
                Icon: WandSparkles,
                direction: "right" as const,
              },
              {
                step: "03",
                title: "실시간 모니터링",
                desc: "강사가 모든 학생의 설치 상태를 실시간으로 확인합니다. 실패 시 원인도 바로 파악됩니다.",
                Icon: ChartLine,
                direction: "left" as const,
              },
            ].map(({ step, title, desc, Icon, direction }, i) => (
              <SlideIn key={i} direction={direction} delay={0.1}>
                <div className="flex items-start gap-8 md:gap-12">
                  <div className="flex-shrink-0 relative">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/15 to-blue-500/5 border border-blue-500/25 flex items-center justify-center">
                      <Icon className="w-9 h-9 text-blue-400" strokeWidth={1.5} />
                    </div>
                    <div className="absolute -bottom-1 -right-1 px-2 py-0.5 bg-blue-500 text-white text-[10px] font-bold rounded-md shadow-lg shadow-blue-500/30">
                      {step}
                    </div>
                  </div>
                  <div className="pt-2">
                    <div className="text-xs font-mono text-blue-400 mb-2 tracking-wider">STEP {step}</div>
                    <h3 className="text-2xl md:text-3xl font-bold mb-3 tracking-tight">{title}</h3>
                    <p className="text-gray-400 leading-relaxed max-w-xl">{desc}</p>
                  </div>
                </div>
              </SlideIn>
            ))}
          </div>
        </div>
      </section>

      {/* ====== Use Case ====== */}
      <section className="relative py-28 px-6 bg-gray-900/40 border-y border-white/[0.04]">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="text-center mb-4">
              <span className="inline-block px-3 py-1 text-xs font-mono text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full">
                FOR EVERYONE
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-center mb-4 tracking-tight">
              누구를 위한 서비스인가요?
            </h2>
            <p className="text-center text-gray-500 mb-16 max-w-2xl mx-auto leading-relaxed">
              강사와 학생 모두에게 수업 시간을 돌려드립니다.<br className="hidden md:block" />
              각자에게 맞는 도구와 경험을 제공합니다.
            </p>
          </FadeIn>

          <div className="grid md:grid-cols-2 gap-6">
            <SlideIn direction="left">
              <div className="p-10 rounded-2xl bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20 h-full hover:border-blue-500/40 transition-all">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-7 h-7 text-blue-400" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold tracking-tight">강사</h3>
                    <p className="text-sm text-blue-400/80 mt-0.5">수업에 집중하세요</p>
                  </div>
                </div>

                <p className="text-gray-300 leading-relaxed mb-6">
                  수업 계획서를 그대로 입력하면 AI가 환경 명세를 자동 생성합니다. 학생의 설치 진행 상황을 실시간으로 모니터링하고, 막힌 학생만 골라서 도와줄 수 있습니다.
                </p>

                <div className="space-y-3 mb-6">
                  {[
                    { title: "AI 명세 파싱", desc: "자유 형식 수업 계획서 → 도구·버전·검증 명령 자동 추출" },
                    { title: "원클릭 배포", desc: "초대 코드 1개로 전체 학생에게 동일 환경 배포" },
                    { title: "실시간 모니터링", desc: "Supabase Realtime으로 모든 학생의 진행 단계 즉시 반영" },
                    { title: "실패 원인 가시화", desc: "어느 단계에서 누가 막혔는지 한눈에 확인" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                      <Check className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" strokeWidth={2.5} />
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-white">{item.title}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-5 border-t border-blue-500/15">
                  <div className="text-xs text-gray-500 mb-1">예상 절약 시간</div>
                  <div className="text-2xl font-bold text-blue-400">
                    수업당 1시간 30분 <span className="text-sm text-gray-500 font-normal">↓</span>
                  </div>
                </div>
              </div>
            </SlideIn>

            <SlideIn direction="right">
              <div className="p-10 rounded-2xl bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/20 h-full hover:border-green-500/40 transition-all">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 rounded-xl bg-green-500/15 border border-green-500/30 flex items-center justify-center flex-shrink-0">
                    <Code2 className="w-7 h-7 text-green-400" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold tracking-tight">학생</h3>
                    <p className="text-sm text-green-400/80 mt-0.5">코드만 짜면 됩니다</p>
                  </div>
                </div>

                <p className="text-gray-300 leading-relaxed mb-6">
                  강사가 공유한 초대 코드로 접속해 ZIP 파일 하나만 다운로드합니다. AI 에이전트가 알아서 도구를 설치하고, 충돌을 정리하고, 검증까지 마칩니다.
                </p>

                <div className="space-y-3 mb-6">
                  {[
                    { title: "초대 코드만 입력", desc: "복잡한 가입 절차 없이 6자리 코드로 시작" },
                    { title: "ZIP 다운로드 → 더블클릭", desc: "sattle 설치.command 파일 하나만 실행하면 끝" },
                    { title: "AI 자율 설치", desc: "OpenClaw 에이전트가 환경 진단부터 검증까지 자동 수행" },
                    { title: "실패 시 자동 복구", desc: "검증 실패하면 AI가 원인 분석 후 자동으로 재시도" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                      <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" strokeWidth={2.5} />
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-white">{item.title}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-5 border-t border-green-500/15">
                  <div className="text-xs text-gray-500 mb-1">예상 설치 시간</div>
                  <div className="text-2xl font-bold text-green-400">
                    평균 30초 ~ 3분
                  </div>
                </div>
              </div>
            </SlideIn>
          </div>
        </div>
      </section>

      {/* ====== 효과 ====== */}
      <section className="relative py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <h2 className="text-3xl md:text-5xl font-bold text-center mb-4 tracking-tight">
              실제로 달라지는 점
            </h2>
            <p className="text-center text-gray-500 mb-16">수치로 보는 변화</p>
          </FadeIn>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[
              { value: "90%", label: "세팅 시간 절감", color: "text-blue-400", glow: "shadow-blue-500/10" },
              { value: "0건", label: "설치 오류", color: "text-green-400", glow: "shadow-green-500/10" },
              { value: "100%", label: "환경 동일성", color: "text-cyan-400", glow: "shadow-cyan-500/10" },
              { value: "실시간", label: "모니터링", color: "text-purple-400", glow: "shadow-purple-500/10" },
            ].map((stat, i) => (
              <ScaleIn key={i} delay={i * 0.1}>
                <div className={`text-center p-8 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.05] hover:scale-[1.02] transition-all shadow-2xl ${stat.glow}`}>
                  <div className={`text-4xl md:text-5xl font-bold ${stat.color} mb-3 tracking-tight`}>{stat.value}</div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </div>
              </ScaleIn>
            ))}
          </div>
        </div>
      </section>

      {/* ====== CTA ====== */}
      <section className="relative py-24 px-6 bg-gradient-to-b from-gray-900/50 to-gray-950 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-blue-500/[0.05] rounded-full blur-[100px] pointer-events-none" />
        <div className="relative max-w-3xl mx-auto text-center">
          <FadeIn>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              지금 바로 시작해보세요
            </h2>
            <p className="text-gray-400 text-lg mb-10">
              설치 문제 없이 바로 개발을 시작하세요
            </p>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div className="flex flex-col items-center gap-5">
              <Link
                href="/demo"
                className="group px-10 py-4 bg-blue-600 hover:bg-blue-500 rounded-xl text-lg font-semibold transition-all shadow-lg shadow-blue-600/25 hover:shadow-blue-500/40 hover:scale-[1.02]"
              >
                지금 시작하기
                <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">&rarr;</span>
              </Link>
              <Link
                href={authReady && user ? "/instructor" : "/login?next=/instructor"}
                className="text-sm text-gray-500 hover:text-gray-300 transition"
              >
                강사이신가요? <span className="underline underline-offset-4">대시보드로 이동</span>
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ====== Footer ====== */}
      <footer className="py-8 px-6 border-t border-gray-800/50">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-gray-500">
          <span>sattle</span>
          <span>2026 Korea IT Academy</span>
        </div>
      </footer>
    </div>
  );
}
