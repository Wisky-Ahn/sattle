"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import { FadeIn, FlipIn, ScaleIn } from "@/components/Animations";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";

export default function DemoPage() {
  const [code, setCode] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const router = useRouter();

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

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (trimmed) router.push(`/install/${trimmed}`);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden">
      <SiteHeader />

      <div className="relative pt-36 pb-20 px-6">
        {/* 배경 글로우 */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-500/[0.06] rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-lg mx-auto text-center space-y-10">
          {/* 타이틀 */}
          <div className="space-y-4">
            <FadeIn>
              <div className="inline-block px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-sm text-blue-400">
                체험하기
              </div>
            </FadeIn>
            <FlipIn delay={0.1}>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                초대 코드를 입력하세요
              </h1>
            </FlipIn>
            <FadeIn delay={0.3}>
              <p className="text-gray-400">
                강사에게 받은 초대 코드를 입력하면<br />
                개발 환경 설치 패키지를 받을 수 있습니다
              </p>
            </FadeIn>
          </div>

          {/* 코드 입력 */}
          <FadeIn delay={0.4}>
            <form onSubmit={handleJoin} className="space-y-4">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                maxLength={6}
                autoCapitalize="characters"
                autoCorrect="off"
                autoComplete="off"
                spellCheck={false}
                style={{ textTransform: "uppercase" }}
                className="w-full px-6 py-4 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white text-center font-mono text-2xl tracking-[0.3em] placeholder:text-gray-600 placeholder:tracking-[0.3em] focus:border-blue-500/50 focus:outline-none focus:bg-white/[0.05] transition uppercase"
              />
              <button
                type="submit"
                disabled={!code.trim()}
                className="group w-full px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-xl text-lg font-semibold transition-all shadow-lg shadow-blue-600/25 hover:shadow-blue-500/40 hover:scale-[1.01] disabled:opacity-40 disabled:shadow-none disabled:hover:scale-100"
              >
                참여하기
                <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">&rarr;</span>
              </button>
            </form>
          </FadeIn>

          {/* 구분선 */}
          <FadeIn delay={0.5}>
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="text-sm text-gray-500">또는</span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>
          </FadeIn>

          {/* 강사 링크 */}
          <FadeIn delay={0.55}>
            <Link
              href={authReady && user ? "/instructor" : "/login?next=/instructor"}
              className="text-sm text-gray-500 hover:text-gray-300 transition"
            >
              강사이신가요? <span className="underline underline-offset-4">대시보드로 이동</span>
            </Link>
          </FadeIn>

          {/* 안내 카드 */}
          <div className="grid grid-cols-3 gap-4 pt-4">
            {[
              { icon: "📋", title: "명세 업로드", desc: "AI가 수업 계획서를 분석합니다" },
              { icon: "🛠️", title: "원클릭 설치", desc: "파일 실행으로 환경이 세팅됩니다" },
              { icon: "📊", title: "실시간 확인", desc: "설치 상태를 바로 확인합니다" },
            ].map((item, i) => (
              <ScaleIn key={i} delay={0.6 + i * 0.1}>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] text-center hover:bg-white/[0.04] hover:border-white/[0.08] transition-all">
                  <div className="text-xl mb-2">{item.icon}</div>
                  <div className="text-sm font-medium mb-1">{item.title}</div>
                  <div className="text-xs text-gray-500">{item.desc}</div>
                </div>
              </ScaleIn>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
