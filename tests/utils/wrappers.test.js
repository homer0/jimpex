const JimpleMock = require('/tests/mocks/jimple.mock');

jest.mock('jimple', () => JimpleMock);
jest.unmock('/src/utils/wrappers');

require('jasmine-expect');
const {
  provider,
  controller,
  middleware,
} = require('/src/utils/wrappers');

describe('utils/wrappers', () => {
  it('should export the Jimple `provider` method', () => {
    expect(provider).toBe(JimpleMock.provider);
  });

  it('should export a `controller` function that wraps a `connect` statement', () => {
    // Given
    const myController = 'my-controller';
    let result = null;
    // When
    result = controller(myController);
    // Then
    expect(result).toEqual({
      connect: myController,
    });
  });

  it('should export a `middleware` function that wraps a `connect` statement', () => {
    // Given
    const myMiddleware = 'my-middleware';
    let result = null;
    // When
    result = middleware(myMiddleware);
    // Then
    expect(result).toEqual({
      connect: myMiddleware,
    });
  });
});
