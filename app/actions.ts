'use server';

import { PrismaClient } from '@prisma/client';

// Best practice: Use a singleton for PrismaClient in Next.js to avoid connection exhaustion in dev
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

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
