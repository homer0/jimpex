import collection from '@src/services/frontend';

const SERVICES = ['frontendFs'];

describe('services/frontend', () => {
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
