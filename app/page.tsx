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
import { PurchaseFlow, WorldstoreFlow, OnrampFlow, SendFlow, WalletInfo, BalanceFetcher, ConfigurationStatus, AgentWallet } from "./components";

const queryClient = new QueryClient();

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <CrossmintProvider
          apiKey={process.env.NEXT_PUBLIC_CROSSMINT_CLIENT_API_KEY || ""}
        >
          <CrossmintAuthProvider 
            loginMethods={["email", "google", "web3"]}
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <BalanceFetcher 
              onShowContent={(content) => {
                setActiveContent(content);
                setActiveFlow('balances');
              }}
              isActive={activeFlow === 'balances'}
            />
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
            <AgentWallet 
              onShowContent={(content) => {
                setActiveContent(content);
                setActiveFlow('agent-wallet');
              }}
              isActive={activeFlow === 'agent-wallet'}
            />
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
