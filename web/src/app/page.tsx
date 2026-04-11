"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";
import SiteHeader from "@/components/SiteHeader";

// --- Animation Wrapper (Safari 호환: whileInView 사용) ---
function FadeIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function SlideIn({ children, className = "", direction = "left", delay = 0 }: { children: React.ReactNode; className?: string; direction?: "left" | "right"; delay?: number }) {
  const x = direction === "left" ? -60 : 60;
  return (
    <motion.div
      initial={{ opacity: 0, x }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function ScaleIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

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
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <FadeIn>
            <div className="inline-block px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-sm text-blue-400 mb-6">
              개발 교육을 위한 환경 자동화
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <h1 className="text-5xl md:text-6xl font-bold leading-tight tracking-tight">
              개발 환경 세팅,<br />
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                더 이상 설명하지 마세요
              </span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.2}>
            <p className="mt-6 text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              원클릭으로 모든 학생의 개발 환경을 동일하게 맞춥니다.<br />
              강사는 명세만 설정하고, 학생은 클릭 한 번으로 바로 시작합니다.
            </p>
          </FadeIn>

          <FadeIn delay={0.3}>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/demo"
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-xl text-lg font-semibold transition shadow-lg shadow-blue-600/20"
              >
                학생 설치 시작하기
              </Link>
              <Link
                href={authReady && user ? "/instructor" : "/login?next=/instructor"}
                className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-lg font-medium transition"
              >
                강사 대시보드
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ====== 문제 제기 ====== */}
      <section className="py-24 px-6 bg-gray-900/50">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
              이런 문제, 겪고 있지 않나요?
            </h2>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                num: "01",
                title: "학생마다 환경이 달라\n수업이 멈춥니다",
                desc: "OS, 버전, 설정이 달라 오류가 반복됩니다",
                color: "from-red-500/20 to-red-500/5",
                border: "border-red-500/20",
              },
              {
                num: "02",
                title: "설치 설명에 시간을\n다 쓰고 있습니다",
                desc: "수업의 절반이 환경 세팅으로 사라집니다",
                color: "from-orange-500/20 to-orange-500/5",
                border: "border-orange-500/20",
              },
              {
                num: "03",
                title: "누가 어디서 막혔는지\n알 수 없습니다",
                desc: "학생이 막히면 처음부터 다시 확인해야 합니다",
                color: "from-yellow-500/20 to-yellow-500/5",
                border: "border-yellow-500/20",
              },
            ].map((item, i) => (
              <ScaleIn key={i} delay={i * 0.15}>
                <div className={`h-full p-8 rounded-2xl bg-gradient-to-b ${item.color} border ${item.border}`}>
                  <div className="text-sm font-mono text-gray-500 mb-4">{item.num}</div>
                  <h3 className="text-xl font-bold whitespace-pre-line leading-snug mb-3">{item.title}</h3>
                  <p className="text-gray-400 text-sm">{item.desc}</p>
                </div>
              </ScaleIn>
            ))}
          </div>
        </div>
      </section>

      {/* ====== How It Works ====== */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              단 3단계로 해결됩니다
            </h2>
            <p className="text-gray-400 text-center mb-16">복잡한 환경 세팅을 자동화합니다</p>
          </FadeIn>

          <div className="space-y-16">
            {[
              {
                step: "01",
                title: "명세 업로드",
                desc: "강사가 수업 계획서를 입력하면 AI가 자동으로 필요한 도구, 버전, 의존성을 분석합니다.",
                icon: "📋",
                direction: "left" as const,
              },
              {
                step: "02",
                title: "원클릭 설치",
                desc: "학생은 초대 코드로 접속해 파일을 다운로드하고 실행합니다. AI 에이전트가 환경을 자동으로 구성합니다.",
                icon: "🛠️",
                direction: "right" as const,
              },
              {
                step: "03",
                title: "실시간 모니터링",
                desc: "강사가 모든 학생의 설치 상태를 실시간으로 확인합니다. 실패 시 원인도 바로 파악됩니다.",
                icon: "📊",
                direction: "left" as const,
              },
            ].map((item, i) => (
              <SlideIn key={i} direction={item.direction} delay={0.1}>
                <div className="flex items-start gap-8 md:gap-12">
                  <div className="flex-shrink-0 w-20 h-20 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-3xl">
                    {item.icon}
                  </div>
                  <div>
                    <div className="text-sm font-mono text-blue-400 mb-2">Step {item.step}</div>
                    <h3 className="text-2xl font-bold mb-2">{item.title}</h3>
                    <p className="text-gray-400 leading-relaxed max-w-xl">{item.desc}</p>
                  </div>
                </div>
              </SlideIn>
            ))}
          </div>
        </div>
      </section>

      {/* ====== Use Case ====== */}
      <section className="py-24 px-6 bg-gray-900/50">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
              누구를 위한 서비스인가요?
            </h2>
          </FadeIn>

          <div className="grid md:grid-cols-2 gap-8">
            <SlideIn direction="left">
              <div className="p-8 rounded-2xl bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/15 h-full">
                <div className="text-4xl mb-4">👨‍🏫</div>
                <h3 className="text-2xl font-bold mb-6">강사</h3>
                <ul className="space-y-4">
                  {[
                    "환경 세팅 설명 없이 바로 수업 시작",
                    "설치 문제 대응 시간 대폭 감소",
                    "학생 진행 상황 실시간 확인",
                  ].map((text, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="text-blue-400 mt-0.5">&#10003;</span>
                      <span className="text-gray-300">{text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </SlideIn>

            <SlideIn direction="right">
              <div className="p-8 rounded-2xl bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/15 h-full">
                <div className="text-4xl mb-4">👨‍💻</div>
                <h3 className="text-2xl font-bold mb-6">학생</h3>
                <ul className="space-y-4">
                  {[
                    "복잡한 설치 없이 바로 시작",
                    "오류 없는 동일 환경 보장",
                    "수업에만 집중 가능",
                  ].map((text, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="text-green-400 mt-0.5">&#10003;</span>
                      <span className="text-gray-300">{text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </SlideIn>
          </div>
        </div>
      </section>

      {/* ====== 효과 ====== */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
              실제로 달라지는 점
            </h2>
          </FadeIn>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: "90%", label: "세팅 시간 절감", color: "text-blue-400" },
              { value: "0건", label: "설치 오류", color: "text-green-400" },
              { value: "100%", label: "환경 동일성", color: "text-cyan-400" },
              { value: "실시간", label: "모니터링", color: "text-purple-400" },
            ].map((stat, i) => (
              <ScaleIn key={i} delay={i * 0.1}>
                <div className="text-center p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                  <div className={`text-3xl md:text-4xl font-bold ${stat.color} mb-2`}>{stat.value}</div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </div>
              </ScaleIn>
            ))}
          </div>
        </div>
      </section>

      {/* ====== CTA ====== */}
      <section className="py-24 px-6 bg-gradient-to-b from-gray-900/50 to-gray-950">
        <div className="max-w-3xl mx-auto text-center">
          <FadeIn>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              지금 바로 시작해보세요
            </h2>
            <p className="text-gray-400 text-lg mb-10">
              설치 문제 없이 바로 개발을 시작하세요
            </p>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/demo"
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-xl text-lg font-semibold transition shadow-lg shadow-blue-600/20"
              >
                학생 설치 시작하기
              </Link>
              <Link
                href={authReady && user ? "/instructor" : "/login?next=/instructor"}
                className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-lg font-medium transition"
              >
                강사 대시보드
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
