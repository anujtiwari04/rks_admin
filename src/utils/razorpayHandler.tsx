import axios from "axios";

// 1. Update function signature to accept paymentDetails and token
export const handleRazorpayPayment = async (
  paymentDetails: {
    amount: number; // Total amount in Rs (e.g., 5900)
    amountPaid: number; // Total amount in paise (e.g., 590000)
    planName?: string; // Optional - only for Memberships
    duration?: string; // Optional - only for Memberships
    callId?: string;   // Optional - only for Daily Calls
  },
  userData: any, // Contains isBusiness, companyName, gstNumber, address, etc.
  token: string | null,
  // Made optional because Daily Call unlocks might not need to refetch membership status
  refetchUserMemberships: (() => Promise<void>) | undefined,
  onSuccess: () => void,
  onClose: () => void
) => {
  // 2. Add token validation
  if (!token) {
    alert("Authentication error. Please log in again.");
    onClose();
    return;
  }

  if (!paymentDetails.amount || paymentDetails.amount <= 0) {
    alert("Invalid payment amount.");
    onClose();
    return;
  }

  const REACT_APP_RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  // 3. Create reusable axios config with Authorization header
  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  try {
    // 4. Create Order
    const { data: order } = await axios.post(
      `${BACKEND_URL}/payment/create-order`,
      {
        amount: paymentDetails.amount, // Send amount in Rs, backend converts to paise
        currency: "INR",
      },
      axiosConfig
    );

    if (!order?.id) throw new Error("Order creation failed");

    // Helper to determine the display name for Razorpay Popup
    const prefillName = userData.isBusiness 
      ? userData.companyName 
      : `${userData.firstName || ''} ${userData.lastName || ''}`.trim();

    // Determine description based on payment type
    let description = "Payment to RKS Advisory";
    if (paymentDetails.planName) {
      description = `Membership: ${paymentDetails.planName}`;
    } else if (paymentDetails.callId) {
      description = "Daily Call Unlock";
    }

    const options = {
      key: REACT_APP_RAZORPAY_KEY_ID,
      amount: order.amount, // This is amount in paise, from backend
      currency: order.currency,
      name: "RKS Advisory",
      description: description,
      order_id: order.id,
      handler: async (response: any) => {
        try {
          // 5. Send ALL data to /verify-payment
          // We pass whatever context we have (planName OR callId)
          const verification = await axios.post(
            `${BACKEND_URL}/payment/verify-payment`,
            {
              ...response, // razorpay_order_id, razorpay_payment_id, razorpay_signature
              
              // Payment Context (Send whatever is present)
              planName: paymentDetails.planName,
              duration: paymentDetails.duration,
              callId: paymentDetails.callId, // New field for single calls
              amountPaid: paymentDetails.amountPaid, // Send amount in paise
              
              // --- Pass User/Company Details for Invoice ---
              isBusiness: userData.isBusiness,
              companyName: userData.companyName,
              gstNumber: userData.gstNumber,
              
              // Common Contact Info (Used for Emailing the Invoice)
              email: userData.email,
              mobile: userData.mobile,
              
              // Address Info (Used inside the PDF)
              address: userData.address,
              state: userData.state,
              pinCode: userData.pinCode,
              
              // Personal Name (only needed if not business)
              firstName: userData.firstName,
              lastName: userData.lastName
            },
            axiosConfig
          );

          alert(`Payment successful. ${verification.data.message}. Your Invoice has been sent to your email.`);
          console.log("Payment verified:", verification.data);
          
          // Only call refetch if it was provided (i.e. for memberships)
          if (refetchUserMemberships) {
            await refetchUserMemberships();
          }
          
          onSuccess();
        } catch (verifyError: any) {
          console.error("Verification failed:", verifyError);
          const message = verifyError.response?.data?.message || "Payment verification failed.";
          alert(message);
        } finally {
          onClose();
        }
      },
      prefill: {
        name: prefillName,
        email: userData.email,
        contact: userData.mobile,
      },
      theme: { color: "#16a34a" },
      modal: {
        ondismiss: () => {
          console.log("Razorpay modal dismissed by user");
          onClose();
        },
      },
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
    rzp.on("payment.failed", (response: any) => {
      alert("Payment failed: " + response.error.description);
      onClose();
    });
  } catch (err: any) {
    console.error("Payment error:", err);
    const message = err.response?.data?.message || "Unable to process payment. Please try again later.";
    alert(message);
    onClose();
  }
};