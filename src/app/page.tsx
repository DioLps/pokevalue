"use client";

import { useState } from "react";
import { ImageUpload } from "@/components/poke-value/ImageUpload";
import { PokeballIcon } from "@/components/icons/PokeballIcon";
import { AlertTriangle, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CardInfoDisplay } from "@/components/poke-value/CardInfoDisplay";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { EstimateCardValueOutput } from "@/ai/flows/estimate-card-value";
import { IdentifyPokemonCardOutput } from "@/ai/flows/identify-pokemon-card";

type ViewState = "upload" | "loadingResults" | "displayingResults";

export default function HomePage() {
  const { toast } = useToast();

  const [view, setView] = useState<ViewState>("upload");
  const [selectedImageDataUri, setSelectedImageDataUri] = useState<
    string | null
  >(null);

  const [isLoadingInitialScan, setIsLoadingInitialScan] = useState(false);

  const [submissionData, setSubmissionData] = useState<
    | IdentifyPokemonCardOutput & {
      valuationResult: EstimateCardValueOutput;
    }
    | null
  >(null);
  const [processingError, setProcessingError] = useState<string | null>(null);

  const handleFileSelected = (dataUri: string) => {
    setSelectedImageDataUri(dataUri);
    // If user selects a new file while results are shown, go back to upload view
    if (view === "displayingResults" || view === "loadingResults") {
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
    toast({
      title: "Processing Card...",
      description:
        "Identifying card and estimating value. This may take a moment.",
    });

    try {
      setView("loadingResults");
      const response:
        | IdentifyPokemonCardOutput & {
          valuationResult: EstimateCardValueOutput;
        }
        | null = await fetch("/api/scan-card", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ imageDataUri: dataUri }),
        }).then((it) => it.json());

      if (!response) {
        toast({
          variant: "destructive",
          title: "Scan Error",
          description: "Failed to process the card.",
        });
        setProcessingError("Failed to process the card.");
        setView("upload"); // Stay on upload view or allow retry
        return;
      }

      toast({ title: "Success!", description: "Card identified and value estimation process complete.", variant: "default" });

      setView("displayingResults");
      setSubmissionData(response);
    } catch (error) {
      console.error("Error scanning card:", error);
      const errorMessage = error instanceof Error
        ? error.message
        : "An unknown error occurred during scanning.";
      toast({
        variant: "destructive",
        title: "Scan Error",
        description: errorMessage,
      });
      setProcessingError(errorMessage);
      setView("upload"); // Stay on upload view or allow retry
    } finally {
      setIsLoadingInitialScan(false);
    }
  };

  const handleScanAnother = () => {
    setView("upload");
    setSelectedImageDataUri(null);
    setSubmissionData(null);
    setProcessingError(null);
    setIsLoadingInitialScan(false);
    // Reset file input visually if possible (requires ref to ImageUpload or direct DOM manipulation, skipping for now)
  };

  const pageContainerClasses =
    `min-h-screen flex flex-col items-center p-4 sm:p-6 md:p-8 bg-gradient-to-br from-background to-blue-100 dark:from-background dark:to-slate-900 ${view === "upload"
      ? "justify-center"
      : "justify-start pt-12 sm:pt-16 md:pt-20"
    }`;

  return (
    <div className={pageContainerClasses}>
      <header className="mb-8 text-center">
        <div className="flex items-center justify-center space-x-3">
          <PokeballIcon className="h-12 w-12 text-primary animate-spin [animation-duration:5s]" />
          <h1 className="text-4xl sm:text-5xl font-headline font-bold text-primary">
            PokeValue
          </h1>
          <Sparkles className="h-10 w-10 text-accent" />
        </div>
        <p className="text-muted-foreground mt-2 text-lg">
          {view === "upload" &&
            "Upload an image of your Pokémon card to get started!"}
          {view === "loadingResults" &&
            "Hold tight! We're fetching the details..."}
          {view === "displayingResults" && (submissionData && !processingError
            ? "Here are the details and estimated value of your card!"
            : "There was an issue processing your card.")}
        </p>
      </header>

      <main className="w-full max-w-2xl space-y-6">

        {view === "upload" && (
          <ImageUpload
            onFileSelected={handleFileSelected}
            onScanClicked={handleScanClicked}
            imagePreviewUrl={selectedImageDataUri}
            isLoading={isLoadingInitialScan}
          />
        )}

        {view === "loadingResults" && (
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
            <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground text-lg">
              Analyzing your card & summoning estimations...
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              This can take a few moments, please wait.
            </p>
          </div>
        )}

        {view === "displayingResults" && (
          <>
            {processingError && !selectedImageDataUri && ( // Show main error if no data at all and error occurred
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{processingError}</AlertDescription>
              </Alert>
            )}

            {submissionData && (
              <CardInfoDisplay
                imageDataUri={selectedImageDataUri || null} // Ensure null if not present
                cardName={submissionData.cardName || null}
                cardNumber={submissionData.cardNumber || null}
                deckIdLetter={submissionData.deckIdLetter || null}
                illustratorName={submissionData.illustratorName || null}
                estimations={submissionData.valuationResult || []}
                handleScanAnother={handleScanAnother}
              />
            )}
          </>
        )}
      </main>
      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} PokeValue. Powered by AI.</p>
        <p>
          Pokemon is a trademark of Nintendo, Creatures Inc., and GAME FREAK
          inc.
        </p>
      </footer>
    </div>
  );
}
