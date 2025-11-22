# Demo Session Testing Guide

## 📱 Mobile Compatibility

✅ **YES - The demo session is now fully mobile responsive!**

### Mobile Features:
- ✅ Responsive sidebar (slides in from right on mobile)
- ✅ Touch-friendly controls
- ✅ Adaptive header (stacks on small screens)
- ✅ Responsive video area
- ✅ Mobile-optimized buttons and dialogs
- ✅ Works on all screen sizes (mobile, tablet, desktop)

### Responsive Breakpoints:
- **Mobile**: < 1024px - Sidebar becomes overlay
- **Desktop**: ≥ 1024px - Sidebar is fixed on right
- **All sizes**: Video and controls scale appropriately

---

## 🧪 How to Test Demo Session

### Step 1: Run the Migration

1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Run the migration:
   ```sql
   -- Copy and paste the entire content of:
   supabase/migrations/20250123000000_create_demo_sessions.sql
   ```
4. Verify tables created:
   - `demo_sessions`
   - `demo_session_participants`

### Step 2: Request a Demo (User Flow)

1. **Visit the request page:**
   ```
   http://localhost:8080/request-demo
   ```
   (Or your production URL)

2. **Fill out the form:**
   - Name: "Test User"
   - Email: "test@example.com"
   - Phone: "+91 98765 43210" (optional)
   - Message: "I want to test the demo session" (optional)

3. **Submit the form**
   - You should see: "Demo Request Submitted!"
   - Redirects to homepage after 2 seconds

### Step 3: Admin Approves Demo (Admin Flow)

1. **Login as Admin:**
   ```
   http://localhost:8080/admin-dashboard
   ```

2. **Navigate to Demo Sessions:**
   - Click "Demo Sessions" in the sidebar
   - Or go to: `http://localhost:8080/admin/demo-sessions`

3. **View Pending Requests:**
   - Click "Pending" tab
   - You should see your test request

4. **Approve the Request:**
   - Click **"Approve"** button
   - Set a **scheduled date & time** (e.g., today, 2 hours from now)
   - Add admin notes (optional)
   - Click **"Approve & Generate Link"**

5. **Get the Meeting Link:**
   - A unique link is generated: `http://localhost:8080/demo-session/DEMO-XXXXXXXXXXXX`
   - Copy the link using the copy icon
   - Or click "Send Email" to open email client

### Step 4: Join Demo Session (Guest User)

1. **Open the meeting link:**
   - Use the link from Step 3
   - Or open in incognito/private window (to test guest access)

2. **Join Screen:**
   - Enter your name: "Demo Tester"
   - Click **"Join Demo Session"**
   - Should see: "Joined Successfully"

3. **Start the Demo:**
   - Click **"Start Demo"** button
   - Allow camera/microphone permissions when prompted
   - Video should start

### Step 5: Test All Features

#### ✅ Video & Audio
- [ ] Camera is working
- [ ] Microphone is working
- [ ] Mute/Unmute button works
- [ ] Video On/Off button works

#### ✅ Screen Sharing
- [ ] Click screen share button
- [ ] Select screen/window to share
- [ ] Screen share appears in overlay
- [ ] Stop sharing works

#### ✅ Chat
- [ ] Open Chat tab in sidebar
- [ ] Type a message
- [ ] Press Enter or click Send
- [ ] Message appears in chat
- [ ] Messages scroll automatically

#### ✅ File Sharing
- [ ] Open Files tab in sidebar
- [ ] Click "Upload File (Demo)"
- [ ] Select a file
- [ ] File appears in list
- [ ] Shows uploader name

#### ✅ Rate & Multiplier (Settings Tab)
- [ ] Open Settings tab
- [ ] Toggle "Designer View" / "Customer View"
- [ ] **Test Rate Change:**
  - Click edit icon next to "Rate Per Minute"
  - Enter new rate (e.g., 75)
  - In Designer mode: Click "Request" → Should show approval dialog
  - In Customer mode: Click "Update" → Rate changes immediately
- [ ] **Test Multiplier Change:**
  - Click edit icon next to "Format Multiplier"
  - Select file format (e.g., PSD)
  - Enter new multiplier (e.g., 1.5)
  - In Designer mode: Click "Request" → Should show approval dialog
  - In Customer mode: Click "Update" → Multiplier changes immediately
- [ ] **Test Approval Dialogs:**
  - Request change in Designer mode
  - Switch to Customer mode (or open in another tab)
  - Approval dialog should appear
  - Click "Approve" or "Decline"
  - Rate/Multiplier updates accordingly

#### ✅ Timer
- [ ] Timer shows 30:00 at start
- [ ] Timer counts down (30:00 → 29:59 → ...)
- [ ] Warning appears at 60 seconds remaining
- [ ] Session auto-ends at 00:00

#### ✅ Mobile Responsiveness
- [ ] Open on mobile device or resize browser to mobile width
- [ ] Sidebar should slide in from right
- [ ] Click sidebar toggle button
- [ ] Sidebar opens/closes smoothly
- [ ] Video area adjusts to sidebar
- [ ] Controls are touch-friendly
- [ ] Header stacks vertically on small screens
- [ ] All features work on mobile

### Step 6: Test Multi-User (Optional)

1. **Open demo session in two browsers:**
   - Browser 1: Chrome (Designer mode)
   - Browser 2: Firefox/Incognito (Customer mode)

2. **Test Real-time Features:**
   - Send message in Browser 1 → Should appear in Browser 2
   - Change rate in Browser 1 (Designer) → Approval dialog in Browser 2
   - Approve in Browser 2 → Rate updates in Browser 1
   - Upload file in Browser 1 → Should appear in Browser 2

### Step 7: Test Session End

1. **Wait for timer to reach 0** (or manually end)
2. **Click "End Call" button**
3. **Verify:**
   - Session status changes to "completed"
   - Thank you message appears
   - Redirects to homepage after 2 seconds

---

## 🐛 Troubleshooting

### Issue: "Session Not Found"
**Solution:**
- Check the session ID in the URL matches the one in database
- Verify session status is "approved" in admin panel
- Make sure you're using the correct link

### Issue: Camera/Mic Not Working
**Solution:**
- Check browser permissions (Settings → Privacy → Camera/Microphone)
- Try a different browser
- Check if other apps are using camera/mic
- Refresh the page and allow permissions again

### Issue: Sidebar Not Opening on Mobile
**Solution:**
- Check if you're on mobile viewport (< 1024px)
- Click the sidebar toggle button (top right)
- Try refreshing the page

### Issue: Rate/Multiplier Changes Not Syncing
**Solution:**
- Check browser console for errors
- Verify Supabase connection
- Make sure both users are on the same session
- Try refreshing both browsers

### Issue: Timer Not Counting Down
**Solution:**
- Make sure call is active (clicked "Start Demo")
- Check browser console for errors
- Refresh the page (timer resets to 30:00)

---

## 📱 Mobile Testing Checklist

### iPhone (Safari)
- [ ] Sidebar opens/closes smoothly
- [ ] Video works
- [ ] Audio works
- [ ] Chat works
- [ ] File upload works
- [ ] Settings tab works
- [ ] Controls are touch-friendly

### Android (Chrome)
- [ ] Sidebar opens/closes smoothly
- [ ] Video works
- [ ] Audio works
- [ ] Chat works
- [ ] File upload works
- [ ] Settings tab works
- [ ] Controls are touch-friendly

### Tablet (iPad/Android)
- [ ] Layout adapts properly
- [ ] Sidebar works in landscape
- [ ] All features accessible
- [ ] Touch interactions work

---

## 🎯 Quick Test Scenarios

### Scenario 1: Single User Demo
1. Request demo → Admin approves → Join → Test all features
2. **Time:** ~5 minutes
3. **Goal:** Verify all features work for single user

### Scenario 2: Multi-User Demo
1. Open in 2 browsers → Test real-time sync
2. **Time:** ~10 minutes
3. **Goal:** Verify real-time communication works

### Scenario 3: Mobile Demo
1. Open on mobile device → Test all features
2. **Time:** ~5 minutes
3. **Goal:** Verify mobile responsiveness

### Scenario 4: Full Flow Demo
1. Request → Approve → Join → Use all features → End session
2. **Time:** ~15 minutes
3. **Goal:** Complete end-to-end test

---

## ✅ Success Criteria

A successful test should verify:
- ✅ Demo request form works
- ✅ Admin can approve and generate links
- ✅ Guest users can join without login
- ✅ All features work (video, audio, chat, files, settings)
- ✅ Rate and multiplier changes work
- ✅ Approval dialogs appear correctly
- ✅ Timer counts down and auto-ends
- ✅ Mobile view is responsive
- ✅ No billing information is shown
- ✅ Session ends properly

---

## 🚀 Production Testing

Before going live, test:
1. **On real mobile devices** (not just browser dev tools)
2. **With different browsers** (Chrome, Safari, Firefox)
3. **With slow internet** (throttle network in dev tools)
4. **With multiple users** simultaneously
5. **Session expiry** (wait 30 minutes or manually expire)

---

## 📝 Notes

- Demo sessions are **completely free** - no billing occurs
- Timer is **fixed at 30 minutes**
- All features work **exactly like live sessions**
- Mobile sidebar **overlays** on small screens
- Desktop sidebar is **fixed** on right side
- Rate/multiplier changes are **for demo only**

---

**Happy Testing! 🎉**

