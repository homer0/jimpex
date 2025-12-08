jest.mock('@src/utils/index.js', () => ({
  provider: jest.fn(() => 'provider'),
  providerCreator: jest.fn(() => 'providerCreator'),
  providers: jest.fn(() => 'providers'),
}));

import * as services from '@src/services/index.js';

describe('services', () => {
  it('should export all the app sevices', () => {
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
