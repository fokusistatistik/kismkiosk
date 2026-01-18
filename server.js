require('dotenv').config();
/* eslint-disable @typescript-eslint/no-require-imports */
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const next = require('next');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const { generateTimeWindowQR, validateTimeWindowQR } = require('./utils/qrGenerator');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev, turbo: false });
const handle = app.getRequestHandler();

console.log('Loading env vars...');
console.log('Using SQLite Database');

const prisma = new PrismaClient();
const port = process.env.PORT || 3000;

app.prepare().then(() => {
    const server = express();
    const httpServer = createServer(server);

    // Socket.io with path prefix
    const io = new Server(httpServer, {
        path: '/kiosk/socket.io',
        cors: {
            origin: ["https://doku.fokusistatistik.com", "https://kiosk.fokusistatistik.com"],
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    // Main Kiosk Router
    const kioskRouter = express.Router();

    kioskRouter.use(cors({
        origin: ["https://doku.fokusistatistik.com", "https://kiosk.fokusistatistik.com"],
        methods: ["GET", "POST", "OPTIONS"],
        credentials: true
    }));

    kioskRouter.use(express.json());
    kioskRouter.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

    const storage = multer.diskStorage({
        destination: (req, file, cb) => cb(null, 'public/uploads/'),
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            cb(null, uniqueSuffix + path.extname(file.originalname));
        }
    });
    const upload = multer({ storage: storage });

    // Socket Logic
    io.on('connection', (socket) => {
        socket.on('join_kiosk', async (kioskId) => {
            try {
                const kiosk = await prisma.kiosk.findUnique({ where: { id: kioskId } });
                if (kiosk) {
                    await prisma.kiosk.update({
                        where: { id: kioskId },
                        data: { last_seen: new Date() }
                    });
                }
                socket.join(`room_kiosk_${kioskId}`);
                socket.join(kioskId); // Simplified room name for v2 compatibility
            } catch (e) {
                socket.join(`room_kiosk_${kioskId}`);
                socket.join(kioskId);
            }
        });
    });

    // --- API Endpoints (inside /kiosk prefix) ---

    kioskRouter.post('/api/admin/login', (req, res) => {
        const { username, password } = req.body;
        if (username === 'kocaeliilsaglik' && password === 'Kocaeliilsaglik41.Kocaeli') {
            const token = jwt.sign({ username, role: 'ADMIN' }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
            return res.json({ success: true, token, user: { name: 'Admin', role: 'ADMIN' } });
        }
        return res.status(401).json({ error: 'Geçersiz bilgiler' });
    });

    kioskRouter.get('/api/kiosk/qr-token', async (req, res) => {
        const { kioskId, name, locationId } = req.query;
        if (!kioskId) return res.status(400).json({ error: 'Missing kioskId' });
        try {
            let kioskName = name || 'Bilinmeyen Cihaz';
            let kioskLoc = locationId || 'UNKNOWN';
            const kiosk = await prisma.kiosk.findUnique({
                where: { id: kioskId },
                select: { name: true, location_id: true }
            });
            if (kiosk) {
                kioskName = kiosk.name;
                kioskLoc = kiosk.location_id || 'UNKNOWN';
            }
            const token = generateTimeWindowQR(kioskId, kioskLoc, kioskName);
            res.json({ token, kioskName });
        } catch (e) {
            const token = generateTimeWindowQR(kioskId, locationId || 'UNKNOWN', name || 'Cihaz');
            res.json({ token, kioskName: name || 'Cihaz' });
        }
    });

    kioskRouter.post('/api/mobile/scan', async (req, res) => {
        const { qr_token, user_id, user_tc, user_name, device_info } = req.body;
        const tcNo = user_tc || user_id;
        const deviceUuid = device_info?.uuid;
        const testMode = process.env.TEST_MODE === 'true';
        try {
            const validation = validateTimeWindowQR(qr_token);
            if (testMode) {
                const kioskId = validation.kioskId || 'kiosk_ana_a';
                io.to(`room_kiosk_${kioskId}`).emit('SCAN_SUCCESS', {
                    user_name: user_name || "TEST USER",
                    user_title: "Test Modu Aktif",
                    direction: "IN"
                });

                // Align with v2 guide
                io.to(kioskId).emit('access_granted', {
                    user_name: user_name || "TEST USER",
                    message: "TEST MODU: Bağlantı Başarılı, Hoş Geldiniz!"
                });

                return res.json({ success: true, message: "TEST MODU: Bağlantı Başarılı!" });
            }
            if (!validation.valid) return res.status(400).json({ success: false, message: 'QR Geçersiz' });
            const user = await prisma.user.findUnique({ where: { tc_no: tcNo } });
            if (!user) {
                io.to(`room_kiosk_${validation.kioskId}`).emit('SCAN_ERROR', { message: 'Kullanıcı Bulunamadı' });
                return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı' });
            }
            await processEntry(user.id, deviceUuid, 'QR', validation.kioskId, res, user_name);
        } catch (err) {
            res.status(500).json({ success: false, message: 'Error' });
        }
    });

    kioskRouter.post('/api/kiosk/manual-entry', async (req, res) => {
        const { tc, password, kioskId } = req.body;
        try {
            const user = await prisma.user.findUnique({ where: { tc_no: tc } });
            if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
            if (password !== user.tc_no.substring(0, 4)) return res.status(401).json({ error: 'Şifre Hatalı' });
            await processEntry(user.id, null, 'MANUAL', kioskId, res);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });

    kioskRouter.post('/api/kiosk/upload-photo', upload.single('photo'), async (req, res) => {
        try {
            const { kioskId, userId, status, meta } = req.body;
            const parsedMeta = meta ? JSON.parse(meta) : {};
            const photoUrl = req.file ? `/kiosk/uploads/${req.file.filename}` : null;
            const newLog = await prisma.accessLog.create({
                data: {
                    kiosk_id: kioskId,
                    user_id: userId,
                    location_id: parsedMeta.location_id || null,
                    status: (status === 'SUCCESS' || status === 'FAILED') ? status : 'SUCCESS',
                    photo_url: photoUrl,
                    direction: parsedMeta.direction || 'IN',
                    is_roaming: parsedMeta.is_roaming || false,
                    entry_method: parsedMeta.entry_method || 'QR'
                },
                include: { user: true, kiosk: true }
            });
            io.emit('NEW_LOG', newLog);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // Mount Router
    server.use('/kiosk', kioskRouter);

    // Fallback to Next.js
    server.all('*', (req, res) => {
        return handle(req, res);
    });

    async function processEntry(userId, deviceUuid, method, kioskIdOverride, res, mobileUserName = null) {
        try {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user) return res.status(404).json({ success: false });
            if (method === 'QR' && deviceUuid) {
                await prisma.user.update({ where: { id: userId }, data: { device_uuid: deviceUuid } });
            }
            if (user.device_status === 'LOCKED') {
                if (kioskIdOverride) io.to(`room_kiosk_${kioskIdOverride}`).emit('SCAN_ERROR', { message: 'Hesap Kilitli' });
                return res.status(403).json({ success: false, message: 'Hesap Kilitli' });
            }
            const kiosk = await prisma.kiosk.findUnique({ where: { id: kioskIdOverride } });
            const lastLog = await prisma.accessLog.findFirst({ where: { user_id: userId, status: 'SUCCESS' }, orderBy: { timestamp: 'desc' } });
            let direction = 'IN';
            if (lastLog) direction = lastLog.direction === 'IN' ? 'OUT' : 'IN';
            const displayUserName = mobileUserName || `${user.name} ${user.surname}`;
            io.to(`room_kiosk_${kioskIdOverride}`).emit('SCAN_SUCCESS', { user_name: displayUserName, user_title: user.title, direction });

            // Align with v2 guide
            io.to(kioskIdOverride).emit('access_granted', {
                user_name: displayUserName,
                message: direction === 'OUT' ? 'Güle Güle' : 'Hoş Geldiniz'
            });

            io.to(`room_kiosk_${kioskIdOverride}`).emit('TRIGGER_CAMERA', { user_id: user.id, user_name: displayUserName, meta: { direction, kioskId: kioskIdOverride } });
            res.json({ success: true, message: 'Giriş Onaylandı', user_name: displayUserName });
        } catch (e) {
            res.status(500).json({ success: false });
        }
    }

    httpServer.listen(port, (err) => {
        if (err) throw err;
        console.log(`> Server running on port: ${port}`);
        console.log(`> App available at http://localhost:${port}/kiosk`);
    });
});
