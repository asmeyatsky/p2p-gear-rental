/**
 * Semantic Search Engine
 * Provides intelligent search with natural language understanding
 */

import { logger } from '@/lib/logger';
import { CacheManager } from '@/lib/cache';
import { prisma } from '@/lib/prisma';

export interface SemanticSearchQuery {
  originalQuery: string;
  processedQuery: string;
  intent: SearchIntent;
  entities: SearchEntity[];
  filters: SearchFilters;
  confidence: number;
}

export interface SearchIntent {
  type: 'find_item' | 'compare' | 'browse' | 'price_check' | 'availability';
  confidence: number;
  modifiers: string[]; // 'urgent', 'professional', 'budget', etc.
}

export interface SearchEntity {
  type: 'category' | 'brand' | 'model' | 'feature' | 'location' | 'price' | 'condition' | 'event_type';
  value: string;
  confidence: number;
  aliases: string[];
}

export interface SearchFilters {
  category?: string;
  brand?: string;
  model?: string;
  priceRange?: { min: number; max: number };
  location?: { city: string; state: string; radius: number };
  condition?: string;
  features?: string[];
  eventType?: string;
  dateRange?: { start: Date; end: Date };
}

export interface SemanticSearchResult {
  gearId: string;
  title: string;
  description: string;
  relevanceScore: number;
  semanticScore: number;
  matchingEntities: SearchEntity[];
  highlights: string[];
  reasoning: string[];
}

class SemanticSearchEngine {
  private readonly CACHE_TTL = 15 * 60; // 15 minutes
  
  // Equipment knowledge base
  private readonly categoryAliases = {
    'camera': ['cam', 'camera', 'dslr', 'mirrorless', 'photo', 'photography'],
    'lens': ['lens', 'glass', 'optics', 'zoom', 'prime', 'telephoto', 'wide'],
    'lighting': ['light', 'lighting', 'strobe', 'softbox', 'key light', 'fill light'],
    'audio': ['microphone', 'mic', 'sound', 'audio', 'recorder', 'boom'],
    'drone': ['drone', 'uav', 'quadcopter', 'aerial', 'dji'],
    'tripod': ['tripod', 'stand', 'support', 'monopod', 'stabilizer'],
    'monitor': ['monitor', 'screen', 'display', 'viewfinder'],
    'accessories': ['accessory', 'cable', 'battery', 'charger', 'case', 'bag']
  };

  private readonly brandAliases = {
    'canon': ['canon', 'eos'],
    'nikon': ['nikon', 'nikkor'],
    'sony': ['sony', 'alpha', 'fx'],
    'panasonic': ['panasonic', 'lumix', 'gh'],
    'fujifilm': ['fuji', 'fujifilm', 'xt', 'xh'],
    'red': ['red', 'weapon', 'epic'],
    'arri': ['arri', 'alexa'],
    'blackmagic': ['blackmagic', 'bmpcc', 'ursa'],
    'dji': ['dji', 'mavic', 'phantom', 'inspire'],
    'sennheiser': ['sennheiser', 'mkh'],
    'rode': ['rode', 'videomic', 'procaster'],
    'shure': ['shure', 'sm58', 'beta']
  };

  private readonly eventTypeAliases = {
    'wedding': ['wedding', 'marriage', 'ceremony', 'reception', 'bridal'],
    'corporate': ['corporate', 'business', 'conference', 'meeting', 'presentation'],
    'concert': ['concert', 'music', 'performance', 'stage', 'live'],
    'film': ['film', 'movie', 'cinema', 'documentary', 'short'],
    'photography': ['photo', 'photoshoot', 'portrait', 'headshot', 'fashion'],
    'sports': ['sports', 'athletic', 'game', 'tournament', 'competition'],
    'travel': ['travel', 'vacation', 'trip', 'adventure', 'tourism']
  };

  private readonly featureKeywords = {
    'professional': ['professional', 'pro', 'commercial', 'industry'],
    'budget': ['budget', 'cheap', 'affordable', 'economic', 'low-cost'],
    'portable': ['portable', 'compact', 'lightweight', 'travel'],
    'wireless': ['wireless', 'wifi', 'bluetooth', 'remote'],
    'waterproof': ['waterproof', 'weather-sealed', 'rugged'],
    '4k': ['4k', 'uhd', 'ultra hd', 'high resolution'],
    'vintage': ['vintage', 'classic', 'retro', 'film']
  };

  /**
   * Parse natural language search query into structured format
   */
  async parseQuery(query: string): Promise<SemanticSearchQuery> {
    const cacheKey = CacheManager.keys.custom(`semantic_parse:${query}`);
    const cached = await CacheManager.get<SemanticSearchQuery>(cacheKey);
    
    if (cached) {
      return cached;
    }

    logger.info('Parsing semantic search query', { query }, 'SEMANTIC_SEARCH');

    const processedQuery = this.preprocessQuery(query);
    const intent = this.extractIntent(processedQuery);
    const entities = this.extractEntities(processedQuery);
    const filters = this.buildFilters(entities);
    
    const confidence = this.calculateParsingConfidence(intent, entities);

    const result: SemanticSearchQuery = {
      originalQuery: query,
      processedQuery,
      intent,
      entities,
      filters,
      confidence
    };

    await CacheManager.set(cacheKey, result, this.CACHE_TTL);
    
    logger.info('Query parsed successfully', {
      query,
      intent: intent.type,
      entitiesFound: entities.length,
      confidence
    }, 'SEMANTIC_SEARCH');

    return result;
  }

  /**
   * Perform semantic search with natural language understanding
   */
  async search(
    query: string,
    userId?: string,
    maxResults: number = 20
  ): Promise<{
    results: SemanticSearchResult[];
    parsedQuery: SemanticSearchQuery;
    suggestions: string[];
    totalMatches: number;
  }> {
    const parsedQuery = await this.parseQuery(query);
    
    // Get candidate gear based on parsed filters
    const candidates = await this.getCandidateGear(parsedQuery.filters, maxResults * 3);
    
    // Score each candidate using semantic matching
    const scoredResults = await Promise.all(
      candidates.map(gear => this.scoreGearRelevance(gear, parsedQuery))
    );
    
    // Sort by relevance and take top results
    const results = scoredResults
      .filter(result => result.semanticScore > 0.3)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxResults);

    // Generate query suggestions
    const suggestions = this.generateQuerySuggestions(parsedQuery);

    logger.info('Semantic search completed', {
      query,
      candidatesFound: candidates.length,
      resultsReturned: results.length,
      avgRelevance: results.reduce((sum, r) => sum + r.relevanceScore, 0) / results.length
    }, 'SEMANTIC_SEARCH');

    return {
      results,
      parsedQuery,
      suggestions,
      totalMatches: scoredResults.length
    };
  }

  /**
   * Get search suggestions based on partial query
   */
  async getSearchSuggestions(partialQuery: string, limit: number = 8): Promise<string[]> {
    if (partialQuery.length < 2) return [];

    const suggestions: string[] = [];
    const lowerQuery = partialQuery.toLowerCase();

    // Category suggestions
    Object.keys(this.categoryAliases).forEach(category => {
      if (category.startsWith(lowerQuery) || 
          this.categoryAliases[category as keyof typeof this.categoryAliases].some(alias => alias.startsWith(lowerQuery))) {
        suggestions.push(category);
        suggestions.push(`${category} rental`);
        suggestions.push(`professional ${category}`);
      }
    });

    // Brand suggestions
    Object.keys(this.brandAliases).forEach(brand => {
      if (brand.startsWith(lowerQuery) || 
          this.brandAliases[brand as keyof typeof this.brandAliases].some(alias => alias.startsWith(lowerQuery))) {
        suggestions.push(brand);
        suggestions.push(`${brand} camera`);
        suggestions.push(`${brand} lens`);
      }
    });

    // Event type suggestions
    Object.keys(this.eventTypeAliases).forEach(eventType => {
      if (eventType.startsWith(lowerQuery) || 
          this.eventTypeAliases[eventType as keyof typeof this.eventTypeAliases].some(alias => alias.startsWith(lowerQuery))) {
        suggestions.push(`${eventType} equipment`);
        suggestions.push(`${eventType} photography`);
        suggestions.push(`equipment for ${eventType}`);
      }
    });

    // Popular search patterns
    const popularPatterns = [
      'camera for wedding',
      'professional lighting',
      'drone for real estate',
      'audio equipment for podcast',
      'lens for portrait photography',
      'budget friendly camera',
      'waterproof camera',
      '4k video camera'
    ];

    popularPatterns.forEach(pattern => {
      if (pattern.includes(lowerQuery)) {
        suggestions.push(pattern);
      }
    });

    return [...new Set(suggestions)].slice(0, limit);
  }

  private preprocessQuery(query: string): string {
    return query
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, ' ')
      .replace(/\s+/g, ' ');
  }

  private extractIntent(query: string): SearchIntent {
    const intentPatterns = {
      'find_item': ['need', 'looking for', 'want', 'find', 'get', 'rent'],
      'compare': ['compare', 'vs', 'versus', 'difference', 'better'],
      'browse': ['show me', 'browse', 'see', 'what'],
      'price_check': ['price', 'cost', 'how much', 'expensive', 'cheap'],
      'availability': ['available', 'when', 'book', 'reserve']
    };

    let bestMatch: { type: string; confidence: number } = { type: 'browse', confidence: 0.3 };

    Object.entries(intentPatterns).forEach(([intentType, patterns]) => {
      const matches = patterns.filter(pattern => query.includes(pattern));
      if (matches.length > 0) {
        const confidence = Math.min(0.9, 0.4 + (matches.length * 0.2));
        if (confidence > bestMatch.confidence) {
          bestMatch = { type: intentType, confidence };
        }
      }
    });

    // Extract modifiers
    const modifiers: string[] = [];
    Object.keys(this.featureKeywords).forEach(feature => {
      if (this.featureKeywords[feature as keyof typeof this.featureKeywords].some(keyword => query.includes(keyword))) {
        modifiers.push(feature);
      }
    });

    return {
      type: bestMatch.type as SearchIntent['type'],
      confidence: bestMatch.confidence,
      modifiers
    };
  }

  private extractEntities(query: string): SearchEntity[] {
    const entities: SearchEntity[] = [];

    // Extract categories
    Object.entries(this.categoryAliases).forEach(([category, aliases]) => {
      const matchingAliases = aliases.filter(alias => query.includes(alias));
      if (matchingAliases.length > 0) {
        entities.push({
          type: 'category',
          value: category,
          confidence: Math.min(0.95, 0.6 + (matchingAliases.length * 0.15)),
          aliases: matchingAliases
        });
      }
    });

    // Extract brands
    Object.entries(this.brandAliases).forEach(([brand, aliases]) => {
      const matchingAliases = aliases.filter(alias => query.includes(alias));
      if (matchingAliases.length > 0) {
        entities.push({
          type: 'brand',
          value: brand,
          confidence: Math.min(0.95, 0.7 + (matchingAliases.length * 0.1)),
          aliases: matchingAliases
        });
      }
    });

    // Extract event types
    Object.entries(this.eventTypeAliases).forEach(([eventType, aliases]) => {
      const matchingAliases = aliases.filter(alias => query.includes(alias));
      if (matchingAliases.length > 0) {
        entities.push({
          type: 'event_type',
          value: eventType,
          confidence: Math.min(0.9, 0.5 + (matchingAliases.length * 0.2)),
          aliases: matchingAliases
        });
      }
    });

    // Extract features
    Object.entries(this.featureKeywords).forEach(([feature, keywords]) => {
      const matchingKeywords = keywords.filter(keyword => query.includes(keyword));
      if (matchingKeywords.length > 0) {
        entities.push({
          type: 'feature',
          value: feature,
          confidence: Math.min(0.85, 0.4 + (matchingKeywords.length * 0.2)),
          aliases: matchingKeywords
        });
      }
    });

    // Extract price-related entities
    const priceMatches = query.match(/(\$?\d+)/g);
    if (priceMatches) {
      const prices = priceMatches.map(match => parseInt(match.replace('$', '')));
      if (prices.length >= 2) {
        entities.push({
          type: 'price',
          value: `${Math.min(...prices)}-${Math.max(...prices)}`,
          confidence: 0.8,
          aliases: priceMatches
        });
      } else if (prices.length === 1) {
        const budgetKeywords = ['under', 'below', 'less than', 'max'];
        const isBudget = budgetKeywords.some(keyword => query.includes(keyword));
        entities.push({
          type: 'price',
          value: isBudget ? `0-${prices[0]}` : `${prices[0]}`,
          confidence: 0.7,
          aliases: priceMatches
        });
      }
    }

    // Extract condition
    const conditionKeywords = {
      'new': ['new', 'brand new', 'unused'],
      'like-new': ['like new', 'excellent', 'mint'],
      'good': ['good', 'working'],
      'fair': ['fair', 'used', 'worn'],
      'poor': ['poor', 'damaged', 'broken']
    };

    Object.entries(conditionKeywords).forEach(([condition, keywords]) => {
      const matchingKeywords = keywords.filter(keyword => query.includes(keyword));
      if (matchingKeywords.length > 0) {
        entities.push({
          type: 'condition',
          value: condition,
          confidence: 0.8,
          aliases: matchingKeywords
        });
      }
    });

    return entities;
  }

  private buildFilters(entities: SearchEntity[]): SearchFilters {
    const filters: SearchFilters = {};

    entities.forEach(entity => {
      switch (entity.type) {
        case 'category':
          filters.category = entity.value;
          break;
        case 'brand':
          filters.brand = entity.value;
          break;
        case 'condition':
          filters.condition = entity.value;
          break;
        case 'feature':
          if (!filters.features) filters.features = [];
          filters.features.push(entity.value);
          break;
        case 'event_type':
          filters.eventType = entity.value;
          break;
        case 'price':
          const priceRange = entity.value.split('-').map(p => parseInt(p));
          if (priceRange.length === 2) {
            filters.priceRange = { min: priceRange[0], max: priceRange[1] };
          } else {
            filters.priceRange = { min: 0, max: priceRange[0] };
          }
          break;
      }
    });

    return filters;
  }

  private calculateParsingConfidence(intent: SearchIntent, entities: SearchEntity[]): number {
    let confidence = intent.confidence * 0.4;
    
    const entityConfidences = entities.map(e => e.confidence);
    if (entityConfidences.length > 0) {
      const avgEntityConfidence = entityConfidences.reduce((sum, c) => sum + c, 0) / entityConfidences.length;
      confidence += avgEntityConfidence * 0.4;
    }
    
    // Bonus for having multiple entity types
    const entityTypes = new Set(entities.map(e => e.type));
    confidence += Math.min(entityTypes.size * 0.05, 0.2);

    return Math.min(confidence, 0.95);
  }

  private async getCandidateGear(filters: SearchFilters, limit: number): Promise<any[]> {
    const whereClause: any = {};

    if (filters.category) {
      whereClause.category = { contains: filters.category, mode: 'insensitive' };
    }

    if (filters.brand) {
      whereClause.brand = { contains: filters.brand, mode: 'insensitive' };
    }

    if (filters.condition) {
      whereClause.condition = filters.condition;
    }

    if (filters.priceRange) {
      whereClause.dailyRate = {
        gte: filters.priceRange.min,
        lte: filters.priceRange.max
      };
    }

    if (filters.location) {
      whereClause.city = { contains: filters.location.city, mode: 'insensitive' };
      whereClause.state = { contains: filters.location.state, mode: 'insensitive' };
    }

    return prisma.gear.findMany({
      where: whereClause,
      include: {
        user: { 
          select: { 
            id: true, 
            full_name: true, 
            averageRating: true, 
            totalReviews: true 
          } 
        }
      },
      take: limit,
      orderBy: [
        { createdAt: 'desc' }
      ]
    });
  }

  private async scoreGearRelevance(gear: any, parsedQuery: SemanticSearchQuery): Promise<SemanticSearchResult> {
    let relevanceScore = 0;
    let semanticScore = 0;
    const matchingEntities: SearchEntity[] = [];
    const highlights: string[] = [];
    const reasoning: string[] = [];

    // Score based on matching entities
    parsedQuery.entities.forEach(entity => {
      let entityMatch = false;

      switch (entity.type) {
        case 'category':
          if (gear.category?.toLowerCase().includes(entity.value.toLowerCase())) {
            relevanceScore += 0.3 * entity.confidence;
            semanticScore += 0.25;
            entityMatch = true;
            reasoning.push(`Matches category: ${entity.value}`);
            highlights.push(gear.category);
          }
          break;

        case 'brand':
          if (gear.brand?.toLowerCase().includes(entity.value.toLowerCase())) {
            relevanceScore += 0.25 * entity.confidence;
            semanticScore += 0.2;
            entityMatch = true;
            reasoning.push(`Matches brand: ${entity.value}`);
            highlights.push(gear.brand);
          }
          break;

        case 'feature':
          const featureInTitle = gear.title.toLowerCase().includes(entity.value.toLowerCase());
          const featureInDescription = gear.description.toLowerCase().includes(entity.value.toLowerCase());
          if (featureInTitle || featureInDescription) {
            relevanceScore += 0.15 * entity.confidence;
            semanticScore += 0.1;
            entityMatch = true;
            reasoning.push(`Has feature: ${entity.value}`);
            if (featureInTitle) highlights.push(`${entity.value} (in title)`);
          }
          break;

        case 'condition':
          if (gear.condition === entity.value) {
            relevanceScore += 0.1 * entity.confidence;
            semanticScore += 0.05;
            entityMatch = true;
            reasoning.push(`Condition: ${entity.value}`);
          }
          break;
      }

      if (entityMatch) {
        matchingEntities.push(entity);
      }
    });

    // Text similarity scoring
    const textSimilarity = this.calculateTextSimilarity(
      parsedQuery.processedQuery,
      `${gear.title} ${gear.description}`.toLowerCase()
    );
    
    semanticScore += textSimilarity * 0.4;
    relevanceScore += textSimilarity * 0.3;

    // Quality factors
    if (gear.user?.averageRating) {
      const ratingBonus = (gear.user.averageRating / 5) * 0.1;
      relevanceScore += ratingBonus;
      if (gear.user.averageRating >= 4.5) {
        reasoning.push('Highly rated owner');
      }
    }

    // Boost for exact matches
    if (gear.title.toLowerCase().includes(parsedQuery.processedQuery)) {
      relevanceScore += 0.2;
      highlights.push('Title match');
      reasoning.push('Exact title match');
    }

    // Intent-based adjustments
    switch (parsedQuery.intent.type) {
      case 'price_check':
        if (gear.dailyRate < 50) {
          relevanceScore += 0.1;
          reasoning.push('Budget-friendly option');
        }
        break;
      case 'find_item':
        // Boost newer items for immediate needs
        const daysOld = (Date.now() - gear.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysOld < 30) {
          relevanceScore += 0.05;
        }
        break;
    }

    return {
      gearId: gear.id,
      title: gear.title,
      description: gear.description,
      relevanceScore: Math.min(relevanceScore, 1),
      semanticScore: Math.min(semanticScore, 1),
      matchingEntities,
      highlights,
      reasoning
    };
  }

  private calculateTextSimilarity(query: string, text: string): number {
    const queryWords = query.split(' ').filter(word => word.length > 2);
    const textWords = text.split(' ').filter(word => word.length > 2);
    
    if (queryWords.length === 0 || textWords.length === 0) return 0;

    let matches = 0;
    queryWords.forEach(queryWord => {
      if (textWords.some(textWord => 
        textWord.includes(queryWord) || queryWord.includes(textWord)
      )) {
        matches++;
      }
    });

    return matches / queryWords.length;
  }

  private generateQuerySuggestions(parsedQuery: SemanticSearchQuery): string[] {
    const suggestions: string[] = [];
    
    // Add entity-based suggestions
    parsedQuery.entities.forEach(entity => {
      switch (entity.type) {
        case 'category':
          suggestions.push(`professional ${entity.value}`);
          suggestions.push(`${entity.value} for wedding`);
          suggestions.push(`budget ${entity.value}`);
          break;
        case 'brand':
          suggestions.push(`${entity.value} camera`);
          suggestions.push(`${entity.value} lens`);
          break;
        case 'event_type':
          suggestions.push(`equipment for ${entity.value}`);
          suggestions.push(`${entity.value} photography gear`);
          break;
      }
    });

    // Add intent-based suggestions
    if (parsedQuery.intent.type === 'find_item') {
      suggestions.push(`${parsedQuery.originalQuery} near me`);
      suggestions.push(`professional ${parsedQuery.originalQuery}`);
    }

    return [...new Set(suggestions)].slice(0, 6);
  }
}

export const semanticSearchEngine = new SemanticSearchEngine();

/**
 * Autocomplete search suggestions
 */
export async function getAutocomplete(partialQuery: string): Promise<string[]> {
  return semanticSearchEngine.getSearchSuggestions(partialQuery);
}

/**
 * Smart search with query expansion
 */
export async function smartSearch(query: string, userId?: string): Promise<{
  results: SemanticSearchResult[];
  expandedQuery: string;
  suggestions: string[];
}> {
  const searchResult = await semanticSearchEngine.search(query, userId);
  
  // Create expanded query for better understanding
  const expandedQuery = [
    searchResult.parsedQuery.originalQuery,
    ...searchResult.parsedQuery.entities.map(e => e.value)
  ].join(' ');

  return {
    results: searchResult.results,
    expandedQuery,
    suggestions: searchResult.suggestions
  };
}