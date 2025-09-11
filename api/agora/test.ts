import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Test agora-token package availability
        let agoraTokenModule: any = null;
        let importMethod = 'none';
        
        try {
            agoraTokenModule = require('agora-token');
            importMethod = 'require';
        } catch (e) {
            try {
                agoraTokenModule = await import('agora-token');
                importMethod = 'dynamic import';
            } catch (e2) {
                return res.status(500).json({
                    error: 'Agora token package not available',
                    details: {
                        requireError: e.message,
                        importError: e2.message
                    }
                });
            }
        }

        // Check what's available in the module
        const moduleKeys = Object.keys(agoraTokenModule);
        const hasDefault = !!agoraTokenModule.default;
        const hasRtcRole = !!agoraTokenModule.RtcRole;
        const hasRtcTokenBuilder = !!agoraTokenModule.RtcTokenBuilder;
        const hasRtmTokenBuilder = !!agoraTokenModule.RtmTokenBuilder;

        // Check default export
        let defaultKeys: string[] = [];
        if (agoraTokenModule.default) {
            defaultKeys = Object.keys(agoraTokenModule.default);
        }

        return res.status(200).json({
            success: true,
            importMethod,
            moduleKeys,
            hasDefault,
            hasRtcRole,
            hasRtcTokenBuilder,
            hasRtmTokenBuilder,
            defaultKeys,
            agoraTokenModule: agoraTokenModule ? 'available' : 'null'
        });

    } catch (error: any) {
        return res.status(500).json({
            error: error?.message || "Internal server error",
            stack: error?.stack
        });
    }
}
