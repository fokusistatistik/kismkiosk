/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config();
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
const port = 3000;

app.prepare().then(() => {
    const server = express();
    const httpServer = createServer(server);
    const io = new Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    server.use(cors());
    server.use(express.json());
    server.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

    const storage = multer.diskStorage({
        destination: (req, file, cb) => cb(null, 'public/uploads/'),
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            cb(null, uniqueSuffix + path.extname(file.originalname));
        }
    });
    const upload = multer({ storage: storage });

    // Socket
    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        socket.on('join_kiosk', async (kioskId) => {
            try {
                // Allow non-db kiosks to join for demo purposes
                // Just try to fetch to log activity
                const kiosk = await prisma.kiosk.findUnique({ where: { id: kioskId } });

                if (kiosk) {
                    await prisma.kiosk.update({
                        where: { id: kioskId },
                        data: { last_seen: new Date() }
                    });
                } else {
                    console.log(`Unregistered Kiosk joined: ${kioskId}`);
                }

                const room = `room_kiosk_${kioskId}`;
                socket.join(room);
                console.log(`Socket ${socket.id} joined ${room}`);

            } catch (e) {
                console.error("Socket Auth Error", e);
                // Allow join anyway to prevent UI freeze
                socket.join(`room_kiosk_${kioskId}`);
            }
        });

        socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
    });

    // --- API Endpoints ---

    // Admin Login
    server.post('/api/admin/login', (req, res) => {
        const { username, password } = req.body;
        if (username === 'kocaeliilsaglik' && password === 'Kocaeliilsaglik41.Kocaeli') {
            const token = jwt.sign({ username, role: 'ADMIN' }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
            return res.json({ success: true, token, user: { name: 'Admin', role: 'ADMIN' } });
        }
        return res.status(401).json({ error: 'Geçersiz bilgiler' });
    });

    // 1. Generate QR Token
    // 1. Generate QR Token (Relaxed Mode)
    server.get('/api/kiosk/qr-token', async (req, res) => {
        const { kioskId, name, locationId } = req.query;
        if (!kioskId) return res.status(400).json({ error: 'Missing kioskId' });

        try {
            // Try fetch from DB, but don't enforce existence
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

            // Always generate token
            const token = generateTimeWindowQR(
                kioskId,
                kioskLoc,
                kioskName
            );

            res.json({ token, kioskName });
        } catch (e) {
            console.error("QR Gen Error:", e);
            // Fallback generation on error
            const token = generateTimeWindowQR(kioskId, locationId || 'UNKNOWN', name || 'Cihaz');
            res.json({ token, kioskName: name || 'Cihaz' });
        }
    });

    // 2. Mobile Scan (Protocol v1.1.0)
    server.post('/api/mobile/scan', async (req, res) => {
        const { qr_token, user_id, user_name, device_info } = req.body;
        // user_id -> TC KN
        // device_info -> Object with uuid
        const deviceUuid = device_info?.uuid;

        try {
            const validation = validateTimeWindowQR(qr_token);
            if (!validation.valid) {
                return res.status(400).json({ success: false, message: 'QR Süresi Doldu veya Geçersiz' });
            }

            // Find User by TC Identity
            const user = await prisma.user.findUnique({ where: { tc_no: user_id } });

            // If user not found, emit visual error to Kiosk immediately
            if (!user) {
                io.to(`room_kiosk_${validation.kioskId}`).emit('SCAN_ERROR', { message: 'Kayıtlı Kullanıcı Bulunamadı' });
                return res.status(404).json({ success: false, message: 'Kayıtlı kullanıcı bulunamadı' });
            }

            // Proceed with process logic, passing the mobile-provided name for display preference
            await processEntry(user.id, deviceUuid, 'QR', validation.kioskId, res, user_name);

        } catch (err) {
            console.error("Scan error:", err);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    });

    // 2b. Manual Entry
    server.post('/api/kiosk/manual-entry', async (req, res) => {
        const { tc, password, kioskId } = req.body;
        try {
            const user = await prisma.user.findUnique({ where: { tc_no: tc } });
            if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });

            const expectedPass = user.tc_no.substring(0, 4);
            if (password !== expectedPass) return res.status(401).json({ error: 'Şifre Hatalı' });

            await processEntry(user.id, null, 'MANUAL', kioskId, res);
        } catch (e) {
            console.error(e);
            res.status(500).json({ error: e.message });
        }
    });

    // 3. Upload Photo
    server.post('/api/kiosk/upload-photo', upload.single('photo'), async (req, res) => {
        try {
            const { kioskId, userId, status, meta } = req.body;
            const parsedMeta = meta ? JSON.parse(meta) : {};
            const file = req.file;

            const photoUrl = file ? `/uploads/${file.filename}` : null;
            const validStatus = (status === 'SUCCESS' || status === 'FAILED') ? status : 'SUCCESS';

            const newLog = await prisma.accessLog.create({
                data: {
                    kiosk_id: kioskId,
                    user_id: userId,
                    location_id: parsedMeta.location_id || null,
                    status: validStatus,
                    photo_url: photoUrl,
                    direction: parsedMeta.direction || 'IN',
                    anomaly_flag: parsedMeta.anomaly_flag || null,
                    is_roaming: parsedMeta.is_roaming || false,
                    entry_method: parsedMeta.entry_method || 'QR'
                },
                include: {
                    user: { select: { name: true, surname: true, title: true } },
                    kiosk: { select: { name: true } },
                    location: { select: { name: true } }
                }
            });

            io.emit('NEW_LOG', newLog);
            res.json({ success: true });
        } catch (err) {
            console.error("Upload error:", err);
            res.status(500).json({ error: err.message });
        }
    });

    // --- Process Logic ---
    async function processEntry(userId, deviceUuid, method, kioskIdOverride, res, mobileUserName = null) {
        try {
            // 1. Fetch User (Repeated finding by ID is safe/cached usually, but ensures fresh state)
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user) {
                if (kioskIdOverride) io.to(`room_kiosk_${kioskIdOverride}`).emit('SCAN_ERROR', { message: 'Kayıtlı Kullanıcı Bulunamadı' });
                return res.status(404).json({ success: false, message: 'Kullanıcı Bulunamadı' });
            }

            // 2. Device Binding (Only for QR)
            if (method === 'QR' && deviceUuid) {
                if (user.device_uuid && user.device_uuid !== deviceUuid) {
                    if (kioskIdOverride) io.to(`room_kiosk_${kioskIdOverride}`).emit('SCAN_ERROR', { message: 'Cihaz Eşleşmedi' });
                    return res.status(403).json({ success: false, message: 'Cihaz Eşleşmiyor' });
                }
            }

            // 3. Global Account Lock Check (For Both QR and Manual)
            if (user.device_status === 'LOCKED') {
                if (kioskIdOverride) io.to(`room_kiosk_${kioskIdOverride}`).emit('SCAN_ERROR', { message: 'Hesap Kilitli' });
                return res.status(403).json({ success: false, message: 'Hesap Kilitli. Lütfen çıkış yapınız.' });
            }

            // 3. Fetch Kiosk
            if (!kioskIdOverride) return res.status(400).json({ success: false, message: 'Kiosk ID Missing' });
            const kiosk = await prisma.kiosk.findUnique({ where: { id: kioskIdOverride } });
            if (!kiosk) return res.status(404).json({ success: false, message: 'Kiosk Bulunamadı' });

            // 4. Roaming Check
            const isRoaming = (user.primary_location_id && kiosk.location_id)
                ? (user.primary_location_id !== kiosk.location_id)
                : false;

            // 5. Direction & Anomaly
            const lastLog = await prisma.accessLog.findFirst({
                where: { user_id: userId, status: 'SUCCESS' },
                orderBy: { timestamp: 'desc' }
            });

            const now = new Date();
            let direction = 'IN';
            let anomaly = null;

            if (lastLog) {
                const diffSeconds = (now.getTime() - new Date(lastLog.timestamp).getTime()) / 1000;
                if (diffSeconds < 60) {
                    io.to(`room_kiosk_${kioskIdOverride}`).emit('SCAN_ERROR', { message: 'Çok Hızlı Geçiş' });
                    return res.status(429).json({ success: false, message: 'Çok Hızlı Geçiş. Lütfen bekleyiniz.' });
                }
                // Toggle Direction
                direction = lastLog.direction === 'IN' ? 'OUT' : 'IN';

                // Missed Exit (> 16h)
                if (lastLog.direction === 'IN' && diffSeconds > 16 * 60 * 60) {
                    direction = 'IN';
                    anomaly = 'MISSED_EXIT';
                }
            }

            // Determine Display Name (Mobile override or DB)
            const displayUserName = mobileUserName || `${user.name} ${user.surname}`;

            // Emit Success (Visual)
            io.to(`room_kiosk_${kioskIdOverride}`).emit('SCAN_SUCCESS', {
                user_name: displayUserName,
                user_title: user.title,
                direction: direction
            });

            // Emit Trigger (Camera)
            io.to(`room_kiosk_${kioskIdOverride}`).emit('TRIGGER_CAMERA', {
                user_id: user.id,
                user_name: displayUserName,
                meta: {
                    direction,
                    anomaly_flag: anomaly,
                    location_id: kiosk.location_id,
                    is_roaming: isRoaming,
                    entry_method: method
                }
            });

            res.json({
                success: true,
                message: 'Giriş Onaylandı',
                kiosk_command: 'open_gate',
                user_name: displayUserName
            });

        } catch (e) {
            console.error("Process Entry Error", e);
            if (kioskIdOverride) io.to(`room_kiosk_${kioskIdOverride}`).emit('SCAN_ERROR', { message: 'Sistem Hatası' });
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    }

    server.use((req, res) => handle(req, res));
    httpServer.listen(port, (err) => {
        if (err) throw err;
        console.log(`> Server ready on http://localhost:${port}`);
    });
});
