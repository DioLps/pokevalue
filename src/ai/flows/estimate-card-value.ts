
'use server';

/**
 * @fileOverview Estimates the market value of a Pokemon card by accessing online marketplaces
 * using detailed card information.
 *
 * - estimateCardValue - A function that estimates the market value.
 * - EstimateCardValueInput - The input type for the estimateCardValue function.
 * - EstimateCardValueOutput - The return type for the estimateCardValue function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EstimateCardValueInputSchema = z.object({
  cardName: z.string().describe('The name of the Pokemon card (e.g., "Pikachu").'),
  cardNumber: z.string().describe('The individual number of the card within its set (e.g., "025").'),
  deckIdLetter: z.string().optional().describe('An optional letter (e.g., "D") associated with the card number, indicating a deck version.'),
  illustratorName: z.string().optional().describe("The name of the card's illustrator, if available."),
});
export type EstimateCardValueInput = z.infer<typeof EstimateCardValueInputSchema>;

const SingleMarketplaceEstimationSchema = z.object({
  marketplace: z.string().describe('The name of the marketplace (e.g., eBay, PriceCharting).'),
  estimatedValue: z.string().describe('The estimated market value of the Pokemon card on this marketplace. State "Not found" or "N/A" if no listing is available or value cannot be determined.'),
  searchUrl: z.string().describe('The direct URL used for searching on the marketplace for the given card details.'),
});

const EstimateCardValueOutputSchema = z.array(SingleMarketplaceEstimationSchema).describe('An array of value estimations from different marketplaces (eBay and PriceCharting).');
export type EstimateCardValueOutput = z.infer<typeof EstimateCardValueOutputSchema>;

export async function estimateCardValue(input: EstimateCardValueInput): Promise<EstimateCardValueOutput> {
  return estimateCardValueFlow(input);
}

const estimateCardValuePrompt = ai.definePrompt({
  name: 'estimateCardValuePrompt',
  input: {schema: EstimateCardValueInputSchema},
  output: {schema: EstimateCardValueOutputSchema},
  prompt: `You are an expert appraiser of Pokémon cards.

Estimate the market value of the card by searching two online marketplaces: eBay and PriceCharting.com. Use the provided card details to build accurate search queries by combining the card name, card number, and deck ID letter (if provided). If an illustrator name is available and relevant (e.g., for illustration rares or special arts), include it as well.

Card Details:

  Card Name: {{{cardName}}}
  Card Number: {{{cardNumber}}}
  {{#if deckIdLetter}}- Deck ID Letter: {{{deckIdLetter}}}{{/if}}
  {{#if illustratorName}}- Illustrator: {{{illustratorName}}}{{/if}}

For each marketplace (eBay and PriceCharting), provide the following:

  estimatedValue: Extract the most relevant price from current listings or historical pricing. Always include the currency symbol or code with the price (e.g., "$12.50", "£8.99", "EUR 15.00", "JPY 1800"). If no valid price is found, use "Not found" or "N/A".
  marketplace: The exact name of the source — either "eBay" or "PriceCharting".
  searchUrl: The exact search URL used, incorporating card name, number, and deck ID letter. Encode all parameters for URLs.
  Example eBay URL: https://www.ebay.com/sch/i.html?_nkw=Pikachu+025D
  Example PriceCharting URL: https://www.pricecharting.com/search-products?q=Pikachu+025D&type=prices

Return a JSON array with two objects, one for each marketplace. Make sure that the price is clearly extractable even if listed in a non-USD currency. Do not convert currencies — preserve the original format for accurate human interpretation.`,
});

const estimateCardValueFlow = ai.defineFlow(
  {
    name: 'estimateCardValueFlow',
    inputSchema: EstimateCardValueInputSchema,
    outputSchema: EstimateCardValueOutputSchema,
  },
  async input => {
    const {output} = await estimateCardValuePrompt(input);
    return output || []; // Ensure an empty array is returned if output is null/undefined
  }
);
