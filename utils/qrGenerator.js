const jwt = require('jsonwebtoken');

// Reuse the central secret or default
// In a real scenario, sharing this directly might be risky if not handled well, 
// but for this internal use, it ensures server can verify what it generated.
const SECRET = process.env.JWT_SECRET || 'secret';

function generateTimeWindowQR(kioskId, locationId = 'UNKNOWN', kioskName = 'UNKNOWN') {
    // Current timestamp in seconds
    const now = Math.floor(Date.now() / 1000);

    // Payload (Short keys for smaller QR size)
    // kid: Kiosk ID
    // loc: Location ID
    // nam: Name
    const payload = {
        kid: kioskId,
        loc: locationId,
        nam: kioskName,
        iat: now,
        exp: now + 60 // 60 seconds expiration as requested
    };

    // Sign with secret
    return jwt.sign(payload, SECRET);
}

function validateTimeWindowQR(token) {
    try {
        // Verify signature and decode
        const decoded = jwt.verify(token, SECRET);

        // Time window check 
        // Allow 30 seconds drift/delay
        // Since we generate every 5-10s, a 30s window is generous but safe enough for "presence"
        const now = Math.floor(Date.now() / 1000);
        const diff = now - decoded.iat;

        if (diff >= -5 && diff <= 35) { // -5 for slight clock skew ahead
            return {
                valid: true,
                kioskId: decoded.kid,
                locationId: decoded.loc,
                kioskName: decoded.nam
            };
        }

        return {
            valid: false,
            reason: `Expired (${diff}s)`,
            kioskId: decoded.kid,
            locationId: decoded.loc,
            kioskName: decoded.nam
        };

    } catch (e) {
        return { valid: false, reason: e.message };
    }
}

module.exports = { generateTimeWindowQR, validateTimeWindowQR };
