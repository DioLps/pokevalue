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
    await insertNewSubmission(submissionId, imageDataUri);
  } catch (dbError) {
    console.error('Error inserting initial submission into DB:', dbError);
    return NextResponse.json({ error: 'Failed to initialize card scan process. Please try again.' }, { status: 500 });
  }
  
  // Perform AI Identification
  try {
    const identificationResult = await identifyPokemonCard({ photoDataUri: imageDataUri });
    if (!identificationResult || !identificationResult.cardName || !identificationResult.cardNumber) {
      throw new Error('AI failed to identify the card name or number.');
    }
    await updateSubmissionWithIdentification(submissionId, identificationResult, 'PROCESSING_VALUATION');

    // Perform AI Valuation
    try {
      const valuationResult = await estimateCardValue({
        cardName: identificationResult.cardName,
        cardNumber: identificationResult.cardNumber,
        deckIdLetter: identificationResult.deckIdLetter,
        illustratorName: identificationResult.illustratorName,
      });
      if (!valuationResult || valuationResult.length === 0) {
        // This might not be a critical error if the AI returns empty but doesn't crash.
        // We'll still mark as completed but the UI will show no estimations.
        console.warn(`Valuation for ${submissionId} returned no estimations.`);
      }
      await updateSubmissionWithValuation(submissionId, valuationResult, 'COMPLETED');
    } catch (valuationError) {
      const message = valuationError instanceof Error ? valuationError.message : 'Unknown valuation error';
      console.error(`Valuation error for submission ${submissionId}:`, valuationError);
      await updateSubmissionWithError(submissionId, 'ERROR_VALUATION', `Failed to estimate card value: ${message}`);
      // Return submissionId even if valuation fails, so client can fetch partial data/error
      return NextResponse.json({ submissionId });
    }

  } catch (identificationError) {
    const message = identificationError instanceof Error ? identificationError.message : 'Unknown identification error';
    console.error(`Identification error for submission ${submissionId}:`, identificationError);
    await updateSubmissionWithError(submissionId, 'ERROR_IDENTIFICATION', `Failed to identify Pokemon card: ${message}`);
     // Return submissionId even if identification fails, so client can fetch the error
    return NextResponse.json({ submissionId });
  }

  return NextResponse.json({ submissionId });
}
