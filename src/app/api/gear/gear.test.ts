import { NextRequest, NextResponse } from 'next/server';
import { POST, GET, PUT, DELETE } from './route';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';

// Mock Supabase and Prisma
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
  },
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    gear: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      upsert: jest.fn(),
    },
  },
}));

const mockSession = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    user_metadata: {
      full_name: 'Test User',
    },
  },
};

const mockGearData = {
  id: 'existing-gear-id',
  title: 'Existing Gear',
  description: 'An existing gear item',
  dailyRate: 15.0,
  city: 'Existing City',
  state: 'EX',
  images: ['existing-image.jpg'],
  category: 'lenses',
  userId: 'test-user-id',
};

const mockOtherUserGearData = {
  id: 'other-user-gear-id',
  title: 'Other User Gear',
  description: 'Gear from another user',
  dailyRate: 20.0,
  city: 'Other City',
  state: 'OT',
  images: ['other-image.jpg'],
  category: 'audio',
  userId: 'other-user-id',
};

describe('Gear API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/gear', () => {
    it('should return 401 if not authenticated', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: null } });

      const request = new NextRequest('http://localhost/api/gear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
    });

    it('should return 400 if required fields are missing', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: mockSession } });

      const request = new NextRequest('http://localhost/api/gear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Test Gear' }), // Missing other fields
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ error: 'Missing required fields' });
    });

    it('should create new gear if authenticated and fields are valid', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: mockSession } });
      (prisma.user.upsert as jest.Mock).mockResolvedValue(mockSession.user);
      (prisma.gear.create as jest.Mock).mockResolvedValue({
        id: 'new-gear-id',
        ...mockGearData,
        userId: mockSession.user.id,
      });

      const newGearData = {
        title: 'New Test Gear',
        description: 'A new test gear item',
        dailyRate: 10.0,
        city: 'New City',
        state: 'NC',
        images: ['new-image.jpg'],
        category: 'cameras',
      };

      const request = new NextRequest('http://localhost/api/gear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGearData),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
      await expect(response.json()).resolves.toEqual({
        id: 'new-gear-id',
        ...newGearData,
        userId: mockSession.user.id,
      });
      expect(prisma.user.upsert).toHaveBeenCalledWith({
        where: { id: mockSession.user.id },
        update: {
          email: mockSession.user.email,
          full_name: mockSession.user.user_metadata.full_name,
        },
        create: {
          id: mockSession.user.id,
          email: mockSession.user.email,
          full_name: mockSession.user.user_metadata.full_name,
        },
      });
      expect(prisma.gear.create).toHaveBeenCalledWith({
        data: {
          ...newGearData,
          userId: mockSession.user.id,
        },
      });
    });
  });

  describe('PUT /api/gear/[id]', () => {
    it('should return 401 if not authenticated', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: null } });

      const request = new NextRequest(`http://localhost/api/gear/${mockGearData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const response = await PUT(request, { params: { id: mockGearData.id } });
      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
    });

    it('should return 404 if gear not found', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: mockSession } });
      (prisma.gear.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(`http://localhost/api/gear/non-existent-id`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Updated Title' }),
      });

      const response = await PUT(request, { params: { id: 'non-existent-id' } });
      expect(response.status).toBe(404);
      await expect(response.json()).resolves.toEqual({ error: 'Gear not found' });
    });

    it('should return 403 if user is not the owner', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: mockSession } });
      (prisma.gear.findUnique as jest.Mock).mockResolvedValue(mockOtherUserGearData);

      const request = new NextRequest(`http://localhost/api/gear/${mockOtherUserGearData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Updated Title' }),
      });

      const response = await PUT(request, { params: { id: mockOtherUserGearData.id } });
      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toEqual({ error: 'Forbidden: You do not own this gear' });
    });

    it('should update gear if authenticated and is owner', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: mockSession } });
      (prisma.gear.findUnique as jest.Mock).mockResolvedValue(mockGearData);
      (prisma.gear.update as jest.Mock).mockResolvedValue({
        ...mockGearData,
        title: 'Updated Title',
        dailyRate: 25.0,
      });

      const updatedData = { title: 'Updated Title', dailyRate: 25.0 };
      const request = new NextRequest(`http://localhost/api/gear/${mockGearData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });

      const response = await PUT(request, { params: { id: mockGearData.id } });
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({
        ...mockGearData,
        title: 'Updated Title',
        dailyRate: 25.0,
      });
      expect(prisma.gear.update).toHaveBeenCalledWith({
        where: { id: mockGearData.id },
        data: {
          title: 'Updated Title',
          dailyRate: 25.0,
        },
      });
    });
  });

  describe('DELETE /api/gear/[id]', () => {
    it('should return 401 if not authenticated', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: null } });

      const request = new NextRequest(`http://localhost/api/gear/${mockGearData.id}`, {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: { id: mockGearData.id } });
      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
    });

    it('should return 404 if gear not found', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: mockSession } });
      (prisma.gear.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(`http://localhost/api/gear/non-existent-id`, {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: { id: 'non-existent-id' } });
      expect(response.status).toBe(404);
      await expect(response.json()).resolves.toEqual({ error: 'Gear not found' });
    });

    it('should return 403 if user is not the owner', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: mockSession } });
      (prisma.gear.findUnique as jest.Mock).mockResolvedValue(mockOtherUserGearData);

      const request = new NextRequest(`http://localhost/api/gear/${mockOtherUserGearData.id}`, {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: { id: mockOtherUserGearData.id } });
      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toEqual({ error: 'Forbidden: You do not own this gear' });
    });

    it('should delete gear if authenticated and is owner', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: mockSession } });
      (prisma.gear.findUnique as jest.Mock).mockResolvedValue(mockGearData);
      (prisma.gear.delete as jest.Mock).mockResolvedValue(mockGearData);

      const request = new NextRequest(`http://localhost/api/gear/${mockGearData.id}`, {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: { id: mockGearData.id } });
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ message: 'Gear deleted successfully' });
      expect(prisma.gear.delete).toHaveBeenCalledWith({
        where: { id: mockGearData.id },
      });
    });
  });

  describe('GET /api/gear', () => {
    it('should return all gear items', async () => {
      (prisma.gear.findMany as jest.Mock).mockResolvedValue([mockGearData, mockOtherUserGearData]);

      const request = new NextRequest('http://localhost/api/gear');
      const response = await GET(request);
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual([mockGearData, mockOtherUserGearData]);
      expect(prisma.gear.findMany).toHaveBeenCalledWith({ where: { dailyRate: { gte: 0, lte: 10000 } } });
    });

    it('should filter gear by search term', async () => {
      (prisma.gear.findMany as jest.Mock).mockResolvedValue([mockGearData]);

      const request = new NextRequest('http://localhost/api/gear?search=Existing');
      const response = await GET(request);
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual([mockGearData]);
      expect(prisma.gear.findMany).toHaveBeenCalledWith({
        where: {
          dailyRate: { gte: 0, lte: 10000 },
          OR: [
            { title: { contains: 'Existing', mode: 'insensitive' } },
            { description: { contains: 'Existing', mode: 'insensitive' } },
            { brand: { contains: 'Existing', mode: 'insensitive' } },
            { model: { contains: 'Existing', mode: 'insensitive' } },
          ],
        },
      });
    });

    it('should filter gear by category', async () => {
      (prisma.gear.findMany as jest.Mock).mockResolvedValue([mockGearData]);

      const request = new NextRequest('http://localhost/api/gear?category=lenses');
      const response = await GET(request);
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual([mockGearData]);
      expect(prisma.gear.findMany).toHaveBeenCalledWith({
        where: {
          dailyRate: { gte: 0, lte: 10000 },
          category: 'lenses',
        },
      });
    });

    it('should filter gear by price range', async () => {
      (prisma.gear.findMany as jest.Mock).mockResolvedValue([mockGearData]);

      const request = new NextRequest('http://localhost/api/gear?minPrice=10&maxPrice=20');
      const response = await GET(request);
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual([mockGearData]);
      expect(prisma.gear.findMany).toHaveBeenCalledWith({
        where: {
          dailyRate: { gte: 10, lte: 20 },
        },
      });
    });

    it('should filter gear by city and state', async () => {
      (prisma.gear.findMany as jest.Mock).mockResolvedValue([mockGearData]);

      const request = new NextRequest('http://localhost/api/gear?city=Existing City&state=EX');
      const response = await GET(request);
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual([mockGearData]);
      expect(prisma.gear.findMany).toHaveBeenCalledWith({
        where: {
          dailyRate: { gte: 0, lte: 10000 },
          city: { contains: 'Existing City', mode: 'insensitive' },
          state: { contains: 'EX', mode: 'insensitive' },
        },
      });
    });
  });

  describe('GET /api/gear/[id]', () => {
    it('should return a specific gear item by ID', async () => {
      (prisma.gear.findUnique as jest.Mock).mockResolvedValue(mockGearData);

      const request = new NextRequest(`http://localhost/api/gear/${mockGearData.id}`);
      const response = await GET(request, { params: { id: mockGearData.id } });
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual(mockGearData);
      expect(prisma.gear.findUnique).toHaveBeenCalledWith({ where: { id: mockGearData.id } });
    });

    it('should return 404 if gear is not found', async () => {
      (prisma.gear.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest(`http://localhost/api/gear/non-existent-id`);
      const response = await GET(request, { params: { id: 'non-existent-id' } });
      expect(response.status).toBe(404);
      await expect(response.json()).resolves.toEqual({ error: 'Gear not found' });
    });
  });
});
