jest.unmock('@src/services/common/index');

import commonServices from '@src/services/common';

const COMMON_SERVICES = ['appError', 'httpError', 'sendFile'];

describe('services/common', () => {
  it('should export a providers collection with all the services', () => {
    expect(commonServices).toEqual({
      provider: true,
      register: expect.any(Function),
      ...COMMON_SERVICES.reduce<Record<string, unknown>>((acc, service) => {
        acc[`${service}Provider`] = {
          provider: true,
          register: expect.any(Function),
        };

        return acc;
      }, {}),
    });
  });
});
