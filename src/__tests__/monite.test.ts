import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MoniteSDK } from '@monite/sdk-api';
import { initializeMoniteSDK, clearMoniteSDK, MONITE_CONFIG } from '@/lib/monite/config';

// Mock MoniteSDK
vi.mock('@monite/sdk-api', () => {
  const MoniteSDK = vi.fn();
  MoniteSDK.prototype.waitForReady = vi.fn().mockResolvedValue(undefined);
  MoniteSDK.prototype.entity = {
    getEntity: vi.fn()
  };
  return { MoniteSDK };
});

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Monite SDK Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearMoniteSDK();
  });

  afterEach(() => {
    clearMoniteSDK();
  });

  it('should initialize SDK with valid credentials', async () => {
    // Mock successful token response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: 'test_token',
        token_type: 'Bearer',
        expires_in: 1800
      })
    });

    // Mock successful entity verification
    const mockGetEntity = vi.fn().mockResolvedValue({ id: 'test_entity_id' });
    MoniteSDK.prototype.entity.getEntity = mockGetEntity;

    const sdk = await initializeMoniteSDK();
    expect(sdk).toBeInstanceOf(MoniteSDK);
    expect(mockFetch).toHaveBeenCalledWith(
      `${MONITE_CONFIG.apiUrl}/auth/token`,
      expect.any(Object)
    );
  });

  it('should handle missing configuration', async () => {
    // Temporarily clear required config
    const originalConfig = { ...MONITE_CONFIG };
    MONITE_CONFIG.clientId = '';

    await expect(initializeMoniteSDK()).rejects.toThrow('Missing required Monite configuration');

    // Restore config
    Object.assign(MONITE_CONFIG, originalConfig);
  });

  it('should handle token fetch failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ error: 'Invalid credentials' })
    });

    await expect(initializeMoniteSDK()).rejects.toThrow('Token fetch failed');
  });

  it('should handle entity verification failure', async () => {
    // Mock successful token response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: 'test_token',
        token_type: 'Bearer',
        expires_in: 1800
      })
    });

    // Mock failed entity verification
    MoniteSDK.prototype.entity.getEntity = vi.fn().mockRejectedValue(new Error('Entity not found'));

    await expect(initializeMoniteSDK()).rejects.toThrow('API access verification failed');
  });

  it('should reuse existing token if not expired', async () => {
    // Mock successful token response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: 'test_token',
        token_type: 'Bearer',
        expires_in: 1800
      })
    });

    // Mock successful entity verification
    MoniteSDK.prototype.entity.getEntity = vi.fn().mockResolvedValue({ id: 'test_entity_id' });

    // Initialize SDK twice
    await initializeMoniteSDK();
    await initializeMoniteSDK();

    // Token fetch should only be called once
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});