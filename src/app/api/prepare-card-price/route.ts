
import { NextResponse, type NextRequest } from 'next/server';

// This route is deprecated and no longer used.
// The functionality has been moved to /api/scan-card
// This file can be safely deleted.

export async function POST(request: NextRequest) {
  return NextResponse.json({ error: 'This endpoint is deprecated and no longer in use. Please use /api/scan-card.' }, { status: 410 }); // 410 Gone
}

// Adding a GET handler as well to make it fully a stub
export async function GET(request: NextRequest) {
    return NextResponse.json({ error: 'This endpoint is deprecated and no longer in use. Please use /api/scan-card.' }, { status: 410 }); // 410 Gone
}
