
import { NextResponse, type NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { identifyPokemonCard, type IdentifyPokemonCardOutput } from '@/ai/flows/identify-pokemon-card';
import { estimateCardValue, type EstimateCardValueOutput } from '@/ai/flows/estimate-card-value';
import { 
  insertNewSubmission, 
  updateSubmissionWithIdentification, 
  updateSubmissionWithValuation,
  updateSubmissionWithError,
  getSubmissionById // For checking if submission was created before error update
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

  // Step 1: Insert initial submission record
  try {
    await insertNewSubmission(submissionId, imageDataUri); 
    // Default status is 'PROCESSING_IDENTIFICATION' in insertNewSubmission
  } catch (dbError) {
    console.error(`Critical error: Failed to insert initial submission ${submissionId}:`, dbError);
    const message = dbError instanceof Error ? dbError.message : 'Database error during initial submission.';
    return NextResponse.json({ error: `Server error: ${message}` }, { status: 500 });
  }

  // Step 2: AI Processing and subsequent updates
  try {
    // Perform AI Identification
    const identificationResult = await identifyPokemonCard({ photoDataUri: imageDataUri });
    if (!identificationResult || !identificationResult.cardName || !identificationResult.cardNumber) {
      await updateSubmissionWithError(submissionId, 'ERROR_IDENTIFICATION', 'AI failed to identify key card details (name or number).');
      return NextResponse.json({ submissionId }); // Return ID, client will see error status
    }
    await updateSubmissionWithIdentification(submissionId, identificationResult, 'PROCESSING_VALUATION');

    // Perform AI Valuation
    const valuationResult = await estimateCardValue({
      cardName: identificationResult.cardName,
      cardNumber: identificationResult.cardNumber,
      deckIdLetter: identificationResult.deckIdLetter,
      illustratorName: identificationResult.illustratorName,
    });

    // Check if valuationResult itself is null or undefined, indicating a failure in the flow execution
    if (!valuationResult) {
        await updateSubmissionWithError(submissionId, 'ERROR_VALUATION', 'AI valuation process failed to return data.');
        return NextResponse.json({ submissionId });
    }
    
    // If valuationResult is an empty array, it means no specific prices were found, which is not necessarily an error.
    // The database schema handles estimationsJson as TEXT, so an empty array JSON string is fine.
    if (valuationResult.length === 0) {
      console.warn(`Valuation for ${submissionId} (Card: ${identificationResult.cardName} #${identificationResult.cardNumber}) returned no specific estimations, but AI call was successful.`);
    }
    await updateSubmissionWithValuation(submissionId, valuationResult, 'COMPLETED');

  } catch (aiProcessingError) { // Catch errors specifically from AI flows or subsequent DB updates
    const message = aiProcessingError instanceof Error ? aiProcessingError.message : 'Unknown AI processing error';
    console.error(`Error during AI processing or DB update for submission ${submissionId}:`, aiProcessingError);
    
    // Determine if error was during identification or valuation phase based on current record status if possible,
    // or default to a general processing error. For simplicity, let's use ERROR_IDENTIFICATION if it's early,
    // or ERROR_VALUATION if identification seemed to pass.
    // A more robust way would be to check the submission's current status if needed.
    // For now, we'll assume if it got here, identification might have been attempted.
    // Let's try to be a bit more specific: check if cardName exists on the record
    const currentSubmission = await getSubmissionById(submissionId);
    const errorStatus = currentSubmission?.cardName ? 'ERROR_VALUATION' : 'ERROR_IDENTIFICATION';

    await updateSubmissionWithError(submissionId, errorStatus, `Failed during AI processing: ${message}`);
    return NextResponse.json({ submissionId }); // Return ID so client can fetch and see the error state
  }

  // If all goes well, the record is now 'COMPLETED'.
  return NextResponse.json({ submissionId });
}

    