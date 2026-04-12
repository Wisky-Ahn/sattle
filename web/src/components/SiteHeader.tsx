"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";

type Props = {
  rightExtra?: ReactNode;
};

export default function SiteHeader({
  rightExtra,
}: Props) {
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

  const handleLogout = async () => {
    const supabase = createSupabaseBrowser();
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-gray-950/80 backdrop-blur-md border-b border-gray-800/50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight">sattle</Link>
        <div className="flex items-center gap-3">
          {rightExtra}
          <Link href="/demo" className="px-4 py-2 text-sm text-gray-400 hover:text-white transition">
            학생 입장
          </Link>
          <div className={`flex items-center gap-3 transition-opacity duration-300 ${authReady ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
            {user ? (
              <>
                <Link
                  href="/instructor"
                  className="px-4 py-2 text-sm bg-white/10 hover:bg-white/15 rounded-lg transition"
                >
                  강사 대시보드
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white transition"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <Link
                href="/login?next=/instructor"
                className="px-4 py-2 text-sm bg-white/10 hover:bg-white/15 rounded-lg transition"
              >
                강사 로그인
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
