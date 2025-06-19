
'use server';

/**
 * @fileOverview Estimates the market value of a Pokemon card by accessing online marketplaces.
 *
 * - estimateCardValue - A function that estimates the market value of a Pokemon card from eBay and PriceCharting.
 * - EstimateCardValueInput - The input type for the estimateCardValue function.
 * - EstimateCardValueOutput - The return type for the estimateCardValue function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EstimateCardValueInputSchema = z.object({
  cardName: z.string().describe('The name of the Pokemon card.'),
  serialNumber: z.string().describe('The serial number of the Pokemon card, typically found at the bottom of the card (e.g., "SV1EN 056/165").'),
});
export type EstimateCardValueInput = z.infer<typeof EstimateCardValueInputSchema>;

const SingleMarketplaceEstimationSchema = z.object({
  marketplace: z.string().describe('The name of the marketplace (e.g., eBay, PriceCharting).'),
  estimatedValue: z.string().describe('The estimated market value of the Pokemon card on this marketplace. State "Not found" or "N/A" if no listing is available or value cannot be determined.'),
  searchUrl: z.string().url().describe('The direct URL used for searching on the marketplace for the given card name and serial number.'),
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
  prompt: `You are an expert appraiser of Pokemon cards.

You will estimate the market value of the card by searching two online marketplaces: eBay and PriceCharting.com.
Use the card's name and serial number for accurate searching.

Card Name: {{{cardName}}}
Serial Number: {{{serialNumber}}}

For each marketplace (eBay and PriceCharting):
- Provide an estimated market value. If no listings are found or a value cannot be determined, state "Not found" or "N/A" for the estimatedValue.
- Provide the marketplace name (must be exactly "eBay" or "PriceCharting").
- Provide the direct search URL you used for that marketplace, incorporating both the card name and serial number in the search query if possible.

Return an array containing two estimation objects, one for eBay and one for PriceCharting.
Example of a search URL for eBay: "https://www.ebay.com/sch/i.html?_nkw=Pikachu+151+MEW+025%2F165"
Example of a search URL for PriceCharting: "https://www.pricecharting.com/search-products?q=Pikachu+151+MEW+025%2F165&type=prices"
Ensure the serial number is URL encoded in the searchUrl.`,
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

