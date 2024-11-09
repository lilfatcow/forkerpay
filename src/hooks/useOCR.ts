import { useState } from 'react';
import { useMonite } from '@/contexts/MoniteContext';
import { useToast } from '@/hooks/use-toast';
import type { PayableResponse } from '@monite/sdk-api';

export function useOCR() {
  const { monite } = useMonite();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000; // 2 seconds

  const processDocument = async (file: File): Promise<PayableResponse | null> => {
    if (!monite) {
      toast({
        title: 'Error',
        description: 'OCR service not initialized',
        variant: 'destructive',
      });
      return null;
    }

    setProcessing(true);
    setRetryCount(0);

    try {
      // Step 1: Upload document
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadResponse = await fetch(`${monite.apiUrl}/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await monite.fetchToken()}`,
          'x-monite-version': monite.apiVersion,
        },
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload document');
      }

      const document = await uploadResponse.json();
      
      if (!document?.id) {
        throw new Error('Document upload failed');
      }

      // Step 2: Process document with OCR with retry mechanism
      let processedData: PayableResponse | null = null;
      let currentTry = 0;

      while (currentTry < MAX_RETRIES && !processedData) {
        try {
          // Check document status
          const statusResponse = await fetch(`${monite.apiUrl}/documents/${document.id}`, {
            headers: {
              'Authorization': `Bearer ${await monite.fetchToken()}`,
              'x-monite-version': monite.apiVersion,
            }
          });

          if (!statusResponse.ok) {
            throw new Error('Failed to check document status');
          }

          const status = await statusResponse.json();

          if (status.status === 'processed') {
            // Create payable from processed document
            const payableResponse = await fetch(`${monite.apiUrl}/payables`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${await monite.fetchToken()}`,
                'Content-Type': 'application/json',
                'x-monite-version': monite.apiVersion,
              },
              body: JSON.stringify({
                document_id: document.id,
                type: 'bill',
                status: 'draft'
              })
            });

            if (!payableResponse.ok) {
              throw new Error('Failed to create payable');
            }

            processedData = await payableResponse.json();
            
            toast({
              title: 'Success',
              description: 'Document processed successfully',
            });
            
            return processedData;
          }
          
          currentTry++;
          setRetryCount(currentTry);
          
          if (currentTry === MAX_RETRIES) {
            throw new Error(`Failed to process document after ${MAX_RETRIES} attempts`);
          }
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        } catch (error) {
          if (currentTry === MAX_RETRIES - 1) {
            throw error;
          }
          console.warn(`Processing attempt ${currentTry + 1} failed, retrying...`);
        }
      }

      throw new Error('Failed to process document');
    } catch (error) {
      console.error('OCR processing error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process document',
        variant: 'destructive',
      });
      return null;
    } finally {
      setProcessing(false);
      setRetryCount(0);
    }
  };

  return {
    processDocument,
    processing,
    retryCount,
    maxRetries: MAX_RETRIES
  };
}