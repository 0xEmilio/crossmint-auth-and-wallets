"use client";

import React from "react";
import { useWallet, CrossmintEmbeddedCheckout } from "@crossmint/client-sdk-react-ui";
import { useAccount, useWalletClient } from "wagmi";
import { type Hex, parseTransaction } from "viem";
import { baseSepolia } from "viem/chains";
import { buttonStyles, cardStyles, DEFAULT_CHAIN } from "@/lib/constants";

interface PurchaseFlowProps {
  onShowContent: (content: React.ReactNode) => void;
  isActive: boolean;
}

export function PurchaseFlow({ onShowContent, isActive }: PurchaseFlowProps) {
  const { wallet } = useWallet();
  const { address: externalWallet } = useAccount();
  const { data: walletClient } = useWalletClient();

  const isWeb3User = !!externalWallet;
  const activeWallet = isWeb3User ? externalWallet : wallet?.address || "";

  const collectionId = process.env.NEXT_PUBLIC_CROSSMINT_COLLECTION_ID;
  const isCollectionConfigured = !!collectionId;

  const handlePurchaseClick = () => {
    if (!isCollectionConfigured) {
      onShowContent(
        <div className={cardStyles.base}>
          <h2 className="text-xl font-semibold mb-4 text-center text-red-600">Collection Not Configured</h2>
          <div className={cardStyles.error}>
            <p className="text-red-700 mb-2">
              The NFT collection is not configured. Please add the following environment variable:
            </p>
            <code className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm block">
              NEXT_PUBLIC_CROSSMINT_COLLECTION_ID=your-collection-id
            </code>
            <p className="text-red-600 text-sm mt-2">
              Add this to your <code className="bg-red-100 px-1 rounded">.env.local</code> file and restart the development server.
            </p>
          </div>
        </div>
      );
      return;
    }

    if (!activeWallet) {
      onShowContent(
        <div className={cardStyles.error}>
          <p className="text-red-700">Please create or connect a wallet first</p>
        </div>
      );
      return;
    }

    onShowContent(
      <div className={cardStyles.base}>
        <h2 className="text-xl font-semibold mb-4 text-center">Purchase NFT Flow</h2>
        <CrossmintEmbeddedCheckout
          recipient={{ walletAddress: activeWallet }}
          lineItems={[
            {
              collectionLocator: `crossmint:${collectionId}`,
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
                initialChain: DEFAULT_CHAIN as any,
                supportedChains: [DEFAULT_CHAIN] as any,
                handleChainSwitch: async (chain: any) => {
                  if (!walletClient) {
                    console.error("Wallet client not available for chain switch");
                    return;
                  }
                  await walletClient.switchChain({
                    id: baseSepolia.id,
                  });
                },
                handleSignAndSendTransaction: async (serializedTx: any) => {
                  if (!walletClient) {
                    console.error("Wallet client not available for transaction");
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

                    return { success: true, txId: hash ?? "" };
                  } catch (error) {
                    console.error("Transaction failed:", error);
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
    );
  };

  return (
    <button
      type="button"
      onClick={handlePurchaseClick}
      className={
        !isCollectionConfigured
          ? buttonStyles.disabled
          : isActive 
            ? buttonStyles.primary
            : buttonStyles.secondary
      }
      title={!isCollectionConfigured ? 'Collection ID not configured' : ''}
    >
      Purchase NFT
    </button>
  );
} 