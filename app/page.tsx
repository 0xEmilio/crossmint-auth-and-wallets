"use client";

import React from "react";
import {
  CrossmintAuthProvider,
  CrossmintProvider,
  CrossmintWalletProvider,
  useAuth,
  useWallet,
} from "@crossmint/client-sdk-react-ui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "@/lib/wagmi";
import { useAccount, WagmiProvider, useDisconnect } from "wagmi";
import { DEFAULT_CHAIN, DEFAULT_SIGNER_TYPE, buttonStyles } from "@/lib/constants";
import { PurchaseFlow, WorldstoreFlow, OnrampFlow, SendFlow, WalletInfo, BalanceFetcher, ConfigurationStatus, AgentWallet, ViewTransactions } from "./components";

const queryClient = new QueryClient();

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <CrossmintProvider
          apiKey={process.env.NEXT_PUBLIC_CROSSMINT_CLIENT_API_KEY || ""}
        >
          <CrossmintAuthProvider 
            loginMethods={["email", "google", "twitter"]}
            authModalTitle="Sign in to Crossmint Demo"
          >
            <CrossmintWalletProvider
              createOnLogin={{ 
                chain: DEFAULT_CHAIN as any, 
                signer: { type: DEFAULT_SIGNER_TYPE as any } 
              }}
            >
              {children}
            </CrossmintWalletProvider>
          </CrossmintAuthProvider>
        </CrossmintProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

function CheckoutPage() {
  const { user, login, logout } = useAuth();
  const { wallet } = useWallet();
  const { address: externalWallet } = useAccount();
  const { disconnect } = useDisconnect();

  const [hasMounted, setHasMounted] = React.useState(false);
  const [activeContent, setActiveContent] = React.useState<React.ReactNode>(null);
  const [activeFlow, setActiveFlow] = React.useState<string | null>(null);

  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  const handleLogout = () => {
    try {
      logout();
      disconnect();
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const handleBackToOptions = () => {
    setActiveContent(null);
    setActiveFlow(null);
  };

  if (!hasMounted) return null;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <button
          type="button"
          onClick={login}
          className={buttonStyles.primary}
        >
          Login
        </button>
      </div>
    );
  }

  // Check if there's an active wallet (either Crossmint or external)
  const hasActiveWallet = wallet || externalWallet;

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Crossmint Demo</h1>
          <button
            type="button"
            onClick={handleLogout}
            className={buttonStyles.danger}
          >
            Logout
          </button>
        </div>

        <WalletInfo />

        {activeContent ? (
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleBackToOptions}
              className={buttonStyles.secondary}
            >
              ← Back to Menu
            </button>
            {activeContent}
          </div>
        ) : (
          <div className="space-y-8">
            {hasActiveWallet ? (
              <>
                {/* Your Wallet Section */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Wallet</h2>
                  <div className="grid gap-4 md:grid-cols-3">
                    <BalanceFetcher 
                      onShowContent={(content) => {
                        setActiveContent(content);
                        setActiveFlow('balances');
                      }}
                      isActive={activeFlow === 'balances'}
                    />
                    <ViewTransactions 
                      onShowContent={(content) => {
                        setActiveContent(content);
                        setActiveFlow('view-transactions');
                      }}
                      isActive={activeFlow === 'view-transactions'}
                    />
                    <AgentWallet 
                      onShowContent={(content) => {
                        setActiveContent(content);
                        setActiveFlow('agent-wallet');
                      }}
                      isActive={activeFlow === 'agent-wallet'}
                    />
                  </div>
                </div>

                {/* Funding Section */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Funding</h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    <OnrampFlow 
                      onShowContent={(content) => {
                        setActiveContent(content);
                        setActiveFlow('onramp');
                      }}
                      isActive={activeFlow === 'onramp'}
                    />
                    <SendFlow 
                      onShowContent={(content) => {
                        setActiveContent(content);
                        setActiveFlow('send');
                      }}
                      isActive={activeFlow === 'send'}
                    />
                  </div>
                </div>

                {/* Commerce Section */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Commerce</h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    <PurchaseFlow 
                      onShowContent={(content) => {
                        setActiveContent(content);
                        setActiveFlow('purchase');
                      }}
                      isActive={activeFlow === 'purchase'}
                    />
                    <WorldstoreFlow 
                      onShowContent={(content) => {
                        setActiveContent(content);
                        setActiveFlow('worldstore');
                      }}
                      isActive={activeFlow === 'worldstore'}
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <div className="mb-6">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Wallet Available</h3>
                  <p className="text-gray-600 mb-6">
                    You're logged in but don't have an active wallet. Please create or connect a wallet to access wallet features.
                  </p>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-500">
                      • Crossmint wallets are created automatically when you first use wallet features
                    </p>
                    <p className="text-sm text-gray-500">
                      • You can also connect an external wallet like MetaMask
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <ConfigurationStatus />
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
