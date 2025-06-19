import { NextResponse, type NextRequest } from 'next/server';
import { identifyPokemonCard, type IdentifyPokemonCardOutput } from '@/ai/flows/identify-pokemon-card';
import { estimateCardValue, type EstimateCardValueOutput } from '@/ai/flows/estimate-card-value';

export async function POST(request: NextRequest) {
  try {
    let imageDataUri: string;
    let result: IdentifyPokemonCardOutput & {
      valuationResult: EstimateCardValueOutput;
    } | null = null;

    const body = await request.json();
    imageDataUri = body.imageDataUri as string;

    if (!imageDataUri || typeof imageDataUri !== 'string' || !imageDataUri.startsWith('data:image')) {
      return NextResponse.json({ error: 'Invalid imageDataUri format' }, { status: 400 });
    }
    if (imageDataUri.length > 10 * 1024 * 1024) { // 10MB limit
      return NextResponse.json({ error: 'Image data is too large (max 10MB)' }, { status: 413 });
    }

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

    result = {
      ...identificationResult,
      valuationResult,
    };

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to process the request: ${message}` }, { status: 500 });
  }
}
