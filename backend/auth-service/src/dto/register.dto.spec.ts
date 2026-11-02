import { normalizeTunisianPhone } from './register.dto';

/**
 * The phone normaliser is the one piece of pure logic that can silently break
 * every signup, so it is worth a test of its own.
 */
describe('normalizeTunisianPhone', () => {
  it('adds the +216 prefix to a bare 8-digit number', () => {
    expect(normalizeTunisianPhone('12345678')).toBe('+21612345678');
  });

  it('keeps numbers that already have the prefix', () => {
    expect(normalizeTunisianPhone('+21612345678')).toBe('+21612345678');
  });

  it('accepts a number without the plus sign', () => {
    expect(normalizeTunisianPhone('21612345678')).toBe('+21612345678');
  });

  it('strips spaces and dashes people type on mobile keyboards', () => {
    expect(normalizeTunisianPhone('12 345 678')).toBe('+21612345678');
    expect(normalizeTunisianPhone('12-345-678')).toBe('+21612345678');
  });

  it('does not invent digits for an empty value', () => {
    expect(normalizeTunisianPhone('')).toBe('+216');
  });
});
