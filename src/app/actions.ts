
'use server';

import type { IdentifyPokemonCardInput, IdentifyPokemonCardOutput } from '@/ai/flows/identify-pokemon-card';
import { identifyPokemonCard } from '@/ai/flows/identify-pokemon-card';
import type { EstimateCardValueInput, EstimateCardValueOutput } from '@/ai/flows/estimate-card-value';
import { estimateCardValue } from '@/ai/flows/estimate-card-value';

export async function identifyPokemonCardAction(
  input: IdentifyPokemonCardInput
): Promise<IdentifyPokemonCardOutput> {
  try {
    const result = await identifyPokemonCard(input);
    if (!result || !result.cardName) {
        throw new Error('AI failed to identify the card name.');
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
     if (!result || result.length === 0) { // Check if result is empty or undefined
        throw new Error('AI failed to return any card value estimations.');
    }
    // Optionally, check if at least one estimation has a value
    const hasAnyValue = result.some(est => est.estimatedValue && est.estimatedValue.toLowerCase() !== "not found" && est.estimatedValue.toLowerCase() !== "n/a");
    if (!hasAnyValue) {
      // This case might be okay depending on requirements, but we can log it
      console.warn('AI returned estimations, but no concrete values were found for any marketplace.');
    }
    return result;
  } catch (error) {
    console.error('Error in estimateCardValueAction:', error);
    throw new Error(`Failed to estimate card value: ${error instanceof Error ? error.message : String(error)}`);
  }
}

