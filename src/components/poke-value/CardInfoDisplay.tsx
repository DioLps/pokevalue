
'use client';

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { DollarSign, Info, ShoppingCart, ExternalLink, Hash } from 'lucide-react';

interface CardInfoDisplayProps {
  imageDataUri: string | null;
  cardName: string | null;
  serialNumber: string | null; // Changed from description to serialNumber
  estimatedValue: string | null;
  marketplace: string | null;
  isLoadingIdentification: boolean;
  isLoadingValuation: boolean;
}

export function CardInfoDisplay({
  imageDataUri,
  cardName,
  serialNumber, // Changed from description to serialNumber
  estimatedValue,
  marketplace,
  isLoadingIdentification,
  isLoadingValuation,
}: CardInfoDisplayProps) {
  if (!isLoadingIdentification && !isLoadingValuation && !cardName && !imageDataUri) {
    return null; // Nothing to display yet
  }

  const getMarketplaceSearchUrl = () => {
    if (!cardName || !marketplace) return '#';
    const searchTerm = encodeURIComponent(`${cardName} Pokemon card`);
    if (marketplace.toLowerCase() === 'ebay') {
      return `https://www.ebay.com/sch/i.html?_nkw=${searchTerm}`;
    }
    // Generic Google search for other marketplaces
    return `https://www.google.com/search?q=${searchTerm}+${encodeURIComponent(marketplace)}`;
  };

  return (
    <Card className="w-full shadow-lg mt-6">
      <CardHeader>
        <CardTitle className="font-headline text-xl">Card Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {imageDataUri && !cardName && !isLoadingIdentification && (
           <div className="text-center text-muted-foreground p-4">
            <Info size={32} className="mx-auto mb-2"/>
            <p>Ready to scan. Click "Scan Card" above.</p>
          </div>
        )}

        {(isLoadingIdentification || cardName) && (
          <div className="grid md:grid-cols-2 gap-6 items-start">
            {imageDataUri && (
              <div className="flex justify-center items-center p-2 border rounded-md bg-muted/50 aspect-[3/4] max-h-[400px] overflow-hidden">
                 <Image
                    src={imageDataUri}
                    alt={cardName || "Uploaded Pokemon card"}
                    width={250}
                    height={350}
                    className="rounded-md object-contain max-h-full w-auto"
                    data-ai-hint="pokemon card"
                  />
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-primary mb-1 font-headline">
                  {isLoadingIdentification ? <Skeleton className="h-7 w-3/4" /> : cardName || "Identifying..."}
                </h3>
                {isLoadingIdentification && !serialNumber ? (
                  <div className="space-y-2 mt-1">
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                ) : serialNumber ? (
                  <p className="text-sm text-muted-foreground flex items-center">
                    <Hash size={14} className="mr-1 text-muted-foreground/80" /> {serialNumber}
                  </p>
                ) : null}
              </div>

              {(isLoadingValuation || (estimatedValue && marketplace)) && (
                <div className="pt-4 border-t">
                  <h4 className="text-md font-semibold mb-2 flex items-center">
                    <DollarSign size={20} className="mr-2 text-accent" /> Estimated Value
                  </h4>
                  {isLoadingValuation ? (
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-1/2" />
                      <Skeleton className="h-4 w-1/3" />
                       <Skeleton className="h-10 w-3/4 mt-2" />
                    </div>
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-primary">{estimatedValue}</p>
                      {marketplace && <p className="text-xs text-muted-foreground">Source: {marketplace}</p>}
                      {marketplace && cardName && estimatedValue && (
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="mt-2"
                          onClick={() => window.open(getMarketplaceSearchUrl(), '_blank')}
                        >
                          See on {marketplace}
                          <ExternalLink size={16} className="ml-2" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
         {!isLoadingIdentification && !isLoadingValuation && cardName && !(estimatedValue && marketplace) && (
          <div className="text-center text-muted-foreground p-4">
            <ShoppingCart size={32} className="mx-auto mb-2"/>
            <p>Card identified. Value estimation might have failed or is not available.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
