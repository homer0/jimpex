import { describe, it, expect } from 'vitest';
import {
  removeLeadingSlash,
  removeTrailingSlash,
  createRouteExpression,
  removeSlashes,
} from '@src/utils/fns/routes.js';

describe('utils:fns/routes', () => {
  describe('removeLeadingSlash', () => {
    it.each([
      ['/some/path/', 'some/path/'],
      ['some/path/', 'some/path/'],
      ['///some/path/', 'some/path/'],
      ['/', ''],
      ['', ''],
    ])('should remove leading slashes from a URL (%s)', (url, expectedFormattedUrl) => {
      // Given/When
      const sut = removeLeadingSlash(url);
      // Then
      expect(sut).toBe(expectedFormattedUrl);
    });
  });

  describe('removeTrailingSlash', () => {
    it.each([
      ['/some/path/', '/some/path'],
      ['/some/path', '/some/path'],
      ['/some/path///', '/some/path'],
      ['/', ''],
      ['', ''],
    ])('should remove trailing slashes from a URL (%s)', (url, expectedFormattedUrl) => {
      // Given/When
      const sut = removeTrailingSlash(url);
      // Then
      expect(sut).toBe(expectedFormattedUrl);
    });
  });

  describe('removeSlashes', () => {
    it.each([
      ['/some/path/', { leading: true, trailing: true }, 'some/path'],
      ['/some/path/', { leading: true, trailing: false }, 'some/path/'],
      ['/some/path/', { leading: false, trailing: true }, '/some/path'],
      ['/some/path/', { leading: false, trailing: false }, '/some/path/'],
    ])(
      'should remove leading and/or trailing slashes from a URL (%s)',
      (url, options, expectedFormattedUrl) => {
        // Given/When
        const sut = removeSlashes(url, options.leading, options.trailing);
        // Then
        expect(sut).toBe(expectedFormattedUrl);
      },
    );
  });

  describe('createRouteExpression', () => {
    it.each([
      [
        'defaults',
        '/some/:param1/path/:param2/',
        {
          leadingSlash: undefined,
          trailingSlash: undefined,
        },
        /\/some\/(?:([^\/]+?))\/path\/(?:([^\/]+?))/,
      ],
      [
        'with leading slash',
        '/some/:param1/path/:param2/',
        {
          leadingSlash: true,
          trailingSlash: false,
        },
        /\/some\/(?:([^\/]+?))\/path\/(?:([^\/]+?))/,
      ],
      [
        'without leading slash',
        '/some/:param1/path/:param2/',
        {
          leadingSlash: false,
          trailingSlash: false,
        },
        /some\/(?:([^\/]+?))\/path\/(?:([^\/]+?))/,
      ],
      [
        'with trailing slash',
        '/some/:param1/path/:param2/',
        {
          leadingSlash: false,
          trailingSlash: true,
        },
        /some\/(?:([^\/]+?))\/path\/(?:([^\/]+?))\//,
      ],
      [
        'with leading and trailing slash',
        '/some/:param1/path/:param2/',
        {
          leadingSlash: true,
          trailingSlash: true,
        },
        /\/some\/(?:([^\/]+?))\/path\/(?:([^\/]+?))\//,
      ],
    ])(
      'should create a route expression from a string (%s)',
      (_, route, options, expectedExpression) => {
        // Given/When
        const sut = createRouteExpression(
          route,
          options.leadingSlash,
          options.trailingSlash,
        );
        // Then
        expect(sut).toEqual(expectedExpression);
      },
    );
  });
});
