import Link from 'next/link';
import { Users, Activity, Settings, Home, Monitor, Building2 } from 'lucide-react';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex h-screen bg-gray-100 dark:bg-neutral-900 text-gray-900 dark:text-gray-100">
            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-neutral-950 border-r border-gray-200 dark:border-neutral-800 flex flex-col transition-all">
                <div className="p-6">
                    <h1 className="text-xl font-bold tracking-tight text-blue-600 dark:text-blue-400">Admin Panel</h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Güvenli Geçiş Sistemi</p>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    <Link href="/" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-gray-300 transition-colors">
                        <Home className="w-5 h-5" />
                        Ana Sayfa
                    </Link>
                    <Link href="/admin/kiosks" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-gray-300 transition-colors">
                        <Monitor className="w-5 h-5" />
                        Cihaz Yönetimi
                    </Link>
                    <Link href="/admin/locations" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-gray-300 transition-colors">
                        <Building2 className="w-5 h-5" />
                        Kurum Yönetimi
                    </Link>
                    <Link href="/admin/logs" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-gray-300 transition-colors">
                        <Activity className="w-5 h-5" />
                        Canlı Loglar
                    </Link>
                    <Link href="/admin/users" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-gray-300 transition-colors">
                        <Users className="w-5 h-5" />
                        Kullanıcı Yönetimi
                    </Link>
                    <Link href="/admin/settings" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-gray-300 transition-colors">
                        <Settings className="w-5 h-5" />
                        Ayarlar
                    </Link>
                </nav>

                <div className="p-4 border-t border-gray-200 dark:border-neutral-800">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shadow">
                            A
                        </div>
                        <div className="text-sm">
                            <div className="font-semibold">Admin User</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">admin@saglik.gov.tr</div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-gray-50 dark:bg-neutral-900">
                <div className="p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
