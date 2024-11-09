import { MoniteSDK } from '@monite/sdk-api';

interface MoniteConfig {
  apiUrl: string;
  clientId: string;
  clientSecret: string;
  apiVersion: string;
  entityId?: string;
}

export const MONITE_CONFIG: MoniteConfig = {
  apiUrl: 'https://api.sandbox.monite.com/v1',
  clientId: 'c8eb06b3-706e-4f71-8c7c-38b9dcd16d0f',
  clientSecret: '3157626c-e99d-47ba-8be9-a06d538c5df5',
  apiVersion: '2024-01-31',
  // We'll set this after entity creation
  entityId: undefined
};

let moniteInstance: MoniteSDK | null = null;
let tokenData: { token: string; expiresAt: number } | null = null;

export async function getAccessToken(): Promise<string> {
  try {
    // Use cached token if still valid
    if (tokenData && tokenData.expiresAt > Date.now()) {
      return tokenData.token;
    }

    // Get new token
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
      throw new Error(`Failed to get access token: ${response.status}`);
    }

    const data = await response.json();
    
    tokenData = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in * 1000)
    };

    return data.access_token;
  } catch (error) {
    console.error('Failed to get access token:', error);
    throw error;
  }
}

async function createTestEntity(): Promise<string> {
  try {
    const token = await getAccessToken();

    const response = await fetch(`${MONITE_CONFIG.apiUrl}/entities`, {
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
          tax_id: '123456789'
        },
        address: {
          country: 'US',
          city: 'Los Angeles',
          line1: '123 Main St',
          postal_code: '90001',
          state: 'CA'
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to create entity: ${response.status}`);
    }

    const entity = await response.json();
    return entity.id;
  } catch (error) {
    console.error('Failed to create test entity:', error);
    throw error;
  }
}

export async function initializeMoniteSDK(): Promise<MoniteSDK> {
  try {
    if (moniteInstance) {
      return moniteInstance;
    }

    // Get access token first
    const token = await getAccessToken();

    // List existing entities
    const entitiesResponse = await fetch(`${MONITE_CONFIG.apiUrl}/entities`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-monite-version': MONITE_CONFIG.apiVersion
      }
    });

    if (!entitiesResponse.ok) {
      throw new Error('Failed to list entities');
    }

    const entities = await entitiesResponse.json();
    
    // Get existing or create new entity
    let entityId: string;
    if (entities.data && entities.data.length > 0) {
      entityId = entities.data[0].id;
    } else {
      entityId = await createTestEntity();
    }

    // Store entity ID
    MONITE_CONFIG.entityId = entityId;

    // Initialize SDK with entity
    moniteInstance = new MoniteSDK({
      entityId,
      apiUrl: MONITE_CONFIG.apiUrl,
      fetchToken: getAccessToken
    });

    return moniteInstance;
  } catch (error) {
    console.error('Monite SDK initialization failed:', error);
    throw error;
  }
}

export function getMoniteInstance(): MoniteSDK {
  if (!moniteInstance) {
    throw new Error('Monite SDK not initialized. Call initializeMoniteSDK() first.');
  }
  return moniteInstance;
}

export function clearMoniteSDK(): void {
  moniteInstance = null;
  tokenData = null;
  MONITE_CONFIG.entityId = undefined;
}