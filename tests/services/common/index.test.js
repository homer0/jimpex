jest.unmock('/src/services/common');
jest.mock('/src/utils/wrappers', () => ({
  provider: jest.fn(() => 'provider'),
  providers: jest.fn(() => 'providers'),
}));

const common = require('/src/services/common');
const { providers } = require('/src/utils/wrappers');

describe('services:common', () => {
  it('should export a providers collection with all the common services', () => {
    // Given/When/Then
    expect(common).toBe('providers');
    expect(providers).toHaveBeenCalledTimes(1);
    expect(providers).toHaveBeenCalledWith({
      appError: 'provider',
      httpError: 'provider',
      sendFile: 'provider',
    });
  });
});
