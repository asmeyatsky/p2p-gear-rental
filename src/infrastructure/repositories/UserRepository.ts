import { User } from '../../domain/entities/User';
import { IUserRepository } from '../../domain/ports/repositories';
import { prisma } from '../../lib/prisma';

export class UserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    const userData = await prisma.user.findUnique({
      where: { id },
    });

    if (!userData) {
      return null;
    }

    return new User({
      id: userData.id,
      email: userData.email,
      fullName: userData.full_name || undefined,
      averageRating: userData.averageRating || undefined,
      totalReviews: userData.totalReviews,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    const userData = await prisma.user.findUnique({
      where: { email },
    });

    if (!userData) {
      return null;
    }

    return new User({
      id: userData.id,
      email: userData.email,
      fullName: userData.full_name || undefined,
      averageRating: userData.averageRating || undefined,
      totalReviews: userData.totalReviews,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
    });
  }

  async create(userData: any): Promise<User> {
    const createdUser = await prisma.user.create({
      data: {
        id: userData.id,
        email: userData.email,
        full_name: userData.fullName,
      },
    });

    return new User({
      id: createdUser.id,
      email: createdUser.email,
      fullName: createdUser.full_name || undefined,
      averageRating: createdUser.averageRating || undefined,
      totalReviews: createdUser.totalReviews,
      createdAt: createdUser.createdAt,
      updatedAt: createdUser.updatedAt,
    });
  }

  async update(userData: any): Promise<User> {
    const updatedUser = await prisma.user.update({
      where: { id: userData.id },
      data: {
        email: userData.email,
        full_name: userData.fullName,
        averageRating: userData.averageRating,
        totalReviews: userData.totalReviews,
        updatedAt: new Date(),
      },
    });

    return new User({
      id: updatedUser.id,
      email: updatedUser.email,
      fullName: updatedUser.full_name || undefined,
      averageRating: updatedUser.averageRating || undefined,
      totalReviews: updatedUser.totalReviews,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    });
  }
}