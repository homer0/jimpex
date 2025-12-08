import { vi, describe, it, expect } from 'vitest';

vi.mock('@src/utils/index.js', () => ({
  provider: vi.fn(() => 'provider'),
  providerCreator: vi.fn(() => 'providerCreator'),
  providers: vi.fn(() => 'providers'),
}));

import * as services from '@src/services/index.js';

describe('services', () => {
  it('should export all the app services', () => {
    // Given/When/Then
    expect(services).toEqual(
      expect.objectContaining({
        commonServicesProvider: 'providers',
        frontendServicesProvider: 'providers',
        htmlServicesProvider: 'providers',
        httpServicesProvider: 'providers',
        utilsServicesProvider: 'providers',
      }),
    );
  });
});
