import { createContext, useContext, useEffect, useState } from 'react';
import { MoniteSDK } from '@monite/sdk-api';
import { initializeMoniteSDK, clearMoniteSDK } from '@/lib/monite/config';
import { useToast } from '@/hooks/use-toast';

interface MoniteContextType {
  monite: MoniteSDK | null;
  isInitializing: boolean;
  error: Error | null;
  initialize: () => Promise<MoniteSDK | null>;
}

const MoniteContext = createContext<MoniteContextType>({
  monite: null,
  isInitializing: true,
  error: null,
  initialize: async () => null,
});

export function MoniteProvider({ children }: { children: React.ReactNode }) {
  const [monite, setMonite] = useState<MoniteSDK | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const [initializationAttempts, setInitializationAttempts] = useState(0);
  const MAX_ATTEMPTS = 3;
  const RETRY_DELAY = 2000;

  const initialize = async () => {
    if (monite) {
      return monite;
    }

    try {
      setIsInitializing(true);
      setError(null);

      const sdk = await initializeMoniteSDK();
      setMonite(sdk);
      return sdk;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize Monite';
      console.error('Monite initialization error:', errorMessage);
      
      setError(err instanceof Error ? err : new Error(errorMessage));
      setInitializationAttempts(prev => prev + 1);
      
      toast({
        variant: 'destructive',
        title: 'Initialization Error',
        description: errorMessage
      });
      
      return null;
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    let retryTimeout: number;

    const init = async () => {
      try {
        const sdk = await initialize();
        if (mounted && sdk) {
          setMonite(sdk);
        } else if (mounted && initializationAttempts < MAX_ATTEMPTS) {
          retryTimeout = window.setTimeout(init, RETRY_DELAY);
        }
      } catch (error) {
        if (mounted) {
          console.error('Initialization error:', error);
        }
      }
    };

    init();

    return () => {
      mounted = false;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
      clearMoniteSDK();
    };
  }, []);

  const value = {
    monite,
    isInitializing,
    error,
    initialize
  };

  return (
    <MoniteContext.Provider value={value}>
      {children}
    </MoniteContext.Provider>
  );
}

export function useMonite() {
  const context = useContext(MoniteContext);
  if (context === undefined) {
    throw new Error('useMonite must be used within a MoniteProvider');
  }
  return context;
}