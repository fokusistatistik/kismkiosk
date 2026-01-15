'use server';

import { prisma } from '@/lib/prisma';


export async function getAccessLogs() {
    try {
        const logs = await prisma.accessLog.findMany({
            orderBy: { timestamp: 'desc' },
            take: 50,
            include: {
                user: {
                    select: { name: true, surname: true, title: true }
                },
                kiosk: {
                    select: { name: true }
                }
            }
        });
        // Convert dates to string to avoid serialization warnings in Client Components if passing directly
        return logs.map(log => ({
            ...log,
            timestamp: log.timestamp.toISOString() // pass as string for safety
        }));
    } catch (error) {
        console.error("Failed to fetch logs:", error);
        return [];
    }
}

export async function getUsers() {
    try {
        const users = await prisma.user.findMany({
            orderBy: { name: 'asc' }
        });
        return users;
    } catch (error) {
        console.error("Failed to fetch users:", error);
        return [];
    }
}

export async function resetDeviceLock(userId: string) {
    try {
        await prisma.user.update({
            where: { id: userId },
            data: {
                device_uuid: null,
                device_status: 'OPEN'
            }
        });
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false };
    }
}

export async function createUser(data: { name: string, surname: string, tc_no: string, title?: string, primary_location_id?: string }) {
    try {
        // Cleaning
        const payload = {
            name: data.name,
            surname: data.surname,
            tc_no: data.tc_no,
            title: data.title,
            primary_location_id: (data.primary_location_id && data.primary_location_id !== "") ? data.primary_location_id : null,
            role: 'USER',
            device_status: 'OPEN',
            password_hash: 'DUMMY' // Required by schema but logic uses TC substring
        };

        await prisma.user.create({ data: payload });
        return { success: true };
    } catch (e: any) {
        console.error("Create User Error", e);
        if (e.code === 'P2002') {
            return { success: false, error: 'Bu TC Kimlik numarası zaten kayıtlı.' };
        }
        return { success: false, error: 'Kayıt sırasında hata oluştu.' };
    }
}

export async function updateUser(id: string, data: { name: string, surname: string, tc_no: string, title?: string, primary_location_id?: string }) {
    try {
        const payload = {
            name: data.name,
            surname: data.surname,
            tc_no: data.tc_no,
            title: data.title,
            primary_location_id: (data.primary_location_id && data.primary_location_id !== "") ? data.primary_location_id : null,
        };

        await prisma.user.update({
            where: { id },
            data: payload
        });
        return { success: true };
    } catch (e: any) {
        console.error("Update User Error", e);
        if (e.code === 'P2002') return { success: false, error: 'Bu TC Kimlik numarası zaten kullanımda.' };
        return { success: false, error: 'Güncelleme sırasında hata oluştu.' };
    }
}

export async function deleteUser(id: string) {
    try {
        await prisma.user.delete({ where: { id } });
        return { success: true };
    } catch (e) {
        console.error("Delete User Error", e);
        return { success: false, error: 'Silme işlemi başarısız.' };
    }
}
