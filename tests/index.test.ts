jest.unmock('@src/index');

import { hello } from '@src/index';

describe('hello', () => {
  it('should print the message', () => {
    // Given/When/Then
    expect(hello()).toBe('hello world');
  });
});
