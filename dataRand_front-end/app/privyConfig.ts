import type { PrivyClientConfig } from "@privy-io/react-auth";
import { arbitrumSepolia } from "wagmi/chains";

export const privyConfig: PrivyClientConfig = {
  embeddedWallets: {
    ethereum: {
      createOnLogin: 'users-without-wallets', 
    },    
    showWalletUIs: true,
  },

  loginMethods: ['google', 'email'],

  appearance: {
    logo: '/datarand-logo.svg',
  },

  defaultChain: arbitrumSepolia,
  supportedChains: [
    arbitrumSepolia,
  ],
};
