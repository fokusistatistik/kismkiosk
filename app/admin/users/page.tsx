'use client';

import { useEffect, useState } from 'react';
import { getUsers, resetDeviceLock } from '@/app/actions';
import { Unlock, Smartphone, User as UserIcon } from 'lucide-react';

export default function UsersPage() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        const data = await getUsers();
        setUsers(data);
        setLoading(false);
    }

    const handleReset = async (id: string, name: string) => {
        if (!confirm(`${name} isimli personelin cihaz kilidini kaldırmak istediğinize emin misiniz?`)) return;

        const res = await resetDeviceLock(id);
        if (res.success) {
            alert('Cihaz kilidi başarıyla kaldırıldı.');
            loadUsers();
        } else {
            alert('Bir hata oluştu.');
        }
    }

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Kullanıcı Yönetimi</h2>

            <div className="bg-white dark:bg-neutral-950 shadow-sm rounded-lg border border-gray-200 dark:border-neutral-800 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-neutral-900 text-gray-700 dark:text-gray-300 font-semibold border-b border-gray-200 dark:border-neutral-800">
                        <tr>
                            <th className="py-3 px-4">Personel</th>
                            <th className="py-3 px-4">TC No</th>
                            <th className="py-3 px-4">Cihaz Durumu</th>
                            <th className="py-3 px-4">İşlemler</th>
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
                                                <span className="text-xs text-gray-400 truncate max-w-[100px]">{user.device_uuid}</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">Cihaz Eşleşmedi</span>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 transition-all">
                                        {user.device_uuid && (
                                            <button
                                                onClick={() => handleReset(user.id, user.name)}
                                                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md border border-red-200 transition-colors"
                                            >
                                                <Unlock className="w-3 h-3" />
                                                Cihaz Kilidini Sıfırla
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
