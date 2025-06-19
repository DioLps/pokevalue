import { NextResponse, type NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { identifyPokemonCard } from '@/ai/flows/identify-pokemon-card';
import { estimateCardValue } from '@/ai/flows/estimate-card-value';
import { 
  insertNewSubmission, 
  updateSubmissionWithIdentification, 
  updateSubmissionWithValuation,
  updateSubmissionWithError
} from '@/lib/db';

export async function POST(request: NextRequest) {
  const submissionId = uuidv4();
  let imageDataUri: string;

  try {
    const body = await request.json();
    imageDataUri = body.imageDataUri as string;

    if (!imageDataUri || typeof imageDataUri !== 'string' || !imageDataUri.startsWith('data:image')) {
      return NextResponse.json({ error: 'Invalid imageDataUri format' }, { status: 400 });
    }
    if (imageDataUri.length > 10 * 1024 * 1024) { // 10MB limit
        return NextResponse.json({ error: 'Image data is too large (max 10MB)' }, { status: 413 });
    }
  } catch (error) {
    console.error('Error parsing request body in /api/scan-card:', error);
    return NextResponse.json({ error: 'Invalid request body. Expected JSON with imageDataUri.' }, { status: 400 });
  }

  try {
    // Perform AI Identification
    const identificationResult = await identifyPokemonCard({ photoDataUri: imageDataUri });
    if (!identificationResult || !identificationResult.cardName || !identificationResult.cardNumber) {
      throw new Error('AI failed to identify the card name or number.');
    }

    // Perform AI Valuation
    const valuationResult = await estimateCardValue({
      cardName: identificationResult.cardName,
      cardNumber: identificationResult.cardNumber,
      deckIdLetter: identificationResult.deckIdLetter,
      illustratorName: identificationResult.illustratorName,
    });

    if (!valuationResult || valuationResult.length === 0) {
      console.warn(`Valuation for ${submissionId} returned no estimations.`);
    }

    await insertNewSubmission(submissionId, imageDataUri);
    await updateSubmissionWithIdentification(submissionId, identificationResult, 'PROCESSING_VALUATION');
    await updateSubmissionWithValuation(submissionId, valuationResult, 'COMPLETED');

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error for submission ${submissionId}:`, error);
    await updateSubmissionWithError(submissionId, 'ERROR_IDENTIFICATION', `Failed to process submission: ${message}`);
    return NextResponse.json({ submissionId });
  }

  return NextResponse.json({ submissionId });
}
