import { MoniteSDK } from '@monite/sdk-api';
import { MONITE_CONFIG } from './config';

export class MoniteAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MoniteAuthError';
  }
}

async function getAuthToken(): Promise<{
  access_token: string;
  token_type: string;
  expires_in: number;
}> {
  try {
    const response = await fetch(`${MONITE_CONFIG.apiUrl}/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-monite-version': MONITE_CONFIG.apiVersion
      },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: MONITE_CONFIG.clientId,
        client_secret: MONITE_CONFIG.clientSecret
      })
    });

    if (!response.ok) {
      throw new MoniteAuthError(`Authentication failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Authentication error:', error);
    throw new MoniteAuthError(error instanceof Error ? error.message : 'Authentication failed');
  }
}

async function createOrGetEntity(token: string): Promise<string> {
  try {
    // First try to list existing entities
    const listResponse = await fetch(`${MONITE_CONFIG.apiUrl}/entities`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-monite-version': MONITE_CONFIG.apiVersion
      }
    });

    if (!listResponse.ok) {
      throw new Error(`Failed to list entities: ${listResponse.status}`);
    }

    const listData = await listResponse.json();
    
    // If we have existing entities, use the first one
    if (listData.data && listData.data.length > 0) {
      return listData.data[0].id;
    }

    // If no entities exist, create a new one
    const createResponse = await fetch(`${MONITE_CONFIG.apiUrl}/entities`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-monite-version': MONITE_CONFIG.apiVersion
      },
      body: JSON.stringify({
        type: 'organization',
        organization: {
          legal_name: 'Wonderland Studio LLC',
          legal_type: 'llc',
          tax_id: '123456789',
          is_vendor: true,
          is_customer: true
        },
        address: {
          country: 'US',
          city: 'Los Angeles',
          line1: '123 Main St',
          postal_code: '90001',
          state: 'CA'
        },
        email: 'mitch@wonderland.studio',
        phone: '+12125551234'
      })
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.json();
      throw new Error(`Failed to create entity: ${JSON.stringify(errorData)}`);
    }

    const entity = await createResponse.json();
    return entity.id;
  } catch (error) {
    console.error('Entity creation/retrieval error:', error);
    throw error;
  }
}

export async function authenticateUser(email: string, password: string): Promise<{
  user: {
    email: string;
    name: string;
    entityId: string;
  };
  token: string;
}> {
  try {
    // Step 1: Get auth token
    const authToken = await getAuthToken();
    
    // Step 2: Get or create entity
    const entityId = await createOrGetEntity(authToken.access_token);

    // For sandbox testing - in production, this would validate against your user management system
    if (email === 'mitch@wonderland.studio' && password === 'password123') {
      const userData = {
        user: {
          email,
          name: 'Mitch Eisner',
          entityId,
        },
        token: authToken.access_token,
      };

      // Store auth data in localStorage
      localStorage.setItem('wonderpay_auth', JSON.stringify(userData));

      return userData;
    }

    throw new MoniteAuthError('Invalid credentials');
  } catch (error) {
    console.error('Authentication error:', error);
    throw new MoniteAuthError(error instanceof Error ? error.message : 'Authentication failed');
  }
}