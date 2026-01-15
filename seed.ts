const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Seeding...');

    // 1. Locations
    const merkez = await prisma.location.upsert({
        where: { id: 'merkez' },
        update: {},
        create: { id: 'merkez', name: 'İl Sağlık Müdürlüğü' },
    });

    const izmitIlce = await prisma.location.upsert({
        where: { id: 'izmit-ilce' },
        update: {},
        create: { id: 'izmit-ilce', name: 'İzmit İlçe Sağlık' },
    });

    // 2. Kiosks
    // Kiosk 1: Ana Bina A Kapısı
    await prisma.kiosk.upsert({
        where: { id: 'kiosk_ana_a' },
        update: {
            name: 'Ana Bina A Kapısı',
            location_id: 'merkez',
            status: 'ACTIVE'
        },
        create: {
            id: 'kiosk_ana_a',
            name: 'Ana Bina A Kapısı',
            location_id: 'merkez',
            secret_key: 'secret_ana_a',
            status: 'ACTIVE'
        },
    });

    // Kiosk 2: İzmit İlçe Sağlık
    await prisma.kiosk.upsert({
        where: { id: 'kiosk_ilce_1' },
        update: {
            name: 'İzmit İlçe Sağlık',
            location_id: 'izmit-ilce',
            status: 'ACTIVE'
        },
        create: {
            id: 'kiosk_ilce_1',
            name: 'İzmit İlçe Sağlık',
            location_id: 'izmit-ilce',
            secret_key: 'secret_ilce_1',
            status: 'ACTIVE'
        },
    });

    // Dummy 3rd Kiosk for testing setup flow later if needed (Inactive?)
    // Prompt says "Update seed.ts to create 3 predefined Kiosks... ID: kiosk_ana_a... ID: kiosk_ilce_1...". 
    // Wait, it says "create 3 predefined Kiosks" but only lists 2 in the example lines? 
    // "ID: kiosk_ana_a... ID: kiosk_ilce_1..." -> Only 2 listed. 
    // "Update seed.ts to create 3 predefined Kiosks so we can test immediately".
    // Maybe the 3rd is implied or I should make one?
    // I'll add `kiosk_test_inactive` just in case.
    await prisma.kiosk.upsert({
        where: { id: 'kiosk_inactive' },
        update: { status: 'INACTIVE' },
        create: {
            id: 'kiosk_inactive',
            name: 'Depo (Pasif)',
            location_id: 'merkez',
            secret_key: 'secret_inactive',
            status: 'INACTIVE'
        }
    });


    /*
    // 3. User (Dr Ahmet - Merkez)
    await prisma.user.create({
        data: {
            email: 'ahmet@example.com',
            name: 'Ahmet',
            surname: 'Yılmaz',
            tc_no: '12345678901',
            title: 'Doktor',
            password_hash: 'hashed_pw', // schema requires this
            primary_location_id: 'merkez',
            device_uuid: 'uuid-1',
            device_status: 'OPEN'
        },
    });

    // 4. User (Hemsire Fatma - Izmit Ilce)
    await prisma.user.create({
        data: {
            email: 'fatma@example.com',
            name: 'Fatma',
            surname: 'Demir',
            tc_no: '11111111111',
            title: 'Hemşire',
            password_hash: 'hashed_pw',
            primary_location_id: 'izmit-ilce',
            device_uuid: 'uuid-2',
            device_status: 'OPEN'
        },
    });
    */

    console.log('Seed completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
