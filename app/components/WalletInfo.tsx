"use client";

import React from "react";
import { useWallet } from "@crossmint/client-sdk-react-ui";
import { useAccount } from "wagmi";
import { cardStyles } from "@/lib/constants";

export function WalletInfo() {
  const { wallet } = useWallet();
  const { address: externalWallet } = useAccount();

  const isWeb3User = !!externalWallet;
  const activeWallet = isWeb3User ? externalWallet : wallet?.address || "";

  return (
    <div className="space-y-4">
      <div className={`${cardStyles.base} bg-gray-100`}>
        <p className="text-gray-800 font-semibold">Connected Wallet:</p>
        <p className="text-gray-600 break-all">
          {activeWallet || "No wallet connected"}
        </p>
        {isWeb3User && (
          <p className="text-sm text-green-600 mt-1">Web3 Wallet</p>
        )}
        {!isWeb3User && wallet?.address && (
          <p className="text-sm text-green-600 mt-1">Crossmint Smart Wallet</p>
        )}
      </div>

      {!isWeb3User && !wallet?.address && (
        <div className={cardStyles.info}>
          <p className="text-green-700 text-sm">
            Crossmint wallet will be created automatically when you log in with email or social.
          </p>
        </div>
      )}
    </div>
  );
} 