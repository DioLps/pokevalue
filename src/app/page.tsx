
'use client';

import { useState, useEffect } from 'react';
import { ImageUpload } from '@/components/poke-value/ImageUpload';
import { CardInfoDisplay } from '@/components/poke-value/CardInfoDisplay';
import { PokeballIcon } from '@/components/icons/PokeballIcon';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertTriangle, Sparkles } from 'lucide-react';
import { identifyPokemonCardAction, estimateCardValueAction } from './actions';
import type { EstimateCardValueOutput } from '@/ai/flows/estimate-card-value';
import { useToast } from "@/hooks/use-toast";

export default function PokeValuePage() {
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  const [cardName, setCardName] = useState<string | null>(null);
  const [cardNumber, setCardNumber] = useState<string | null>(null);
  const [deckIdLetter, setDeckIdLetter] = useState<string | null>(null);
  const [illustratorName, setIllustratorName] = useState<string | null>(null);
  const [estimations, setEstimations] = useState<EstimateCardValueOutput>([]);
  
  const [isLoadingIdentification, setIsLoadingIdentification] = useState(false);
  const [isLoadingValuation, setIsLoadingValuation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const isLoading = isLoadingIdentification || isLoadingValuation;

  const resetAllStates = () => {
    setImageDataUri(null);
    setCardName(null);
    setCardNumber(null);
    setDeckIdLetter(null);
    setIllustratorName(null);
    setEstimations([]);
    setIsLoadingIdentification(false);
    setIsLoadingValuation(false);
    setError(null);
  };

  const handleImageSelectedAndProcess = async (dataUri: string) => {
    resetAllStates(); 
    setImageDataUri(dataUri); 
    setError(null);
    setIsLoadingIdentification(true);

    try {
      toast({ title: "Identifying Card...", description: "Please wait while we analyze your Pokemon card."});
      const identificationResult = await identifyPokemonCardAction({ photoDataUri: dataUri });
      setCardName(identificationResult.cardName);
      setCardNumber(identificationResult.cardNumber);
      setDeckIdLetter(identificationResult.deckIdLetter || null);
      setIllustratorName(identificationResult.illustratorName || null);
      setIsLoadingIdentification(false);

      if (identificationResult.cardName && identificationResult.cardNumber) {
        setIsLoadingValuation(true);
        const displayCardIdentifier = `${identificationResult.cardName} #${identificationResult.cardNumber}${identificationResult.deckIdLetter ? identificationResult.deckIdLetter : ''}`;
        toast({ title: "Estimating Value...", description: `Searching for ${displayCardIdentifier} value on multiple marketplaces.`});
        try {
          const valuationResult = await estimateCardValueAction({ 
            cardName: identificationResult.cardName,
            cardNumber: identificationResult.cardNumber,
            deckIdLetter: identificationResult.deckIdLetter,
            illustratorName: identificationResult.illustratorName,
          });
          setEstimations(valuationResult);
          toast({ title: "Success!", description: "Card identified and value estimation process complete.", variant: "default" });
        } catch (valuationError) {
          const errorMessage = valuationError instanceof Error ? valuationError.message : "An unknown error occurred during valuation.";
          console.error("Valuation error:", valuationError);
          setError(`Failed to estimate card value: ${errorMessage}`);
          toast({ variant: "destructive", title: "Valuation Error", description: `Could not estimate value for ${displayCardIdentifier}. ${errorMessage}` });
        } finally {
          setIsLoadingValuation(false);
        }
      } else {
         toast({ variant: "destructive", title: "Identification Issue", description: "Could not retrieve full card details for valuation. Card name or number missing." });
         if (!identificationResult.cardName) setError("AI failed to identify card name.");
         if (!identificationResult.cardNumber) setError("AI failed to identify card number.");
      }

    } catch (identificationError) {
      const errorMessage = identificationError instanceof Error ? identificationError.message : "An unknown error occurred during identification.";
      console.error("Identification error:", identificationError);
      setError(`Failed to identify Pokemon card: ${errorMessage}`);
      toast({ variant: "destructive", title: "Identification Error", description: `Could not identify card. ${errorMessage}` });
      setIsLoadingIdentification(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 bg-gradient-to-br from-background to-blue-100 dark:from-background dark:to-slate-900">
      <header className="mb-8 text-center">
        <div className="flex items-center justify-center space-x-3">
          <PokeballIcon className="h-12 w-12 text-primary animate-spin [animation-duration:5s]" />
          <h1 className="text-4xl sm:text-5xl font-headline font-bold text-primary">PokeValue</h1>
          <Sparkles className="h-10 w-10 text-accent" />
        </div>
        <p className="text-muted-foreground mt-2 text-lg">
          Discover the value of your Pokémon cards instantly!
        </p>
      </header>

      <main className="w-full max-w-2xl space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription> 
          </Alert>
        )}

        <ImageUpload 
          onImageSelected={handleImageSelectedAndProcess}
          onReset={resetAllStates}
          isLoading={isLoading}
          currentImagePreview={imageDataUri}
        />

        <CardInfoDisplay
          imageDataUri={imageDataUri}
          cardName={cardName}
          cardNumber={cardNumber}
          deckIdLetter={deckIdLetter}
          illustratorName={illustratorName}
          estimations={estimations}
          isLoadingIdentification={isLoadingIdentification}
          isLoadingValuation={isLoadingValuation}
        />
      </main>
      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} PokeValue. Powered by AI.</p>
        <p>Pokemon is a trademark of Nintendo, Creatures Inc., and GAME FREAK inc.</p>
      </footer>
    </div>
  );
}
