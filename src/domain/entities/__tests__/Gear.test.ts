import { Gear } from '../domain/entities/Gear';

describe('Gear Entity', () => {
  const validGearData = {
    id: 'test-id',
    title: 'Test Camera',
    description: 'A high-quality test camera for photography',
    dailyRate: 50,
    weeklyRate: 300,
    monthlyRate: 1000,
    images: ['https://example.com/image1.jpg'],
    city: 'New York',
    state: 'NY',
    brand: 'Test Brand',
    model: 'Test Model',
    condition: 'good',
    category: 'cameras',
    userId: 'user-123',
    averageRating: 4.5,
    totalReviews: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('should create a valid gear entity', () => {
    const gear = new Gear(validGearData);

    expect(gear.id).toBe('test-id');
    expect(gear.title).toBe('Test Camera');
    expect(gear.dailyRate).toBe(50);
    expect(gear.city).toBe('New York');
    expect(gear.state).toBe('NY');
  });

  it('should throw an error for empty title', () => {
    expect(() => {
      new Gear({
        ...validGearData,
        title: '',
      });
    }).toThrow('Title cannot be empty');
  });

  it('should throw an error for title exceeding 100 characters', () => {
    expect(() => {
      new Gear({
        ...validGearData,
        title: 'a'.repeat(101),
      });
    }).toThrow('Title cannot exceed 100 characters');
  });

  it('should throw an error for negative daily rate', () => {
    expect(() => {
      new Gear({
        ...validGearData,
        dailyRate: -10,
      });
    }).toThrow('Daily rate must be positive');
  });

  it('should throw an error for daily rate exceeding $10,000', () => {
    expect(() => {
      new Gear({
        ...validGearData,
        dailyRate: 15000,
      });
    }).toThrow('Daily rate cannot exceed $10,000');
  });

  it('should throw an error for invalid state format', () => {
    expect(() => {
      new Gear({
        ...validGearData,
        state: 'NEWYORK',
      });
    }).toThrow('State must be 2 characters');
  });

  it('should throw an error for invalid condition', () => {
    expect(() => {
      new Gear({
        ...validGearData,
        condition: 'invalid_condition',
      });
    }).toThrow('Invalid condition');
  });

  it('should allow valid condition values', () => {
    const validConditions = ['new', 'like-new', 'good', 'fair', 'poor'];
    
    validConditions.forEach(condition => {
      const gear = new Gear({
        ...validGearData,
        condition,
      });
      expect(gear.condition).toBe(condition);
    });
  });

  it('should update title successfully', () => {
    const gear = new Gear(validGearData);
    const newTitle = 'Updated Camera Title';
    
    gear.updateTitle(newTitle);
    
    expect(gear.title).toBe(newTitle);
  });

  it('should throw an error when updating title to empty string', () => {
    const gear = new Gear(validGearData);
    
    expect(() => {
      gear.updateTitle('');
    }).toThrow('Title cannot be empty');
  });

  it('should check availability correctly', () => {
    const gear = new Gear(validGearData);
    
    // Should be available initially (no rentals)
    const startDate = new Date('2023-01-01');
    const endDate = new Date('2023-01-05');
    expect(gear.isAvailable(startDate, endDate)).toBe(true);
  });
});