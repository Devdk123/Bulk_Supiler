type SendWhatsAppTextArgs = {
  to: string;
  body: string;
};

export function isWhatsAppCloudConfigured() {
  return Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

export async function sendWhatsAppText({ to, body }: SendWhatsAppTextArgs) {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const graphVersion = process.env.META_GRAPH_API_VERSION || "v25.0";

  if (!accessToken || !phoneNumberId) {
    return {
      ok: false,
      skipped: true,
      error: "WhatsApp Cloud API is not configured."
    };
  }

  const normalizedTo = to.replace(/\D/g, "");
  const response = await fetch(`https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: normalizedTo,
      type: "text",
      text: {
        preview_url: false,
        body
      }
    })
  });

  const data = await response.json();

  if (!response.ok) {
    return {
      ok: false,
      skipped: false,
      error: data?.error?.message || "WhatsApp Cloud API message failed.",
      details: data
    };
  }

  return {
    ok: true,
    skipped: false,
    data
  };
}
