
'use client';

import { useState, type ChangeEvent, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadCloud, RotateCcw, ScanLine } from 'lucide-react';

interface ImageUploadProps {
  onImageSelected: (dataUri: string) => void;
  onReset: () => void;
  isLoading: boolean;
  currentImagePreview: string | null;
}

const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export function ImageUpload({ onImageSelected, onReset, isLoading, currentImagePreview }: ImageUploadProps) {
  const [internalPreview, setInternalPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInternalPreview(currentImagePreview);
  }, [currentImagePreview]);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('File size exceeds 5MB. Please choose a smaller image.');
        setInternalPreview(null);
        if(fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
        setError('Invalid file type. Please select a JPG, PNG, WEBP or GIF image.');
        setInternalPreview(null);
        if(fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setError(null);
      try {
        const dataUri = await fileToDataUri(file);
        setInternalPreview(dataUri);
      } catch (err) {
        console.error('Error converting file to data URI:', err);
        setError('Could not read image file. Please try again.');
        setInternalPreview(null);
      }
    }
  };

  const handleScan = () => {
    if (internalPreview) {
      onImageSelected(internalPreview);
    } else {
      setError('Please select an image first.');
    }
  };

  const handleReset = () => {
    setInternalPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onReset();
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl">Upload Card Image</CardTitle>
        <CardDescription>Select a picture of your Pokemon card.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Input
            id="pokemon-card-upload"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            ref={fileInputRef}
            disabled={isLoading}
            aria-label="Upload Pokemon card image"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        {internalPreview && (
          <div className="mt-4 p-2 border rounded-md bg-muted/50 flex justify-center items-center aspect-[3/4] max-h-[300px] overflow-hidden">
            <Image
              src={internalPreview}
              alt="Pokemon card preview"
              width={200}
              height={280}
              className="rounded-md object-contain max-h-full w-auto"
              data-ai-hint="pokemon card"
            />
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <Button onClick={handleScan} disabled={isLoading || !internalPreview} className="w-full sm:w-auto flex-grow bg-accent hover:bg-accent/90 text-accent-foreground">
            <ScanLine className="mr-2 h-5 w-5" />
            {isLoading ? 'Scanning...' : 'Scan Card'}
          </Button>
          <Button onClick={handleReset} variant="outline" disabled={isLoading} className="w-full sm:w-auto">
            <RotateCcw className="mr-2 h-5 w-5" />
            Reset
          </Button>
        </div>
         {!internalPreview && !isLoading && (
          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg text-muted-foreground h-48">
            <UploadCloud size={48} className="mb-2" />
            <p className="text-center">Upload an image to see a preview</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
