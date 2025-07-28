"use client";

import React from "react";
import { useWallet } from "@crossmint/client-sdk-react-ui";
import { useAccount } from "wagmi";
import { buttonStyles, cardStyles } from "@/lib/constants";

interface OnrampFlowProps {
  onShowContent: (content: React.ReactNode) => void;
  isActive: boolean;
}

export function OnrampFlow({ onShowContent, isActive }: OnrampFlowProps) {
  const { wallet } = useWallet();
  const { address: externalWallet } = useAccount();

  const isWeb3User = !!externalWallet;
  const activeWallet = isWeb3User ? externalWallet : wallet?.address || "";

  const handleOnrampClick = async () => {
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
        <h2 className="text-xl font-semibold mb-4 text-center">Onramp USDC</h2>
        <div className="text-center space-y-4">
          <p className="text-green-600">Onramp integration coming soon...</p>
          <p className="text-sm text-gray-500">Target wallet: {activeWallet}</p>
        </div>
      </div>
    );
  };

  return (
    <button
      type="button"
      onClick={handleOnrampClick}
      className={isActive ? buttonStyles.primary : buttonStyles.secondary}
    >
      Purchase USDC
    </button>
  );
} 