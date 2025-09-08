# Screen Share Deployment Fix

## Issue Fixed
Screen sharing was working locally but failing in production with "Failed to start screen sharing" error.

## Root Cause
The `/api/agora/token` endpoint was only available in Vite's development server but missing in production deployment.

## Solution Implemented
1. **Created Vercel API Function**: Added `api/agora/token.ts` to handle token generation in production
2. **Updated Vercel Config**: Modified `vercel.json` to properly route API calls and configure the function
3. **Enhanced Error Handling**: Added better logging and error messages for debugging
4. **Security Check**: Added HTTPS requirement check for screen capture API

## Environment Variables (Optional)
You can set these in Vercel dashboard for production security:

```
AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERT=your_agora_app_certificate
```

If not set, the function will use the hardcoded values for testing.

## Files Modified
- `api/agora/token.ts` (new)
- `vercel.json` (updated routing)
- `src/utils/ScreenShareWebRTC.ts` (enhanced error handling)
- `package.json` (added @vercel/node dependency)

## Next Steps
1. Commit and push these changes
2. Deploy to production
3. Test screen sharing functionality
4. (Optional) Set environment variables in Vercel dashboard

The screen sharing should now work in production!
