import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side proxy for Nominatim (OpenStreetMap geocoding).
 * The browser cannot call Nominatim directly due to CORS restrictions,
 * so all requests are forwarded through this Next.js API route.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q');

  if (!query || query.trim().length < 3) {
    return NextResponse.json([], { status: 200 });
  }

  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`;

    const res = await fetch(nominatimUrl, {
      headers: {
        // Nominatim requires a descriptive User-Agent
        'User-Agent': 'WorkforceOS/1.0 (internal demo app)',
        'Accept-Language': 'en',
      },
    });

    if (!res.ok) {
      return NextResponse.json([], { status: 200 });
    }

    const data = await res.json();
    return NextResponse.json(data || []);
  } catch (err) {
    console.error('[geocode proxy] Failed to fetch from Nominatim:', err);
    return NextResponse.json([], { status: 200 });
  }
}
