
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
  prompt: `You are a specialized AI expert in appraising Pokémon cards. Your task is to find the most accurate market value for a given card from two specific sources: eBay and PriceCharting.com. You must provide a specific price and a direct URL to the search results that support that price.

Card Details:
- Card Name: {{{cardName}}}
- Card Number: {{{cardNumber}}}
- Deck ID Letter (if applicable): {{#if deckIdLetter}}{{{deckIdLetter}}}{{else}}N/A{{/if}}
- Illustrator (if applicable): {{#if illustratorName}}{{{illustratorName}}}{{else}}N/A{{/if}}

Instructions:
1.  **Construct Precise Search Queries**: Combine the card name and card number (e.g., "Charizard 4/102"). If a deck ID letter is present, append it (e.g., "Pikachu 025D"). Use the illustrator name for special/promo cards where it is a key identifier.
2.  **Analyze Search Results**:
    -   For **eBay**, prioritize analyzing **recently sold listings** to determine a realistic market value. Avoid using prices from active listings that have not sold, as they may be inflated.
    -   For **PriceCharting**, use the primary price listed for the card (typically for an ungraded version unless otherwise specified in the search).
3.  **Format the Output**: For each marketplace, you must return an object with the following fields:
    -   \`marketplace\`: The exact name of the source: "eBay" or "PriceCharting".
    -   \`estimatedValue\`: Provide the most representative price you found. Be specific. For example, "$15.50 (average sold ungraded)" or "€25.00 (raw)". Always include the currency. If you absolutely cannot find a credible price from sold listings or a direct chart, return "Not found".
    -   \`searchUrl\`: Provide the **exact search URL** you would use to find this information. The URL should lead to the search results page you analyzed. For PriceCharting, if there is a specific product page for the card, use that URL. Ensure the URL is properly encoded.

Example Search URLs:
-   eBay: https://www.ebay.com/sch/i.html?_nkw=Pikachu+151&_sacat=0&LH_Complete=1&LH_Sold=1 (Note the use of \`LH_Sold=1\` to filter by sold items)
-   PriceCharting: https://www.pricecharting.com/search-products?q=Pikachu+151&type=prices

Return a JSON array containing two objects, one for eBay and one for PriceCharting.`,
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
