'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import ManualEntryModal from '@/components/ManualEntryModal';

export default function KioskPage() {
    const router = useRouter();
    const params = useParams();
    const kioskId = params.id as string;

    const [token, setToken] = useState<string>('');
    const [currentTime, setCurrentTime] = useState(new Date());
    const [viewState, setViewState] = useState<'IDLE' | 'SUCCESS_MODAL' | 'ERROR_MODAL'>('IDLE');
    const [modalData, setModalData] = useState<{ title: string, subtitle?: string, footer?: string, bg?: string }>({ title: '' });
    const [qrSize, setQrSize] = useState(350);

    // Manual Modal State
    const [isManualOpen, setIsManualOpen] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const socketRef = useRef<Socket | null>(null);

    const [kioskName, setKioskName] = useState('');

    // Save to localStorage for auto-return
    useEffect(() => {
        if (kioskId) {
            localStorage.setItem('lastKioskId', kioskId);
        }
    }, [kioskId]);

    // No manual JS size calculation needed, handled via CSS

    // Clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Fetch Token and Name
    const fetchToken = useCallback(async () => {
        try {
            // Get local name override if available
            const localName = localStorage.getItem('kioskName') || '';
            const queryName = localName ? `&name=${encodeURIComponent(localName)}` : '';

            const res = await fetch(`/api/kiosk/qr-token?kioskId=${kioskId}${queryName}`);
            const data = await res.json();
            if (data.token) {
                setToken(data.token);
            }
            if (data.kioskName) {
                setKioskName(data.kioskName);
            }
        } catch (err) {
            console.error("Token fetch error", err);
        }
    }, [kioskId]);

    useEffect(() => {
        fetchToken();
        const interval = setInterval(fetchToken, 20000); // Refresh token every 20s
        return () => clearInterval(interval);
    }, [fetchToken]);

    // Socket Logic
    useEffect(() => {
        // Connect to same host
        const socket = io({ path: '/socket.io' });
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log("Connected to socket");
            socket.emit('join_kiosk', kioskId);
        });

        // Visual Feedback: Success
        socket.on('SCAN_SUCCESS', (data: { user_name: string, user_title?: string, direction?: string }) => {
            const isOut = data.direction === 'OUT';
            setModalData({
                title: data.user_name,
                subtitle: data.user_title || '',
                footer: isOut ? 'Çıkış Yapıldı' : 'Hoşgeldiniz',
                bg: isOut ? 'bg-orange-600' : 'bg-green-600'
            });
            setViewState('SUCCESS_MODAL');
            setIsManualOpen(false); // Close manual if open

            // 2 Seconds Display
            setTimeout(() => {
                setViewState('IDLE');
                fetchToken();
            }, 2000);
        });

        // Visual Feedback: Error
        socket.on('SCAN_ERROR', (data: { message: string }) => {
            setModalData({
                title: 'Giriş Başarısız',
                subtitle: data.message || 'Lütfen yönetici ile görüşünüz.',
                bg: 'bg-red-600'
            });
            setViewState('ERROR_MODAL');

            setTimeout(() => {
                setViewState('IDLE');
                fetchToken();
            }, 3000);
        });

        // Functional Trigger: Camera
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        socket.on('TRIGGER_CAMERA', (data: any) => {
            handleCameraTrigger(data);
        });

        return () => { socket.disconnect(); };
    }, [kioskId, fetchToken]);

    // Camera Init
    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                if (videoRef.current) videoRef.current.srcObject = stream;
            })
            .catch(e => {
                console.error('Camera access error:', e);
                // Silently fail - camera is optional for QR display
                // User will still see QR codes, just won't capture photos
            });
    }, []);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleCameraTrigger = (data: any) => {
        if (!videoRef.current || !canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);

        canvasRef.current.toBlob(async (blob) => {
            if (!blob) return;
            const formData = new FormData();
            formData.append('photo', blob, 'snap.jpg');
            formData.append('kioskId', kioskId);
            formData.append('userId', data.user_id);
            formData.append('status', 'SUCCESS');
            formData.append('meta', JSON.stringify(data.meta || {}));

            try {
                await fetch('/api/kiosk/upload-photo', { method: 'POST', body: formData });
            } catch (e) { console.error(e); }
        }, 'image/jpeg', 0.8);
    };

    const handleManualSubmit = async (tc: string, pass: string) => {
        // RESET/LOGOUT CODE: 11x0 + 4x0
        if (tc === '00000000000' && pass === '0000') {
            if (confirm('BU CİHAZIN KİOSK BAĞLANTISINI KESMEK İSTİYOR MUSUNUZ?\n\nCihaz "Bilinmeyen" duruma dönecek.')) {
                localStorage.removeItem('lastKioskId');
                router.push('/');
            }
            return;
        }

        try {
            const res = await fetch('/api/kiosk/manual-entry', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tc, password: pass, kioskId })
            });
            if (!res.ok) {
                const d = await res.json();
                throw new Error(d.error || 'Hata');
            }
            // Success assumes Socket will trigger UI update.
            setIsManualOpen(false); // Close immediately, wait for socket.
        } catch (e: any) { // eslint-disable-line
            // Show error in the main modal instead of alert
            setIsManualOpen(false);
            setModalData({
                title: 'Giriş Başarısız',
                subtitle: e.message,
                bg: 'bg-red-600'
            });
            setViewState('ERROR_MODAL');

            setTimeout(() => {
                setViewState('IDLE');
            }, 3000);
        }
    };

    return (
        <div className="h-screen w-screen bg-black text-white flex flex-col items-center overflow-hidden font-sans select-none relative py-2">

            {/* Spacer */}
            <div className="flex-1 min-h-4" />

            {/* 1. Top Section - Logo & Branding - FIXED 80px + Text */}
            <div className="flex flex-col items-center justify-center space-y-2 z-10 shrink-0">
                <img
                    src="https://static.fokusistatistik.com/resimler/kism.png"
                    alt="Logo"
                    className="h-[80px] object-contain brightness-100"
                />
                <div className="text-center leading-none">
                    <h1 className="text-xl md:text-2xl font-bold tracking-wide mt-2">Kocaeli İl Sağlık Müdürlüğü</h1>
                    {kioskName && (
                        <p className="text-lg text-blue-300 font-semibold mt-1 tracking-wider">{kioskName}</p>
                    )}
                </div>
            </div>

            {/* Spacer */}
            <div className="flex-[2] min-h-4" />

            {/* 2. Center Section - QR Code & Button - TARGET 500px */}
            <div className="flex flex-col items-center justify-center z-10 shrink-0">

                {/* QR Container - Fixed Goal 500px */}
                <div className="relative bg-white p-3 rounded-2xl shadow-[0_0_50px_rgba(255,255,255,0.15)] 
                                w-[500px] h-[500px]
                                max-w-[90vw] max-h-[50vh]
                                aspect-square
                                flex items-center justify-center">
                    {token ? (
                        <div className="w-full h-full">
                            <QRCodeSVG
                                value={token}
                                width="100%"
                                height="100%"
                                level="H"
                                includeMargin={true}
                            />
                        </div>
                    ) : (
                        <div className="w-full h-full bg-gray-900 animate-pulse rounded-xl" />
                    )}
                </div>

                {/* Button */}
                <div className="mt-8">
                    <button
                        onClick={() => setIsManualOpen(true)}
                        className="group flex items-center gap-2 bg-neutral-900 border border-neutral-700 hover:border-blue-500 text-white px-8 py-4 rounded-full transition-all active:scale-95 shadow-lg whitespace-nowrap"
                    >
                        <div className="p-1 rounded bg-white text-black">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                        </div>
                        <span className="text-xl font-bold tracking-wide text-gray-200 group-hover:text-white">TC Kimlik ile Giriş</span>
                    </button>
                </div>
            </div>

            {/* Spacer */}
            <div className="flex-[2] min-h-4" />

            {/* 3. Bottom Section - Date & Time - Fixed Size */}
            <div className="flex flex-col items-center justify-center space-y-1 z-10 shrink-0 mb-4">
                <div className="text-5xl font-bold font-mono tracking-wider text-white tabular-nums leading-none">
                    {format(currentTime, 'HH:mm')}
                </div>
                <div className="text-sm text-gray-500 uppercase tracking-[0.2em] font-medium">
                    {format(currentTime, 'd MMMM yyyy', { locale: tr })}
                </div>
            </div>

            {/* Spacer */}
            <div className="flex-1 min-h-2" />


            {/* Hidden Elements */}
            <div className="fixed top-0 left-0 w-1 h-1 opacity-0 overflow-hidden">
                <video ref={videoRef} autoPlay muted playsInline />
                <canvas ref={canvasRef} width={640} height={480} />
            </div>

            {/* Manual Home Navigation */}
            <a
                href="/"
                className="fixed bottom-8 right-8 z-50 p-4 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-full text-white/50 hover:text-white transition-all duration-300 shadow-2xl active:scale-95 group"
                title="Ana Sayfaya Dön"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 12v9a1 1 0 001 1h3m10-11l2 2m-2-2v9a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    Ana Sayfa
                </span>
            </a>

            {/* Manual Modal */}
            <ManualEntryModal
                isOpen={isManualOpen}
                onClose={() => setIsManualOpen(false)}
                onSubmit={handleManualSubmit}
            />

            {/* --- FEEDBACK MODALS --- */}

            {/* Success Modal */}
            {viewState === 'SUCCESS_MODAL' && (
                <div className={`absolute inset-0 z-50 ${modalData.bg || 'bg-green-600'} flex flex-col items-center justify-center text-center animate-in zoom-in duration-300 p-4`}>
                    <div className="w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-6 md:mb-8 shadow-2xl border-4 border-white/30">
                        <svg className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                    </div>

                    <h2 className="text-xl md:text-2xl lg:text-3xl font-medium text-white/80 mb-2 uppercase tracking-widest">Kocaeli İl Sağlık Müdürlüğü</h2>
                    <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-3 md:mb-4 shadow-black drop-shadow-lg">{modalData.title}</h1>
                    <p className="text-2xl md:text-3xl lg:text-4xl text-white/90 font-light mb-8 md:mb-12">{modalData.subtitle}</p>

                    <div className="bg-white text-black px-8 md:px-10 lg:px-12 py-3 md:py-4 rounded-full text-2xl md:text-3xl lg:text-4xl font-bold shadow-xl uppercase">
                        {modalData.footer}
                    </div>
                </div>
            )}

            {/* Error Modal */}
            {viewState === 'ERROR_MODAL' && (
                <div className="absolute inset-0 z-50 bg-red-600 flex flex-col items-center justify-center text-center animate-in zoom-in duration-300 p-4">
                    <div className="w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-8 md:mb-12 shadow-2xl border-4 border-white/30">
                        <svg className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M6 18L18 6M6 6l12 12" /></svg>
                    </div>
                    <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 md:mb-6">{modalData.title}</h2>
                    <p className="text-2xl md:text-3xl lg:text-4xl text-red-100 font-light max-w-2xl leading-normal px-4">{modalData.subtitle}</p>
                </div>
            )}

        </div>
    );
}
