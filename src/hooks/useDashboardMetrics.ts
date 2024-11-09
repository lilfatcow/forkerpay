import { useState } from 'react';
import { useMonite } from '@/contexts/MoniteContext';
import { useToast } from '@/hooks/use-toast';

interface DashboardMetrics {
  accountsPayable: {
    total: number;
    pendingCount: number;
  };
  accountsReceivable: {
    total: number;
    pendingCount: number;
  };
  cashFlow: {
    inflow: number[];
    outflow: number[];
    dates: string[];
  };
}

export function useDashboardMetrics() {
  const { monite } = useMonite();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);

  const fetchMetrics = async () => {
    if (!monite) {
      toast({
        title: 'Error',
        description: 'Monite SDK not initialized',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Fetch payables metrics
      const payables = await monite.payables.getList({
        status: ['draft', 'pending']
      });
      
      const payablesTotal = payables.data.reduce((sum, p) => sum + (p.amount || 0), 0);

      // Fetch receivables metrics
      const receivables = await monite.receivables.getList({
        status: ['draft', 'pending']
      });
      
      const receivablesTotal = receivables.data.reduce((sum, r) => sum + (r.amount || 0), 0);

      // Fetch cash flow data for last 30 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const cashFlow = await monite.analytics.getPayments({
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      });

      // Process cash flow data
      const cashFlowData = {
        inflow: [],
        outflow: [],
        dates: []
      };

      cashFlow.data.forEach(day => {
        cashFlowData.inflow.push(day.inflow || 0);
        cashFlowData.outflow.push(day.outflow || 0);
        cashFlowData.dates.push(day.date);
      });

      setMetrics({
        accountsPayable: {
          total: payablesTotal,
          pendingCount: payables.data.length
        },
        accountsReceivable: {
          total: receivablesTotal,
          pendingCount: receivables.data.length
        },
        cashFlow: cashFlowData
      });

    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch dashboard metrics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    metrics,
    loading,
    fetchMetrics
  };
}