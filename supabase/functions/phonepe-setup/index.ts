import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // PhonePe Setup Instructions
    const setupInstructions = {
      message: "PhonePe API Setup Required",
      steps: [
        {
          step: 1,
          title: "Create PhonePe Merchant Account",
          description: "Go to https://mercury.phonepe.com/ and create a merchant account",
          action: "Register for PhonePe for Business"
        },
        {
          step: 2,
          title: "Get API Credentials",
          description: "After account approval, get your API credentials from the PhonePe dashboard",
          action: "Navigate to API Settings in your PhonePe dashboard"
        },
        {
          step: 3,
          title: "Configure Environment Variables",
          description: "Set the following environment variables in Supabase Edge Functions",
          variables: [
            "PHONEPE_MERCHANT_ID=your_merchant_id",
            "PHONEPE_SALT_KEY=your_salt_key", 
            "PHONEPE_CLIENT_ID=your_client_id",
            "PHONEPE_CLIENT_SECRET=your_client_secret"
          ]
        },
        {
          step: 4,
          title: "Test Integration",
          description: "Use the phonepe-verify function to test your configuration",
          action: "Call the phonepe-verify function with your credentials"
        }
      ],
      currentIssue: {
        error: "KEY_NOT_CONFIGURED",
        reason: "The provided test credentials are not valid or the merchant account is not properly set up",
        solution: "You need to create a real PhonePe merchant account and get valid API credentials"
      },
      alternativeSolution: {
        title: "Use Razorpay Instead",
        description: "Razorpay has easier setup and better documentation for testing",
        benefits: [
          "Faster setup process",
          "Better test credentials",
          "More comprehensive documentation",
          "Easier integration"
        ]
      }
    };

    return new Response(
      JSON.stringify(setupInstructions),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Setup Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to get setup instructions',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});


