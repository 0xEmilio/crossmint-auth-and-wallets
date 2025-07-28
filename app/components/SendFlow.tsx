"use client";

import React from "react";
import { useWallet } from "@crossmint/client-sdk-react-ui";
import { useAccount, useSignMessage } from "wagmi";
import { 
  buttonStyles, 
  cardStyles, 
  inputStyles, 
  DEFAULT_CHAIN, 
  DEFAULT_SIGNER_TYPE 
} from "@/lib/constants";
import { 
  formatBalance, 
  getChainDisplayName, 
  parseBalanceToFloat, 
  hasSufficientBalance 
} from "@/lib/utils";

interface TokenBalance {
  token: string;
  decimals: number;
  balances: Record<string, string>;
}

interface SendFlowProps {
  onShowContent: (content: React.ReactNode) => void;
  onTriggerOnramp: () => void;
  isActive: boolean;
}

export function SendFlow({ onShowContent, onTriggerOnramp, isActive }: SendFlowProps) {
  const { wallet, getOrCreateWallet } = useWallet();
  const { address: externalWallet } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const isWeb3User = !!externalWallet;
  const activeWallet = isWeb3User ? externalWallet : wallet?.address || "";

  const handleSendClick = () => {
    if (!activeWallet) {
      onShowContent(
        <div className={cardStyles.error}>
          <p className="text-red-700">Please create or connect a wallet first</p>
        </div>
      );
      return;
    }
    
    const SendForm = () => {
      const [balances, setBalances] = React.useState<TokenBalance[]>([]);
      const [isLoadingBalances, setIsLoadingBalances] = React.useState(true);
      const [isLoading, setIsLoading] = React.useState(false);
      const [recipient, setRecipient] = React.useState("");
      const [amount, setAmount] = React.useState("");
      const [error, setError] = React.useState<React.ReactNode | null>(null);
      const [success, setSuccess] = React.useState<string | null>(null);
      const [transactionResult, setTransactionResult] = React.useState<{
        hash: string; 
        explorerLink: string; 
        transactionId: string
      } | null>(null);
      const [currentStep, setCurrentStep] = React.useState<'amount' | 'recipient' | 'success'>('amount');

      const selectedChain = DEFAULT_CHAIN;

      React.useEffect(() => {
        fetchBalances();
      }, []);

      const fetchBalances = async () => {
        try {
          setIsLoadingBalances(true);
          const response = await fetch(`/api/wallet-balances?wallet=${activeWallet}`);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch balances: ${response.statusText}`);
          }

          const data = await response.json();
          setBalances(data);
        } catch (err) {
          console.error("Failed to fetch balances:", err);
          setError(err instanceof Error ? err.message : "Failed to fetch balances");
        } finally {
          setIsLoadingBalances(false);
        }
      };

      const usdcData = balances.find(b => b.token === 'usdc');
      const chainBalance = usdcData?.balances?.[selectedChain] || '0';
      const formattedBalance = usdcData ? formatBalance(chainBalance, usdcData.decimals) : '0';
      const rawBalance = usdcData ? parseBalanceToFloat(chainBalance, usdcData.decimals) : 0;

      const requestedAmount = parseFloat(amount) || 0;
      const isInsufficientBalance = !hasSufficientBalance(chainBalance, usdcData?.decimals || 6, requestedAmount);

      const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeWallet || !recipient || !selectedChain || !amount) {
          setError("Missing required fields");
          return;
        }

        if (requestedAmount <= 0) {
          setError("Amount must be greater than 0");
          return;
        }

        setIsLoading(true);
        setError(null);

        try {
          let chainWallet = wallet;

          if (!isWeb3User && wallet) {
            if (wallet.chain !== selectedChain) {
              const newWallet = await getOrCreateWallet({
                chain: selectedChain as any,
                signer: { type: DEFAULT_SIGNER_TYPE as any }
              });
              if (newWallet) {
                chainWallet = newWallet;
              } else {
                throw new Error(`Failed to create wallet for ${selectedChain}`);
              }
            }
          }

          if (!chainWallet) {
            throw new Error("No wallet available");
          }

          const result = await chainWallet.send(recipient, 'usdc', amount);
          
          setTransactionResult(result);
          setSuccess(`Successfully sent ${amount} USDC!`);
          setCurrentStep('success');
          
        } catch (error) {
          console.error("Send failed:", error);
          setError(error instanceof Error ? error.message : "Transaction failed");
        } finally {
          setIsLoading(false);
        }
      };

      const reset = () => {
        setCurrentStep('amount');
        setAmount('');
        setRecipient('');
        setError(null);
        setSuccess(null);
        setTransactionResult(null);
        fetchBalances();
      };

      const renderInsufficientBalanceError = () => (
        <div className={`${cardStyles.error} text-center`}>
          <div className="mb-3">
            <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c.77.833 1.732 2.5 3.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-700 mb-4">
            You need USDC on {getChainDisplayName(selectedChain)} to send payments.
          </p>
          <div className="flex space-x-3 justify-center">
            <button
              onClick={onTriggerOnramp}
              className={buttonStyles.primary}
            >
              Buy USDC
            </button>
            <button
              onClick={fetchBalances}
              disabled={isLoadingBalances}
              className={buttonStyles.secondary}
            >
              {isLoadingBalances ? 'Refreshing...' : 'Refresh Balance'}
            </button>
          </div>
        </div>
      );

      if (isLoadingBalances) {
        return (
          <div className={cardStyles.base}>
            <h2 className="text-xl font-semibold mb-4 text-center">Loading Balance...</h2>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          </div>
        );
      }

      if (rawBalance === 0) {
        return (
          <div className={cardStyles.base}>
            <h2 className="text-xl font-semibold mb-4 text-center">Send USDC</h2>
            {renderInsufficientBalanceError()}
          </div>
        );
      }

      return (
        <div className={cardStyles.base}>
          <h2 className="text-xl font-semibold mb-4 text-center">Send USDC</h2>

          {currentStep === 'amount' && (
            <div>
              <div className="mb-4 p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-600">
                  From: <span className="font-medium">{getChainDisplayName(selectedChain)}</span>
                </p>
                <div className="flex items-center text-sm text-gray-600">
                  <span>Available: <span className="font-medium">{formattedBalance} USDC</span></span>
                  <button
                    onClick={fetchBalances}
                    disabled={isLoadingBalances}
                    className="ml-2 p-1 text-gray-500 hover:text-gray-700 disabled:text-gray-300 transition-colors"
                    title="Refresh balance"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (USDC)
                  </label>
                  <input
                    id="amount"
                    type="number"
                    step="0.000001"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className={inputStyles.base}
                  />
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {['0.1', '1', '5', 'MAX'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmount(preset === 'MAX' ? rawBalance.toString() : preset)}
                      className={buttonStyles.secondary}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                {error && <div className={cardStyles.error}><p className="text-red-700">{error}</p></div>}

                <button
                  type="button"
                  onClick={() => {
                    if (requestedAmount <= 0) {
                      setError("Please enter a valid amount");
                      return;
                    }
                    if (isInsufficientBalance) {
                      setError("Insufficient balance");
                      return;
                    }
                    setCurrentStep('recipient');
                  }}
                  disabled={!amount || requestedAmount <= 0}
                  className={requestedAmount > 0 ? buttonStyles.primary : buttonStyles.disabled}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {currentStep === 'recipient' && (
            <div>
              <div className="mb-4 p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-600">
                  Sending: <span className="font-bold text-green-600">{requestedAmount} USDC</span>
                </p>
                <p className="text-sm text-gray-600">
                  From: <span className="font-medium">{getChainDisplayName(selectedChain)}</span>
                </p>
              </div>

              <form onSubmit={handleSend} className="space-y-4">
                <div>
                  <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 mb-1">
                    Recipient Address
                  </label>
                  <input
                    id="recipient"
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="0x..."
                    className={inputStyles.base}
                    required
                  />
                </div>

                {error && <div className={cardStyles.error}><p className="text-red-700">{error}</p></div>}

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setCurrentStep('amount')}
                    className={buttonStyles.secondary}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || !recipient}
                    className={buttonStyles.success}
                  >
                    {isLoading ? 'Sending...' : 'Send USDC'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {currentStep === 'success' && (
            <div className="text-center space-y-4">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-lg font-semibold text-green-600">Transaction Successful!</h3>
              <p className="text-green-600">{success}</p>
              
              {transactionResult && (
                <div className={cardStyles.info}>
                  <h4 className="font-semibold mb-2">Transaction Details</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Hash:</strong> {transactionResult.hash}</p>
                    <p><strong>ID:</strong> {transactionResult.transactionId}</p>
                    <a 
                      href={transactionResult.explorerLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-black hover:text-gray-800 underline"
                    >
                      View on Explorer →
                    </a>
                  </div>
                </div>
              )}

              <div className="flex space-x-3 justify-center">
                <button
                  onClick={reset}
                  className={buttonStyles.primary}
                >
                  Send More
                </button>
                <button
                  onClick={() => onShowContent(null)}
                  className={buttonStyles.secondary}
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      );
    };

    onShowContent(<SendForm />);
  };

  return (
    <button
      type="button"
      onClick={handleSendClick}
      className={isActive ? buttonStyles.primary : buttonStyles.secondary}
    >
      Send USDC
    </button>
  );
} 