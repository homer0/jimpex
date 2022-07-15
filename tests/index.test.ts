jest.unmock('../src');

import { hello } from '../src';

describe('hello', () => {
  it('should print the message', () => {
    // Given/When/Then
    expect(hello()).toBe('hello world');
  });
});
