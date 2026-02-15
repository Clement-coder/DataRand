import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const USDC_ADDRESSES = {
  421614: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d', // Arbitrum Sepolia
  42161: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // Arbitrum Mainnet
};

const USDC_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
];

export function useWalletBalance(address: string | undefined, chainId: number = 421614) {
  const [ethBalance, setEthBalance] = useState('0');
  const [usdcBalance, setUsdcBalance] = useState('0');
  const [isLoading, setIsLoading] = useState(true);

  const refetch = async () => {
    if (!address) {
      setEthBalance('0');
      setUsdcBalance('0');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const provider = new ethers.JsonRpcProvider(
        chainId === 421614 
          ? 'https://sepolia-rollup.arbitrum.io/rpc'
          : 'https://arb1.arbitrum.io/rpc'
      );

      // Get ETH balance
      const ethBal = await provider.getBalance(address);
      setEthBalance(parseFloat(ethers.formatEther(ethBal)).toFixed(4));

      // Get USDC balance
      const usdcAddress = USDC_ADDRESSES[chainId as keyof typeof USDC_ADDRESSES];
      if (usdcAddress) {
        const usdcContract = new ethers.Contract(usdcAddress, USDC_ABI, provider);
        const usdcBal = await usdcContract.balanceOf(address);
        // USDC has 6 decimals
        setUsdcBalance(parseFloat(ethers.formatUnits(usdcBal, 6)).toFixed(2));
      }
    } catch (error) {
      console.error('Error fetching balances:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, [address, chainId]);

  return {
    ethBalance,
    usdcBalance,
    ethSymbol: 'ETH',
    usdcSymbol: 'USDC',
    isLoading,
    refetch,
    ethDecimals: 18,
    usdcDecimals: 6,
  };
}
