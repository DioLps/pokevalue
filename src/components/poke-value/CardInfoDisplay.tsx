
'use client';

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { DollarSign, Info, ShoppingCart, ExternalLink, Hash, Search } from 'lucide-react';
import type { EstimateCardValueOutput } from '@/ai/flows/estimate-card-value';

interface CardInfoDisplayProps {
  imageDataUri: string | null;
  cardName: string | null;
  serialNumber: string | null;
  estimations: EstimateCardValueOutput;
  isLoadingIdentification: boolean;
  isLoadingValuation: boolean;
}

export function CardInfoDisplay({
  imageDataUri,
  cardName,
  serialNumber,
  estimations,
  isLoadingIdentification,
  isLoadingValuation,
}: CardInfoDisplayProps) {
  if (!isLoadingIdentification && !isLoadingValuation && !cardName && !imageDataUri) {
    return null; 
  }

  const hasValidEstimations = estimations && estimations.length > 0 && estimations.some(
    est => est.estimatedValue && est.estimatedValue.toLowerCase() !== "not found" && est.estimatedValue.toLowerCase() !== "n/a"
  );

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
                  <Skeleton className="h-4 w-2/3 mt-1" />
                ) : serialNumber ? (
                  <p className="text-sm text-muted-foreground flex items-center">
                    <Hash size={14} className="mr-1 text-muted-foreground/80" /> {serialNumber}
                  </p>
                ) : null}
              </div>

              {(isLoadingValuation || (estimations && estimations.length > 0)) && (
                <div className="pt-4 border-t">
                  <h4 className="text-md font-semibold mb-3 flex items-center">
                    <DollarSign size={20} className="mr-2 text-accent" /> Estimated Values
                  </h4>
                  {isLoadingValuation ? (
                    <div className="space-y-3">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-10 w-full mt-1" />
                      <Skeleton className="h-6 w-3/4 mt-2" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-10 w-full mt-1" />
                    </div>
                  ) : estimations && estimations.length > 0 ? (
                    <ul className="space-y-4">
                      {estimations.map((est, index) => (
                        <li key={index} className="p-3 border rounded-md bg-secondary/30">
                          <p className="text-xl font-bold text-primary">{est.estimatedValue}</p>
                          <p className="text-xs text-muted-foreground">Source: {est.marketplace}</p>
                          {(est.estimatedValue.toLowerCase() !== "not found" && est.estimatedValue.toLowerCase() !== "n/a" && est.searchUrl) && (
                            <Button 
                              variant="default" 
                              size="sm" 
                              className="mt-2"
                              onClick={() => window.open(est.searchUrl, '_blank')}
                            >
                              See on {est.marketplace}
                              <ExternalLink size={16} className="ml-2" />
                            </Button>
                          )}
                           { (est.estimatedValue.toLowerCase() === "not found" || est.estimatedValue.toLowerCase() === "n/a") && est.searchUrl && (
                             <Button
                              variant="outline"
                              size="sm"
                              className="mt-2"
                              onClick={() => window.open(est.searchUrl, '_blank')}
                            >
                              Search on {est.marketplace}
                              <Search size={16} className="ml-2" />
                            </Button>
                           )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                     <div className="text-center text-muted-foreground p-4">
                        <ShoppingCart size={32} className="mx-auto mb-2"/>
                        <p>No valuation data found for this card.</p>
                     </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
         {!isLoadingIdentification && !isLoadingValuation && cardName && !hasValidEstimations && estimations.length > 0 && (
          <div className="text-center text-muted-foreground p-4 border-t mt-4">
            <ShoppingCart size={32} className="mx-auto mb-2"/>
            <p>Card identified. Value estimation data might not be available or could not be found on marketplaces.</p>
             { estimations.map((est, index) => est.searchUrl && (
                <Button 
                    key={`search-fallback-${index}`}
                    variant="link" 
                    size="sm" 
                    className="mt-1"
                    onClick={() => window.open(est.searchUrl, '_blank')}
                >
                    Try searching on {est.marketplace} manually
                    <ExternalLink size={16} className="ml-2" />
                </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
