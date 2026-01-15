'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import ManualEntryModal from '@/components/ManualEntryModal';

export default function KioskPage() {
    const params = useParams();
    const kioskId = params.id as string;

    const [token, setToken] = useState<string>('');
    const [currentTime, setCurrentTime] = useState(new Date());
    const [viewState, setViewState] = useState<'IDLE' | 'SUCCESS_MODAL' | 'ERROR_MODAL'>('IDLE');
    const [modalData, setModalData] = useState<{ title: string, subtitle?: string, footer?: string, bg?: string }>({ title: '' });

    // Manual Modal State
    const [isManualOpen, setIsManualOpen] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const socketRef = useRef<Socket | null>(null);

    // Clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Fetch Token
    const fetchToken = useCallback(async () => {
        try {
            const res = await fetch(`/api/kiosk/qr-token?kioskId=${kioskId}`);
            const data = await res.json();
            if (data.token) {
                setToken(data.token);
            }
        } catch (err) {
            console.error("Token fetch error", err);
        }
    }, [kioskId]);

    useEffect(() => {
        fetchToken();
        const interval = setInterval(fetchToken, 20000);
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
            setModalData({ title: 'Eşleşme Başarısız', subtitle: 'Lütfen Sistem Yöneticisi ile görüşünüz.' });
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
            .catch(e => console.error(e));
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
            alert(e.message);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-stretch relative overflow-hidden font-sans select-none">

            {/* 1. Top Section - Clock */}
            <div className="h-[20vh] flex flex-col justify-center items-center z-10">
                <div className="text-8xl font-bold font-mono tracking-wider text-blue-500">
                    {format(currentTime, 'HH:mm')}
                </div>
                <div className="text-3xl text-gray-400 mt-4 uppercase tracking-widest font-semibold">
                    {format(currentTime, 'd MMMM yyyy', { locale: tr })}
                </div>
            </div>

            {/* 2. Center Section - QR */}
            <div className="flex-1 flex flex-col items-center justify-center relative z-10 gap-8">
                <div className="bg-white p-8 rounded-3xl shadow-[0_0_80px_rgba(59,130,246,0.3)]">
                    {token ? (
                        <QRCodeSVG value={token} size={450} level="H" />
                    ) : (
                        <div className="w-[450px] h-[450px] bg-gray-800 animate-pulse rounded-xl" />
                    )}
                </div>

                {/* Manual Entry Button */}
                <button
                    onClick={() => setIsManualOpen(true)}
                    className="bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md text-white px-8 py-4 rounded-full text-2xl font-semibold transition-all flex items-center gap-3 active:scale-95">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                    TC Kimlik ile Giriş
                </button>
            </div>

            {/* 3. Bottom Section - Branding */}
            <div className="h-[20vh] flex flex-col items-center justify-center z-10 pb-8">
                <div className="flex flex-col items-center gap-6">
                    <img
                        src="https://static.fokusistatistik.com/resimler/kism.png"
                        alt="Logo"
                        className="h-24 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                    />
                    <div className="text-center">
                        <h1 className="text-4xl font-bold leading-tight">Kocaeli İl Sağlık Müdürlüğü</h1>
                        <p className="text-2xl text-gray-500 mt-2">Güvenli Geçiş Sistemi</p>
                    </div>
                </div>
            </div>

            {/* Hidden Elements */}
            <div className="fixed top-0 left-0 w-1 h-1 opacity-0 overflow-hidden">
                <video ref={videoRef} autoPlay muted playsInline />
                <canvas ref={canvasRef} width={640} height={480} />
            </div>

            {/* Manual Modal */}
            <ManualEntryModal
                isOpen={isManualOpen}
                onClose={() => setIsManualOpen(false)}
                onSubmit={handleManualSubmit}
            />

            {/* --- FEEDBACK MODALS --- */}

            {/* Success Modal */}
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

            {/* Error Modal */}
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
