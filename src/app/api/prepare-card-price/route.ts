import { NextResponse, type NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { addSubmission } from '@/lib/temp-store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const imageDataUri = body.imageDataUri as string;

    if (!imageDataUri) {
      return NextResponse.json({ error: 'imageDataUri is required' }, { status: 400 });
    }

    if (typeof imageDataUri !== 'string' || !imageDataUri.startsWith('data:image')) {
      return NextResponse.json({ error: 'Invalid imageDataUri format' }, { status: 400 });
    }
    
    // Basic check for excessively large data URI to prevent abuse, e.g. > 10MB
    if (imageDataUri.length > 10 * 1024 * 1024) {
        return NextResponse.json({ error: 'Image data is too large (max 10MB)' }, { status: 413 });
    }

    const submissionId = uuidv4();
    addSubmission(submissionId, imageDataUri);

    return NextResponse.json({ submissionId });
  } catch (error) {
    console.error('Error in /api/prepare-card-price:', error);
    let message = 'Internal Server Error';
    if (error instanceof SyntaxError) { // JSON parsing error
        message = 'Invalid request body: Expected JSON.';
    } else if (error instanceof Error) {
        message = error.message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
