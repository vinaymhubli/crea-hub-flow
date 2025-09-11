import type { VercelRequest, VercelResponse } from '@vercel/node';

// Pre-import agora-token to ensure it's available
let agoraTokenModule: any = null;
try {
    agoraTokenModule = require('agora-token');
} catch (e) {
    console.log('⚠️ Pre-import of agora-token failed, will try dynamic import');
}

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
        const APP_ID = "cc907f53350b4b9e9ba84070daad8c52";
        const APP_CERT = "808ccb94ef3247e7bbe032dc5491d34d";
        const ttl = 36000; // Token validity time in seconds

        console.log("🎫 Generating Agora token for:", {
            APP_ID: APP_ID ? `✓ Set (${APP_ID.substring(0, 8)}...)` : "✗ Missing",
            uid: uid,
            channel: channel,
            asSharer: asSharer
        });

        // Import agora-token with multiple fallback strategies for Vercel
        let RtcRole, RtcTokenBuilder, RtmTokenBuilder;
        
        // Strategy 1: Use pre-imported module if available
        if (agoraTokenModule) {
            console.log("📦 Using pre-imported agora-token module");
            ({ RtcRole, RtcTokenBuilder, RtmTokenBuilder } = agoraTokenModule);
            console.log("✅ Successfully used pre-imported Agora token builders");
        } else {
            try {
                // Strategy 2: Dynamic import
                const agoraToken = await import('agora-token');
                console.log("📦 Agora token import result:", Object.keys(agoraToken));
                
                // Handle different export patterns
                if (agoraToken.default) {
                    // CommonJS default export
                    ({ RtcRole, RtcTokenBuilder, RtmTokenBuilder } = agoraToken.default);
                    console.log("✅ Using default export");
                } else if (agoraToken.RtcRole) {
                    // Named exports
                    ({ RtcRole, RtcTokenBuilder, RtmTokenBuilder } = agoraToken);
                    console.log("✅ Using named exports");
                } else {
                    throw new Error('Could not find Agora token builders in import');
                }
                
                console.log("✅ Successfully imported Agora token builders");
            } catch (importError) {
                console.error("❌ Dynamic import failed:", importError);
                
                // Strategy 3: Try require for CommonJS
                try {
                    const agoraToken = require('agora-token');
                    console.log("📦 Agora token require result:", Object.keys(agoraToken));
                    ({ RtcRole, RtcTokenBuilder, RtmTokenBuilder } = agoraToken);
                    console.log("✅ Successfully required Agora token builders");
                } catch (requireError) {
                    console.error("❌ Require failed:", requireError);
                    
                    // Strategy 4: Try direct require with different paths
                    try {
                        const agoraToken = require('agora-token/dist/index.js');
                        ({ RtcRole, RtcTokenBuilder, RtmTokenBuilder } = agoraToken);
                        console.log("✅ Successfully required from dist/index.js");
                    } catch (distError) {
                        console.error("❌ All import strategies failed:", distError);
                        throw new Error('Agora token package not available on Vercel');
                    }
                }
            }
        }

        // Verify that the required functions are available
        if (!RtcRole || !RtcTokenBuilder || !RtmTokenBuilder) {
            throw new Error('Required Agora token builders not available');
        }
        
        if (!RtcTokenBuilder.buildTokenWithAccount && !RtcTokenBuilder.buildTokenWithUid) {
            throw new Error('No valid RTC token builder methods available');
        }
        
        console.log("🔍 Available RTC token methods:", {
            buildTokenWithAccount: !!RtcTokenBuilder.buildTokenWithAccount,
            buildTokenWithUid: !!RtcTokenBuilder.buildTokenWithUid,
            RtcTokenBuilderKeys: Object.keys(RtcTokenBuilder)
        });

        const now = Math.floor(Date.now() / 1000);
        const expireAt = now + ttl;
        const rtcRole = asSharer ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

        // Generate RTC token with comprehensive fallback for Vercel compatibility
        let rtcToken;
        let tokenMethod = 'unknown';
        
        try {
            // Try buildTokenWithAccount first (preferred for string UIDs)
            if (RtcTokenBuilder.buildTokenWithAccount) {
                rtcToken = RtcTokenBuilder.buildTokenWithAccount(
                    APP_ID,
                    APP_CERT,
                    channel,
                    String(uid),
                    rtcRole,
                    expireAt
                );
                tokenMethod = 'buildTokenWithAccount';
                console.log("✅ Generated token using buildTokenWithAccount");
            } else {
                throw new Error('buildTokenWithAccount not available');
            }
        } catch (accountError) {
            console.log("⚠️ buildTokenWithAccount failed, trying buildTokenWithUid:", accountError);
            
            // Fallback to buildTokenWithUid with numeric UID
            try {
                const numericUid = parseInt(String(uid).replace(/[^0-9]/g, '')) || Math.abs(String(uid).split('').reduce((a, b) => {
                    a = ((a << 5) - a) + b.charCodeAt(0);
                    return a & a;
                }, 0));
                
                rtcToken = RtcTokenBuilder.buildTokenWithUid(
                    APP_ID,
                    APP_CERT,
                    channel,
                    numericUid,
                    rtcRole,
                    expireAt
                );
                tokenMethod = 'buildTokenWithUid';
                console.log("✅ Generated token using buildTokenWithUid with numeric UID:", numericUid);
            } catch (uidError) {
                console.error("❌ Both token generation methods failed:", uidError);
                
                // Last resort: try to use any available method
                const availableMethods = Object.keys(RtcTokenBuilder).filter(key => 
                    typeof RtcTokenBuilder[key] === 'function' && key.includes('buildToken')
                );
                
                console.log("🔍 Available token methods:", availableMethods);
                
                if (availableMethods.length > 0) {
                    const method = availableMethods[0];
                    console.log(`🔄 Trying last resort method: ${method}`);
                    
                    try {
                        rtcToken = RtcTokenBuilder[method](
                            APP_ID,
                            APP_CERT,
                            channel,
                            String(uid),
                            rtcRole,
                            expireAt
                        );
                        tokenMethod = method;
                        console.log(`✅ Generated token using ${method}`);
                    } catch (lastResortError) {
                        console.error(`❌ Last resort method ${method} failed:`, lastResortError);
                        throw new Error('All token generation methods failed');
                    }
                } else {
                    throw new Error('No token generation methods available');
                }
            }
        }

        // Generate RTM token for messaging
        const rtmToken = RtmTokenBuilder.buildToken(
            APP_ID,
            APP_CERT,
            String(uid),
            expireAt
        );

        console.log(`✅ Successfully generated Agora tokens using ${tokenMethod}`);

        return res.status(200).json({
            appId: APP_ID,
            channel,
            uid: String(uid),
            rtcToken,
            rtmToken,
            expireAt,
            tokenMethod
        });

    } catch (error: any) {
        console.error("❌ Agora token API error:", error);
        return res.status(500).json({
            error: error?.message || "Internal server error",
            details: {
                agoraTokenModule: agoraTokenModule ? 'available' : 'null',
                errorStack: error?.stack
            }
        });
    }
}
