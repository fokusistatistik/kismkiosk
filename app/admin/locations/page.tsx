'use client';

import React, { useState, useEffect } from 'react';
import { getLocations, upsertLocation, deleteLocation } from './actions';
import { Plus, Edit, Trash2, MapPin, Building2 } from 'lucide-react';

type Location = {
    id: string;
    name: string;
    _count?: {
        kiosks: number;
        users: number;
    };
};

export default function LocationsPage() {
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ id: '', name: '' });
    const [isEditing, setIsEditing] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await getLocations();
            setLocations(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenModal = (loc?: Location) => {
        if (loc) {
            setFormData({ id: loc.id, name: loc.name });
            setIsEditing(true);
        } else {
            setFormData({ id: '', name: '' });
            setIsEditing(false);
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await upsertLocation(formData);
            setIsModalOpen(false);
            fetchData();
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleDelete = async (id: string, count: number) => {
        if (count > 0) {
            alert('Bu kuruma bağlı Kiosk veya Kullanıcılar var. Önce onları taşıyınız veya siliniz.');
            return;
        }
        if (!confirm('Bu kurumu silmek istediğinize emin misiniz?')) return;
        try {
            await deleteLocation(id);
            fetchData();
        } catch (e: any) {
            alert(e.message);
        }
    };

    return (
        <div className="p-8 space-y-8 bg-gray-50 min-h-screen text-gray-900">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <Building2 className="w-8 h-8 text-blue-600" />
                        Kurum Yönetimi
                    </h1>
                    <p className="text-gray-500 mt-1">Sistemdeki kurum ve birimleri yönetin.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-all shadow-lg hover:shadow-blue-500/30">
                    <Plus className="w-5 h-5" />
                    Yeni Kurum Ekle
                </button>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full text-center py-12 text-gray-500">Yükleniyor...</div>
                ) : locations.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500">Kayıtlı kurum bulunamadı.</div>
                ) : (
                    locations.map(loc => (
                        <div key={loc.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                                    <MapPin className="w-6 h-6" />
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleOpenModal(loc)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(loc.id, (loc._count?.kiosks || 0) + (loc._count?.users || 0))} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 mb-1">{loc.name}</h3>
                            <code className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-100">{loc.id}</code>

                            <div className="mt-6 flex gap-4 text-sm text-gray-500 border-t pt-4">
                                <div className="flex items-center gap-1.5">
                                    <div className={`w-2 h-2 rounded-full ${loc._count?.kiosks ? 'bg-green-500' : 'bg-gray-300'}`} />
                                    {loc._count?.kiosks || 0} Kiosk
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className={`w-2 h-2 rounded-full ${loc._count?.users ? 'bg-blue-500' : 'bg-gray-300'}`} />
                                    {loc._count?.users || 0} Kullanıcı
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-800">
                                {isEditing ? 'Kurum Düzenle' : 'Yeni Kurum Ekle'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">X</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Kurum Adı</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    placeholder="Örn: Başiskele İlçe Sağlık"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Kurum ID (Opsiyonel)</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono text-gray-600"
                                    placeholder="Otomatik oluşturulur"
                                    value={formData.id}
                                    readOnly={isEditing}
                                    onChange={e => setFormData({ ...formData, id: e.target.value })}
                                />
                                <p className="text-xs text-gray-400 mt-1">Boş bırakırsanız isimden otomatik oluşturulur.</p>
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">İptal</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/30">Kaydet</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
