import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-950 text-white gap-8 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-blend-overlay bg-black/80">
      <div className="text-center space-y-4 animate-in fade-in zoom-in duration-700">
        <h1 className="text-6xl font-extrabold tracking-tighter bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent drop-shadow-2xl">
          DOKU Dijital Otomasyon
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Dijital Otomasyon Kontrol Uygulaması ile tesis güvenliği ve erişim yönetimi.
        </p>
      </div>

      <div className="flex gap-6 mt-8 animate-in slide-in-from-bottom-4 duration-700 delay-200">
        <Link href="/admin/logs" className="group px-8 py-4 bg-blue-600 rounded-full hover:bg-blue-500 transition-all font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:-translate-y-1">
          <span>Admin Panele Git</span>
          <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
        </Link>
        <Link href="/kiosk/main-entrance" className="group px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-full hover:bg-white/20 transition-all font-semibold flex items-center gap-2 hover:-translate-y-1">
          <span>Kiosk Modu (Demo)</span>
        </Link>
      </div>
    </div>
  )
}
