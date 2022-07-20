jest.unmock('@src/services/frontend/index');

import frontendServices from '@src/services/frontend';

const FRONTEND_SERVICES = ['frontendFs'];

describe('services/frontend', () => {
  it('should export a providers collection with all the services', () => {
    expect(frontendServices).toEqual({
      provider: true,
      register: expect.any(Function),
      ...FRONTEND_SERVICES.reduce<Record<string, unknown>>((acc, service) => {
        acc[`${service}Provider`] = {
          provider: true,
          register: expect.any(Function),
        };

        return acc;
      }, {}),
    });
  });
});
