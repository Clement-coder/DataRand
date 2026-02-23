"use client";

import { useEffect, useState } from "react";

interface EthPrice {
  usd: number;
  lastUpdated: number;
}

export function useEthPrice() {
  const [ethPrice, setEthPrice] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
        );
        
        if (!response.ok) {
          throw new Error("Failed to fetch ETH price");
        }

        const data = await response.json();
        const price = data.ethereum?.usd || 0;
        
        setEthPrice(price);
        setError(null);
      } catch (err) {
        console.error("Error fetching ETH price:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        // Fallback to approximate price if API fails
        setEthPrice(1850); // Approximate ETH price as fallback
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrice();
    
    // Refresh price every 60 seconds
    const interval = setInterval(fetchPrice, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const ethToUsd = (ethAmount: string | number): number => {
    const amount = typeof ethAmount === "string" ? parseFloat(ethAmount) : ethAmount;
    return amount * ethPrice;
  };

  return {
    ethPrice,
    isLoading,
    error,
    ethToUsd,
  };
}
