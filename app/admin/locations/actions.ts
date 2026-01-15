'use server';

import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

export async function getLocations() {
    return await prisma.location.findMany({
        orderBy: { name: 'asc' },
        include: { _count: { select: { kiosks: true, users: true } } }
    });
}

export async function upsertLocation(data: { id: string, name: string }) {
    if (!data.id) {
        // Auto-generate ID from name if not provided (slugify)
        data.id = data.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    }

    try {
        await prisma.location.upsert({
            where: { id: data.id },
            update: { name: data.name },
            create: { id: data.id, name: data.name }
        });
        revalidatePath('/admin/locations');
        return { success: true };
    } catch (error) {
        console.error("Location Upsert Error:", error);
        throw new Error('Kurum kaydedilirken hata oluştu.');
    }
}

export async function deleteLocation(id: string) {
    try {
        await prisma.location.delete({ where: { id } });
        revalidatePath('/admin/locations');
        return { success: true };
    } catch (error) {
        console.error("Delete Error:", error);
        throw new Error('Kurum silinemedi. Bağlı kiosk veya kullanıcılar olabilir.');
    }
}
