jest.unmock('/src/services/http');
jest.mock('/src/utils/wrappers', () => ({
  provider: jest.fn(() => 'provider'),
  providerCreator: jest.fn(() => 'providerCreator'),
  providers: jest.fn(() => 'providers'),
}));

const http = require('/src/services/http');
const { providers } = require('/src/utils/wrappers');

describe('services:http', () => {
  it('should export a providers collection with all the HTTP services', () => {
    // Given/When/Then
    expect(http).toBe('providers');
    expect(providers).toHaveBeenCalledTimes(1);
    expect(providers).toHaveBeenCalledWith({
      apiClient: 'providerCreator',
      http: 'provider',
      responsesBuilder: 'provider',
    });
  });
});
