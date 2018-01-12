const message = 'compression-middleware';

const compressionMock = jest.fn(() => message);
compressionMock.message = message;
compressionMock.reset = () => compressionMock.mockClear();

module.exports = compressionMock;
