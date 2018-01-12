const mocks = {
  any: jest.fn(() => 'multer-any'),
};

const multerMock = jest.fn(() => mocks);
multerMock.mocks = mocks;
multerMock.reset = () => {
  multerMock.mockClear();
  Object.keys(mocks).forEach((name) => {
    mocks[name].mockClear();
  });
};

module.exports = multerMock;
