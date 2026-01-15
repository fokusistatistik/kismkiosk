'use client';

import { useEffect, useState } from 'react';
import { getUsers, resetDeviceLock, createUser, updateUser, deleteUser } from '@/app/actions';
import { getLocations } from '@/app/admin/locations/actions';
import { Unlock, Smartphone, User as UserIcon, Plus, Save, Pencil, Trash2 } from 'lucide-react';

export default function UsersPage() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [users, setUsers] = useState<any[]>([]);
    const [locations, setLocations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        surname: '',
        tc_no: '',
        title: '',
        primary_location_id: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [userData, locData] = await Promise.all([getUsers(), getLocations()]);
        setUsers(userData);
        setLocations(locData);
        setLoading(false);
    }

    const handleReset = async (id: string, name: string) => {
        if (!confirm(`${name} isimli personelin cihaz kilidini kaldırmak istediğinize emin misiniz?`)) return;

        const res = await resetDeviceLock(id);
        if (res.success) { alert('Başarılı'); loadData(); } else { alert('Hata'); }
    }

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`${name} isimli personeli silmek istediğinize emin misiniz?`)) return;
        const res = await deleteUser(id);
        if (res.success) { loadData(); } else { alert(res.error || 'Hata'); }
    }

    const handleEdit = (user: any) => {
        setEditingId(user.id);
        setFormData({
            name: user.name,
            surname: user.surname,
            tc_no: user.tc_no,
            title: user.title || '',
            primary_location_id: user.primary_location_id || ''
        });
        setIsModalOpen(true);
    }

    const openNewModal = () => {
        setEditingId(null);
        setFormData({ name: '', surname: '', tc_no: '', title: '', primary_location_id: '' });
        setIsModalOpen(true);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.surname || !formData.tc_no) {
            alert('Ad, Soyad ve TC No zorunludur.');
            return;
        }

        let res;
        if (editingId) {
            res = await updateUser(editingId, formData);
        } else {
            res = await createUser(formData);
        }

        if (res.success) {
            setIsModalOpen(false);
            loadData();
        } else {
            alert(res.error || 'Hata oluştu');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight text-gray-800 dark:text-white">Kullanıcı Yönetimi</h2>
                <button
                    onClick={openNewModal}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-lg shadow-blue-500/20"
                >
                    <Plus className="w-5 h-5" />
                    Yeni Personel Ekle
                </button>
            </div>

            <div className="bg-white dark:bg-neutral-950 shadow-sm rounded-lg border border-gray-200 dark:border-neutral-800 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-neutral-900 text-gray-700 dark:text-gray-300 font-semibold border-b border-gray-200 dark:border-neutral-800">
                        <tr>
                            <th className="py-3 px-4">Personel</th>
                            <th className="py-3 px-4">TC No</th>
                            <th className="py-3 px-4">Cihaz Durumu</th>
                            <th className="py-3 px-4 text-right">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                        {loading ? (
                            <tr><td colSpan={4} className="py-8 text-center text-gray-500">Yükleniyor...</td></tr>
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="py-8 text-center text-gray-400">Kullanıcı bulunamadı.</td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-neutral-900 transition-colors">
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-gray-100 dark:bg-neutral-800 p-2 rounded-full">
                                                <UserIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900 dark:text-white">
                                                    {user.name} {user.surname}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {user.title || 'Personel'}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400 font-mono">
                                        {user.tc_no}
                                    </td>
                                    <td className="py-3 px-4">
                                        {user.device_uuid ? (
                                            <div className="flex items-center gap-2">
                                                <Smartphone className="w-4 h-4 text-blue-500" />
                                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${user.device_status === 'LOCKED'
                                                    ? 'bg-red-100 text-red-800'
                                                    : 'bg-green-100 text-green-800'
                                                    }`}>
                                                    {user.device_status === 'LOCKED' ? 'KİLİTLİ' : 'AÇIK'}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">Eşleşmedi</span>
                                        )}
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center justify-end gap-2">
                                            {user.device_uuid && (
                                                <button
                                                    onClick={() => handleReset(user.id, user.name)}
                                                    className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                                                    title="Kilidi Sıfırla"
                                                >
                                                    <Unlock className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleEdit(user)}
                                                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                title="Düzenle"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user.id, user.name)}
                                                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                title="Sil"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-800">{editingId ? 'Personeli Düzenle' : 'Yeni Personel Ekle'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">X</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ad</label>
                                    <input
                                        type="text" required
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Soyad</label>
                                    <input
                                        type="text" required
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.surname}
                                        onChange={e => setFormData({ ...formData, surname: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">TC Kimlik No</label>
                                <input
                                    type="text" required maxLength={11}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                                    value={formData.tc_no}
                                    onChange={e => setFormData({ ...formData, tc_no: e.target.value.replace(/[^0-9]/g, '') })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ünvan</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Örn: Doktor, Hemşire, Güvenlik"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Birimi (Konum)</label>
                                <select
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.primary_location_id}
                                    onChange={e => setFormData({ ...formData, primary_location_id: e.target.value })}
                                >
                                    <option value="">Seçiniz...</option>
                                    {locations.map((loc: any) => (
                                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t mt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">İptal</button>
                                <button type="submit" className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/30">
                                    <Save className="w-4 h-4" />
                                    {editingId ? 'Güncelle' : 'Kaydet'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
