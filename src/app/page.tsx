
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
    try {
      const response = await fetch('/api/prepare-card-price', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageDataUri: dataUri }),
      });

      if (response.ok) {
        const { submissionId } = await response.json();
        if (submissionId) {
          router.push(`/card-price?submissionId=${submissionId}`);
        } else {
          throw new Error('Submission ID not received from server.');
        }
      } else {
        const errorData = await response.json().catch(() => ({ message: "Failed to prepare card for scanning. Please try again." }));
        throw new Error(errorData.message || "Server error during card preparation.");
      }
    } catch (error) {
      console.error("Error preparing card for scanning:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({
        variant: "destructive",
        title: "Scan Error",
        description: errorMessage,
      });
      setIsScanning(false);
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
