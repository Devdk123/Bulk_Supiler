import { NextResponse } from "next/server";

export async function GET() {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const graphVersion = process.env.META_GRAPH_API_VERSION || "v25.0";

  if (!accessToken) {
    return NextResponse.json(
      {
        error: "Missing WHATSAPP_ACCESS_TOKEN in .env.local."
      },
      { status: 500 }
    );
  }

  const response = await fetch(`https://graph.facebook.com/${graphVersion}/me?fields=id,name`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  const data = await response.json();

  if (!response.ok) {
    return NextResponse.json(
      {
        error: data?.error?.message || "Meta Graph API request failed.",
        details: data
      },
      { status: response.status }
    );
  }

  return NextResponse.json(data);
}
