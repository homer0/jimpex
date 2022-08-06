import { commonServicesProvider as collection } from '@src/services/common';

const SERVICES = ['appError', 'httpError', 'sendFile'];

describe('services/common', () => {
  it('should export a providers collection with all the services', () => {
    expect(collection).toEqual(
      expect.objectContaining({
        provider: true,
        register: expect.any(Function),
      }),
    );
    SERVICES.forEach((service) => {
      const key = `${service}Provider`;
      expect(collection).toHaveProperty(key);
      expect(collection[key]!.provider).toBe(true);
      expect(collection[key]!.register).toEqual(expect.any(Function));
    });
  });
});
