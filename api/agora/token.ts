import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { uid, channel, asSharer } = req.body;

        // Validate required parameters
        if (!uid || !channel) {
            return res.status(400).json({ error: 'uid and channel are required' });
        }

        // Agora credentials - these should be moved to environment variables in production
        const APP_ID = process.env.AGORA_APP_ID || "9f26de32fa2546839b41ffbf0ad0cfb9";
        const APP_CERT = process.env.AGORA_APP_CERT || "bfe2d626b93d4665aa1756b7ab56780c";
        const ttl = 36000; // Token validity time in seconds

        console.log("🎫 Generating Agora token for:", {
            APP_ID: APP_ID ? `✓ Set (${APP_ID.substring(0, 8)}...)` : "✗ Missing",
            uid: uid,
            channel: channel,
            asSharer: asSharer
        });

        // Import agora-token dynamically to handle ESM/CommonJS compatibility
        const agoraToken = await import('agora-token');

        // Handle both CommonJS default export and named exports
        const { RtcRole, RtcTokenBuilder, RtmTokenBuilder } = agoraToken.default || agoraToken;

        const now = Math.floor(Date.now() / 1000);
        const expireAt = now + ttl;
        const rtcRole = asSharer ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

        // Generate RTC token using Account to support string UIDs reliably
        const rtcToken = RtcTokenBuilder.buildTokenWithAccount(
            APP_ID,
            APP_CERT,
            channel,
            String(uid),
            rtcRole,
            expireAt
        );

        // Generate RTM token for messaging
        const rtmToken = RtmTokenBuilder.buildToken(
            APP_ID,
            APP_CERT,
            String(uid),
            expireAt
        );

        console.log("✅ Successfully generated Agora tokens (account mode)");

        return res.status(200).json({
            appId: APP_ID,
            channel,
            uid: String(uid),
            rtcToken,
            rtmToken,
            expireAt
        });

    } catch (error: any) {
        console.error("❌ Agora token API error:", error);
        return res.status(500).json({
            error: error?.message || "Internal server error"
        });
    }
}
