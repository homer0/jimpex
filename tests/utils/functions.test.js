jest.unmock('../../src/utils/functions');

const {
  createRouteExpression,
  escapeForRegExp,
  removeLeadingSlash,
  removeSlashes,
  removeTrailingSlash,
} = require('../../src/utils/functions');

describe('utils/functions', () => {
  describe('removeLeadingSlash', () => {
    it('should remove the leading slash from a URL', () => {
      // Given
      const url = '/my/url';
      let result = null;
      // When
      result = removeLeadingSlash(url);
      // Then
      expect(result).toBe(url.substr(1));
    });

    it('should remove multiple leading slashes from a URL', () => {
      // Given
      const url = '///my/url';
      let result = null;
      // When
      result = removeLeadingSlash(url);
      // Then
      expect(result).toBe(url.substr(3));
    });

    it("shouldn't modify a URL that doesn't start with a slash", () => {
      // Given
      const url = 'my/url';
      let result = null;
      // When
      result = removeLeadingSlash(url);
      // Then
      expect(result).toBe(url);
    });
  });

  describe('removeTrailingSlash', () => {
    it('should remove the leading slash from a URL', () => {
      // Given
      const url = 'my/url/';
      let result = null;
      // When
      result = removeTrailingSlash(url);
      // Then
      expect(result).toBe(url.substr(0, url.length - 1));
    });

    it('should remove multiple trailing slashes from a URL', () => {
      // Given
      const url = 'my/url///';
      let result = null;
      // When
      result = removeTrailingSlash(url);
      // Then
      expect(result).toBe(url.substr(0, url.length - 3));
    });

    it("shouldn't modify a URL that doesn't start with a slash", () => {
      // Given
      const url = 'my/url';
      let result = null;
      // When
      result = removeTrailingSlash(url);
      // Then
      expect(result).toBe(url);
    });
  });

  describe('removeSlashes', () => {
    it('should remove both leading and trailing slashes from a URL', () => {
      // Given
      const url = '/my/url/';
      let result = null;
      // When
      result = removeSlashes(url);
      // Then
      expect(result).toBe(url.substr(1, url.length - 2));
    });

    it('should remove the trailing slash from a URL', () => {
      // Given
      const url = '/my/url/';
      let result = null;
      // When
      result = removeSlashes(url, false);
      // Then
      expect(result).toBe(url.substr(0, url.length - 1));
    });

    it("shouldn't remove slashes from a URL", () => {
      // Given
      const url = '/my/url/';
      let result = null;
      // When
      result = removeSlashes(url, false, false);
      // Then
      expect(result).toBe(url);
    });
  });

  describe('escapeForRegExp', () => {
    it('should escape a text to be used inside a RegExp', () => {
      // Given
      const text = 'hello {(world)}';
      let result = null;
      // When
      result = escapeForRegExp(text);
      // Then
      expect(result).toBe('hello\\ \\{\\(world\\)\\}');
    });
  });

  describe('createRouteExpression', () => {
    it('should create a expression that matches a route', () => {
      // Given
      const definition = '/my-route/:my-param/something/:else/end';
      const route = '/my-route/something/something/something/end';
      let expression = null;
      let result = null;
      // When
      expression = createRouteExpression(definition);
      result = expression.test(route);
      // Then
      expect(result).toBe(true);
    });

    it('should create a expression that matches the route with a trailing slash', () => {
      // Given
      const definition = '/my-route/:my-param/something/:else/end';
      const route = 'my-route/something/something/something/end/';
      let expression = null;
      let result = null;
      // When
      expression = createRouteExpression(definition, false, true);
      result = expression.test(route);
      // Then
      expect(result).toBe(true);
    });

    it("should create a expression that doesn't matches a route", () => {
      // Given
      const definition = '/my-route/:my-param/something/:else/end';
      const route = '/my-route/something/something/something';
      let expression = null;
      let result = null;
      // When
      expression = createRouteExpression(definition);
      result = expression.test(route);
      // Then
      expect(result).toBe(false);
    });
  });
});
