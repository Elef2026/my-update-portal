const CHAPA_API_URL = "https://api.chapa.co/v1";
const chapaKey = process.env.CHAPA_SECRET_KEY || "CHASECK-kTlnbfayvgQlud4HhJ2VoY4CykN2GgdL";

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
  
  // Detect live domain automatically
  let appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl || appUrl.includes("localhost")) {
    if (process.env.VERCEL_URL) {
      appUrl = `https://${process.env.VERCEL_URL}`;
    } else {
      appUrl = "https://my-update-portal.vercel.app";
    }
  }

  // Split name into first and last, and sanitize to alphanumeric
  const nameParts = (customerName || "Customer").trim().split(/\s+/);
  const rawFirst = nameParts[0] || "Customer";
  const rawLast = nameParts.slice(1).join(" ") || "Client";

  // Sanitize first & last name to letters/numbers for Chapa validation
  let firstName = rawFirst.replace(/[^a-zA-Z0-9]/g, "");
  let lastName = rawLast.replace(/[^a-zA-Z0-9]/g, "");
  if (!firstName) firstName = "Customer";
  if (!lastName) lastName = "Client";

  // Normalize phone to Ethiopian 10-digit format: 09xxxxxxxx or 07xxxxxxxx
  let cleanPhone = (customerPhone || "").replace(/[^0-9]/g, "");
  if (cleanPhone.startsWith("251") && cleanPhone.length === 12) {
    cleanPhone = "0" + cleanPhone.substring(3);
  }
  if ((cleanPhone.startsWith("9") || cleanPhone.startsWith("7")) && cleanPhone.length === 9) {
    cleanPhone = "0" + cleanPhone;
  }
  if (!cleanPhone || cleanPhone.length !== 10) {
    cleanPhone = "0911000000";
  }

  // Ensure valid email format for Chapa
  const email = (customerEmail && customerEmail.includes("@") && customerEmail.includes(".")) 
    ? customerEmail 
    : `customer.${cleanPhone}@gmail.com`;

  // Format amount as string with 2 decimal places
  const formattedAmount = Number(amount).toFixed(2);

  const payload = {
    amount: formattedAmount,
    currency: "ETB",
    email,
    first_name: firstName,
    last_name: lastName,
    phone_number: cleanPhone,
    tx_ref: txRef,
    callback_url: `${appUrl}/api/chapa/verify?tx_ref=${txRef}`,
    return_url: `${appUrl}/am/shop/new-order?payment=success&orderId=${orderId}`,
    customization: {
      title: "Update Portal",
      description: `Order ${orderId.substring(0, 8)}`,
    },
    meta: {
      hide_receipt: "true",
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

