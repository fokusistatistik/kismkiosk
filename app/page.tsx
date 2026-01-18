'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, X, Monitor, Cpu, Type } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  // No local state needed for setup anymore

  useEffect(() => {
    // Only auto-redirect if kiosk was previously active
    const lastKioskId = localStorage.getItem('kiosk_config');
    if (!lastKioskId) return;

    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        router.push('/qr');
      }, 10000); // 10 seconds
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    resetTimer();
    events.forEach(event => document.addEventListener(event, resetTimer));

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach(event => document.removeEventListener(event, resetTimer));
    };
  }, [router]);

  const handleKioskMode = () => {
    router.push('/qr');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-950 text-white gap-8 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-blend-overlay bg-black/80 relative">
      <div className="text-center space-y-6 animate-in fade-in zoom-in duration-700 z-10 flex flex-col items-center">
        {/* Logo */}
        <div className="relative mb-2">
          <div className="absolute -inset-4 bg-blue-500/20 rounded-full blur-2xl animate-pulse"></div>
          <img
            src="https://static.fokusistatistik.com/DOKU/logos/DOKU_FAVICON.png"
            alt="DOKU Logo"
            className="relative w-32 h-32 md:w-40 md:h-40 drop-shadow-2xl object-contain"
          />
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tighter bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent drop-shadow-2xl">
          DOKU Dijital Otomasyon
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Dijital Otomasyon Kontrol Uygulaması ile tesis güvenliği ve erişim yönetimi.
        </p>
      </div>

      <div className="flex gap-6 mt-8 animate-in slide-in-from-bottom-4 duration-700 delay-200 z-10">
        <Link href="/admin/logs" className="group px-8 py-4 bg-blue-600 rounded-full hover:bg-blue-500 transition-all font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:-translate-y-1">
          <span>Admin Panele Git</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
        <button
          onClick={handleKioskMode}
          className="group px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-full hover:bg-white/20 transition-all font-semibold flex items-center gap-2 hover:-translate-y-1 cursor-pointer"
        >
          <span>Kiosk Modu (Başlat)</span>
          <Monitor className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {/* Kiosk Setup Modal */}

    </div>
  )
}
