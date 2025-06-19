
'use server';

import type { IdentifyPokemonCardInput, IdentifyPokemonCardOutput } from '@/ai/flows/identify-pokemon-card';
import { identifyPokemonCard } from '@/ai/flows/identify-pokemon-card';
import type { EstimateCardValueInput, EstimateCardValueOutput } from '@/ai/flows/estimate-card-value';
import { estimateCardValue } from '@/ai/flows/estimate-card-value';
import { getSubmission } from '@/lib/temp-store';

export async function getSubmittedImageDataAction(
  submissionId: string
): Promise<{ imageDataUri: string | null; error?: string }> {
  try {
    if (!submissionId || typeof submissionId !== 'string') {
      console.error('Invalid submissionId provided to getSubmittedImageDataAction:', submissionId);
      return { imageDataUri: null, error: 'Invalid submission ID format. Please try uploading again.' };
    }
    const imageDataUri = getSubmission(submissionId);
    if (!imageDataUri) {
      console.warn(`No image data found for submissionId: ${submissionId}`);
      return { imageDataUri: null, error: 'Your card image session may have expired or the link is invalid. Please try uploading your card again.' };
    }
    return { imageDataUri };
  } catch (error) {
    console.error('Error in getSubmittedImageDataAction:', error);
    return { 
      imageDataUri: null, 
      error: `Failed to retrieve image data: ${error instanceof Error ? error.message : String(error)}. Please try uploading again.` 
    };
  }
}


export async function identifyPokemonCardAction(
  input: IdentifyPokemonCardInput
): Promise<IdentifyPokemonCardOutput> {
  try {
    const result = await identifyPokemonCard(input);
    if (!result || !result.cardName || !result.cardNumber) { // Ensure essential fields are present
        throw new Error('AI failed to identify the card name or number.');
    }
    return result;
  } catch (error) {
    console.error('Error in identifyPokemonCardAction:', error);
    throw new Error(`Failed to identify Pokemon card: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function estimateCardValueAction(
  input: EstimateCardValueInput
): Promise<EstimateCardValueOutput> {
  try {
    const result = await estimateCardValue(input);
     if (!result || result.length === 0) {
        throw new Error('AI failed to return any card value estimations.');
    }
    const hasAnyValue = result.some(est => est.estimatedValue && est.estimatedValue.toLowerCase() !== "not found" && est.estimatedValue.toLowerCase() !== "n/a");
    if (!hasAnyValue) {
      console.warn('AI returned estimations, but no concrete values were found for any marketplace.');
    }
    return result;
  } catch (error) {
    console.error('Error in estimateCardValueAction:', error);
    throw new Error(`Failed to estimate card value: ${error instanceof Error ? error.message : String(error)}`);
  }
}
