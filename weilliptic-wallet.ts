// Weilliptic Wallet Integration Service (WAuth)
// This provides wallet connection, WUSD balance, and transaction capabilities

import { toasts } from '@/components/ui/toast';

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: number;
  network: string;
}

// The provided wallet address for testing
export const DEFAULT_WALLET_ADDRESS = '85d5820b714c5e1e2e82513871fa16a1d8b170c5ffb5930514601e83b01f655c';
export const VAPID_KEY = 'BBIA1AvsuH2ZR4_KeNRosHgeSh3-ovVI9TythuESXMyKMnGtNePmBE2oOx_0g1c6eRk-SxKdkw28hdWSUgDkIvc';

class WeillipticWallet {
  private state: WalletState = {
    isConnected: false,
    address: null,
    balance: 0,
    network: 'WeilChain Testnet'
  };

  private listeners: Set<(state: WalletState) => void> = new Set();

  // Get current wallet state
  getState(): WalletState {
    return { ...this.state };
  }

  // Subscribe to wallet state changes
  subscribe(callback: (state: WalletState) => void): () => void {
    this.listeners.add(callback);
    callback(this.getState());
    return () => this.listeners.delete(callback);
  }

  // Notify all listeners of state change
  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach(callback => callback(state));
  }

  // Check if WAuth extension is installed
  isExtensionInstalled(): boolean {
    return typeof window !== 'undefined' && !!(window as any).weilliptic;
  }

  // Connect wallet
  async connect(): Promise<boolean> {
    try {
      // Check for WAuth extension
      if (this.isExtensionInstalled()) {
        const weilliptic = (window as any).weilliptic;
        const result = await weilliptic.connect();
        
        if (result.success) {
          this.state = {
            isConnected: true,
            address: result.address,
            balance: await this.fetchBalance(result.address),
            network: result.network || 'WeilChain Testnet'
          };
          this.notifyListeners();
          toasts.success('Wallet connected successfully');
          return true;
        }
      } else {
        // Fallback: Simulate connection with provided wallet address
        // In production, this would require the actual extension
        this.state = {
          isConnected: true,
          address: DEFAULT_WALLET_ADDRESS,
          balance: 10000, // Mock balance for testing
          network: 'WeilChain Testnet'
        };
        this.notifyListeners();
        toasts.success('Connected to Weilliptic Wallet (Demo Mode)');
        return true;
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
      toasts.error('Failed to connect wallet. Please install WAuth extension.');
    }
    return false;
  }

  // Disconnect wallet
  async disconnect(): Promise<void> {
    if (this.isExtensionInstalled()) {
      try {
        await (window as any).weilliptic.disconnect();
      } catch (e) {
        console.error('Disconnect error:', e);
      }
    }
    
    this.state = {
      isConnected: false,
      address: null,
      balance: 0,
      network: 'WeilChain Testnet'
    };
    this.notifyListeners();
    toasts.info('Wallet disconnected');
  }

  // Fetch WUSD balance
  async fetchBalance(address: string): Promise<number> {
    // In production, this would call WeilChain API
    // For now, return mock balance
    return 10000;
  }

  // Execute a transaction (pay with WUSD)
  async executeTransaction(
    to: string, 
    amount: number, 
    description: string
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      if (!this.state.isConnected) {
        throw new Error('Wallet not connected');
      }

      // Check sufficient balance
      if (this.state.balance < amount) {
        throw new Error('Insufficient WUSD balance');
      }

      // Platform fee calculation (1%)
      const platformFee = amount * 0.01;
      const totalAmount = amount + platformFee;

      if (this.isExtensionInstalled()) {
        const weilliptic = (window as any).weilliptic;
        const result = await weilliptic.sendTransaction({
          to,
          amount: totalAmount,
          token: 'WUSD',
          memo: description
        });

        if (result.success) {
          this.state.balance -= totalAmount;
          this.notifyListeners();
          return { success: true, txHash: result.txHash };
        } else {
          throw new Error(result.error || 'Transaction failed');
        }
      } else {
        // Demo mode: Simulate transaction
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        this.state.balance -= totalAmount;
        this.notifyListeners();
        
        const mockTxHash = '0x' + Array.from({length: 64}, () => 
          Math.floor(Math.random() * 16).toString(16)
        ).join('');
        
        toasts.success(`Transaction successful! Fee: ${platformFee.toFixed(2)} WUSD (1%)`);
        return { success: true, txHash: mockTxHash };
      }
    } catch (error: any) {
      console.error('Transaction error:', error);
      toasts.error(error.message || 'Transaction failed');
      return { success: false, error: error.message };
    }
  }

  // Sign a message (for authentication)
  async signMessage(message: string): Promise<string | null> {
    try {
      if (!this.state.isConnected) {
        throw new Error('Wallet not connected');
      }

      if (this.isExtensionInstalled()) {
        const weilliptic = (window as any).weilliptic;
        const result = await weilliptic.signMessage(message);
        return result.signature;
      } else {
        // Demo mode: Return mock signature
        return '0x' + Array.from({length: 128}, () => 
          Math.floor(Math.random() * 16).toString(16)
        ).join('');
      }
    } catch (error) {
      console.error('Signing error:', error);
      return null;
    }
  }

  // Get transaction history
  async getTransactionHistory(): Promise<any[]> {
    // In production, fetch from WeilChain API
    return [];
  }
}

// Export singleton instance
export const weillipticWallet = new WeillipticWallet();

// React hook for wallet state
export function useWallet() {
  const [state, setState] = useState<WalletState>(weillipticWallet.getState());

  useEffect(() => {
    return weillipticWallet.subscribe(setState);
  }, []);

  return {
    ...state,
    connect: () => weillipticWallet.connect(),
    disconnect: () => weillipticWallet.disconnect(),
    executeTransaction: (to: string, amount: number, desc: string) => 
      weillipticWallet.executeTransaction(to, amount, desc),
    signMessage: (msg: string) => weillipticWallet.signMessage(msg)
  };
}

import { useState, useEffect } from 'react';
