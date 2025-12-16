import { Gear } from '../../domain/entities/Gear';
import { IGearRepository } from '../../domain/ports/repositories';
import { prisma } from '../../lib/prisma';

export class GearRepository implements IGearRepository {
  async findById(id: string): Promise<Gear | null> {
    const gearData = await prisma.gear.findUnique({
      where: { id },
    });

    if (!gearData) {
      return null;
    }

    return new Gear({
      id: gearData.id,
      title: gearData.title,
      description: gearData.description,
      dailyRate: gearData.dailyRate,
      weeklyRate: gearData.weeklyRate || undefined,
      monthlyRate: gearData.monthlyRate || undefined,
      images: gearData.images ? JSON.parse(gearData.images as string) : [],
      city: gearData.city,
      state: gearData.state,
      brand: gearData.brand || undefined,
      model: gearData.model || undefined,
      condition: gearData.condition || undefined,
      category: gearData.category || undefined,
      userId: gearData.userId || undefined,
      averageRating: gearData.averageRating || undefined,
      totalReviews: gearData.totalReviews,
      createdAt: gearData.createdAt,
      updatedAt: gearData.updatedAt,
    });
  }

  async findByUserId(userId: string): Promise<Gear[]> {
    const gearData = await prisma.gear.findMany({
      where: { userId },
    });

    return gearData.map(gear => new Gear({
      id: gear.id,
      title: gear.title,
      description: gear.description,
      dailyRate: gear.dailyRate,
      weeklyRate: gear.weeklyRate || undefined,
      monthlyRate: gear.monthlyRate || undefined,
      images: gear.images ? JSON.parse(gear.images as string) : [],
      city: gear.city,
      state: gear.state,
      brand: gear.brand || undefined,
      model: gear.model || undefined,
      condition: gear.condition || undefined,
      category: gear.category || undefined,
      userId: gear.userId || undefined,
      averageRating: gear.averageRating || undefined,
      totalReviews: gear.totalReviews,
      createdAt: gear.createdAt,
      updatedAt: gear.updatedAt,
    }));
  }

  async findAll(): Promise<Gear[]> {
    const gearData = await prisma.gear.findMany();

    return gearData.map(gear => new Gear({
      id: gear.id,
      title: gear.title,
      description: gear.description,
      dailyRate: gear.dailyRate,
      weeklyRate: gear.weeklyRate || undefined,
      monthlyRate: gear.monthlyRate || undefined,
      images: gear.images ? JSON.parse(gear.images as string) : [],
      city: gear.city,
      state: gear.state,
      brand: gear.brand || undefined,
      model: gear.model || undefined,
      condition: gear.condition || undefined,
      category: gear.category || undefined,
      userId: gear.userId || undefined,
      averageRating: gear.averageRating || undefined,
      totalReviews: gear.totalReviews,
      createdAt: gear.createdAt,
      updatedAt: gear.updatedAt,
    }));
  }

  async create(gear: Gear): Promise<Gear> {
    const gearData = await prisma.gear.create({
      data: {
        id: gear.id,
        title: gear.title,
        description: gear.description,
        dailyRate: gear.dailyRate,
        weeklyRate: gear.weeklyRate,
        monthlyRate: gear.monthlyRate,
        images: JSON.stringify(gear.images),
        city: gear.city,
        state: gear.state,
        brand: gear.brand,
        model: gear.model,
        condition: gear.condition,
        category: gear.category,
        userId: gear.userId,
      },
    });

    return new Gear({
      id: gearData.id,
      title: gearData.title,
      description: gearData.description,
      dailyRate: gearData.dailyRate,
      weeklyRate: gearData.weeklyRate || undefined,
      monthlyRate: gearData.monthlyRate || undefined,
      images: gearData.images ? JSON.parse(gearData.images as string) : [],
      city: gearData.city,
      state: gearData.state,
      brand: gearData.brand || undefined,
      model: gearData.model || undefined,
      condition: gearData.condition || undefined,
      category: gearData.category || undefined,
      userId: gearData.userId || undefined,
      averageRating: gearData.averageRating || undefined,
      totalReviews: gearData.totalReviews,
      createdAt: gearData.createdAt,
      updatedAt: gearData.updatedAt,
    });
  }

  async update(gear: Gear): Promise<Gear> {
    const gearData = await prisma.gear.update({
      where: { id: gear.id },
      data: {
        title: gear.title,
        description: gear.description,
        dailyRate: gear.dailyRate,
        weeklyRate: gear.weeklyRate,
        monthlyRate: gear.monthlyRate,
        images: JSON.stringify(gear.images),
        city: gear.city,
        state: gear.state,
        brand: gear.brand,
        model: gear.model,
        condition: gear.condition,
        category: gear.category,
        userId: gear.userId,
        averageRating: gear.averageRating,
        totalReviews: gear.totalReviews,
        updatedAt: gear.updatedAt,
      },
    });

    return new Gear({
      id: gearData.id,
      title: gearData.title,
      description: gearData.description,
      dailyRate: gearData.dailyRate,
      weeklyRate: gearData.weeklyRate || undefined,
      monthlyRate: gearData.monthlyRate || undefined,
      images: gearData.images ? JSON.parse(gearData.images as string) : [],
      city: gearData.city,
      state: gearData.state,
      brand: gearData.brand || undefined,
      model: gearData.model || undefined,
      condition: gearData.condition || undefined,
      category: gearData.category || undefined,
      userId: gearData.userId || undefined,
      averageRating: gearData.averageRating || undefined,
      totalReviews: gearData.totalReviews,
      createdAt: gearData.createdAt,
      updatedAt: gearData.updatedAt,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.gear.delete({
      where: { id },
    });
  }
}