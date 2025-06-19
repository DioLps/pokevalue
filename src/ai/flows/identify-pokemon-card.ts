
'use server';

/**
 * @fileOverview Identifies a Pokemon card from an image.
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
  serialNumber: z.string().describe('The serial number of the identified Pokemon card, typically found at the bottom of the card.'),
  cardName: z.string().describe('The name of the identified Pokemon card.'),
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
  prompt: `You are an expert Pokemon card identifier.
On the following picture of a pokemon card, you should retrieve on the bottom left the series number and card name.

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
