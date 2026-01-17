'use server';

import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';
import type { KioskStatus } from '@/types/prisma-enums';

const prisma = new PrismaClient();

export async function getKiosks() {
    return await prisma.kiosk.findMany({
        include: { location: true },
        orderBy: { name: 'asc' }
    });
}

export async function getLocations() {
    return await prisma.location.findMany({
        orderBy: { name: 'asc' }
    });
}

export async function upsertKiosk(data: { id?: string, name: string, location_id: string, status?: KioskStatus }) {
    if (data.id) {
        // Edit existing
        // Check if exists first to decide update vs create w/ specific ID? 
        // Admin Panel "Edit" usually implies update. "Add" implies create.
        // But "Add" allows auto-gen ID.
        // If ID provided and exists -> Update. If ID provided and new -> Create (rare).
        // I will split logic or simple upsert.

        const existing = await prisma.kiosk.findUnique({ where: { id: data.id } });
        if (existing) {
            await prisma.kiosk.update({
                where: { id: data.id },
                data: {
                    name: data.name,
                    location_id: data.location_id,
                    status: data.status || 'ACTIVE'
                }
            });
        } else {
            // Creating with a specific ID (rare but possible if manually entered?)
            // Prompt says "Auto-Generate ID button".
            // We'll treat provided ID as "Create with this ID" if not found.
            await prisma.kiosk.create({
                data: {
                    id: data.id,
                    name: data.name,
                    location_id: data.location_id,
                    status: data.status || 'ACTIVE',
                    secret_key: uuidv4() // Dummy secret if needed
                }
            });
        }
    } else {
        // Create with auto ID
        await prisma.kiosk.create({
            data: {
                name: data.name,
                location_id: data.location_id,
                status: data.status || 'ACTIVE',
                secret_key: uuidv4()
            }
        });
    }
    revalidatePath('/admin/kiosks');
}

export async function deleteKiosk(id: string) {
    await prisma.kiosk.delete({ where: { id } });
    revalidatePath('/admin/kiosks');
}

export async function toggleKioskStatus(id: string, currentStatus: KioskStatus) {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await prisma.kiosk.update({
        where: { id },
        data: { status: newStatus }
    });
    revalidatePath('/admin/kiosks');
}
