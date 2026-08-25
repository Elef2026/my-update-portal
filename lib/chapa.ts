import { Chapa } from "chapa-nodejs";

const chapaKey = process.env.CHAPA_SECRET_KEY || "CHASECK_TEST-missing-key";

export const chapa = new Chapa({
  secretKey: chapaKey,
});

export async function initiatePayment(orderId: string, amount: string, customerEmail: string) {
  const txRef = `TX-${orderId}-${Date.now()}`;
  
  try {
    const response = await chapa.initialize({
      first_name: "Customer",
      last_name: "Client",
      email: customerEmail,
      amount: amount,
      currency: "ETB",
      tx_ref: txRef,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/chapa/verify?tx_ref=${txRef}`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/am/shop/history`, // Redirect after payment
      customization: {
        title: "የሰነድ ማደስ ክፍያ (Document Update)",
        description: "Payment for document update/printing service",
      }
    });

    return { success: true, data: response.data, txRef };
  } catch (error) {
    console.error("Chapa Initialization Error:", error);
    return { success: false, error };
  }
}
