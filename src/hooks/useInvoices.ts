import { useState } from 'react';
import { useMonite } from '@/contexts/MoniteContext';
import { useToast } from '@/hooks/use-toast';
import type { 
  ReceivableResponse, 
  CreateReceivableRequest,
  UpdateReceivableRequest 
} from '@monite/sdk-api';

export function useInvoices() {
  const { monite } = useMonite();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const create = async (data: CreateReceivableRequest): Promise<ReceivableResponse | null> => {
    if (!monite) {
      toast({
        title: 'Error',
        description: 'Invoice service not initialized',
        variant: 'destructive',
      });
      return null;
    }

    setLoading(true);
    try {
      const invoice = await monite.receivables.create({
        ...data,
        type: 'invoice'
      });

      toast({
        title: 'Success',
        description: 'Invoice created successfully',
      });

      return invoice;
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create invoice',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const get = async (id: string): Promise<ReceivableResponse | null> => {
    if (!monite) return null;

    setLoading(true);
    try {
      return await monite.receivables.getById(id);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch invoice',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const update = async (
    id: string, 
    data: UpdateReceivableRequest
  ): Promise<ReceivableResponse | null> => {
    if (!monite) return null;

    setLoading(true);
    try {
      const invoice = await monite.receivables.update(id, data);
      toast({
        title: 'Success',
        description: 'Invoice updated successfully',
      });
      return invoice;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update invoice',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const list = async (params?: {
    limit?: number;
    offset?: number;
    status?: string;
  }): Promise<ReceivableResponse[]> => {
    if (!monite) return [];

    setLoading(true);
    try {
      const response = await monite.receivables.getList(params);
      return response.data;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch invoices',
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const issue = async (id: string): Promise<boolean> => {
    if (!monite) return false;

    setLoading(true);
    try {
      await monite.receivables.issue(id);
      toast({
        title: 'Success',
        description: 'Invoice issued successfully',
      });
      return true;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to issue invoice',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const cancel = async (id: string): Promise<boolean> => {
    if (!monite) return false;

    setLoading(true);
    try {
      await monite.receivables.cancel(id);
      toast({
        title: 'Success',
        description: 'Invoice cancelled successfully',
      });
      return true;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel invoice',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const markAsPaid = async (id: string): Promise<boolean> => {
    if (!monite) return false;

    setLoading(true);
    try {
      await monite.receivables.markAsPaid(id);
      toast({
        title: 'Success',
        description: 'Invoice marked as paid',
      });
      return true;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark invoice as paid',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    create,
    get,
    update,
    list,
    issue,
    cancel,
    markAsPaid,
    loading
  };
}