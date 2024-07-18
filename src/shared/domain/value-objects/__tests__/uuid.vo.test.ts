import { InvalidUuidError, Uuid } from '../uuid.vo';
import { validate as uuidValidate } from 'uuid';

describe('Uuid Unit Tests', () => {
  const validateSpy = jest.spyOn(Uuid.prototype as any, 'validate');

  test(' should throw an error when invalid UUID is provided', () => {
    expect(() => new Uuid('invalid-uuid')).toThrow(new InvalidUuidError());
    expect(validateSpy).toHaveBeenCalledTimes(1);
  });

  test('should generate a valid UUID when no ID is provided', () => {
    const uuid = new Uuid();
    expect(uuid.id).toBeDefined();
    expect(uuidValidate(uuid.id)).toBeTruthy();
    expect(validateSpy).toHaveBeenCalledTimes(1);
  });

  test('should accept a valid UUID', () => {
    const uuid = new Uuid('123e4567-e89b-12d3-a456-426655440000');
    expect(uuid.id).toBe('123e4567-e89b-12d3-a456-426655440000');
    expect(validateSpy).toHaveBeenCalledTimes(1);
  });
});
