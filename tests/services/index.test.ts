jest.mock('@src/utils', () => ({
  provider: jest.fn(() => 'provider'),
  providerCreator: jest.fn(() => 'providerCreator'),
  providers: jest.fn(() => 'providers'),
}));

import * as services from '@src/services';

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
