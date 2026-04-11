"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
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
    <div className="min-h-screen bg-gray-950 text-white">
      <SiteHeader showStudentLink={false} />

      {/* Main */}
      <div className="pt-32 pb-20 px-6">
        <div className="max-w-lg mx-auto text-center space-y-10">
          {/* 타이틀 */}
          <div className="space-y-3">
            <div className="inline-block px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-sm text-blue-400">
              체험하기
            </div>
            <h1 className="text-4xl font-bold tracking-tight">
              초대 코드를 입력하세요
            </h1>
            <p className="text-gray-400">
              강사에게 받은 초대 코드를 입력하면<br />
              개발 환경 설치 패키지를 받을 수 있습니다
            </p>
          </div>

          {/* 코드 입력 */}
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
              className="w-full px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-xl text-lg font-semibold transition shadow-lg shadow-blue-600/20 disabled:opacity-40 disabled:shadow-none"
            >
              참여하기
            </button>
          </form>

          {/* 구분선 */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-sm text-gray-500">또는</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* 강사 링크 */}
          <div className="space-y-3">
            <Link
              href={authReady && user ? "/instructor" : "/login?next=/instructor"}
              className="inline-block px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-medium transition"
            >
              강사 대시보드
            </Link>
            <p className="text-sm text-gray-500">
              강사라면 여기서 수업 환경을 설정하세요
            </p>
          </div>

          {/* 안내 카드 */}
          <div className="grid grid-cols-3 gap-4 pt-4">
            {[
              { icon: "📋", title: "명세 업로드", desc: "AI가 수업 계획서를 분석합니다" },
              { icon: "🛠️", title: "원클릭 설치", desc: "파일 실행으로 환경이 세팅됩니다" },
              { icon: "📊", title: "실시간 확인", desc: "설치 상태를 바로 확인합니다" },
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] text-center">
                <div className="text-xl mb-2">{item.icon}</div>
                <div className="text-sm font-medium mb-1">{item.title}</div>
                <div className="text-xs text-gray-500">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
