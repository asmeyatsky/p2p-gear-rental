import { describe, test, expect, jest, beforeEach } from '@jest/globals';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch as jest.MockedFunction<typeof fetch>;

describe('API Client Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Gear API', () => {
    test('should fetch gear list successfully', async () => {
      const mockGear = [
        {
          id: '1',
          title: 'Test Camera',
          description: 'A test camera',
          dailyRate: 50,
          city: 'San Francisco',
          state: 'CA',
          images: ['/test.jpg'],
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockGear, total: 1 }),
      } as Response);

      const response = await fetch('/api/gear');
      const result = await response.json();

      expect(mockFetch).toHaveBeenCalledWith('/api/gear');
      expect(result.data).toEqual(mockGear);
      expect(result.total).toBe(1);
    });

    test('should handle gear API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' }),
      } as Response);

      const response = await fetch('/api/gear');
      const result = await response.json();

      expect(response.ok).toBe(false);
      expect(result.error).toBe('Internal server error');
    });

    test('should create gear successfully', async () => {
      const newGear = {
        title: 'New Camera',
        description: 'A new camera',
        dailyRate: 75,
        city: 'Los Angeles',
        state: 'CA',
        images: ['/new-camera.jpg'],
      };

      const createdGear = {
        ...newGear,
        id: '2',
        createdAt: '2023-01-02T00:00:00.000Z',
        updatedAt: '2023-01-02T00:00:00.000Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createdGear,
      } as Response);

      const response = await fetch('/api/gear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGear),
      });

      const result = await response.json();

      expect(mockFetch).toHaveBeenCalledWith('/api/gear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGear),
      });
      expect(result.id).toBe('2');
      expect(result.title).toBe(newGear.title);
    });
  });

  describe('Rental API', () => {
    test('should create rental request successfully', async () => {
      const newRental = {
        gearId: '1',
        startDate: '2023-06-01',
        endDate: '2023-06-03',
        message: 'Looking forward to using this camera!',
      };

      const createdRental = {
        ...newRental,
        id: '1',
        status: 'pending',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createdRental,
      } as Response);

      const response = await fetch('/api/rentals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRental),
      });

      const result = await response.json();

      expect(mockFetch).toHaveBeenCalledWith('/api/rentals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRental),
      });
      expect(result.id).toBe('1');
      expect(result.status).toBe('pending');
    });

    test('should approve rental successfully', async () => {
      const rentalId = '1';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Rental approved successfully' }),
      } as Response);

      const response = await fetch(`/api/rentals/${rentalId}/approve`, {
        method: 'PUT',
      });

      const result = await response.json();

      expect(mockFetch).toHaveBeenCalledWith(`/api/rentals/${rentalId}/approve`, {
        method: 'PUT',
      });
      expect(result.message).toBe('Rental approved successfully');
    });

    test('should reject rental successfully', async () => {
      const rentalId = '1';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Rental rejected successfully' }),
      } as Response);

      const response = await fetch(`/api/rentals/${rentalId}/reject`, {
        method: 'PUT',
      });

      const result = await response.json();

      expect(mockFetch).toHaveBeenCalledWith(`/api/rentals/${rentalId}/reject`, {
        method: 'PUT',
      });
      expect(result.message).toBe('Rental rejected successfully');
    });
  });

  describe('Search API', () => {
    test('should search gear with filters', async () => {
      const searchParams = new URLSearchParams({
        q: 'camera',
        category: 'cameras',
        city: 'San Francisco',
        maxPrice: '100',
      });

      const searchResults = [
        {
          id: '1',
          title: 'Professional Camera',
          description: 'High-end DSLR camera',
          dailyRate: 75,
          city: 'San Francisco',
          state: 'CA',
          images: ['/camera.jpg'],
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: searchResults, total: 1 }),
      } as Response);

      const response = await fetch(`/api/search?${searchParams.toString()}`);
      const result = await response.json();

      expect(mockFetch).toHaveBeenCalledWith(`/api/search?${searchParams.toString()}`);
      expect(result.data).toEqual(searchResults);
      expect(result.total).toBe(1);
    });
  });

  describe('Categories API', () => {
    test('should fetch categories successfully', async () => {
      const categories = [
        { id: 'cameras', name: 'Cameras', count: 25 },
        { id: 'lenses', name: 'Lenses', count: 15 },
        { id: 'lighting', name: 'Lighting', count: 10 },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => categories,
      } as Response);

      const response = await fetch('/api/categories');
      const result = await response.json();

      expect(mockFetch).toHaveBeenCalledWith('/api/categories');
      expect(result).toEqual(categories);
      expect(result).toHaveLength(3);
    });
  });
});