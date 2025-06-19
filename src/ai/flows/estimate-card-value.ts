
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
  prompt: `You are an expert appraiser of Pokemon cards.

You will estimate the market value of the card by searching two online marketplaces: eBay and PriceCharting.com.
Use the provided card details to construct effective search queries. Combine the card name, card number, and deck ID letter (if present) for accuracy. The illustrator name can also be used to refine searches if available and relevant (e.g., for special art versions or "Illustration Rares").

Card Details:
- Card Name: {{{cardName}}}
- Card Number: {{{cardNumber}}}
{{#if deckIdLetter}}- Deck ID Letter: {{{deckIdLetter}}}{{/if}}
{{#if illustratorName}}- Illustrator: {{{illustratorName}}}{{/if}}

For each marketplace (eBay and PriceCharting):
- Provide an estimated market value. If no listings are found or a value cannot be determined, state "Not found" or "N/A" for the estimatedValue.
- Provide the marketplace name (must be exactly "eBay" or "PriceCharting").
- Provide the direct search URL you used for that marketplace. The search query should incorporate the card name, card number, and deck ID letter (if present).
  Example search query components: "{{{cardName}}} {{{cardNumber}}}{{{deckIdLetter}}}". If illustrator name is present and seems relevant (e.g. for a full art card), you can add it like "{{{cardName}}} {{{cardNumber}}}{{{deckIdLetter}}} illustrator {{{illustratorName}}}".
  Example eBay URL: "https://www.ebay.com/sch/i.html?_nkw=Pikachu+025D"
  Example PriceCharting URL: "https://www.pricecharting.com/search-products?q=Pikachu+025D&type=prices"
  Ensure search query components are URL encoded in the searchUrl.

Return an array containing two estimation objects, one for eBay and one for PriceCharting.`,
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
