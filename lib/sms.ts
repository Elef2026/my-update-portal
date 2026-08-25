/**
 * Utility for sending SMS notifications in Ethiopia.
 * In production, this would connect to a local SMS Gateway like AfricasTalking or a local telecom API.
 */

export async function sendSmsNotification(phone: string, message: string) {
  try {
    // Simulated SMS gateway call
    console.log(`[SMS Gateway] Sending to ${phone}: ${message}`);
    
    // Example format for an actual API call (e.g., using fetch)
    /*
    const response = await fetch("https://api.sms-gateway.com/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.SMS_API_KEY}`
      },
      body: JSON.stringify({
        to: phone,
        text: message
      })
    });
    return response.ok;
    */

    return { success: true, message: "SMS sent successfully (Mocked)" };
  } catch (error) {
    console.error("SMS Sending Error:", error);
    return { success: false, error };
  }
}

// Pre-defined SMS Templates for the 4 stages
export const SmsTemplates = {
  paymentReceived: (name: string) => `ጤና ይስጥልኝ ${name}፣ ክፍያዎ ደርሶናል፤ የሰነድ ማደስ ስራው ተጀምሯል። (Payment received, processing started)`,
  inProgress: () => `ውድ ደንበኛ፣ የሰነድ ማደስ ስራው በመካሄድ ላይ ነው። (Your document update is in progress)`,
  completed: () => `ውድ ደንበኛ፣ ሰነድዎ ታድሶ አልቋል። ማተሚያ ቤትዎ ሄደው መውሰድ ይችላሉ። (Your document is ready)`,
  delivered: () => `እናመሰግናለን! ሰነድዎን እንደወሰዱ አረጋግጠናል፤ መልካም ቀን። (Document delivered. Thank you!)`
};
