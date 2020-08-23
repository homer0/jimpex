jest.unmock('../../../src/services/utils');
jest.mock('../../../src/utils/wrappers', () => ({
  providerCreator: jest.fn(() => 'providerCreator'),
  providers: jest.fn(() => 'providers'),
}));

const utils = require('../../../src/services/utils');
const { providers } = require('../../../src/utils/wrappers');

describe('services:utils', () => {
  it('should export a providers collection with all the utility services', () => {
    // Given/When/Then
    expect(utils).toBe('providers');
    expect(providers).toHaveBeenCalledTimes(1);
    expect(providers).toHaveBeenCalledWith({
      ensureBearerToken: 'providerCreator',
    });
  });
});
