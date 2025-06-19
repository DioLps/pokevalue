
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CardInfoDisplay } from '@/components/poke-value/CardInfoDisplay';
import { PokeballIcon } from '@/components/icons/PokeballIcon';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertTriangle, Sparkles, ArrowLeft } from 'lucide-react';
import type { EstimateCardValueOutput } from '@/ai/flows/estimate-card-value';
import { useToast } from "@/hooks/use-toast";
import type { CardSubmissionRow } from '@/lib/db'; // Using the DB row type directly

interface FetchedSubmissionData extends Omit<CardSubmissionRow, 'estimationsJson' | 'createdAt' | 'updatedAt'> {
  estimations?: EstimateCardValueOutput | null;
  createdAt?: string; // Make them optional as they might not be used directly in UI state
  updatedAt?: string;
}


function CardPriceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [submissionData, setSubmissionData] = useState<FetchedSubmissionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const subIdFromParams = searchParams.get('submissionId');
    if (subIdFromParams) {
      setSubmissionId(subIdFromParams);
      fetchSubmissionData(subIdFromParams);
    } else {
      const noIdError = "No submission ID found. Please go back and upload an image.";
      setError(noIdError);
      toast({ variant: "destructive", title: "Error", description: noIdError });
      setIsLoading(false);
    }
  }, [searchParams]);

  const fetchSubmissionData = async (subId: string) => {
    setError(null);
    setIsLoading(true);
    try {
      toast({ title: "Loading Card Details...", description: "Please wait while we retrieve your card information." });
      const response = await fetch(`/api/get-submission/${subId}`);
      const data: FetchedSubmissionData & { error?: string } = await response.json();

      if (response.ok && data && data.status) { // Check for data and status
        setSubmissionData(data);
        if (data.status === 'ERROR_IDENTIFICATION' || data.status === 'ERROR_VALUATION') {
          const errorMessage = data.errorMessage || `An error occurred during ${data.status.toLowerCase().includes('identification') ? 'identification' : 'valuation'}.`;
          setError(errorMessage);
          toast({ variant: "destructive", title: "Processing Error", description: errorMessage });
        } else if (data.status === 'COMPLETED') {
           toast({ title: "Success!", description: "Card details and estimations loaded.", variant: "default" });
        } else {
          // Should ideally not happen if scan-card completes fully
          setError("Card processing is not yet complete or in an unknown state.");
           toast({ variant: "destructive", title: "Unexpected State", description: "Card processing is not yet complete." });
        }
      } else {
        const errorMessage = data.error || "Could not retrieve submission data.";
        console.warn("Error fetching submission data:", errorMessage);
        setError(errorMessage);
        toast({ variant: "destructive", title: "Load Error", description: errorMessage });
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Failed to load submission data.";
      console.error("Error fetching submission data (unexpected):", e);
      setError(errorMessage);
      toast({ variant: "destructive", title: "Load Error", description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading card data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-4 sm:p-6 md:p-8 bg-gradient-to-br from-background to-blue-100 dark:from-background dark:to-slate-900">
      <header className="mb-8 text-center">
        <div className="flex items-center justify-center space-x-3">
          <PokeballIcon className="h-12 w-12 text-primary animate-spin [animation-duration:5s]" />
          <h1 className="text-4xl sm:text-5xl font-headline font-bold text-primary">PokeValue</h1>
          <Sparkles className="h-10 w-10 text-accent" />
        </div>
        <p className="text-muted-foreground mt-2 text-lg">
          {!error && submissionData ? "Here are the details and estimated value of your card!" : "There was an issue loading your card."}
        </p>
      </header>

      <main className="w-full max-w-2xl space-y-6">
         <Button variant="outline" onClick={() => router.push('/')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Scan Another Card
        </Button>
        
        {error && !submissionData?.imageDataUri && ( // Show main error if no data at all
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription> 
          </Alert>
        )}

        {submissionData && (
            <CardInfoDisplay
              imageDataUri={submissionData.imageDataUri || null}
              cardName={submissionData.cardName || null}
              cardNumber={submissionData.cardNumber || null}
              deckIdLetter={submissionData.deckIdLetter || null}
              illustratorName={submissionData.illustratorName || null}
              estimations={submissionData.estimations || []}
              isLoadingIdentification={false} // Data is either loaded or errored by now
              isLoadingValuation={false}    // Data is either loaded or errored by now
            />
        )}
         {/* Display specific error from submission data if card was partially processed */}
         {submissionData && (submissionData.status === 'ERROR_IDENTIFICATION' || submissionData.status === 'ERROR_VALUATION') && submissionData.errorMessage && (
             <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Processing Error</AlertTitle>
                <AlertDescription>{submissionData.errorMessage}</AlertDescription>
             </Alert>
         )}

      </main>
      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} PokeValue. Powered by AI.</p>
        <p>Pokemon is a trademark of Nintendo, Creatures Inc., and GAME FREAK inc.</p>
      </footer>
    </div>
  );
}


export default function CardPricePage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>}>
      <CardPriceContent />
    </Suspense>
  );
}
