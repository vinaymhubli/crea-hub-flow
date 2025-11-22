# Demo Sessions Feature - Complete Guide

## Overview
The demo sessions feature allows your platform to offer **free 30-minute demo video calls** to potential users. These sessions:
- Have **NO billing** - completely free
- Are accessible to **guest users** (no login required)
- Run for a **fixed 30 minutes**
- Can only be created and managed by **admins**

---

## How It Works

### 1. User Requests a Demo
- Users visit: `/request-demo`
- Fill out a simple form with:
  - Full Name (required)
  - Email (required)
  - Phone Number (optional)
  - Message about what they'd like to explore (optional)
- Request is submitted and stored in the `demo_sessions` table with status `pending`

### 2. Admin Reviews and Approves
- Admin logs into admin panel
- Goes to **"Demo Sessions"** in the sidebar
- Views all demo requests with tabs:
  - **Pending**: New requests waiting for approval
  - **Approved**: Scheduled sessions
  - **Completed**: Finished sessions
  - **Rejected**: Declined requests
  - **All**: View everything

#### Approving a Demo Request:
1. Click **"Approve"** button on a pending request
2. Select a **scheduled date & time**
3. Add **admin notes** (optional, for internal reference)
4. Click **"Approve & Generate Link"**
5. System automatically:
   - Generates a unique session ID (e.g., `DEMO-A1B2C3D4E5F6`)
   - Creates a meeting link: `https://yoursite.com/demo-session/DEMO-A1B2C3D4E5F6`
   - Updates status to `approved`

#### Sending the Link to User:
- Click the **"Send Email"** button
- Opens default email client with pre-filled message containing:
  - Scheduled date/time
  - Meeting link
  - Session duration (30 minutes)
- Or manually copy the link using the **copy icon**

### 3. Guest User Joins Demo Session
- User clicks the meeting link received via email
- Arrives at `/demo-session/DEMO-A1B2C3D4E5F6`
- Sees join screen showing:
  - Session duration: 30 minutes
  - Scheduled date/time
  - "FREE DEMO SESSION" badge
- Enters their name and clicks **"Join Demo Session"**

### 4. Demo Session Experience
Once joined:
- **NO billing information** shown
- **30-minute timer** displayed at the top
- **Video call interface** with:
  - Video feed from camera
  - Microphone toggle
  - Video toggle
  - End call button
- **Auto-expiry**: Session automatically ends after 30 minutes
- **Warning**: User gets a warning when 60 seconds remain
- After session ends:
  - Status changes to `completed`
  - User is redirected to homepage

---

## Database Schema

### `demo_sessions` Table
```sql
- id: UUID (primary key)
- session_id: TEXT (unique identifier for meeting link)
- requester_name: TEXT
- requester_email: TEXT
- requester_phone: TEXT (optional)
- requester_message: TEXT (optional)
- status: TEXT (pending/approved/rejected/completed/expired)
- scheduled_date: TIMESTAMPTZ
- meeting_link: TEXT
- duration_minutes: INTEGER (default: 30)
- started_at: TIMESTAMPTZ
- ended_at: TIMESTAMPTZ
- admin_notes: TEXT
- created_by: UUID (admin who approved)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### `demo_session_participants` Table
```sql
- id: UUID (primary key)
- demo_session_id: UUID (foreign key)
- participant_name: TEXT
- participant_type: TEXT (admin/guest)
- joined_at: TIMESTAMPTZ
- left_at: TIMESTAMPTZ
```

---

## Security & Access Control

### Row Level Security (RLS) Policies:
1. **Admins can view/manage all demo sessions**
   - Full CRUD access for admin users
2. **Guest users can view demo sessions by session_id**
   - Only when they have the unique meeting link
3. **Anyone can join as a participant**
   - No authentication required for joining

### Session Expiry:
- Database function `auto_expire_demo_sessions()` runs periodically
- Marks sessions as `expired` if started more than 30 minutes ago
- Prevents access to expired sessions

---

## Admin Features

### Demo Sessions Management Page (`/admin/demo-sessions`)

**Summary Stats:**
- Total demo requests count

**Tabs:**
- All / Pending / Approved / Completed / Rejected

**For Each Request, Admin Can:**
1. **View Details:**
   - Requester name, email, phone
   - Message/requirements
   - Current status
   - Scheduled date (if approved)
   
2. **Approve:**
   - Set scheduled date/time
   - Add internal notes
   - Generate meeting link
   
3. **Reject:**
   - Mark as rejected
   - Add rejection reason (optional)
   
4. **Send Email:**
   - Pre-filled email with meeting details
   - One-click to open email client
   
5. **Copy Link:**
   - Copy meeting link to clipboard
   - Open meeting link in new tab

---

## Routes

### Public Routes (No Login Required):
- `/request-demo` - Request a demo form
- `/demo-session/:sessionId` - Join demo session (guest access)

### Admin Routes (Admin Only):
- `/admin/demo-sessions` - Manage demo sessions

---

## Key Features

✅ **No Billing**: Completely free, no payment required
✅ **Guest Access**: Users don't need to create an account
✅ **30-Minute Limit**: Fixed duration, auto-expires
✅ **Admin Control**: Only admins can approve and create sessions
✅ **Email Integration**: Easy sending of meeting links
✅ **Video Call**: Full video/audio capabilities
✅ **Timer Display**: Clear countdown showing time remaining
✅ **Responsive Design**: Works on desktop and mobile
✅ **Security**: RLS policies protect data access

---

## Setup Instructions

1. **Run the migration:**
   ```bash
   # In Supabase SQL Editor, run:
   supabase/migrations/20250123000000_create_demo_sessions.sql
   ```

2. **Verify tables created:**
   - `demo_sessions`
   - `demo_session_participants`

3. **Test the flow:**
   - Visit `/request-demo`
   - Submit a demo request
   - Login as admin
   - Go to `/admin/demo-sessions`
   - Approve the request
   - Copy the meeting link
   - Open in incognito/private window (guest access)
   - Join and test the video call

---

## Usage Tips

### For Admins:
- Review demo requests regularly
- Schedule sessions at convenient times
- Use admin notes for internal tracking
- Send meeting links promptly after approval
- Monitor completed sessions for feedback

### For Marketing:
- Add "Request Demo" link in header/footer
- Promote free demo sessions on homepage
- Include demo option in pricing page
- Use in email campaigns

### Best Practices:
- Respond to demo requests within 24 hours
- Schedule demos during business hours
- Test your camera/mic before each session
- Follow up with users after demo completion
- Track conversion rate from demos to signups

---

## Troubleshooting

**Issue: "Session Not Found"**
- Session ID is invalid or doesn't exist
- Check the meeting link is correct

**Issue: "Session Not Ready"**
- Status is still 'pending'
- Admin needs to approve the request

**Issue: "Session Expired"**
- Session already ended or 30 minutes passed
- Request a new demo session

**Issue: Camera/Mic Access Denied**
- Browser needs permission to access media devices
- Check browser settings
- Try a different browser

---

## Future Enhancements (Optional)

Potential features to add later:
- WebRTC for real peer-to-peer video
- Screen sharing capability
- Chat feature during demo
- Recording capability (with consent)
- Post-demo feedback form
- Automated email reminders
- Calendar integration (Google/Outlook)
- Analytics on demo conversion rates

---

## Technical Notes

- Video uses browser's `getUserMedia` API
- Session IDs are generated using MD5 hash + random
- Timer runs client-side with setInterval
- Session expiry also handled server-side
- Guest users tracked in `demo_session_participants`
- No WebSocket/SignalR for simplicity (can be added later)

---

## Support

For issues or questions:
1. Check browser console for errors
2. Verify Supabase tables and RLS policies
3. Test with different browsers
4. Ensure camera/mic permissions granted
5. Check network connectivity

---

**Congratulations!** Your demo sessions feature is now fully implemented and ready to use! 🎉

