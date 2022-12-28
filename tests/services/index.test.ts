jest.unmock('@src/services');
jest.mock('@src/utils', () => ({
  provider: jest.fn(() => 'provider'),
  providerCreator: jest.fn(() => 'providerCreator'),
  providers: jest.fn(() => 'providers'),
}));

import * as services from '@src/services';

describe('services', () => {
  it('should export all the app sevices', () => {
    // Given/When/Then
    expect(services).toEqual({
      common: 'providers',
      frontend: 'providers',
      html: 'providers',
      http: 'providers',
      utils: 'providers',
    });
  });
});
