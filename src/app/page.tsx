
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

  const handleScanClicked = (dataUri: string) => {
    if (!dataUri) {
      toast({
        variant: "destructive",
        title: "No Image",
        description: "Please select an image before scanning.",
      });
      return;
    }
    setIsScanning(true);
    // Encode the Data URI to make it safe for URL query parameter
    const encodedDataUri = encodeURIComponent(dataUri);
    router.push(`/card-price?imageDataUri=${encodedDataUri}`);
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
