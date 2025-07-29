"use client";

import React, { useState, useEffect } from 'react';
import { useWallet } from '@crossmint/client-sdk-react-ui';
import { buttonStyles, cardStyles } from '@/lib/constants';
import { useConfigStatus } from './ConfigurationStatus';

interface Transaction {
  id: string;
  status: string;
  createdAt: string;
  completedAt?: string;
  approvals: {
    pending: Array<{ signer: string; message: string }>;
    submitted: Array<{ signer: string; message: string; submittedAt: string }>;
  };
  params: {
    calls: Array<{
      to: string;
      value: string;
      data: string;
    }>;
    chain: string;
    signer: string;
  };
  onChain?: {
    userOperation: any;
    userOperationHash: string;
    txId?: string;
    explorerLink?: string;
  };
  sendParams?: {
    token: string;
    params: {
      amount: string;
      recipient: string;
      recipientAddress: string;
    };
  };
}

interface ViewTransactionsProps {
  onShowContent: (content: React.ReactNode) => void;
  isActive: boolean;
  walletAddress?: string; // Optional - if not provided, uses connected wallet
}

function ViewTransactionsForm({ walletAddress, onShowContent, isFromAgent = false, onBackToAgent }: { walletAddress?: string; onShowContent: (content: React.ReactNode) => void; isFromAgent?: boolean; onBackToAgent?: () => void }) {
  const { wallet } = useWallet();
  const [localIsLoading, setIsLoading] = useState(false);
  const [localTransactions, setLocalTransactions] = useState<Transaction[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);
  const [localCurrentPage, setLocalCurrentPage] = useState(1);
  const [localExpandedTransactions, setLocalExpandedTransactions] = useState<Set<string>>(new Set());
  const [localPerPage] = useState(10);

  const fetchTransactions = async (page: number) => {
    const currentWalletAddress = walletAddress || wallet?.address;
    if (!currentWalletAddress) {
      setLocalError('No wallet address available');
      return;
    }

    setIsLoading(true);
    setLocalError(null);

    try {
      const response = await fetch('/api/get-transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: currentWalletAddress,
          page,
          perPage: localPerPage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch transactions');
      }

      setLocalTransactions(data.transactions || []);
      setLocalCurrentPage(page);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setLocalError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTransactionExpansion = (transactionId: string) => {
    const newExpanded = new Set(localExpandedTransactions);
    if (newExpanded.has(transactionId)) {
      newExpanded.delete(transactionId);
    } else {
      newExpanded.add(transactionId);
    }
    setLocalExpandedTransactions(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'awaiting-approval':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleBackToOptions = () => {
    if (isFromAgent && onBackToAgent) {
      onBackToAgent();
    } else {
      onShowContent(null);
    }
  };

  // Auto-fetch transactions when component mounts
  useEffect(() => {
    fetchTransactions(1);
  }, []);

  return (
    <div className={cardStyles.base}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">View Transactions</h2>
        <button
          type="button"
          onClick={handleBackToOptions}
          className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
        >
          {isFromAgent ? 'Back to Agent' : 'Back'}
        </button>
      </div>

      {walletAddress && (
        <div className="mb-4 p-3 bg-green-50 rounded-lg">
          <p className="text-sm text-green-800">
            <span className="font-medium">Wallet:</span> {walletAddress}
          </p>
        </div>
      )}

      {localError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{localError}</p>
        </div>
      )}

      {localIsLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading transactions...</p>
        </div>
      ) : localTransactions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No transactions found for this wallet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {localTransactions.map((transaction) => (
            <div key={transaction.id} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Transaction Header - Always Visible */}
              <div 
                className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => toggleTransactionExpansion(transaction.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-mono text-gray-600">{transaction.id}</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(transaction.status)}`}>
                          {transaction.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Created: {formatDate(transaction.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      {localExpandedTransactions.has(transaction.id) ? '▼' : '▶'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Transaction Details - Expandable */}
              {localExpandedTransactions.has(transaction.id) && (
                <div className="p-4 border-t border-gray-200 bg-white">
                  <div className="space-y-4">
                    {/* Basic Info */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Transaction Details</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">ID:</span>
                          <span className="ml-2 font-mono text-gray-600">{transaction.id}</span>
                        </div>
                        <div>
                          <span className="font-medium">Status:</span>
                          <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getStatusColor(transaction.status)}`}>
                            {transaction.status}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Created:</span>
                          <span className="ml-2 text-gray-600">{formatDate(transaction.createdAt)}</span>
                        </div>
                        {transaction.completedAt && (
                          <div>
                            <span className="font-medium">Completed:</span>
                            <span className="ml-2 text-gray-600">{formatDate(transaction.completedAt)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Success Transaction Info */}
                    {transaction.status === 'success' && transaction.onChain?.txId && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Transaction Hash</h4>
                        <div className="space-y-2">
                          <div>
                            <span className="font-medium text-sm">Tx ID:</span>
                            <span className="ml-2 font-mono text-sm text-gray-600 break-all">
                              {transaction.onChain.txId}
                            </span>
                          </div>
                          {transaction.onChain.explorerLink && (
                            <div>
                              <a
                                href={transaction.onChain.explorerLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-green-600 hover:text-green-800 text-sm"
                              >
                                View on Explorer →
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Send Params */}
                    {transaction.sendParams && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Send Parameters</h4>
                        <div className="bg-gray-50 p-3 rounded text-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="font-medium">Token:</span>
                              <span className="ml-2 text-gray-600">{transaction.sendParams.token}</span>
                            </div>
                            <div>
                              <span className="font-medium">Amount:</span>
                              <span className="ml-2 text-gray-600">{transaction.sendParams.params.amount}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="font-medium">Recipient:</span>
                              <span className="ml-2 font-mono text-gray-600 break-all">
                                {transaction.sendParams.params.recipient}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Approvals */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Approvals</h4>
                      <div className="space-y-3">
                        {transaction.approvals.pending.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium text-yellow-700 mb-2">Pending ({transaction.approvals.pending.length})</h5>
                            <div className="space-y-2">
                              {transaction.approvals.pending.map((approval, index) => (
                                <div key={index} className="bg-yellow-50 p-2 rounded text-xs">
                                  <div className="font-medium">Signer: {approval.signer}</div>
                                  <div className="font-mono text-gray-600 break-all mt-1">
                                    Message: {approval.message}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {transaction.approvals.submitted.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium text-green-700 mb-2">Submitted ({transaction.approvals.submitted.length})</h5>
                            <div className="space-y-2">
                              {transaction.approvals.submitted.map((approval, index) => (
                                <div key={index} className="bg-green-50 p-2 rounded text-xs">
                                  <div className="font-medium">Signer: {approval.signer}</div>
                                  <div className="font-mono text-gray-600 break-all mt-1">
                                    Message: {approval.message}
                                  </div>
                                  <div className="text-gray-500 mt-1">
                                    Submitted: {formatDate(approval.submittedAt)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Params - Expandable */}
                    <div>
                      <details className="group">
                        <summary className="cursor-pointer font-medium text-gray-900 mb-2">
                          Params
                        </summary>
                        <div className="mt-2 bg-gray-50 p-3 rounded text-sm">
                          <div className="space-y-2">
                            <div>
                              <span className="font-medium">Chain:</span>
                              <span className="ml-2 text-gray-600">{transaction.params.chain}</span>
                            </div>
                            <div>
                              <span className="font-medium">Signer:</span>
                              <span className="ml-2 font-mono text-gray-600 break-all">{transaction.params.signer}</span>
                            </div>
                            <div>
                              <span className="font-medium">Calls:</span>
                              <div className="mt-1 space-y-1">
                                {transaction.params.calls.map((call, index) => (
                                  <div key={index} className="bg-white p-2 rounded border">
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                      <div>
                                        <span className="font-medium">To:</span>
                                        <span className="ml-1 font-mono text-gray-600 break-all">{call.to}</span>
                                      </div>
                                      <div>
                                        <span className="font-medium">Value:</span>
                                        <span className="ml-1 font-mono text-gray-600">{call.value}</span>
                                      </div>
                                      <div className="col-span-2">
                                        <span className="font-medium">Data:</span>
                                        <span className="ml-1 font-mono text-gray-600 break-all text-xs">{call.data}</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </details>
                    </div>

                    {/* OnChain - Expandable */}
                    {transaction.onChain && (
                      <div>
                        <details className="group">
                          <summary className="cursor-pointer font-medium text-gray-900 mb-2">
                            OnChain Data
                          </summary>
                          <div className="mt-2 bg-gray-50 p-3 rounded text-sm">
                            <div className="space-y-2">
                              <div>
                                <span className="font-medium">User Operation Hash:</span>
                                <span className="ml-2 font-mono text-gray-600 break-all">{transaction.onChain.userOperationHash}</span>
                              </div>
                              <div>
                                <span className="font-medium">Sender:</span>
                                <span className="ml-2 font-mono text-gray-600 break-all">{transaction.onChain.userOperation.sender}</span>
                              </div>
                              <div>
                                <span className="font-medium">Nonce:</span>
                                <span className="ml-2 font-mono text-gray-600 break-all">{transaction.onChain.userOperation.nonce}</span>
                              </div>
                              <div>
                                <span className="font-medium">Call Data:</span>
                                <span className="ml-2 font-mono text-gray-600 break-all text-xs">{transaction.onChain.userOperation.callData}</span>
                              </div>
                            </div>
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <button
              type="button"
              onClick={() => fetchTransactions(localCurrentPage - 1)}
              disabled={localCurrentPage <= 1 || localIsLoading}
              className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {localCurrentPage}
            </span>
            <button
              type="button"
              onClick={() => fetchTransactions(localCurrentPage + 1)}
              disabled={localTransactions.length < localPerPage || localIsLoading}
              className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ViewTransactions({ onShowContent, isActive, walletAddress }: ViewTransactionsProps) {
  const { wallet } = useWallet();
  const { configStatus, mounted } = useConfigStatus();

  const isServerApiKeyConfigured = mounted ? (configStatus?.serverApiKey ?? false) : false;
  const targetWalletAddress = walletAddress || wallet?.address;

  // If walletAddress is provided, show the form directly
  if (walletAddress) {
    return <ViewTransactionsForm walletAddress={walletAddress} onShowContent={onShowContent} isFromAgent={true} onBackToAgent={() => onShowContent(null)} />;
  }

  const handleClick = () => {
    if (!isServerApiKeyConfigured) {
      onShowContent(
        <div className={cardStyles.base}>
          <h2 className="text-xl font-semibold mb-4 text-center text-red-600">Server API Key Not Configured</h2>
          <div className={cardStyles.error}>
            <p className="text-red-700 mb-2">
              View Transactions functionality requires a server API key. Please add the following environment variable:
            </p>
            <code className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm block">
              CROSSMINT_SERVER_API_KEY=your-server-api-key
            </code>
            <p className="text-red-600 text-sm mt-2">
              Add this to your <code className="bg-red-100 px-1 rounded">.env.local</code> file and restart the development server.
            </p>
          </div>
        </div>
      );
      return;
    }

    if (!targetWalletAddress) {
      onShowContent(
        <div className={cardStyles.base}>
          <h2 className="text-xl font-semibold mb-4 text-center text-red-600">No Wallet Address</h2>
          <div className={cardStyles.error}>
            <p className="text-red-700">
              No wallet address available. Please connect a wallet or provide a wallet address.
            </p>
          </div>
        </div>
      );
      return;
    }

    onShowContent(<ViewTransactionsForm walletAddress={targetWalletAddress} onShowContent={onShowContent} isFromAgent={false} onBackToAgent={() => onShowContent(null)} />);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      data-testid="view-transactions"
      className={
        !isServerApiKeyConfigured
          ? buttonStyles.disabled
          : isActive 
            ? `${buttonStyles.primary} ring-2 ring-green-500`
            : buttonStyles.primary
      }
      disabled={!isServerApiKeyConfigured}
      title={
        !isServerApiKeyConfigured 
          ? 'Server API key not configured' 
          : undefined
      }
    >
      View Transactions
    </button>
  );
} 