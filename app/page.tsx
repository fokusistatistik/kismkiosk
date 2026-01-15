'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, X, Monitor, Cpu, Type } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Kiosk Setup State
  const [showKioskModal, setShowKioskModal] = useState(false);
  const [inputKioskId, setInputKioskId] = useState('');
  const [inputKioskName, setInputKioskName] = useState('');

  useEffect(() => {
    // Only auto-redirect if a kiosk was previously active
    const lastKioskId = localStorage.getItem('lastKioskId');
    if (!lastKioskId) return;

    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        router.push(`/kiosk/${lastKioskId}`);
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
    const lastKioskId = localStorage.getItem('lastKioskId');
    if (lastKioskId) {
      router.push(`/kiosk/${lastKioskId}`);
      return;
    }
    // No auth required, just open setup
    setShowKioskModal(true);
  };

  const handleStartKiosk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputKioskId || !inputKioskName) return;

    localStorage.setItem('lastKioskId', inputKioskId);
    localStorage.setItem('kioskName', inputKioskName);

    router.push(`/kiosk/${inputKioskId}`);
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
      {showKioskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-200 border border-neutral-800">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-neutral-800 flex justify-between items-center bg-gray-50 dark:bg-neutral-900">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <Monitor className="w-4 h-4 text-blue-500" />
                Kiosk Kurulumu
              </h3>
              <button onClick={() => setShowKioskModal(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStartKiosk} className="p-6 space-y-4">
              <p className="text-sm text-gray-400 mb-4">
                Bu cihazı sisteme tanıtmak için bir kimlik ve isim belirleyin. Bu bilgiler QR kod içinde kullanılacaktır.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5 ml-1">Kiosk ID (Unique)</label>
                <div className="relative">
                  <Cpu className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-neutral-800 border-neutral-700 text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-600 font-mono"
                    placeholder="cihaz-01"
                    value={inputKioskId}
                    onChange={e => setInputKioskId(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5 ml-1">Görünür İsim</label>
                <div className="relative">
                  <Type className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-neutral-800 border-neutral-700 text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-600"
                    placeholder="Ana Giriş Turnikesi"
                    value={inputKioskName}
                    onChange={e => setInputKioskName(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium transition-colors shadow-lg shadow-blue-600/20 mt-2"
              >
                Kiosku Başlat
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
