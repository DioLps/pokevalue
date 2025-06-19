
'use server';

/**
 * @fileOverview Identifies a Pokemon card from an image, extracting specific details for valuation.
 *
 * - identifyPokemonCard - A function that handles the card identification process.
 * - IdentifyPokemonCardInput - The input type for the identifyPokemonCard function.
 * - IdentifyPokemonCardOutput - The return type for the identifyPokemonCard function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IdentifyPokemonCardInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a Pokemon card, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type IdentifyPokemonCardInput = z.infer<typeof IdentifyPokemonCardInputSchema>;

const IdentifyPokemonCardOutputSchema = z.object({
  cardName: z.string().describe('The name of the identified Pokemon card (e.g., "Pikachu", "Charizard ex").'),
  cardNumber: z.string().describe('The individual number of the card within its set, typically found before a slash (e.g., "025" from "025/165").'),
  deckIdLetter: z.string().optional().describe('An optional letter (commonly "D") immediately following or very close to the card number, indicating a special deck version. Omit if not present.'),
  illustratorName: z.string().optional().describe("The name of the artist who illustrated the card, usually found at the bottom. Omit if not visible or identifiable."),
});
export type IdentifyPokemonCardOutput = z.infer<typeof IdentifyPokemonCardOutputSchema>;

export async function identifyPokemonCard(
  input: IdentifyPokemonCardInput
): Promise<IdentifyPokemonCardOutput> {
  return identifyPokemonCardFlow(input);
}

const prompt = ai.definePrompt({
  name: 'identifyPokemonCardPrompt',
  input: {schema: IdentifyPokemonCardInputSchema},
  output: {schema: IdentifyPokemonCardOutputSchema},
  prompt: `You are an expert Pokemon card identifier. From the provided image of a Pokemon card, please extract the following information:
1.  **Card Name**: The primary name of the Pokemon (e.g., "Pikachu", "Charizard ex").
2.  **Card Number**: The individual number of the card within its set, typically found before a slash (e.g., "25" from "025/165", or "RC25" from "RC25/RC32"). This is the number part of the set/collector number.
3.  **Deck ID Letter (Optional)**: If there is a letter (commonly 'D') appended to or very close to the card number (e.g., "56D", "056 D"), indicating a special deck version (especially in series like Black & White or theme decks), please capture this letter. If no such letter is clearly associated with the card number, omit this field.
4.  **Illustrator Name (Optional)**: The name of the artist who illustrated the card, usually found at the bottom edge of the card image (e.g., "Illus. Ken Sugimori"). Extract only the name. If not visible or identifiable, omit this field.

Photo: {{media url=photoDataUri}}`,
});

const identifyPokemonCardFlow = ai.defineFlow(
  {
    name: 'identifyPokemonCardFlow',
    inputSchema: IdentifyPokemonCardInputSchema,
    outputSchema: IdentifyPokemonCardOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
