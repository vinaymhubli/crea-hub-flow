import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key for admin access
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get today's date in IST (Asia/Kolkata timezone)
    // IST is UTC+5:30, so 6 AM IST = 12:30 AM UTC
    const now = new Date()
    
    // Get current date in IST
    const istDateString = now.toLocaleString("en-US", { 
      timeZone: "Asia/Kolkata",
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
    
    // Parse IST date (format: MM/DD/YYYY)
    const [month, day, year] = istDateString.split('/')
    
    // Create today's date at 00:00:00 IST
    // This represents the start of today in IST
    const todayIST = new Date(`${year}-${month}-${day}T00:00:00`)
    // Convert IST to UTC: IST is UTC+5:30, so subtract 5.5 hours
    const todayStartUTC = new Date(todayIST.getTime() - (5.5 * 60 * 60 * 1000))
    
    console.log(`🕐 Running auto-expire at ${now.toISOString()}`)
    console.log(`📅 Today's date (IST): ${year}-${month}-${day}`)
    console.log(`📅 Today start (UTC): ${todayStartUTC.toISOString()}`)

    // Find all bookings with scheduled_date before today (date only, not time)
    // scheduled_date should be less than today's start (00:00:00 IST)
    const { data: expiredBookings, error: fetchError } = await supabase
      .from('bookings')
      .select('id, customer_id, designer_id, scheduled_date, service')
      .in('status', ['pending', 'confirmed'])
      // Compare: scheduled_date < today's start (00:00:00 IST in UTC)
      .lt('scheduled_date', todayStartUTC.toISOString())

    if (fetchError) {
      console.error('❌ Error fetching expired bookings:', fetchError)
      throw fetchError
    }

    if (!expiredBookings || expiredBookings.length === 0) {
      console.log('✅ No expired bookings to cancel')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No expired bookings found',
          expiredCount: 0 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    console.log(`📋 Found ${expiredBookings.length} expired bookings to cancel`)

    // Get unique IDs
    const expiredIds = expiredBookings.map(b => b.id)

    // Update all expired bookings to cancelled
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .in('id', expiredIds)

    if (updateError) {
      console.error('❌ Error cancelling expired bookings:', updateError)
      throw updateError
    }

    console.log(`✅ Successfully cancelled ${expiredIds.length} expired bookings`)

    // Create notifications for all affected users
    const notifications = []
    const userBookingMap = new Map<string, number>() // userId -> count of expired bookings

    // Get all designer user_ids in one query
    const designerIds = [...new Set(expiredBookings.map(b => b.designer_id).filter(Boolean))]
    const designerUserMap = new Map<string, string>() // designer_id -> user_id
    
    if (designerIds.length > 0) {
      const { data: designers } = await supabase
        .from('designers')
        .select('id, user_id')
        .in('id', designerIds)
      
      designers?.forEach(d => {
        if (d.user_id) {
          designerUserMap.set(d.id, d.user_id)
        }
      })
    }

    // Count expired bookings per user
    for (const booking of expiredBookings) {
      // Add customer
      if (booking.customer_id) {
        const count = userBookingMap.get(booking.customer_id) || 0
        userBookingMap.set(booking.customer_id, count + 1)
      }
      
      // Add designer
      const designerUserId = booking.designer_id ? designerUserMap.get(booking.designer_id) : null
      if (designerUserId) {
        const count = userBookingMap.get(designerUserId) || 0
        userBookingMap.set(designerUserId, count + 1)
      }
    }

    // Create notifications for each user
    for (const [userId, count] of userBookingMap.entries()) {
      const userBookings = expiredBookings.filter(b => 
        b.customer_id === userId || 
        (b.designer_id && designerUserMap.get(b.designer_id) === userId)
      )

      if (userBookings.length > 0) {
        notifications.push({
          user_id: userId,
          title: 'Sessions Expired',
          message: `${count} scheduled session(s) have been automatically cancelled as the date has passed.`,
          type: 'booking_cancelled',
          related_id: userBookings[0].id
        })
      }
    }

    // Insert notifications in batch
    if (notifications.length > 0) {
      const { error: notifError } = await supabase
        .from('notifications')
        .insert(notifications)

      if (notifError) {
        console.warn('⚠️ Error creating notifications:', notifError)
        // Don't throw - notifications are not critical
      } else {
        console.log(`📬 Created ${notifications.length} notifications`)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully cancelled ${expiredIds.length} expired bookings`,
        expiredCount: expiredIds.length,
        notificationsSent: notifications.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('❌ Error in auto-expire-sessions:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

