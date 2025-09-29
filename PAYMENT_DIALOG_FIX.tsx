// FIXED PAYMENT SECTION FOR SessionPaymentDialog.tsx
// Replace the handlePayment function wallet section with this:

      if (paymentMethod === 'wallet') {
        console.log('🔄 Processing wallet payment with proper commission and TDS...');
        
        // Calculate base amount (remove GST to get original amount)
        const gstRate = 0.18;
        const baseAmount = totalAmount / (1 + gstRate);
        
        console.log(`💰 Processing session payment: Total ₹${totalAmount}, Base ₹${baseAmount.toFixed(2)}`);
        
        // Call our fixed payment processing function
        try {
          const { data: paymentResult, error: paymentError } = await supabase.functions.invoke('process-session-payment', {
            body: {
              sessionId: sessionIdWithPrefix,
              customerId: user?.id,
              designerId: designerUserId,
              amount: baseAmount,
              bookingId: null
            }
          });

          if (paymentError) {
            console.error('❌ Payment processing error:', paymentError);
            throw new Error('Payment processing failed: ' + paymentError.message);
          } else {
            console.log('✅ Payment processed successfully with proper deductions:', paymentResult);
          }
        } catch (paymentErr) {
          console.error('❌ Error calling payment function:', paymentErr);
          throw new Error('Payment function call failed: ' + paymentErr.message);
        }

        toast({
          title: "Payment Successful",
          description: `₹${totalAmount.toFixed(2)} processed with proper commission and TDS deductions.`,
        });
        
      } else {
        // Handle other payment methods normally
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        toast({
          title: "Payment Successful", 
          description: `Payment of ₹${totalAmount.toFixed(2)} completed via ${paymentMethod}.`,
        });
      }


