'use client';

import React, { useState, useEffect, useRef } from 'react';

interface ManualEntryModalProps {
    onClose: () => void;
    onSubmit: (tc: string, pass: string) => Promise<void>;
    isOpen: boolean;
}

export default function ManualEntryModal({ onClose, onSubmit, isOpen }: ManualEntryModalProps) {
    const [tc, setTc] = useState('');
    const [pass, setPass] = useState('');
    const [step, setStep] = useState<'TC' | 'PASS'>('TC');
    const [error, setError] = useState('');
    const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Inactivity Logic
    const resetTimeout = () => {
        if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
        inactivityTimeoutRef.current = setTimeout(() => {
            onClose();
        }, 10000); // 10s
    };

    useEffect(() => {
        if (isOpen) {
            resetTimeout();
            setTc('');
            setPass('');
            setStep('TC');
            setError('');
        }
        return () => { if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current); }
    }, [isOpen]);

    const handleInput = (val: string) => {
        resetTimeout();
        setError('');
        if (val === 'DEL') {
            if (step === 'TC') setTc(prev => prev.slice(0, -1));
            else setPass(prev => prev.slice(0, -1));
            return;
        }

        if (step === 'TC') {
            if (tc.length < 11) setTc(prev => prev + val);
        } else {
            if (pass.length < 4) setPass(prev => prev + val);
        }
    };

    const handleNext = () => {
        resetTimeout();
        if (step === 'TC') {
            if (tc.length !== 11) {
                setError('TC No 11 hane olmalıdır.');
                return;
            }
            setStep('PASS');
        } else {
            // Submit
            onSubmit(tc, pass).catch(e => setError('Hata oluştu'));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white text-black w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                <div className="p-6 bg-blue-600 text-white text-center relative">
                    <h2 className="text-2xl font-bold">Manuel Giriş</h2>
                    <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white">X</button>
                </div>

                <div className="p-8 flex-1 flex flex-col items-center gap-6">
                    <div className="text-center space-y-2">
                        <label className="text-gray-500 font-medium">
                            {step === 'TC' ? 'TC Kimlik Numaranız' : 'Şifreniz (TC İlk 4 Hane)'}
                        </label>
                        <div className="text-4xl font-mono font-bold tracking-widest border-b-2 border-blue-500 pb-2 w-full text-center h-16">
                            {step === 'TC' ? (tc || '-----------') : ('•'.repeat(pass.length) || '----')}
                        </div>
                        {error && <p className="text-red-500 text-sm animate-pulse">{error}</p>}
                    </div>

                    {/* Keypad */}
                    <div className="grid grid-cols-3 gap-4 w-full">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                            <button key={n} onClick={() => handleInput(n.toString())} className="h-16 rounded-xl bg-gray-100 text-2xl font-bold hover:bg-gray-200 active:bg-blue-100 transition-colors">
                                {n}
                            </button>
                        ))}
                        <button onClick={() => handleInput('DEL')} className="h-16 rounded-xl bg-red-50 text-red-500 font-bold hover:bg-red-100">SIL</button>
                        <button onClick={() => handleInput('0')} className="h-16 rounded-xl bg-gray-100 text-2xl font-bold hover:bg-gray-200">0</button>
                        <button onClick={handleNext} className="h-16 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700">
                            {step === 'TC' ? 'ILERI' : 'GIRIS'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
