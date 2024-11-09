import { useState } from 'react';
import { useMonite } from '@/contexts/MoniteContext';
import { useToast } from '@/hooks/use-toast';
import type { BankAccountResponse } from '@monite/sdk-api';

export function useBanking() {
  const { monite } = useMonite();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const connect = async (data: {
    account_holder_name: string;
    iban: string;
    bic: string;
  }): Promise<BankAccountResponse | null> => {
    if (!monite) {
      toast({
        title: 'Error',
        description: 'Banking service not initialized',
        variant: 'destructive',
      });
      return null;
    }

    setLoading(true);
    try {
      // Create bank account connection
      const response = await fetch(`${monite.apiUrl}/bank_accounts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await monite.fetchToken()}`,
          'Content-Type': 'application/json',
          'x-monite-version': monite.apiVersion,
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to connect bank account');
      }

      const account = await response.json();
      
      toast({
        title: 'Success',
        description: 'Bank account connected successfully',
      });
      
      return account;
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to connect bank account',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const list = async (): Promise<BankAccountResponse[]> => {
    if (!monite) return [];

    setLoading(true);
    try {
      const response = await fetch(`${monite.apiUrl}/bank_accounts`, {
        headers: {
          'Authorization': `Bearer ${await monite.fetchToken()}`,
          'x-monite-version': monite.apiVersion,
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch bank accounts');
      }

      const { data } = await response.json();
      return data;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch bank accounts',
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const verify = async (id: string, data: {
    amounts: number[]
  }): Promise<boolean> => {
    if (!monite) return false;

    setLoading(true);
    try {
      const response = await fetch(`${monite.apiUrl}/bank_accounts/${id}/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await monite.fetchToken()}`,
          'Content-Type': 'application/json',
          'x-monite-version': monite.apiVersion,
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to verify bank account');
      }

      toast({
        title: 'Success',
        description: 'Bank account verified successfully',
      });

      return true;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to verify bank account',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string): Promise<boolean> => {
    if (!monite) return false;

    setLoading(true);
    try {
      const response = await fetch(`${monite.apiUrl}/bank_accounts/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await monite.fetchToken()}`,
          'x-monite-version': monite.apiVersion,
        }
      });

      if (!response.ok) {
        throw new Error('Failed to remove bank account');
      }

      toast({
        title: 'Success',
        description: 'Bank account removed successfully',
      });

      return true;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove bank account',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getTransactions = async (id: string): Promise<any[]> => {
    if (!monite) return [];

    setLoading(true);
    try {
      const response = await fetch(`${monite.apiUrl}/bank_accounts/${id}/transactions`, {
        headers: {
          'Authorization': `Bearer ${await monite.fetchToken()}`,
          'x-monite-version': monite.apiVersion,
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const { data } = await response.json();
      return data;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch transactions',
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getBalance = async (id: string): Promise<number | null> => {
    if (!monite) return null;

    try {
      const response = await fetch(`${monite.apiUrl}/bank_accounts/${id}/balance`, {
        headers: {
          'Authorization': `Bearer ${await monite.fetchToken()}`,
          'x-monite-version': monite.apiVersion,
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch balance');
      }

      const data = await response.json();
      return data.available_balance;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch balance',
        variant: 'destructive',
      });
      return null;
    }
  };

  return {
    connect,
    list,
    verify,
    remove,
    getTransactions,
    getBalance,
    loading
  };
}