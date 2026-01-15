const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = [
        {
            tc_no: '17422776208',
            name: 'Test',
            surname: 'Kullanıcı 1',
            title: 'Yazılım Uzmanı',
            password_hash: '1742' // TC first 4 digits
        },
        {
            tc_no: '24400543608',
            name: 'Test',
            surname: 'Kullanıcı 2',
            title: 'Sistem Yöneticisi',
            password_hash: '2440' // TC first 4 digits
        }
    ];

    for (const u of users) {
        const exists = await prisma.user.findUnique({ where: { tc_no: u.tc_no } });
        if (exists) {
            console.log(`User ${u.tc_no} already exists.`);
        } else {
            await prisma.user.create({
                data: {
                    tc_no: u.tc_no,
                    name: u.name,
                    surname: u.surname,
                    title: u.title,
                    password_hash: u.password_hash,
                    device_status: 'OPEN',
                    role: 'USER'
                }
            });
            console.log(`User ${u.tc_no} created.`);
        }
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
