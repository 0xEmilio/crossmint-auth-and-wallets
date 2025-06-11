'use client';

import React from 'react';
import {
  CrossmintAuthProvider,
  CrossmintCheckoutProvider,
  CrossmintEmbeddedCheckout,
  CrossmintProvider,
  CrossmintWalletProvider,
  useAuth,
  useWallet,
} from "@crossmint/client-sdk-react-ui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "@/lib/wagmi";
import { useAccount, useWalletClient, WagmiProvider, useDisconnect } from "wagmi";
import { type Hex, parseTransaction } from "viem";

type ExtendedUser = {
  id: string;
  email?: string;
  [key: string]: any;
};

const queryClient = new QueryClient();

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <CrossmintProvider apiKey={process.env.NEXT_PUBLIC_CROSSMINT_API_KEY || ""}>
          <CrossmintCheckoutProvider>
            <CrossmintAuthProvider loginMethods={["email", "google", "web3"]}>
              <CrossmintWalletProvider>{children}</CrossmintWalletProvider>
            </CrossmintAuthProvider>
          </CrossmintCheckoutProvider>
        </CrossmintProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

function CheckoutPage() {
  const { user: rawUser, login, logout } = useAuth();
  const user = rawUser as ExtendedUser;
  const { wallet: smartWallet, getOrCreateWallet } = useWallet();
  const { address: externalWallet } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: walletClient } = useWalletClient();

  const [showCheckout, setShowCheckout] = React.useState(false);
  const [hasMounted, setHasMounted] = React.useState(false);

  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  const isWeb3User = !!externalWallet;
  const activeWallet = isWeb3User ? externalWallet : smartWallet?.address || "";

  React.useEffect(() => {
    if (!user?.id) return;

    console.log(
      `✅ Logged in as a ${isWeb3User ? "Web3" : "Email/Google"} user`
    );
    console.log("🔗 Active Wallet:", activeWallet);
  }, [user?.id, isWeb3User, activeWallet]);

  // Disconnect external wallet if using Email/Google
  React.useEffect(() => {
    if (user?.id && !externalWallet) {
      disconnect();
    }
  }, [user?.id, externalWallet, disconnect]);

  // Create wallet only if needed
  React.useEffect(() => {
    if (!user?.id) return;

    if (!externalWallet && !smartWallet?.address) {
      console.log("⚙️ Needs to create Crossmint wallet...");
      void getOrCreateWallet({
        chain: "base-sepolia",
        signer: { type: "passkey" },
      });
    } else if (externalWallet) {
      console.log("⛔ Web3 wallet detected, skipping Crossmint wallet creation.");
    } else if (smartWallet?.address) {
      console.log("✅ Already has a Crossmint smart wallet.");
    }
  }, [user?.id, externalWallet, smartWallet?.address, getOrCreateWallet]);

  const handleLogout = async () => {
    try {
      await logout();
      await disconnect();
      setShowCheckout(false);
      console.log("👋 Logged out and disconnected.");
    } catch (err) {
      console.error("Logout error", err);
    }
  };

  if (!hasMounted) return null;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <button
          type="button"
          onClick={login}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Login
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Crossmint Demo</h1>
          <button
            type="button"
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Logout
          </button>
        </div>

        <div className="bg-gray-100 p-4 rounded-lg">
          <p className="text-gray-800 font-semibold">Connected Wallet:</p>
          <p className="text-gray-600 break-all">
            {activeWallet || "No wallet connected"}
          </p>
        </div>

        {!isWeb3User && !smartWallet?.address ? (
          <button
            type="button"
            onClick={() => {
              console.log("🛠 Manually triggering smart wallet creation...");
              getOrCreateWallet({
                chain: "base-sepolia",
                signer: { type: "passkey" },
              });
            }}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Create Crossmint Wallet
          </button>
        ) : !showCheckout ? (
          <button
            type="button"
            onClick={() => {
              console.log("🛒 Starting checkout flow...");
              setShowCheckout(true);
            }}
            className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
          >
            Purchase flow
          </button>
        ) : (
          <div className="border rounded-lg p-6">
            <CrossmintEmbeddedCheckout
              recipient={{ walletAddress: activeWallet }}
              lineItems={[
                {
                  collectionLocator: `crossmint:${process.env.NEXT_PUBLIC_CROSSMINT_COLLECTION_ID}`,
                  callData: {
                    totalPrice: "1",
                    quantity: "1",
                  },
                },
              ]}
              payment={{
                crypto: {
                  enabled: true,
                  payer: {
                    address: activeWallet,
                    initialChain: "base-sepolia",
                    supportedChains: ["base-sepolia"],
                    handleChainSwitch: async (chain) => {
                      console.log("🔀 Chain switch requested:", chain);
                    },
                    handleSignAndSendTransaction: async (serializedTx) => {
                      if (!walletClient) {
                        console.error("❌ Wallet client not available");
                        return {
                          success: false,
                          errorMessage: "Wallet client not found.",
                        };
                      }

                      try {
                        const tx = parseTransaction(serializedTx as Hex);
                        const hash = await walletClient.sendTransaction({
                          to: tx.to,
                          value: tx.value,
                          data: tx.data ?? "0x",
                          gas: tx.gas,
                          chainId: tx.chainId,
                        });

                        console.log("✅ Transaction sent:", hash);
                        return { success: true, txId: hash ?? "" };
                      } catch (error) {
                        console.error("❌ Transaction failed", error);
                        return {
                          success: false,
                          errorMessage:
                            error instanceof Error
                              ? error.message
                              : "Transaction failed",
                        };
                      }
                    },
                  },
                },
                fiat: { enabled: true },
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Providers>
      <CheckoutPage />
    </Providers>
  );
}
