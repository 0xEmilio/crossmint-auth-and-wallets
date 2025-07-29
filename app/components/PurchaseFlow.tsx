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
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
            <h2 className="text-2xl font-bold text-white text-center">Purchase NFT</h2>
            <p className="text-purple-100 text-center mt-1">Secure checkout powered by Crossmint</p>
          </div>

          {/* Main Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Product Info */}
              <div className="lg:col-span-1">
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Product Details</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Collection:</span>
                      <span className="font-medium">Crossmint Demo NFT</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Quantity:</span>
                      <span className="font-medium">1</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price:</span>
                      <span className="font-medium text-green-600">$1.00</span>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total:</span>
                        <span className="text-green-600">$1.00</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Wallet Info */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-800 mb-3">Receiving Wallet</h3>
                  <div className="bg-white rounded border p-3">
                    <p className="text-sm text-gray-600 mb-1">Address:</p>
                    <p className="text-xs font-mono text-blue-600 break-all">
                      {activeWallet}
                    </p>
                  </div>
                </div>
              </div>

              {/* Checkout Form */}
              <div className="lg:col-span-2">
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Method</h3>
                  <div className="min-h-[400px]">
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
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  Secure Payment
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Instant Delivery
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  24/7 Support
                </div>
              </div>
            </div>
          </div>
        </div>
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