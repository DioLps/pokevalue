
'use client';

import { useState, useEffect, useCallback } from 'react';
import { ImageUpload } from '@/components/poke-value/ImageUpload';
import { PokeballIcon } from '@/components/icons/PokeballIcon';
import { Sparkles, Loader2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { CardInfoDisplay } from '@/components/poke-value/CardInfoDisplay';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { EstimateCardValueOutput } from '@/ai/flows/estimate-card-value';
import type { CardSubmissionRow } from '@/lib/db';

interface FetchedSubmissionData extends Omit<CardSubmissionRow, 'estimationsJson' | 'createdAt' | 'updatedAt'> {
  estimations?: EstimateCardValueOutput | null;
  createdAt?: string; 
  updatedAt?: string;
}

type ViewState = 'upload' | 'loadingResults' | 'displayingResults';

export default function HomePage() {
  const { toast } = useToast();
  
  const [view, setView] = useState<ViewState>('upload');
  const [selectedImageDataUri, setSelectedImageDataUri] = useState<string | null>(null);
  const [currentSubmissionId, setCurrentSubmissionId] = useState<string | null>(null);
  
  const [isLoadingInitialScan, setIsLoadingInitialScan] = useState(false);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  
  const [submissionData, setSubmissionData] = useState<FetchedSubmissionData | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);

  const handleFileSelected = (dataUri: string) => {
    setSelectedImageDataUri(dataUri);
    // If user selects a new file while results are shown, go back to upload view
    if (view === 'displayingResults' || view === 'loadingResults') {
      handleScanAnother();
    }
  };

  const handleScanClicked = async (dataUri: string) => {
    if (!dataUri) {
      toast({
        variant: "destructive",
        title: "No Image",
        description: "Please select an image before scanning.",
      });
      return;
    }
    setIsLoadingInitialScan(true);
    setProcessingError(null);
    setSubmissionData(null);
    setCurrentSubmissionId(null);
    toast({ title: "Processing Card...", description: "Identifying card and estimating value. This may take a moment." });

    try {
      const response = await fetch('/api/scan-card', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageDataUri: dataUri }),
      });

      const responseData = await response.json();

      if (response.ok && responseData.submissionId) {
        setCurrentSubmissionId(responseData.submissionId);
        // API call finished, now fetch results
      } else {
        const errorMessage = responseData.error || "Failed to start card scan. Please try again.";
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Error scanning card:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during scanning.";
      toast({
        variant: "destructive",
        title: "Scan Error",
        description: errorMessage,
      });
      setProcessingError(errorMessage);
      setView('upload'); // Stay on upload view or allow retry
    } finally {
      setIsLoadingInitialScan(false);
    }
  };
  
  const fetchSubmissionDetails = useCallback(async (subId: string) => {
    setIsLoadingResults(true);
    setProcessingError(null); // Clear previous errors for this new fetch
    setView('loadingResults');
    toast({ title: "Fetching Card Details...", description: "Please wait while we retrieve your card information." });
    try {
      const response = await fetch(`/api/get-submission/${subId}`);
      const data: FetchedSubmissionData & { error?: string } = await response.json();

      if (response.ok && data && data.status) {
        setSubmissionData(data);
        if (data.status === 'ERROR_IDENTIFICATION' || data.status === 'ERROR_VALUATION') {
          const errorMessage = data.errorMessage || `An error occurred during ${data.status.toLowerCase().includes('identification') ? 'identification' : 'valuation'}.`;
          setProcessingError(errorMessage);
          toast({ variant: "destructive", title: "Processing Error", description: errorMessage });
        } else if (data.status === 'COMPLETED') {
          toast({ title: "Success!", description: "Card details and estimations loaded.", variant: "default" });
        } else {
           // Should not happen if scan-card waits for completion
          setProcessingError("Card processing is in an unexpected state.");
          toast({ variant: "destructive", title: "Unexpected State", description: "Card processing is not yet complete." });
        }
      } else {
        const errorMessage = data.error || "Could not retrieve submission data.";
        setProcessingError(errorMessage);
        toast({ variant: "destructive", title: "Load Error", description: errorMessage });
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Failed to load submission data.";
      console.warn("Error fetching submission details:", e);
      setProcessingError(errorMessage);
      toast({ variant: "destructive", title: "Load Error", description: errorMessage });
    } finally {
      setIsLoadingResults(false);
      setView('displayingResults'); // Always move to displaying results view to show data or error
    }
  }, []);

  useEffect(() => {
    if (currentSubmissionId && !isLoadingInitialScan) {
      fetchSubmissionDetails(currentSubmissionId);
    }
  }, [currentSubmissionId, isLoadingInitialScan, fetchSubmissionDetails]);

  const handleScanAnother = () => {
    setView('upload');
    setSelectedImageDataUri(null);
    setCurrentSubmissionId(null);
    setSubmissionData(null);
    setProcessingError(null);
    setIsLoadingInitialScan(false);
    setIsLoadingResults(false);
    // Reset file input visually if possible (requires ref to ImageUpload or direct DOM manipulation, skipping for now)
  };

  const pageContainerClasses = `min-h-screen flex flex-col items-center p-4 sm:p-6 md:p-8 bg-gradient-to-br from-background to-blue-100 dark:from-background dark:to-slate-900 ${
    view === 'upload' ? 'justify-center' : 'justify-start pt-12 sm:pt-16 md:pt-20'
  }`;
  
  return (
    <div className={pageContainerClasses}>
      <header className="mb-8 text-center">
        <div className="flex items-center justify-center space-x-3">
          <PokeballIcon className="h-12 w-12 text-primary animate-spin [animation-duration:5s]" />
          <h1 className="text-4xl sm:text-5xl font-headline font-bold text-primary">PokeValue</h1>
          <Sparkles className="h-10 w-10 text-accent" />
        </div>
        <p className="text-muted-foreground mt-2 text-lg">
          {view === 'upload' && "Upload an image of your Pokémon card to get started!"}
          {view === 'loadingResults' && "Hold tight! We're fetching the details..."}
          {view === 'displayingResults' && (submissionData && !processingError ? "Here are the details and estimated value of your card!" : "There was an issue processing your card.")}
        </p>
      </header>

      <main className="w-full max-w-2xl space-y-6">
        {view !== 'upload' && (
          <Button variant="outline" onClick={handleScanAnother} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Scan Another Card
          </Button>
        )}

        {view === 'upload' && (
          <ImageUpload
            onFileSelected={handleFileSelected}
            onScanClicked={handleScanClicked}
            imagePreviewUrl={selectedImageDataUri}
            isLoading={isLoadingInitialScan}
          />
        )}

        {view === 'loadingResults' && (
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
            <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground text-lg">Analyzing your card & summoning estimations...</p>
            <p className="text-sm text-muted-foreground mt-1">This can take a few moments, please wait.</p>
          </div>
        )}

        {view === 'displayingResults' && (
          <>
            {processingError && !submissionData?.imageDataUri && ( // Show main error if no data at all and error occurred
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{processingError}</AlertDescription> 
              </Alert>
            )}

            {submissionData && (
                <CardInfoDisplay
                  imageDataUri={submissionData.imageDataUri || null} // Ensure null if not present
                  cardName={submissionData.cardName || null}
                  cardNumber={submissionData.cardNumber || null}
                  deckIdLetter={submissionData.deckIdLetter || null}
                  illustratorName={submissionData.illustratorName || null}
                  estimations={submissionData.estimations || []}
                />
            )}
            {/* Display specific error from submission data if card was partially processed, or general processing error */}
            {processingError && submissionData?.imageDataUri && ( // Show error even if some data (like image) is present
                 <Alert variant="destructive" className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Processing Issue</AlertTitle>
                    <AlertDescription>{submissionData?.errorMessage || processingError}</AlertDescription>
                 </Alert>
             )}
          </>
        )}
      </main>
      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} PokeValue. Powered by AI.</p>
        <p>Pokemon is a trademark of Nintendo, Creatures Inc., and GAME FREAK inc.</p>
      </footer>
    </div>
  );
}
