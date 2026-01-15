'use client';

import React, { useState, useEffect } from 'react';
import { getKiosks, getLocations, upsertKiosk, deleteKiosk, toggleKioskStatus } from './actions';
import { Plus, Edit, Trash2, RefreshCw, Eye, EyeOff, Monitor, MapPin, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

// Types (Mirrors Prisma)
type Kiosk = {
    id: string;
    name: string;
    location_id: string | null;
    status: 'ACTIVE' | 'INACTIVE';
    last_seen: Date | null;
    location?: { name: string } | null;
};

type Location = {
    id: string;
    name: string;
};

export default function KioskPage() {
    const [kiosks, setKiosks] = useState<Kiosk[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<{ id: string, name: string, location_id: string, status: 'ACTIVE' | 'INACTIVE' }>({
        id: '',
        name: '',
        location_id: '',
        status: 'ACTIVE'
    });
    const [isEditing, setIsEditing] = useState(false);
    const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});

    const fetchData = async () => {
        setLoading(true);
        const [k, l] = await Promise.all([getKiosks(), getLocations()]);
        // Parse dates in Kiosks (serialization boundary)
        const parsedK = k.map((x: any) => ({ ...x, last_seen: x.last_seen ? new Date(x.last_seen) : null }));
        setKiosks(parsedK);
        setLocations(l);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenModal = (kiosk?: Kiosk) => {
        if (kiosk) {
            setFormData({
                id: kiosk.id,
                name: kiosk.name,
                location_id: kiosk.location_id || '',
                status: kiosk.status
            });
            setIsEditing(true);
        } else {
            setFormData({
                id: '',
                name: '',
                location_id: '',
                status: 'ACTIVE'
            });
            setIsEditing(false);
        }
        setIsModalOpen(true);
    };

    const handleGenerateId = () => {
        setFormData(prev => ({ ...prev, id: crypto.randomUUID() }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!formData.name || !formData.id) return alert('İsim ve ID zorunludur');
            await upsertKiosk(formData);
            setIsModalOpen(false);
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Hata oluştu');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bu Kiosk\'u silmek istediğinize emin misiniz?')) return;
        await deleteKiosk(id);
        fetchData();
    };

    const toggleReveal = (id: string) => {
        setRevealedIds(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div className="p-8 space-y-8 bg-gray-50 min-h-screen text-gray-900">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <Monitor className="w-8 h-8 text-blue-600" />
                        Kiosk Yönetimi
                    </h1>
                    <p className="text-gray-500 mt-1">Sistemdeki cihazları izleyin ve yönetin.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-all shadow-lg hover:shadow-blue-500/30">
                    <Plus className="w-5 h-5" />
                    Yeni Kiosk Ekle
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-sm uppercase tracking-wider">
                        <tr>
                            <th className="p-4 font-semibold">Cihaz Adı</th>
                            <th className="p-4 font-semibold">Kiosk ID (Secret)</th>
                            <th className="p-4 font-semibold">Konum</th>
                            <th className="p-4 font-semibold">Durum</th>
                            <th className="p-4 font-semibold">Son Görülme</th>
                            <th className="p-4 font-semibold text-right">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={6} className="p-8 text-center text-gray-500">Yükleniyor...</td></tr>
                        ) : kiosks.length === 0 ? (
                            <tr><td colSpan={6} className="p-8 text-center text-gray-500">Kayıtlı kiosk bulunamadı.</td></tr>
                        ) : kiosks.map(kiosk => (
                            <tr key={kiosk.id} className="hover:bg-blue-50/50 transition-colors group">
                                <td className="p-4 font-medium text-gray-900">{kiosk.name}</td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <code className="bg-gray-100 px-2 py-1 rounded text-sm text-gray-600 font-mono">
                                            {revealedIds[kiosk.id] ? kiosk.id : '•'.repeat(24)}
                                        </code>
                                        <button onClick={() => toggleReveal(kiosk.id)} className="text-gray-400 hover:text-blue-600">
                                            {revealedIds[kiosk.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </td>
                                <td className="p-4 text-gray-600 flex items-center gap-2">
                                    {kiosk.location?.name || '-'}
                                </td>
                                <td className="p-4">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${kiosk.status === 'ACTIVE'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-red-100 text-red-700'
                                        }`}>
                                        <span className={`w-2 h-2 rounded-full ${kiosk.status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500'}`} />
                                        {kiosk.status === 'ACTIVE' ? 'Aktif' : 'Pasif'}
                                    </span>
                                </td>
                                <td className="p-4 text-sm text-gray-500">
                                    {kiosk.last_seen
                                        ? formatDistanceToNow(kiosk.last_seen, { addSuffix: true, locale: tr })
                                        : 'Hiç Görülmedi'}
                                </td>
                                <td className="p-4 text-right space-x-2">
                                    <button
                                        onClick={() => handleOpenModal(kiosk)}
                                        className="text-gray-400 hover:text-blue-600 p-1 rounded-md hover:bg-blue-50 transition-colors">
                                        <Edit className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(kiosk.id)}
                                        className="text-gray-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition-colors">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-800">
                                {isEditing ? 'Kiosk Düzenle' : 'Yeni Kiosk Ekle'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">X</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cihaz Adı (Friendly Name)</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    placeholder="Örn: Ana Bina - A Kapısı"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Konum</label>
                                <select
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.location_id}
                                    onChange={e => setFormData({ ...formData, location_id: e.target.value })}
                                >
                                    <option value="">Konum Seçiniz</option>
                                    {locations.map(l => (
                                        <option key={l.id} value={l.id}>{l.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Kiosk ID (UUID)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        required
                                        readOnly={isEditing}
                                        className={`flex-1 px-4 py-2 rounded-lg border border-gray-300 outline-none font-mono text-sm ${isEditing ? 'bg-gray-100 text-gray-500' : 'focus:ring-2 focus:ring-blue-500'}`}
                                        value={formData.id}
                                        onChange={e => setFormData({ ...formData, id: e.target.value })}
                                        placeholder="Oto-Oluştur veya Giriniz"
                                    />
                                    {!isEditing && (
                                        <button
                                            type="button"
                                            onClick={handleGenerateId}
                                            className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-2 rounded-lg border border-gray-300 transition-colors"
                                            title="Oto-Oluştur"
                                        >
                                            <RefreshCw className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Bu ID'yi Kiosk kurulum ekranına giriniz.</p>
                            </div>

                            {isEditing && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
                                    <select
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.status}
                                        onChange={e => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                                    >
                                        <option value="ACTIVE">Aktif</option>
                                        <option value="INACTIVE">Pasif</option>
                                    </select>
                                </div>
                            )}

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-5 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition-colors"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg shadow-blue-500/30 transition-all"
                                >
                                    Kaydet
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
