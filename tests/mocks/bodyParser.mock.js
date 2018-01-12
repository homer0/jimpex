const mocks = {
  json: jest.fn(() => 'body-parser-json'),
  urlencoded: jest.fn(() => 'body-parser-urlencoded'),
};

const bodyParserMock = {
  json: mocks.json,
  urlencoded: mocks.urlencoded,
  reset: () => {
    Object.keys(mocks).forEach((name) => {
      mocks[name].mockClear();
    });
  },
};

module.exports = bodyParserMock;
