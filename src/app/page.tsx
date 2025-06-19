
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ImageUpload } from '@/components/poke-value/ImageUpload';
import { PokeballIcon } from '@/components/icons/PokeballIcon';
import { Sparkles } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

export default function UploadPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedImageDataUri, setSelectedImageDataUri] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const handleFileSelected = (dataUri: string) => {
    setSelectedImageDataUri(dataUri);
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
    setIsScanning(true);
    toast({ title: "Processing Card...", description: "Please wait, this may take a moment." });

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
        router.push(`/card-price?submissionId=${responseData.submissionId}`);
      } else {
        // Error already handled by API, or submissionId missing
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
      setIsScanning(false); // Ensure loading state is reset on error
    }
    // setIsScanning(false) will be effectively handled by navigation or error toast reset above
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
          Upload an image of your Pokémon card to get started!
        </p>
      </header>

      <main className="w-full max-w-2xl space-y-6">
        <ImageUpload
          onFileSelected={handleFileSelected}
          onScanClicked={handleScanClicked}
          imagePreviewUrl={selectedImageDataUri}
          isLoading={isScanning}
        />
      </main>
      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} PokeValue. Powered by AI.</p>
        <p>Pokemon is a trademark of Nintendo, Creatures Inc., and GAME FREAK inc.</p>
      </footer>
    </div>
  );
}
