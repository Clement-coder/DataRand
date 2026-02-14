// wagmiConfig.ts
import { createConfig } from "@privy-io/wagmi";
import { arbitrum, arbitrumSepolia } from "wagmi/chains";
import { http } from "wagmi";

export const wagmiConfig = createConfig({
  chains: [arbitrum, arbitrumSepolia],
  transports: {
    [arbitrum.id]: http(),
    [arbitrumSepolia.id]: http(),
  },
});
