import { useState } from 'react';
import { useMonite } from '@/contexts/MoniteContext';
import { useToast } from '@/hooks/use-toast';
import type { CreateEntityRequest, EntityResponse } from '@monite/sdk-api';

export function useEntityManagement() {
  const { monite } = useMonite();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const createEntity = async (data: CreateEntityRequest): Promise<EntityResponse | null> => {
    if (!monite) {
      toast({
        title: 'Error',
        description: 'Monite SDK not initialized',
        variant: 'destructive',
      });
      return null;
    }

    setLoading(true);
    try {
      const entity = await monite.entities.create({
        ...data,
        type: 'organization',
        organization: {
          name: data.organization?.name || 'Default Organization',
          tax_id: data.organization?.tax_id,
        },
      });

      toast({
        title: 'Success',
        description: 'Entity created successfully',
      });

      return entity;
    } catch (error) {
      console.error('Entity creation error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create entity',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getEntityList = async () => {
    if (!monite) return [];

    setLoading(true);
    try {
      const response = await monite.entities.getList();
      return response.data;
    } catch (error) {
      console.error('Entity list error:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch entities',
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    createEntity,
    getEntityList,
    loading
  };
}