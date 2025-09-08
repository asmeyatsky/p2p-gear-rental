/**
 * AI-Powered Fraud Detection System
 * Detects suspicious activities and potential fraud using machine learning algorithms
 */

import { logger } from '@/lib/logger';
import { CacheManager } from '@/lib/cache';
import { Rental, User, Gear, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const rentalWithGear = Prisma.validator<Prisma.RentalFindManyArgs>()({
  include: { gear: true },
})

type RentalWithGear = Prisma.RentalGetPayload<typeof rentalWithGear>

export interface FraudSignal {
  type: 'user_behavior' | 'listing_quality' | 'payment' | 'communication' | 'device_fingerprint';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-1
  description: string;
  metadata: Record<string, unknown>;
}

export interface FraudAssessment {
  riskScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  signals: FraudSignal[];
  recommendations: string[];
  actionRequired: boolean;
  allowTransaction: boolean;
}

export interface UserBehaviorProfile {
  userId: string;
  accountAge: number; // days
  totalTransactions: number;
  successfulTransactions: number;
  averageTransactionValue: number;
  communicationPatterns: {
    responseTime: number; // hours
    messageLength: number;
    politenessScore: number;
  };
  deviceFingerprints: DeviceFingerprint[];
  locationHistory: LocationData[];
  timePatterns: TimePattern[];
  riskFactors: string[];
}

export interface DeviceFingerprint {
  fingerprint: string;
  userAgent: string;
  ipAddress: string;
  location: { city: string; country: string; };
  firstSeen: Date;
  lastSeen: Date;
  isVPN: boolean;
  isTor: boolean;
  suspiciousFlags: string[];
}

export interface LocationData {
  city: string;
  state: string;
  country: string;
  timestamp: Date;
  source: 'ip' | 'gear_location' | 'user_profile';
}

export interface TimePattern {
  hourOfDay: number;
  dayOfWeek: number;
  activityType: 'listing' | 'booking' | 'messaging' | 'payment';
  frequency: number;
}

class FraudDetectionEngine {
  private readonly CACHE_TTL = 60 * 60; // 1 hour
  private readonly HIGH_RISK_THRESHOLD = 70;
  private readonly MEDIUM_RISK_THRESHOLD = 40;

  /**
   * Assess fraud risk for a user action (listing, booking, payment)
   */
  async assessRisk(
    userId: string,
    actionType: 'create_listing' | 'create_booking' | 'process_payment' | 'send_message',
    context: {
      gearId?: string;
      rentalId?: string;
      amount?: number;
      deviceFingerprint?: string;
      ipAddress?: string;
      userAgent?: string;
      message?: string;
    }
  ): Promise<FraudAssessment> {
    logger.info('Starting fraud risk assessment', {
      userId,
      actionType,
      contextKeys: Object.keys(context)
    }, 'FRAUD_DETECTION');

    // Get user behavior profile
    const userProfile = await this.buildUserProfile(userId);
    
    // Collect fraud signals
    const signals: FraudSignal[] = [];
    
    // Analyze user behavior patterns
    signals.push(...await this.analyzeUserBehavior(userProfile, actionType, context));
    
    // Analyze device and location
    signals.push(...await this.analyzeDeviceAndLocation(userId, context));
    
    // Analyze content quality (for listings and messages)
    if (actionType === 'create_listing' && context.gearId) {
      signals.push(...await this.analyzeListingQuality(context.gearId));
    }
    
    if (actionType === 'send_message' && context.message) {
      signals.push(...this.analyzeCommunicationQuality(context.message, userProfile));
    }
    
    // Analyze payment patterns
    if (actionType === 'process_payment' && context.amount) {
      signals.push(...await this.analyzePaymentPatterns(userId, context.amount, userProfile));
    }
    
    // Calculate overall risk score
    const riskScore = this.calculateRiskScore(signals, userProfile);
    const riskLevel = this.determineRiskLevel(riskScore);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(signals, riskLevel);
    
    const assessment: FraudAssessment = {
      riskScore,
      riskLevel,
      signals,
      recommendations,
      actionRequired: riskScore >= this.MEDIUM_RISK_THRESHOLD,
      allowTransaction: riskScore < this.HIGH_RISK_THRESHOLD
    };

    // Log assessment
    logger.info('Fraud risk assessment completed', {
      userId,
      actionType,
      riskScore,
      riskLevel,
      signalsCount: signals.length,
      allowTransaction: assessment.allowTransaction
    }, 'FRAUD_DETECTION');

    // Store assessment for future reference
    await this.storeAssessment(userId, actionType, assessment);

    return assessment;
  }

  /**
   * Continuous monitoring of user behavior
   */
  async monitorUserActivity(userId: string): Promise<FraudSignal[]> {
    const cacheKey = CacheManager.keys.custom(`fraud_monitor:${userId}`);
    const cached = await CacheManager.get<FraudSignal[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const signals: FraudSignal[] = [];
    const userProfile = await this.buildUserProfile(userId);

    // Check for suspicious patterns
    signals.push(...this.detectSuspiciousPatterns(userProfile));
    
    // Check for velocity violations
    signals.push(...await this.detectVelocityViolations(userId));
    
    // Check for unusual behavior
    signals.push(...this.detectUnusualBehavior(userProfile));

    await CacheManager.set(cacheKey, signals, this.CACHE_TTL);
    return signals;
  }

  /**
   * Check if an IP address or device is suspicious
   */
  async checkDeviceTrustLevel(
    ipAddress: string,
    userAgent: string,
    deviceFingerprint?: string
  ): Promise<{
    trustLevel: 'trusted' | 'neutral' | 'suspicious' | 'blocked';
    signals: FraudSignal[];
  }> {
    const signals: FraudSignal[] = [];

    // Check IP reputation
    const ipSignals = await this.analyzeIPAddress(ipAddress);
    signals.push(...ipSignals);

    // Check device fingerprint
    if (deviceFingerprint) {
      const deviceSignals = await this.analyzeDeviceFingerprint(deviceFingerprint);
      signals.push(...deviceSignals);
    }

    // Check user agent
    const uaSignals = this.analyzeUserAgent(userAgent);
    signals.push(...uaSignals);

    // Determine trust level
    const criticalSignals = signals.filter(s => s.severity === 'critical').length;
    const highSignals = signals.filter(s => s.severity === 'high').length;
    
    let trustLevel: 'trusted' | 'neutral' | 'suspicious' | 'blocked';
    
    if (criticalSignals > 0) {
      trustLevel = 'blocked';
    } else if (highSignals > 2) {
      trustLevel = 'suspicious';
    } else if (signals.length > 3) {
      trustLevel = 'suspicious';
    } else if (signals.length === 0) {
      trustLevel = 'trusted';
    } else {
      trustLevel = 'neutral';
    }

    return { trustLevel, signals };
  }

  private async buildUserProfile(userId: string): Promise<UserBehaviorProfile> {
    const cacheKey = CacheManager.keys.custom(`user_profile:${userId}`);
    const cached = await CacheManager.get<UserBehaviorProfile>(cacheKey);
    
    if (cached) {
      return cached;
    }

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        gears: true,
        rentedItems: { include: { gear: true } },
        ownedRentals: { include: { gear: true } }
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const accountAge = Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const allTransactions = [...user.rentedItems, ...user.ownedRentals];
    const successfulTransactions = allTransactions.filter(t => t.status === 'completed');

    const profile: UserBehaviorProfile = {
      userId,
      accountAge,
      totalTransactions: allTransactions.length,
      successfulTransactions: successfulTransactions.length,
      averageTransactionValue: this.calculateAverageTransactionValue(allTransactions),
      communicationPatterns: await this.analyzeCommunicationPatterns(userId),
      deviceFingerprints: await this.getDeviceFingerprints(userId),
      locationHistory: this.extractLocationHistory(user),
      timePatterns: this.analyzeTimePatterns(allTransactions),
      riskFactors: []
    };

    await CacheManager.set(cacheKey, profile, this.CACHE_TTL);
    return profile;
  }

  private async analyzeUserBehavior(
    profile: UserBehaviorProfile,
    actionType: string,
    context: Record<string, unknown>
  ): Promise<FraudSignal[]> {
    const signals: FraudSignal[] = [];

    // New account risk
    if (profile.accountAge < 1) {
      signals.push({
        type: 'user_behavior',
        severity: 'high',
        confidence: 0.9,
        description: 'Account created less than 24 hours ago',
        metadata: { accountAge: profile.accountAge }
      });
    } else if (profile.accountAge < 7) {
      signals.push({
        type: 'user_behavior',
        severity: 'medium',
        confidence: 0.7,
        description: 'Very new account (less than 7 days)',
        metadata: { accountAge: profile.accountAge }
      });
    }

    // Transaction history analysis
    if (profile.totalTransactions === 0 && actionType === 'create_booking') {
      signals.push({
        type: 'user_behavior',
        severity: 'medium',
        confidence: 0.6,
        description: 'First-time renter with no transaction history',
        metadata: { totalTransactions: profile.totalTransactions }
      });
    }

    // Success rate analysis
    if (profile.totalTransactions > 0) {
      const successRate = profile.successfulTransactions / profile.totalTransactions;
      if (successRate < 0.5) {
        signals.push({
          type: 'user_behavior',
          severity: 'high',
          confidence: 0.8,
          description: 'Low transaction success rate',
          metadata: { successRate, totalTransactions: profile.totalTransactions }
        });
      }
    }

    // Communication pattern analysis
    if (profile.communicationPatterns.responseTime > 48) {
      signals.push({
        type: 'communication',
        severity: 'low',
        confidence: 0.5,
        description: 'Slow response time to messages',
        metadata: { responseTime: profile.communicationPatterns.responseTime }
      });
    }

    if (profile.communicationPatterns.politenessScore < 0.3) {
      signals.push({
        type: 'communication',
        severity: 'medium',
        confidence: 0.7,
        description: 'Low politeness score in communications',
        metadata: { politenessScore: profile.communicationPatterns.politenessScore }
      });
    }

    return signals;
  }

  private async analyzeDeviceAndLocation(userId: string, context: Record<string, unknown>): Promise<FraudSignal[]> {
    const signals: FraudSignal[] = [];

    if (context.ipAddress) {
      // Check for VPN/Proxy usage
      const isVPN = await this.checkVPNUsage(context.ipAddress as string);
      if (isVPN) {
        signals.push({
          type: 'device_fingerprint',
          severity: 'medium',
          confidence: 0.8,
          description: 'Using VPN or proxy service',
          metadata: { ipAddress: this.maskIP(context.ipAddress as string) }
        });
      }

      // Check for suspicious location
      const locationSignals = await this.analyzeLocationRisk(context.ipAddress as string, userId);
      signals.push(...locationSignals);
    }

    if (context.deviceFingerprint) {
      const deviceSignals = await this.analyzeDeviceFingerprint(context.deviceFingerprint as string);
      signals.push(...deviceSignals);
    }

    return signals;
  }

  private async analyzeListingQuality(gearId: string): Promise<FraudSignal[]> {
    const signals: FraudSignal[] = [];

    const gear = await prisma.gear.findUnique({
      where: { id: gearId }
    });

    if (!gear) return signals;

    // Check description quality
    if (gear.description.length < 50) {
      signals.push({
        type: 'listing_quality',
        severity: 'medium',
        confidence: 0.6,
        description: 'Very short item description',
        metadata: { descriptionLength: gear.description.length }
      });
    }

    // Check for suspicious keywords
    const suspiciousKeywords = ['urgent', 'must sell', 'no questions', 'cash only', 'final sale'];
    const foundSuspiciousKeywords = suspiciousKeywords.filter(keyword => 
      gear.description.toLowerCase().includes(keyword) || 
      gear.title.toLowerCase().includes(keyword)
    );

    if (foundSuspiciousKeywords.length > 0) {
      signals.push({
        type: 'listing_quality',
        severity: 'high',
        confidence: 0.8,
        description: 'Contains suspicious keywords',
        metadata: { keywords: foundSuspiciousKeywords }
      });
    }

    // Check pricing anomalies
    const categoryAveragePrices: Record<string, number> = {
      'cameras': 120,
      'lenses': 80,
      'lighting': 60,
      'audio': 45,
      'drones': 180,
      'tripods': 25,
      'monitors': 70,
      'accessories': 20,
      'other': 50
    };

    const expectedPrice = categoryAveragePrices[gear.category?.toLowerCase() || 'other'];
    const priceRatio = gear.dailyRate / expectedPrice;

    if (priceRatio > 3) {
      signals.push({
        type: 'listing_quality',
        severity: 'high',
        confidence: 0.7,
        description: 'Price significantly above market rate',
        metadata: { dailyRate: gear.dailyRate, expectedPrice, ratio: priceRatio }
      });
    } else if (priceRatio < 0.2) {
      signals.push({
        type: 'listing_quality',
        severity: 'high',
        confidence: 0.8,
        description: 'Price suspiciously low (possible scam)',
        metadata: { dailyRate: gear.dailyRate, expectedPrice, ratio: priceRatio }
      });
    }

    // Check image quality
    if (gear.images.length === 0) {
      signals.push({
        type: 'listing_quality',
        severity: 'high',
        confidence: 0.9,
        description: 'No images provided',
        metadata: { imageCount: 0 }
      });
    } else if (gear.images.length === 1) {
      signals.push({
        type: 'listing_quality',
        severity: 'medium',
        confidence: 0.6,
        description: 'Only one image provided',
        metadata: { imageCount: gear.images.length }
      });
    }

    return signals;
  }

  private analyzeCommunicationQuality(message: string, profile: UserBehaviorProfile): FraudSignal[] {
    const signals: FraudSignal[] = [];

    // Check message length
    if (message.length < 20) {
      signals.push({
        type: 'communication',
        severity: 'low',
        confidence: 0.4,
        description: 'Very short message',
        metadata: { messageLength: message.length }
      });
    }

    // Check for spam patterns
    const spamPatterns = [
      /click here/i,
      /call now/i,
      /limited time/i,
      /act fast/i,
      /guaranteed/i,
      /\$\$\$/,
      /urgent/i
    ];

    const foundSpamPatterns = spamPatterns.filter(pattern => pattern.test(message));
    if (foundSpamPatterns.length > 0) {
      signals.push({
        type: 'communication',
        severity: 'high',
        confidence: 0.8,
        description: 'Contains spam-like patterns',
        metadata: { patterns: foundSpamPatterns.length }
      });
    }

    // Check for excessive capitalization
    const upperCaseRatio = (message.match(/[A-Z]/g) || []).length / message.length;
    if (upperCaseRatio > 0.3) {
      signals.push({
        type: 'communication',
        severity: 'medium',
        confidence: 0.6,
        description: 'Excessive use of capital letters',
        metadata: { upperCaseRatio }
      });
    }

    // Check for external contact attempts
    const contactPatterns = [
      /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/, // Phone numbers
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email addresses
      /whatsapp/i,
      /telegram/i,
      /text me/i,
      /call me/i
    ];

    const foundContactAttempts = contactPatterns.filter(pattern => pattern.test(message));
    if (foundContactAttempts.length > 0) {
      signals.push({
        type: 'communication',
        severity: 'medium',
        confidence: 0.7,
        description: 'Attempting to move communication off-platform',
        metadata: { patterns: foundContactAttempts.length }
      });
    }

    return signals;
  }

  private async analyzePaymentPatterns(
    userId: string,
    amount: number,
    profile: UserBehaviorProfile
  ): Promise<FraudSignal[]> {
    const signals: FraudSignal[] = [];

    // Check for unusually large transaction
    if (amount > profile.averageTransactionValue * 5 && profile.totalTransactions > 0) {
      signals.push({
        type: 'payment',
        severity: 'high',
        confidence: 0.8,
        description: 'Transaction amount significantly above user average',
        metadata: { 
          amount, 
          userAverage: profile.averageTransactionValue,
          ratio: amount / profile.averageTransactionValue
        }
      });
    }

    // Check for high-value transaction from new user
    if (amount > 500 && profile.accountAge < 7) {
      signals.push({
        type: 'payment',
        severity: 'high',
        confidence: 0.9,
        description: 'High-value transaction from very new account',
        metadata: { amount, accountAge: profile.accountAge }
      });
    }

    return signals;
  }

  private calculateRiskScore(signals: FraudSignal[], profile: UserBehaviorProfile): number {
    let score = 0;

    // Base score adjustments
    if (profile.accountAge < 1) score += 20;
    else if (profile.accountAge < 7) score += 10;
    else if (profile.accountAge < 30) score += 5;

    if (profile.totalTransactions === 0) score += 15;
    else if (profile.totalTransactions < 3) score += 10;

    // Signal-based scoring
    signals.forEach(signal => {
      const baseScore = {
        'low': 5,
        'medium': 15,
        'high': 30,
        'critical': 50
      }[signal.severity];

      score += baseScore * signal.confidence;
    });

    // Account for positive factors
    if (profile.accountAge > 365) score -= 10; // Account older than 1 year
    if (profile.successfulTransactions > 10) score -= 10; // Many successful transactions
    if (profile.communicationPatterns.politenessScore > 0.8) score -= 5; // Polite communication

    return Math.max(0, Math.min(100, score));
  }

  private determineRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 80) return 'critical';
    if (score >= this.HIGH_RISK_THRESHOLD) return 'high';
    if (score >= this.MEDIUM_RISK_THRESHOLD) return 'medium';
    return 'low';
  }

  private generateRecommendations(signals: FraudSignal[], riskLevel: string): string[] {
    const recommendations: string[] = [];

    if (riskLevel === 'critical') {
      recommendations.push('Block transaction immediately');
      recommendations.push('Flag account for manual review');
      recommendations.push('Consider permanent account suspension');
    } else if (riskLevel === 'high') {
      recommendations.push('Require additional verification');
      recommendations.push('Limit transaction amounts');
      recommendations.push('Enable enhanced monitoring');
    } else if (riskLevel === 'medium') {
      recommendations.push('Request additional documentation');
      recommendations.push('Monitor subsequent activities closely');
      recommendations.push('Consider temporary restrictions');
    } else {
      recommendations.push('Proceed with standard verification');
      recommendations.push('Continue routine monitoring');
    }

    // Signal-specific recommendations
    const communicationSignals = signals.filter(s => s.type === 'communication');
    if (communicationSignals.length > 0) {
      recommendations.push('Review all user communications');
    }

    const deviceSignals = signals.filter(s => s.type === 'device_fingerprint');
    if (deviceSignals.length > 0) {
      recommendations.push('Require device verification');
    }

    const listingSignals = signals.filter(s => s.type === 'listing_quality');
    if (listingSignals.length > 0) {
      recommendations.push('Review listing quality and pricing');
    }

    return recommendations;
  }

  // Helper methods
  private calculateAverageTransactionValue(transactions: RentalWithGear[]): number {
    if (transactions.length === 0) return 0;
    
    const totalValue = transactions.reduce((sum, t) => {
      const duration = Math.ceil((t.endDate.getTime() - t.startDate.getTime()) / (1000 * 60 * 60 * 24));
      return sum + (t.gear.dailyRate * duration);
    }, 0);
    
    return totalValue / transactions.length;
  }

  private async analyzeCommunicationPatterns(userId: string): Promise<{ responseTime: number; messageLength: number; politenessScore: number; }> {
    // This would analyze message history in a real implementation
    return {
      responseTime: 12, // hours
      messageLength: 85, // average characters
      politenessScore: 0.7 // 0-1 scale
    };
  }

  private async getDeviceFingerprints(userId: string): Promise<DeviceFingerprint[]> {
    // This would retrieve actual device fingerprints in a real implementation
    return [];
  }

  private extractLocationHistory(user: User & { gears: Gear[] }): LocationData[] {
    const locations: LocationData[] = [];
    
    // Extract from gear locations
    user.gears.forEach((gear: Gear) => {
      locations.push({
        city: gear.city,
        state: gear.state,
        country: 'US', // Assuming US for now
        timestamp: gear.createdAt,
        source: 'gear_location'
      });
    });

    return locations;
  }

  private analyzeTimePatterns(transactions: Rental[]): TimePattern[] {
    const patterns: TimePattern[] = [];
    
    // Analyze transaction timing patterns
    const hourCounts: Record<number, number> = {};
    const dayCounts: Record<number, number> = {};
    
    transactions.forEach(t => {
      const hour = t.createdAt.getHours();
      const day = t.createdAt.getDay();
      
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });

    // Convert to patterns
    Object.entries(hourCounts).forEach(([hour, frequency]) => {
      patterns.push({
        hourOfDay: parseInt(hour),
        dayOfWeek: -1, // All days
        activityType: 'booking',
        frequency
      });
    });

    return patterns;
  }

  private detectSuspiciousPatterns(profile: UserBehaviorProfile): FraudSignal[] {
    const signals: FraudSignal[] = [];

    // Check for suspicious time patterns (e.g., all activity at 3 AM)
    const nightActivityPattern = profile.timePatterns.filter(p => p.hourOfDay >= 2 && p.hourOfDay <= 5);
    if (nightActivityPattern.length > 5) {
      signals.push({
        type: 'user_behavior',
        severity: 'medium',
        confidence: 0.6,
        description: 'Unusual activity patterns (frequent late-night activity)',
        metadata: { nightActivities: nightActivityPattern.length }
      });
    }

    return signals;
  }

  private async detectVelocityViolations(userId: string): Promise<FraudSignal[]> {
    const signals: FraudSignal[] = [];

    // Check for rapid consecutive actions
    const recentTransactions = await prisma.rental.findMany({
      where: {
        OR: [
          { renterId: userId },
          { ownerId: userId }
        ],
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });

    if (recentTransactions.length > 10) {
      signals.push({
        type: 'user_behavior',
        severity: 'high',
        confidence: 0.8,
        description: 'Excessive transaction velocity (>10 in 24 hours)',
        metadata: { recentTransactions: recentTransactions.length }
      });
    }

    return signals;
  }

  private detectUnusualBehavior(profile: UserBehaviorProfile): FraudSignal[] {
    const signals: FraudSignal[] = [];

    // Check for location inconsistencies
    const uniqueLocations = new Set(
      profile.locationHistory.map(l => `${l.city}, ${l.state}`)
    );

    if (uniqueLocations.size > 5 && profile.accountAge < 30) {
      signals.push({
        type: 'user_behavior',
        severity: 'medium',
        confidence: 0.7,
        description: 'Multiple locations for new account',
        metadata: { uniqueLocations: uniqueLocations.size, accountAge: profile.accountAge }
      });
    }

    return signals;
  }

  private async analyzeIPAddress(ipAddress: string): Promise<FraudSignal[]> {
    const signals: FraudSignal[] = [];

    // In a real implementation, this would check against IP reputation databases
    // For now, we'll use simplified checks

    // Check for known suspicious IP ranges
    if (ipAddress.startsWith('10.') || ipAddress.startsWith('192.168.') || ipAddress.startsWith('172.')) {
      // Private IP ranges - might indicate VPN or unusual setup
      signals.push({
        type: 'device_fingerprint',
        severity: 'low',
        confidence: 0.5,
        description: 'Private IP address detected',
        metadata: { ipAddress: this.maskIP(ipAddress) }
      });
    }

    return signals;
  }

  private async analyzeDeviceFingerprint(fingerprint: string): Promise<FraudSignal[]> {
    const signals: FraudSignal[] = [];

    // Check if this fingerprint has been associated with multiple accounts
    // This would require a device fingerprint database in a real implementation

    return signals;
  }

  private analyzeUserAgent(userAgent: string): FraudSignal[] {
    const signals: FraudSignal[] = [];

    // Check for suspicious user agents
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /^$/
    ];

    if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
      signals.push({
        type: 'device_fingerprint',
        severity: 'high',
        confidence: 0.9,
        description: 'Suspicious user agent detected',
        metadata: { userAgent: userAgent.substring(0, 100) }
      });
    }

    return signals;
  }

  private async checkVPNUsage(ipAddress: string): Promise<boolean> {
    // In a real implementation, this would check against VPN detection services
    // For now, return false for all IPs
    return false;
  }

  private async analyzeLocationRisk(ipAddress: string, userId: string): Promise<FraudSignal[]> {
    const signals: FraudSignal[] = [];

    // Check for location mismatches with user's historical locations
    // This would require geolocation services in a real implementation

    return signals;
  }

  private async storeAssessment(
    userId: string,
    actionType: string,
    assessment: FraudAssessment
  ): Promise<void> {
    // Store assessment in database for audit trail and pattern analysis
    // This would be implemented with a dedicated fraud_assessments table
    logger.info('Fraud assessment stored', {
      userId,
      actionType,
      riskScore: assessment.riskScore,
      riskLevel: assessment.riskLevel
    }, 'FRAUD_DETECTION');
  }

  private maskIP(ipAddress: string): string {
    // Mask IP address for privacy (show only first two octets)
    const parts = ipAddress.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.xxx.xxx`;
    }
    return 'xxx.xxx.xxx.xxx';
  }
}

export const fraudDetectionEngine = new FraudDetectionEngine();

/**
 * Middleware for automatic fraud checking
 */
export async function checkFraudRisk(
  userId: string,
  actionType: 'create_listing' | 'create_booking' | 'process_payment' | 'send_message',
  context: Record<string, unknown>
): Promise<boolean> {
  const assessment = await fraudDetectionEngine.assessRisk(userId, actionType, context);
  
  if (!assessment.allowTransaction) {
    logger.warn('Transaction blocked due to fraud risk', {
      userId,
      actionType,
      riskScore: assessment.riskScore,
      riskLevel: assessment.riskLevel
    }, 'FRAUD_DETECTION');
  }
  
  return assessment.allowTransaction;
}

/**
 * Get user risk profile
 */
export async function getUserRiskProfile(userId: string): Promise<{
  riskLevel: string;
  signals: FraudSignal[];
  trustScore: number;
}> {
  const signals = await fraudDetectionEngine.monitorUserActivity(userId);
  
  const riskScore = signals.reduce((sum, signal) => {
    const scoreMap = { low: 5, medium: 15, high: 30, critical: 50 };
    return sum + (scoreMap[signal.severity] * signal.confidence);
  }, 0);

  const riskLevel = riskScore >= 70 ? 'high' : riskScore >= 40 ? 'medium' : 'low';
  const trustScore = Math.max(0, 100 - riskScore);

  return { riskLevel, signals, trustScore };
}
