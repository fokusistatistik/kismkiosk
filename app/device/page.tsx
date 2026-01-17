'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import ManualEntryModal from '@/components/ManualEntryModal';

// --- SETUP SCREEN COMPONENT ---
function SetupScreen({ onSave }: { onSave: (id: string, name: string) => void }) {
    const [id, setId] = useState('');
    const [name, setName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (id && name) onSave(id, name);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
            <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-blue-400 mb-2">Cihaz Kurulumu</h1>
                    <p className="text-gray-400">Yönetim panelinden aldığınız bilgileri giriniz.</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Kiosk ID (Gizli UUID)</label>
                        <input
                            type="text"
                            required
                            value={id}
                            onChange={e => setId(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Cihaz Adı (Görünen İsim)</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Örn: ANA BİNA - A KAPISI"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-900/50"
                    >
                        Cihazı Kaydet ve Başlat
                    </button>
                    <p className="text-xs text-center text-gray-500 mt-4">
                        Bu bilgiler cihazda kalıcı olarak saklanacaktır.
                    </p>
                </form>
            </div>
        </div>
    );
}

// --- MAIN KIOSK COMPONENT ---
export default function KioskMain() {
    const [config, setConfig] = useState<{ id: string, name: string } | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load Config
    useEffect(() => {
        const stored = localStorage.getItem('kiosk_config');
        if (stored) {
            try {
                setConfig(JSON.parse(stored));
            } catch (e) {
                console.error("Config Parse Error", e);
            }
        }
        setIsLoaded(true);
    }, []);

    const handleSaveConfig = (id: string, name: string) => {
        const cfg = { id, name };
        localStorage.setItem('kiosk_config', JSON.stringify(cfg));
        setConfig(cfg);
    };

    const handleResetInfo = () => {
        if (confirm("DİKKAT: Cihaz ayarları sıfırlanacak. Devam edilsin mi?")) {
            localStorage.removeItem('kiosk_config');
            setConfig(null);
            window.location.reload();
        }
    };

    if (!isLoaded) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Yükleniyor...</div>;

    if (!config) return <SetupScreen onSave={handleSaveConfig} />;

    return <QRMode config={config} onResetRequest={handleResetInfo} />;
}

// --- QR MODE COMPONENT ---
function QRMode({ config, onResetRequest }: { config: { id: string, name: string }, onResetRequest: () => void }) {
    const [token, setToken] = useState<string>('');
    const [currentTime, setCurrentTime] = useState(new Date());
    const [viewState, setViewState] = useState<'IDLE' | 'SUCCESS_MODAL' | 'ERROR_MODAL' | 'FATAL_ERROR'>('IDLE');
    const [modalData, setModalData] = useState<{ title: string, subtitle?: string, footer?: string, bg?: string }>({ title: '' });
    const [fatalError, setFatalError] = useState('');
    const [isManualOpen, setIsManualOpen] = useState(false);

    // Refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const socketRef = useRef<Socket | null>(null);

    // Reset Gesture: 5 Taps in 2 seconds
    const tapCountRef = useRef(0);
    const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleLogoTap = () => {
        tapCountRef.current += 1;
        if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);

        if (tapCountRef.current >= 5) {
            onResetRequest();
            tapCountRef.current = 0;
        } else {
            tapTimeoutRef.current = setTimeout(() => {
                tapCountRef.current = 0;
            }, 2000);
        }
    };

    // Clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Fetch Token
    const fetchToken = useCallback(async () => {
        if (viewState === 'FATAL_ERROR') return;
        try {
            const res = await fetch(`/kiosk/api/kiosk/qr-token?kioskId=${config.id}`);
            const data = await res.json();
            if (data.token) {
                setToken(data.token);
            }
        } catch (err) {
            console.error("Token fetch error", err);
        }
    }, [config.id, viewState]);

    useEffect(() => {
        fetchToken();
        const interval = setInterval(fetchToken, 20000);
        return () => clearInterval(interval);
    }, [fetchToken]);

    // Socket
    useEffect(() => {
        if (viewState === 'FATAL_ERROR') return;

        const socket = io({ path: '/kiosk/socket.io' });
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log("Connected to socket");
            socket.emit('join_kiosk', config.id);
        });

        // Security Validation Event
        socket.on('INVALID_DEVICE', () => {
            setFatalError('YETKİSİZ CİHAZ / ERİŞİM REDDEDİLDİ');
            setViewState('FATAL_ERROR');
            socket.disconnect();
        });

        socket.on('SCAN_SUCCESS', (data: any) => {
            const isOut = data.direction === 'OUT';
            setModalData({
                title: data.user_name,
                subtitle: data.user_title || '',
                footer: isOut ? 'Çıkış Yapıldı' : 'Hoşgeldiniz',
                bg: isOut ? 'bg-orange-600' : 'bg-green-600'
            });
            setViewState('SUCCESS_MODAL');
            setIsManualOpen(false);

            setTimeout(() => {
                setViewState('IDLE');
                fetchToken();
            }, 2000);
        });

        socket.on('SCAN_ERROR', (data: { message: string }) => {
            setModalData({ title: 'Eşleşme Başarısız', subtitle: 'Lütfen Sistem Yöneticisi ile görüşünüz.' });
            setViewState('ERROR_MODAL');

            setTimeout(() => {
                setViewState('IDLE');
                fetchToken();
            }, 3000);
        });

        socket.on('TRIGGER_CAMERA', (data: any) => {
            handleCameraTrigger(data);
        });

        return () => { socket.disconnect(); };
    }, [config.id, viewState, fetchToken]);

    // Camera Init
    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                if (videoRef.current) videoRef.current.srcObject = stream;
            })
            .catch(e => console.error(e));
    }, []);

    const handleCameraTrigger = (data: any) => {
        if (!videoRef.current || !canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        canvasRef.current.toBlob(async (blob) => {
            if (!blob) return;
            const formData = new FormData();
            formData.append('photo', blob, 'snap.jpg');
            formData.append('kioskId', config.id);
            formData.append('userId', data.user_id);
            formData.append('status', 'SUCCESS');
            formData.append('meta', JSON.stringify(data.meta || {}));
            try {
                await fetch('/kiosk/api/kiosk/upload-photo', { method: 'POST', body: formData });
            } catch (e) { console.error(e); }
        }, 'image/jpeg', 0.8);
    };

    const handleManualSubmit = async (tc: string, pass: string) => {
        try {
            const res = await fetch('/kiosk/api/kiosk/manual-entry', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tc, password: pass, kioskId: config.id })
            });
            if (!res.ok) {
                const d = await res.json();
                throw new Error(d.error || 'Hata');
            }
            setIsManualOpen(false);
        } catch (e: any) { // eslint-disable-line
            alert(e.message);
        }
    };

    if (viewState === 'FATAL_ERROR') {
        return (
            <div className="min-h-screen bg-red-900 text-white flex items-center justify-center p-8 text-center select-none">
                <div>
                    <h1 className="text-6xl font-black mb-6">🚫</h1>
                    <h2 className="text-4xl font-bold mb-4">{fatalError}</h2>
                    <p className="text-xl opacity-75">Bu cihazın sisteme erişimi engellenmiştir.</p>
                    <button onClick={onResetRequest} className="mt-12 text-white/20 hover:text-white/50 underline text-sm">
                        Ayarları Sıfırla (Admin)
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-stretch relative overflow-hidden font-sans select-none">

            {/* 1. Header with Clock */}
            <div className="h-[15vh] flex justify-between items-center px-12 z-10 border-b border-white/10 bg-gradient-to-b from-black/50 to-transparent">
                <div className="flex flex-col">
                    <div className="text-6xl font-bold font-mono tracking-wider text-blue-500">
                        {format(currentTime, 'HH:mm')}
                    </div>
                    <div className="text-xl text-gray-400 mt-1 uppercase tracking-widest font-semibold">
                        {format(currentTime, 'd MMMM yyyy', { locale: tr })}
                    </div>
                </div>

                {/* KIOSK NAME DISPLAY */}
                <div className="text-3xl font-bold text-gray-300 uppercase tracking-wide border-l-4 border-blue-600 pl-4">
                    {config.name}
                </div>
            </div>

            {/* 2. Center Section - QR */}
            <div className="flex-1 flex flex-col items-center justify-center relative z-10 gap-12">
                <div className="bg-white p-6 rounded-3xl shadow-[0_0_80px_rgba(59,130,246,0.3)]">
                    {token ? (
                        <QRCodeSVG value={token} size={400} level="H" />
                    ) : (
                        <div className="w-[400px] h-[400px] bg-gray-800 animate-pulse rounded-xl" />
                    )}
                </div>

                <button
                    onClick={() => setIsManualOpen(true)}
                    className="bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md text-white px-10 py-5 rounded-full text-2xl font-semibold transition-all flex items-center gap-4 active:scale-95 group">
                    <div className="bg-white/20 p-2 rounded-full group-hover:bg-white/30 transition-colors">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                    </div>
                    TC Kimlik ile Giriş
                </button>
            </div>

            {/* 3. Footer Branding */}
            <div className="h-[15vh] flex flex-col items-center justify-center z-10 pb-4 relative">
                <div className="flex flex-col items-center gap-4" onClick={handleLogoTap}>
                    <img
                        src="https://static.fokusistatistik.com/resimler/kism.png"
                        alt="Logo"
                        className="h-20 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] cursor-pointer hover:scale-105 transition-transform"
                    />
                    <div className="text-center">
                        <h1 className="text-2xl font-bold leading-tight">Kocaeli İl Sağlık Müdürlüğü</h1>
                        <p className="text-base text-gray-500 mt-1">Güvenli Geçiş Sistemi v2.0</p>
                    </div>
                </div>
            </div>

            {/* Hidden Elements */}
            <div className="fixed top-0 left-0 w-1 h-1 opacity-0 overflow-hidden">
                <video ref={videoRef} autoPlay muted playsInline />
                <canvas ref={canvasRef} width={640} height={480} />
            </div>

            <ManualEntryModal
                isOpen={isManualOpen}
                onClose={() => setIsManualOpen(false)}
                onSubmit={handleManualSubmit}
            />

            {/* FEEDBACK MODALS */}
            {viewState === 'SUCCESS_MODAL' && (
                <div className={`absolute inset-0 z-50 ${modalData.bg || 'bg-green-600'} flex flex-col items-center justify-center text-center animate-in zoom-in duration-300`}>
                    <div className="w-48 h-48 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-8 shadow-2xl border-4 border-white/30">
                        <svg className="w-24 h-24 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h2 className="text-3xl font-medium text-white/80 mb-2 uppercase tracking-widest">Kocaeli İl Sağlık Müdürlüğü</h2>
                    <h1 className="text-6xl font-bold text-white mb-4 shadow-black drop-shadow-lg">{modalData.title}</h1>
                    <p className="text-4xl text-white/90 font-light mb-12">{modalData.subtitle}</p>

                    <div className="bg-white text-black px-12 py-4 rounded-full text-4xl font-bold shadow-xl uppercase">
                        {modalData.footer}
                    </div>
                </div>
            )}

            {viewState === 'ERROR_MODAL' && (
                <div className="absolute inset-0 z-50 bg-red-600 flex flex-col items-center justify-center text-center animate-in zoom-in duration-300">
                    <div className="w-48 h-48 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-12 shadow-2xl border-4 border-white/30">
                        <svg className="w-24 h-24 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M6 18L18 6M6 6l12 12" /></svg>
                    </div>
                    <h2 className="text-6xl font-bold text-white mb-6">{modalData.title}</h2>
                    <p className="text-4xl text-red-100 font-light max-w-2xl leading-normal">{modalData.subtitle}</p>
                </div>
            )}
        </div>
    );
}
