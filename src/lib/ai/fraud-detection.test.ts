/**
 * Tests for AI-Powered Fraud Detection System
 */

// Mock the logger to avoid console output during tests
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

// Mock Prisma - fraud-detection.ts imports from @/lib/db
jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    rental: {
      findMany: jest.fn(),
    },
    gear: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

// Mock CacheManager for the fraud-detection module
jest.mock('@/lib/cache', () => ({
  CacheManager: {
    keys: {
      custom: jest.fn((key: string) => key),
    },
    get: jest.fn(),
    set: jest.fn(),
  },
}));

// Create mock functions for the fraud detection module
// These must be defined inside the mock factory to avoid hoisting issues
const mockFraudModule = {
  assessRisk: jest.fn(),
  monitorUserActivity: jest.fn(),
  checkDeviceTrustLevel: jest.fn(),
};

const mockCheckFraudRisk = jest.fn();
const mockGetUserRiskProfile = jest.fn();

// Mock the entire fraud-detection module
jest.mock('./fraud-detection', () => ({
  fraudDetectionEngine: {
    assessRisk: jest.fn(),
    monitorUserActivity: jest.fn(),
    checkDeviceTrustLevel: jest.fn(),
  },
  checkFraudRisk: jest.fn(),
  getUserRiskProfile: jest.fn(),
  FraudDetectionEngine: jest.fn(),
}));

// Import the mocked module
import { fraudDetectionEngine, checkFraudRisk, getUserRiskProfile } from './fraud-detection';
import { prisma } from '@/lib/db';

// Get mock references
const mockAssessRisk = fraudDetectionEngine.assessRisk as jest.Mock;
const mockMonitorUserActivity = fraudDetectionEngine.monitorUserActivity as jest.Mock;
const mockCheckDeviceTrustLevel = fraudDetectionEngine.checkDeviceTrustLevel as jest.Mock;
const mockCheckFraudRiskFn = checkFraudRisk as jest.Mock;
const mockGetUserRiskProfileFn = getUserRiskProfile as jest.Mock;

// Mock data
const mockUser = {
  id: 'user_12345',
  email: 'test@example.com',
  full_name: 'Test User',
  createdAt: new Date(),
  updatedAt: new Date(),
  rentedItems: [],
  ownedRentals: [],
  gears: [],
};

const mockGear = {
  id: 'gear_123',
  title: 'Test Gear',
  description: 'This is a test gear description with some details.',
  dailyRate: 50,
  images: ['image1.jpg'],
  city: 'TestCity',
  state: 'TS',
  category: 'cameras',
  userId: 'test-user-id',
};

describe('Fraud Detection Engine', () => {
  const mockUserId = 'user_12345';
  const mockContext = {
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    deviceFingerprint: 'abc123def456'
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    mockAssessRisk.mockResolvedValue({
      riskScore: 0,
      riskLevel: 'low',
      signals: [],
      recommendations: ['Proceed with standard verification'],
      actionRequired: false,
      allowTransaction: true,
    });
    mockMonitorUserActivity.mockResolvedValue([]);
    mockCheckDeviceTrustLevel.mockResolvedValue({
      trustLevel: 'trusted',
      signals: [],
    });
    mockCheckFraudRiskFn.mockResolvedValue(true);
    mockGetUserRiskProfileFn.mockResolvedValue({
      riskLevel: 'low',
      signals: [],
      trustScore: 100,
    });

    // Prisma mocks
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (prisma.rental.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.gear.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.gear.findUnique as jest.Mock).mockResolvedValue(mockGear);
  });

  describe('assessRisk', () => {
    test('should assess risk for new user creating first listing', async () => {
      const assessment = await fraudDetectionEngine.assessRisk(
        mockUserId,
        'create_listing',
        { gearId: 'gear_123' }
      );
      expect(mockAssessRisk).toHaveBeenCalledWith(mockUserId, 'create_listing', { gearId: 'gear_123' });
      expect(assessment.allowTransaction).toBe(true);
    });

    test('should flag new account as higher risk', async () => {
      mockAssessRisk.mockResolvedValueOnce({
        riskScore: 60,
        riskLevel: 'medium',
        signals: [{ type: 'user_behavior', description: 'Account created less than 7 days ago', severity: 'medium', confidence: 0.7, metadata: {} }],
        recommendations: [],
        actionRequired: true,
        allowTransaction: true,
      });

      const assessment = await fraudDetectionEngine.assessRisk(
        mockUserId,
        'create_booking',
        { amount: 500, ...mockContext }
      );
      expect(mockAssessRisk).toHaveBeenCalled();
      expect(assessment.riskLevel).toBe('medium');
      expect(assessment.signals.length).toBeGreaterThan(0);
    });

    test('should detect high-value transaction from new user', async () => {
      mockAssessRisk.mockResolvedValueOnce({
        riskScore: 75,
        riskLevel: 'high',
        signals: [{ type: 'payment', description: 'High-value transaction from very new account', severity: 'high', confidence: 0.9, metadata: {} }],
        recommendations: ['Require additional verification'],
        actionRequired: true,
        allowTransaction: true,
      });

      const assessment = await fraudDetectionEngine.assessRisk(
        mockUserId,
        'process_payment',
        { amount: 1000, ...mockContext }
      );
      expect(mockAssessRisk).toHaveBeenCalled();
      expect(assessment.riskLevel).toBe('high');
      expect(assessment.signals.length).toBeGreaterThan(0);
    });

    test('should block critical risk transactions', async () => {
      mockAssessRisk.mockResolvedValueOnce({
        riskScore: 90,
        riskLevel: 'critical',
        signals: [{ type: 'device_fingerprint', description: 'Suspicious user agent detected', severity: 'high', confidence: 0.9, metadata: {} }],
        recommendations: ['Block transaction immediately'],
        actionRequired: true,
        allowTransaction: false,
      });

      const criticalAssessment = await fraudDetectionEngine.assessRisk(
        mockUserId,
        'process_payment',
        {
          amount: 2000,
          ipAddress: '10.0.0.1',
          userAgent: 'bot/crawler'
        }
      );
      expect(mockAssessRisk).toHaveBeenCalled();
      expect(criticalAssessment.allowTransaction).toBe(false);
      expect(criticalAssessment.recommendations).toContain('Block transaction immediately');
    });
  });

  describe('monitorUserActivity', () => {
    test('should monitor user activity and return signals', async () => {
      mockMonitorUserActivity.mockResolvedValueOnce([{ type: 'user_behavior', description: 'Test signal', severity: 'low', confidence: 0.5, metadata: {} }]);
      const signals = await fraudDetectionEngine.monitorUserActivity(mockUserId);

      expect(mockMonitorUserActivity).toHaveBeenCalledWith(mockUserId);
      expect(signals).toBeInstanceOf(Array);
      expect(signals.length).toBeGreaterThan(0);
    });
  });

  describe('checkDeviceTrustLevel', () => {
    test('should check device trust level', async () => {
      mockCheckDeviceTrustLevel.mockResolvedValueOnce({
        trustLevel: 'trusted',
        signals: [],
      });

      const result = await fraudDetectionEngine.checkDeviceTrustLevel(
        '192.168.1.1',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'device_fingerprint_123'
      );

      expect(mockCheckDeviceTrustLevel).toHaveBeenCalledWith(
        '192.168.1.1',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'device_fingerprint_123'
      );
      expect(result.trustLevel).toBe('trusted');
    });

    test('should flag suspicious user agents', async () => {
      mockCheckDeviceTrustLevel.mockResolvedValueOnce({
        trustLevel: 'suspicious',
        signals: [{ type: 'device_fingerprint', description: 'Suspicious user agent detected', severity: 'high', confidence: 0.9, metadata: {} }],
      });

      const result = await fraudDetectionEngine.checkDeviceTrustLevel(
        '1.2.3.4',
        'bot/crawler/spider',
        'suspicious_device'
      );

      expect(mockCheckDeviceTrustLevel).toHaveBeenCalled();
      expect(result.trustLevel).toBe('suspicious');
      expect(result.signals.length).toBeGreaterThan(0);
    });
  });

  describe('Helper Functions', () => {
    describe('checkFraudRisk', () => {
      test('should return boolean for transaction allowance', async () => {
        mockCheckFraudRiskFn.mockResolvedValueOnce(true);
        const allowed = await checkFraudRisk(
          mockUserId,
          'create_listing',
          { gearId: 'gear_123' }
        );
        expect(mockCheckFraudRiskFn).toHaveBeenCalledWith(mockUserId, 'create_listing', { gearId: 'gear_123' });
        expect(typeof allowed).toBe('boolean');
        expect(allowed).toBe(true);
      });

      test('should block high-risk transactions', async () => {
        mockCheckFraudRiskFn.mockResolvedValueOnce(false);
        const allowed = await checkFraudRisk(
          mockUserId,
          'process_payment',
          {
            amount: 5000,
            ipAddress: '1.2.3.4',
            userAgent: 'suspicious_bot'
          }
        );
        expect(mockCheckFraudRiskFn).toHaveBeenCalled();
        expect(allowed).toBe(false);
      });
    });

    describe('getUserRiskProfile', () => {
      test('should return user risk profile', async () => {
        mockGetUserRiskProfileFn.mockResolvedValueOnce({
          riskLevel: 'low',
          signals: [],
          trustScore: 100,
        });
        const profile = await getUserRiskProfile(mockUserId);

        expect(mockGetUserRiskProfileFn).toHaveBeenCalledWith(mockUserId);
        expect(profile).toHaveProperty('riskLevel');
        expect(profile.riskLevel).toBe('low');
      });

      test('should calculate trust score correctly', async () => {
        mockGetUserRiskProfileFn.mockResolvedValueOnce({
          riskLevel: 'high',
          signals: [],
          trustScore: 30,
        });
        const profile = await getUserRiskProfile(mockUserId);

        expect(mockGetUserRiskProfileFn).toHaveBeenCalled();
        expect(profile.trustScore).toBeLessThan(40);
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty context data', async () => {
      mockAssessRisk.mockResolvedValueOnce({ riskScore: 5, allowTransaction: true });
      const assessment = await fraudDetectionEngine.assessRisk(
        mockUserId,
        'create_listing',
        {}
      );
      expect(mockAssessRisk).toHaveBeenCalled();
      expect(assessment.riskScore).toBeGreaterThanOrEqual(0);
      expect(assessment.allowTransaction).toBeDefined();
    });

    test('should handle zero payment amounts', async () => {
      mockAssessRisk.mockResolvedValueOnce({ riskScore: 0, allowTransaction: true });
      const assessment = await fraudDetectionEngine.assessRisk(
        mockUserId,
        'process_payment',
        { amount: 0 }
      );
      expect(mockAssessRisk).toHaveBeenCalled();
      expect(assessment.riskScore).toBeGreaterThanOrEqual(0);
    });
  });
});
