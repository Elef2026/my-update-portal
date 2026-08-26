const CHAPA_API_URL = "https://api.chapa.co/v1";
const chapaKey = process.env.CHAPA_SECRET_KEY || "CHASECK_TEST-placeholder";

export interface InitiatePaymentParams {
  orderId: string;
  amount: number | string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
}

export async function initiatePayment({
  orderId,
  amount,
  customerName,
  customerPhone,
  customerEmail,
}: InitiatePaymentParams) {
  const txRef = `TX-${orderId.substring(0, 8)}-${Date.now()}`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Split name into first and last
  const nameParts = (customerName || "Customer").trim().split(" ");
  const firstName = nameParts[0] || "Customer";
  const lastName = nameParts.slice(1).join(" ") || "Client";

  // Ensure valid email format for Chapa
  const email = customerEmail && customerEmail.includes("@") 
    ? customerEmail 
    : `customer.${orderId.substring(0, 6)}@updateportal.et`;

  // Format amount as string with 2 decimal places
  const formattedAmount = Number(amount).toFixed(2);

  const payload = {
    amount: formattedAmount,
    currency: "ETB",
    email,
    first_name: firstName,
    last_name: lastName,
    phone_number: customerPhone || "0911000000",
    tx_ref: txRef,
    callback_url: `${appUrl}/api/chapa/verify?tx_ref=${txRef}`,
    return_url: `${appUrl}/am/shop/in-progress?payment=success&orderId=${orderId}`,
    customization: {
      title: "የፋይዳ ሰነድ ማደስ (Update Portal)",
      description: `Payment for Order #${orderId.substring(0, 8)} (${formattedAmount} ETB)`,
    },
  };

  try {
    const res = await fetch(`${CHAPA_API_URL}/transaction/initialize`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${chapaKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (res.ok && data.status === "success" && data.data?.checkout_url) {
      return {
        success: true,
        checkoutUrl: data.data.checkout_url,
        txRef,
        raw: data,
      };
    } else {
      console.warn("Chapa API returned non-success response:", data);
      return {
        success: false,
        error: data.message || "Failed to initialize Chapa payment",
        txRef,
        raw: data,
      };
    }
  } catch (error: any) {
    console.error("Chapa Initialization Network Error:", error);
    return {
      success: false,
      error: error.message || "Network error connecting to Chapa",
      txRef,
    };
  }
}

export async function verifyPayment(txRef: string) {
  try {
    const res = await fetch(`${CHAPA_API_URL}/transaction/verify/${txRef}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${chapaKey}`,
      },
    });

    const data = await res.json();

    if (res.ok && (data.status === "success" || data.data?.status === "success")) {
      return {
        success: true,
        data: data.data,
      };
    }

    return {
      success: false,
      error: data.message || "Payment verification failed",
    };
  } catch (error: any) {
    console.error("Chapa Verify Network Error:", error);
    return {
      success: false,
      error: error.message || "Network error verifying payment",
    };
  }
}

