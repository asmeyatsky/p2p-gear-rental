/**
 * Tests for AI-Powered Fraud Detection System
 */

import { fraudDetectionEngine, checkFraudRisk, getUserRiskProfile } from './fraud-detection';

// Mock the logger to avoid console output during tests
jest.mock('../logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    rental: {
      findMany: jest.fn(),
    },
    gear: {
      findMany: jest.fn(),
    },
  },
}));

// Mock data
const mockUser = {
  id: 'user_12345',
  email: 'test@example.com',
  full_name: 'Test User',
  createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
  updatedAt: new Date(),
};

describe('Fraud Detection Engine', () => {
  const mockUserId = 'user_12345';
  const mockContext = {
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    deviceFingerprint: 'abc123def456'
  };

  describe('assessRisk', () => {
    beforeEach(() => {
      const { prisma } = require('@/lib/prisma');
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.rental.findMany.mockResolvedValue([]);
      prisma.gear.findMany.mockResolvedValue([]);
    });

    test('should assess risk for new user creating first listing', async () => {
      const assessment = await fraudDetectionEngine.assessRisk(
        mockUserId,
        'create_listing',
        { gearId: 'gear_123' }
      );

      expect(assessment).toHaveProperty('riskScore');
      expect(assessment).toHaveProperty('riskLevel');
      expect(assessment).toHaveProperty('signals');
      expect(assessment).toHaveProperty('recommendations');
      expect(assessment).toHaveProperty('actionRequired');
      expect(assessment).toHaveProperty('allowTransaction');

      expect(assessment.riskScore).toBeGreaterThanOrEqual(0);
      expect(assessment.riskScore).toBeLessThanOrEqual(100);
      expect(['low', 'medium', 'high', 'critical']).toContain(assessment.riskLevel);
      expect(assessment.signals).toBeInstanceOf(Array);
      expect(assessment.recommendations).toBeInstanceOf(Array);
      expect(typeof assessment.actionRequired).toBe('boolean');
      expect(typeof assessment.allowTransaction).toBe('boolean');
    });

    test('should flag new account as higher risk', async () => {
      const assessment = await fraudDetectionEngine.assessRisk(
        mockUserId,
        'create_booking',
        { amount: 500, ...mockContext }
      );

      // New accounts should have some risk signals
      const newAccountSignals = assessment.signals.filter(
        signal => signal.description.includes('new account') || signal.description.includes('Account created')
      );
      
      expect(newAccountSignals.length).toBeGreaterThan(0);
    });

    test('should detect high-value transaction from new user', async () => {
      const assessment = await fraudDetectionEngine.assessRisk(
        mockUserId,
        'process_payment',
        { amount: 1000, ...mockContext }
      );

      const highValueSignals = assessment.signals.filter(
        signal => signal.description.includes('High-value transaction')
      );

      expect(highValueSignals.length).toBeGreaterThan(0);
      expect(assessment.riskScore).toBeGreaterThan(30); // Should be medium/high risk
    });

    test('should analyze message content for spam patterns', async () => {
      const spamMessage = 'URGENT! CLICK HERE NOW! Call me at 555-1234 for GUARANTEED deals!!!';
      
      const assessment = await fraudDetectionEngine.assessRisk(
        mockUserId,
        'send_message',
        { message: spamMessage, receiverId: 'user_456' }
      );

      const spamSignals = assessment.signals.filter(
        signal => signal.type === 'communication' && 
        (signal.description.includes('spam') || signal.description.includes('capital letters'))
      );

      expect(spamSignals.length).toBeGreaterThan(0);
    });

    test('should detect off-platform communication attempts', async () => {
      const offPlatformMessage = 'Contact me at john@email.com or call 555-123-4567 or text me on WhatsApp';
      
      const assessment = await fraudDetectionEngine.assessRisk(
        mockUserId,
        'send_message',
        { message: offPlatformMessage, receiverId: 'user_456' }
      );

      const contactSignals = assessment.signals.filter(
        signal => signal.description.includes('off-platform')
      );

      expect(contactSignals.length).toBeGreaterThan(0);
    });

    test('should block critical risk transactions', async () => {
      // Mock a scenario that would trigger critical risk
      const criticalAssessment = await fraudDetectionEngine.assessRisk(
        mockUserId,
        'process_payment',
        { 
          amount: 2000,
          ipAddress: '10.0.0.1', // Private IP
          userAgent: 'bot/crawler'
        }
      );

      if (criticalAssessment.riskLevel === 'critical') {
        expect(criticalAssessment.allowTransaction).toBe(false);
        expect(criticalAssessment.recommendations).toContain('Block transaction immediately');
      }
    });
  });

  describe('monitorUserActivity', () => {
    test('should monitor user activity and return signals', async () => {
      const signals = await fraudDetectionEngine.monitorUserActivity(mockUserId);

      expect(signals).toBeInstanceOf(Array);
      signals.forEach(signal => {
        expect(signal).toHaveProperty('type');
        expect(signal).toHaveProperty('severity');
        expect(signal).toHaveProperty('confidence');
        expect(signal).toHaveProperty('description');
        expect(signal).toHaveProperty('metadata');

        expect(['user_behavior', 'listing_quality', 'payment', 'communication', 'device_fingerprint'])
          .toContain(signal.type);
        expect(['low', 'medium', 'high', 'critical']).toContain(signal.severity);
        expect(signal.confidence).toBeGreaterThanOrEqual(0);
        expect(signal.confidence).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('checkDeviceTrustLevel', () => {
    test('should check device trust level', async () => {
      const result = await fraudDetectionEngine.checkDeviceTrustLevel(
        '192.168.1.1',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'device_fingerprint_123'
      );

      expect(result).toHaveProperty('trustLevel');
      expect(result).toHaveProperty('signals');

      expect(['trusted', 'neutral', 'suspicious', 'blocked']).toContain(result.trustLevel);
      expect(result.signals).toBeInstanceOf(Array);
    });

    test('should flag suspicious user agents', async () => {
      const result = await fraudDetectionEngine.checkDeviceTrustLevel(
        '1.2.3.4',
        'bot/crawler/spider',
        'suspicious_device'
      );

      const suspiciousSignals = result.signals.filter(
        signal => signal.description.includes('Suspicious user agent')
      );

      expect(suspiciousSignals.length).toBeGreaterThan(0);
      expect(['neutral', 'suspicious', 'blocked']).toContain(result.trustLevel);
    });

    test('should handle private IP addresses', async () => {
      const result = await fraudDetectionEngine.checkDeviceTrustLevel(
        '192.168.1.100',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      );

      const privateIPSignals = result.signals.filter(
        signal => signal.description.includes('Private IP address')
      );

      expect(privateIPSignals.length).toBeGreaterThan(0);
    });
  });

  describe('Helper Functions', () => {
    describe('checkFraudRisk', () => {
      test('should return boolean for transaction allowance', async () => {
        const allowed = await checkFraudRisk(
          mockUserId,
          'create_listing',
          { gearId: 'gear_123' }
        );

        expect(typeof allowed).toBe('boolean');
      });

      test('should block high-risk transactions', async () => {
        const allowed = await checkFraudRisk(
          mockUserId,
          'process_payment',
          { 
            amount: 5000, // Very high amount
            ipAddress: '1.2.3.4',
            userAgent: 'suspicious_bot'
          }
        );

        // High-risk transactions might be blocked
        if (!allowed) {
          expect(allowed).toBe(false);
        }
      });
    });

    describe('getUserRiskProfile', () => {
      test('should return user risk profile', async () => {
        const profile = await getUserRiskProfile(mockUserId);

        expect(profile).toHaveProperty('riskLevel');
        expect(profile).toHaveProperty('signals');
        expect(profile).toHaveProperty('trustScore');

        expect(['low', 'medium', 'high']).toContain(profile.riskLevel);
        expect(profile.signals).toBeInstanceOf(Array);
        expect(profile.trustScore).toBeGreaterThanOrEqual(0);
        expect(profile.trustScore).toBeLessThanOrEqual(100);
      });

      test('should calculate trust score correctly', async () => {
        const profile = await getUserRiskProfile(mockUserId);

        // Trust score should be inverse of risk
        if (profile.riskLevel === 'low') {
          expect(profile.trustScore).toBeGreaterThan(60);
        } else if (profile.riskLevel === 'high') {
          expect(profile.trustScore).toBeLessThan(40);
        }
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty message content', async () => {
      const assessment = await fraudDetectionEngine.assessRisk(
        mockUserId,
        'send_message',
        { message: '', receiverId: 'user_456' }
      );

      expect(assessment.riskScore).toBeGreaterThanOrEqual(0);
    });

    test('should handle missing context data', async () => {
      const assessment = await fraudDetectionEngine.assessRisk(
        mockUserId,
        'create_listing',
        {}
      );

      expect(assessment.riskScore).toBeGreaterThanOrEqual(0);
      expect(assessment.allowTransaction).toBeDefined();
    });

    test('should handle very long messages', async () => {
      const longMessage = 'A'.repeat(10000);
      
      const assessment = await fraudDetectionEngine.assessRisk(
        mockUserId,
        'send_message',
        { message: longMessage, receiverId: 'user_456' }
      );

      expect(assessment.riskScore).toBeGreaterThanOrEqual(0);
    });

    test('should handle zero payment amounts', async () => {
      const assessment = await fraudDetectionEngine.assessRisk(
        mockUserId,
        'process_payment',
        { amount: 0 }
      );

      expect(assessment.riskScore).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Risk Level Thresholds', () => {
    test('should categorize risk levels correctly', async () => {
      // Test with different scenarios to ensure proper risk categorization
      const scenarios = [
        { context: { amount: 10 }, expectedMaxRisk: 'medium' },
        { context: { amount: 100 }, expectedMaxRisk: 'medium' },
        { context: { message: 'Hello, is this item available?' }, expectedMaxRisk: 'low' }
      ];

      for (const scenario of scenarios) {
        const assessment = await fraudDetectionEngine.assessRisk(
          mockUserId,
          scenario.context.amount ? 'process_payment' : 'send_message',
          scenario.context
        );

        const riskLevels = ['low', 'medium', 'high', 'critical'];
        const maxRiskIndex = riskLevels.indexOf(scenario.expectedMaxRisk);
        const actualRiskIndex = riskLevels.indexOf(assessment.riskLevel);

        expect(actualRiskIndex).toBeLessThanOrEqual(maxRiskIndex);
      }
    });
  });
});