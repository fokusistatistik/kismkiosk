const crypto = require('crypto');

// Fixed key/iv for demo
const algorithm = 'aes-256-cbc';
const key = crypto.scryptSync(process.env.JWT_SECRET || 'secret', 'salt', 32);
const iv = Buffer.alloc(16, 0);

function generateTimeWindowQR(kioskId) {
    // 20-second window
    const now = Math.floor(Date.now() / 1000);
    const windowSize = 20;

    // Align to window
    const windowStart = now - (now % windowSize);
    const windowEnd = windowStart + windowSize;

    // Payload: START-END|KIOSKID
    const payload = `${windowStart}-${windowEnd}|${kioskId}`;

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(payload, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return encrypted;
}

function validateTimeWindowQR(encryptedToken) {
    try {
        const decipher = crypto.createDecipheriv(algorithm, key, iv);
        let decrypted = decipher.update(encryptedToken, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        // Robust parsing
        const parts = decrypted.split('|');
        if (parts.length < 2) return { valid: false, reason: 'Invalid Payload' };

        const timeRange = parts[0];
        const kioskId = parts[1];

        const [startStr] = timeRange.split('-');
        const start = parseInt(startStr, 10);

        const now = Math.floor(Date.now() / 1000);
        const windowSize = 20;

        // Tolerance: Previous, Current, Next (3 windows total)
        const currentWindowStart = now - (now % windowSize);

        const possibleStarts = [
            currentWindowStart - windowSize, // Prev
            currentWindowStart,           // Curr
            currentWindowStart + windowSize  // Next
        ];

        if (possibleStarts.includes(start)) {
            return { valid: true, kioskId };
        }
        return { valid: false, reason: 'Expired' };

    } catch (e) {
        return { valid: false, reason: 'Invalid Format' };
    }
}

module.exports = { generateTimeWindowQR, validateTimeWindowQR };
