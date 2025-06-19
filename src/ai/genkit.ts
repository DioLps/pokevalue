import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// To use the Gemini API, you need to create an API Key in Google AI Studio:
// https://aistudio.google.com/app/apikey
//
// Then, create a .env file at the root of your project and add the following:
// GOOGLE_API_KEY="YOUR_API_KEY_HERE"
//
// Make sure to restart your development server after adding the .env file.

export const ai = genkit({
  plugins: [
    googleAI({
      // The API version can be set here, or through the GCLOUD_API_VERSION environment variable.
      // apiVersion: 'v1beta',
    }),
  ],
  // Corresponds to gemini-1.5-flash-latest
  model: 'googleai/gemini-1.5-flash-latest', 
});
