"use client";

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  DollarSign,
  ExternalLink,
  Hash,
  Palette,
  ShoppingCart,
} from "lucide-react";
import type { EstimateCardValueOutput } from "@/ai/flows/estimate-card-value";

interface CardInfoDisplayProps {
  imageDataUri: string | null;
  cardName: string | null;
  cardNumber: string | null;
  deckIdLetter: string | null;
  illustratorName: string | null;
  estimations: EstimateCardValueOutput | null;
  handleScanAnother: VoidFunction;
}

export function CardInfoDisplay({
  imageDataUri,
  cardName,
  cardNumber,
  deckIdLetter,
  illustratorName,
  estimations,
  handleScanAnother,
}: CardInfoDisplayProps) {
  const hasValidEstimations = estimations && estimations.length > 0 &&
    estimations.some(
      (est) =>
        est.estimatedValue &&
        est.estimatedValue.toLowerCase() !== "not found" &&
        est.estimatedValue.toLowerCase() !== "n/a",
    );

  if (!imageDataUri && !cardName) { // If no image and no card name, means something went very wrong or no data yet
    return (
      <Card className="w-full shadow-lg mt-6">
        <CardHeader>
          <CardTitle className="font-headline text-xl"
            children={
              <span className="flex items-center justify-center">
                Card Details &amp; Value
                <Button
                  variant="outline"
                  onClick={handleScanAnother}
                  className="mb-4"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Scan Another Card
                </Button>
              </span>}
          />
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No card data available to display.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-lg mt-6">
      <CardHeader>
        <CardTitle className="font-headline text-xl"
          children={
            <span className="flex items-center justify-center">
              Card Details &amp; Value
              <Button
                variant="outline"
                onClick={handleScanAnother}
                className="mb-4"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Scan Another Card
              </Button>
            </span>}
        />
      </CardHeader>
      <CardContent className="space-y-6">
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
                {cardName || "Card Name Not Identified"}
              </h3>
              <>
                {cardNumber && (
                  <p className="text-sm text-muted-foreground flex items-center">
                    <Hash size={14} className="mr-1 text-muted-foreground/80" />
                    {cardNumber}
                    {deckIdLetter && (
                      <span className="ml-1 font-semibold">
                        ({deckIdLetter})
                      </span>
                    )}
                  </p>
                )}
                {illustratorName && (
                  <p className="text-sm text-muted-foreground flex items-center mt-1">
                    <Palette
                      size={14}
                      className="mr-1 text-muted-foreground/80"
                    />{" "}
                    {illustratorName}
                  </p>
                )}
                {!cardName && !cardNumber && !illustratorName && (
                  <p className="text-sm text-muted-foreground">
                    Details could not be identified.
                  </p>
                )}
              </>
            </div>

            {cardName && ( // Only show estimations if card name was identified
              <div className="pt-4 border-t">
                <h4 className="text-md font-semibold mb-3 flex items-center">
                  <DollarSign size={20} className="mr-2 text-accent" />{" "}
                  Estimated Values
                </h4>
                {estimations && estimations.length > 0
                  ? (
                    hasValidEstimations
                      ? (
                        <ul className="space-y-4">
                          {estimations.map((est, index) => (
                            <li
                              key={index}
                              className="p-3 border rounded-md bg-secondary/30"
                            >
                              <p className="text-xl font-bold text-primary">
                                {est.estimatedValue}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Source: {est.marketplace}
                              </p>
                              {est.searchUrl && (
                                <Button
                                  variant={(est.estimatedValue.toLowerCase() !==
                                    "not found" &&
                                    est.estimatedValue.toLowerCase() !==
                                    "n/a")
                                    ? "default"
                                    : "outline"}
                                  size="sm"
                                  className="mt-2"
                                  onClick={() =>
                                    window.open(est.searchUrl, "_blank")}
                                >
                                  {(est.estimatedValue.toLowerCase() !==
                                    "not found" &&
                                    est.estimatedValue.toLowerCase() !==
                                    "n/a")
                                    ? `See on ${est.marketplace}`
                                    : `Search on ${est.marketplace}`}
                                  <ExternalLink size={16} className="ml-2" />
                                </Button>
                              )}
                            </li>
                          ))}
                        </ul>
                      )
                      : (
                        <div className="text-center text-muted-foreground p-3">
                          <ShoppingCart size={24} className="mx-auto mb-1" />
                          <p>
                            No concrete price estimations found for this card on
                            the marketplaces.
                          </p>
                          <p className="text-xs mt-1">
                            You can try searching manually using the links
                            below:
                          </p>
                          {estimations.map((est, index) =>
                            est.searchUrl && (
                              <Button
                                key={`search-fallback-${index}`}
                                variant="link"
                                size="sm"
                                className="mt-1 text-primary hover:text-primary/80"
                                onClick={() =>
                                  window.open(est.searchUrl, "_blank")}
                              >
                                Search on {est.marketplace}
                                <ExternalLink size={16} className="ml-2" />
                              </Button>
                            )
                          )}
                        </div>
                      )
                  )
                  : (
                    <div className="text-center text-muted-foreground p-3">
                      <ShoppingCart size={24} className="mx-auto mb-1" />
                      <p>
                        No valuation data was returned from the marketplaces for
                        this card.
                      </p>
                    </div>
                  )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
