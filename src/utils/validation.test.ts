import { describe, test, expect } from '@jest/globals';

// Validation utility functions for testing
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

const validatePrice = (price: number): boolean => {
  return price > 0 && price <= 10000 && Number.isFinite(price);
};

const validateGearTitle = (title: string): boolean => {
  return title.trim().length >= 3 && title.trim().length <= 100;
};

const validateGearDescription = (description: string): boolean => {
  return description.trim().length >= 10 && description.trim().length <= 2000;
};

const validateLocation = (city: string, state: string): boolean => {
  const cityValid = city.trim().length >= 1 && city.trim().length <= 100;
  const stateValid = state.length === 2 && /^[A-Z]{2}$/.test(state);
  return cityValid && stateValid;
};

describe('Validation Utils', () => {
  describe('validateEmail', () => {
    test('accepts valid email addresses', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('test.email+tag@domain.co.uk')).toBe(true);
      expect(validateEmail('user123@test-domain.org')).toBe(true);
    });

    test('rejects invalid email addresses', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
      expect(validateEmail('user@domain')).toBe(false);
      expect(validateEmail('')).toBe(false);
      expect(validateEmail('user space@domain.com')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    test('accepts strong passwords', () => {
      const result = validatePassword('Password123');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('rejects passwords that are too short', () => {
      const result = validatePassword('Pass1');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    test('rejects passwords without lowercase letters', () => {
      const result = validatePassword('PASSWORD123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    test('rejects passwords without uppercase letters', () => {
      const result = validatePassword('password123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    test('rejects passwords without numbers', () => {
      const result = validatePassword('Password');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    test('returns multiple errors for weak passwords', () => {
      const result = validatePassword('weak');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('validatePrice', () => {
    test('accepts valid prices', () => {
      expect(validatePrice(1)).toBe(true);
      expect(validatePrice(50.99)).toBe(true);
      expect(validatePrice(1000)).toBe(true);
      expect(validatePrice(9999.99)).toBe(true);
    });

    test('rejects invalid prices', () => {
      expect(validatePrice(0)).toBe(false);
      expect(validatePrice(-1)).toBe(false);
      expect(validatePrice(10001)).toBe(false);
      expect(validatePrice(Infinity)).toBe(false);
      expect(validatePrice(NaN)).toBe(false);
    });
  });

  describe('validateGearTitle', () => {
    test('accepts valid titles', () => {
      expect(validateGearTitle('Camera')).toBe(true);
      expect(validateGearTitle('Professional DSLR Camera')).toBe(true);
      expect(validateGearTitle('A'.repeat(50))).toBe(true);
      expect(validateGearTitle('A'.repeat(100))).toBe(true);
    });

    test('rejects invalid titles', () => {
      expect(validateGearTitle('')).toBe(false);
      expect(validateGearTitle('  ')).toBe(false);
      expect(validateGearTitle('AB')).toBe(false);
      expect(validateGearTitle('A'.repeat(101))).toBe(false);
    });
  });

  describe('validateGearDescription', () => {
    test('accepts valid descriptions', () => {
      expect(validateGearDescription('This is a great camera for photography')).toBe(true);
      expect(validateGearDescription('A'.repeat(100))).toBe(true);
      expect(validateGearDescription('A'.repeat(2000))).toBe(true);
    });

    test('rejects invalid descriptions', () => {
      expect(validateGearDescription('')).toBe(false);
      expect(validateGearDescription('  ')).toBe(false);
      expect(validateGearDescription('Too short')).toBe(false);
      expect(validateGearDescription('A'.repeat(2001))).toBe(false);
    });
  });

  describe('validateLocation', () => {
    test('accepts valid locations', () => {
      expect(validateLocation('San Francisco', 'CA')).toBe(true);
      expect(validateLocation('New York', 'NY')).toBe(true);
      expect(validateLocation('Austin', 'TX')).toBe(true);
    });

    test('rejects invalid cities', () => {
      expect(validateLocation('', 'CA')).toBe(false);
      expect(validateLocation('  ', 'CA')).toBe(false);
      expect(validateLocation('A'.repeat(101), 'CA')).toBe(false);
    });

    test('rejects invalid states', () => {
      expect(validateLocation('San Francisco', '')).toBe(false);
      expect(validateLocation('San Francisco', 'C')).toBe(false);
      expect(validateLocation('San Francisco', 'CAL')).toBe(false);
      expect(validateLocation('San Francisco', 'ca')).toBe(false);
      expect(validateLocation('San Francisco', '12')).toBe(false);
    });
  });
});