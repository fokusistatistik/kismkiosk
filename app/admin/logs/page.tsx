'use client';

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { getAccessLogs } from '@/app/actions';

// Types must match what actions and socket sends
interface Log {
    id: string;
    timestamp: string | Date;
    status: 'SUCCESS' | 'FAILED';
    photo_url: string | null;
    user: {
        name: string;
        surname: string;
        title: string | null;
    };
    kiosk: {
        name: string;
    };
}

export default function LogsPage() {
    const [logs, setLogs] = useState<Log[]>([]);
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

    // Initial Load
    useEffect(() => {
        getAccessLogs().then((data: any) => {
            setLogs(data);
        });
    }, []);

    // Socket Listener
    useEffect(() => {
        const socket = io({ path: '/kiosk/socket.io' });

        socket.on('NEW_LOG', (newLog: Log) => {
            setLogs(prev => [newLog, ...prev]);
        });

        return () => { socket.disconnect(); }
    }, []);

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Geçiş Kayıtları (Canlı)</h2>

            <div className="bg-white dark:bg-neutral-950 shadow-sm rounded-lg border border-gray-200 dark:border-neutral-800 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-neutral-900 text-gray-700 dark:text-gray-300 font-semibold border-b border-gray-200 dark:border-neutral-800">
                        <tr>
                            <th className="py-3 px-4">Zaman</th>
                            <th className="py-3 px-4">Personel</th>
                            <th className="py-3 px-4">Kapı / Kiosk</th>
                            <th className="py-3 px-4">Durum</th>
                            <th className="py-3 px-4">Fotoğraf</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                        {logs.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-8 text-center text-gray-400">Henüz kayıt yok...</td>
                            </tr>
                        ) : (
                            logs.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-neutral-900 transition-colors animate-in fade-in slide-in-from-top-2 duration-300">
                                    <td className="py-3 px-4 whitespace-nowrap">
                                        {format(new Date(log.timestamp), 'dd MMM HH:mm:ss', { locale: tr })}
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="font-medium text-gray-900 dark:text-white">
                                            {log.user.name} {log.user.surname}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {log.user.title || 'Personel'}
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                                        {log.kiosk.name}
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${log.status === 'SUCCESS'
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                            }`}>
                                            {log.status === 'SUCCESS' ? 'Başarılı' : 'Reddedildi'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        {log.photo_url ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={log.photo_url}
                                                alt="Snapshot"
                                                className="w-10 h-10 rounded-full object-cover cursor-zoom-in border border-gray-200 dark:border-neutral-700 hover:scale-150 transition-transform"
                                                onClick={() => setSelectedPhoto(log.photo_url)}
                                            />
                                        ) : (
                                            <span className="text-gray-400 text-xs">-</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Photo Modal */}
            {selectedPhoto && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    onClick={() => setSelectedPhoto(null)}
                >
                    <div className="relative max-w-4xl max-h-screen">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={selectedPhoto}
                            alt="Full size"
                            className="rounded-lg shadow-2xl max-h-[90vh] object-contain"
                        />
                        <button className="absolute top-4 right-4 text-white hover:text-gray-300">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
