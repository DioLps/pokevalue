'use server';

/**
 * @fileOverview Estimates the market value of a Pokemon card by accessing online marketplaces.
 *
 * - estimateCardValue - A function that estimates the market value of a Pokemon card.
 * - EstimateCardValueInput - The input type for the estimateCardValue function.
 * - EstimateCardValueOutput - The return type for the estimateCardValue function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EstimateCardValueInputSchema = z.object({
  cardName: z.string().describe('The name of the Pokemon card to estimate the value of.'),
});
export type EstimateCardValueInput = z.infer<typeof EstimateCardValueInputSchema>;

const EstimateCardValueOutputSchema = z.object({
  estimatedValue: z.string().describe('The estimated market value of the Pokemon card.'),
  marketplace: z.string().describe('The marketplace used to estimate the value.'),
});
export type EstimateCardValueOutput = z.infer<typeof EstimateCardValueOutputSchema>;

export async function estimateCardValue(input: EstimateCardValueInput): Promise<EstimateCardValueOutput> {
  return estimateCardValueFlow(input);
}

const estimateCardValuePrompt = ai.definePrompt({
  name: 'estimateCardValuePrompt',
  input: {schema: EstimateCardValueInputSchema},
  output: {schema: EstimateCardValueOutputSchema},
  prompt: `You are an expert appraiser of Pokemon cards.

You will estimate the market value of the card by searching online marketplaces like eBay.

Card Name: {{{cardName}}}

Provide an estimated market value and the marketplace you used to estimate the value.`,
});

const estimateCardValueFlow = ai.defineFlow(
  {
    name: 'estimateCardValueFlow',
    inputSchema: EstimateCardValueInputSchema,
    outputSchema: EstimateCardValueOutputSchema,
  },
  async input => {
    const {output} = await estimateCardValuePrompt(input);
    return output!;
  }
);
