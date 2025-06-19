
'use client';

import { useState, type ChangeEvent, useRef } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadCloud, ScanLine } from 'lucide-react';

interface ImageUploadProps {
  onFileSelected: (dataUri: string) => void;
  onScanClicked: (dataUri: string) => void;
  isLoading: boolean;
  imagePreviewUrl: string | null;
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

export function ImageUpload({ onFileSelected, onScanClicked, isLoading, imagePreviewUrl }: ImageUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('File size exceeds 5MB. Please choose a smaller image.');
        onFileSelected(''); // Clear preview if error
        if(fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setError('Invalid file type. Please select a JPG, PNG or WEBP image.');
        onFileSelected(''); // Clear preview if error
        if(fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setError(null);
      try {
        const dataUri = await fileToDataUri(file);
        onFileSelected(dataUri);
      } catch (err) {
        console.error('Error converting file to data URI:', err);
        setError('Could not read image file. Please try again.');
        onFileSelected(''); // Clear preview if error
      }
    }
  };

  const handleScan = () => {
    if (imagePreviewUrl) {
      onScanClicked(imagePreviewUrl);
    } else {
      setError('Please select an image first.');
    }
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

        {imagePreviewUrl && (
          <div className="mt-4 p-2 mx-auto border rounded-md bg-muted/50 flex justify-center items-center aspect-[3/4] max-h-[300px] overflow-hidden">
            <Image
              src={imagePreviewUrl}
              alt="Pokemon card preview"
              width={200}
              height={280}
              className="rounded-md object-contain max-h-full w-auto"
              data-ai-hint="pokemon card"
            />
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <Button onClick={handleScan} disabled={isLoading || !imagePreviewUrl} className="w-full sm:w-auto flex-grow bg-accent hover:bg-accent/90 text-accent-foreground">
            <ScanLine className="mr-2 h-5 w-5" />
            {isLoading ? 'Processing...' : 'Scan Card'}
          </Button>
        </div>
         {!imagePreviewUrl && !isLoading && (
          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg text-muted-foreground h-48">
            <UploadCloud size={48} className="mb-2" />
            <p className="text-center">Upload an image to see a preview</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
