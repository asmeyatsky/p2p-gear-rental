import { IRentalRepository } from '../../domain/ports/repositories';
import { prisma } from '../../lib/prisma';

export class RentalRepository implements IRentalRepository {
  async findById(id: string): Promise<any | null> {
    const rentalData = await prisma.rental.findUnique({
      where: { id },
    });

    if (!rentalData) {
      return null;
    }

    return {
      id: rentalData.id,
      gearId: rentalData.gearId,
      renterId: rentalData.renterId,
      ownerId: rentalData.ownerId,
      startDate: rentalData.startDate,
      endDate: rentalData.endDate,
      status: rentalData.status,
      message: rentalData.message || undefined,
      paymentIntentId: rentalData.paymentIntentId || undefined,
      clientSecret: rentalData.clientSecret || undefined,
      paymentStatus: rentalData.paymentStatus || undefined,
      createdAt: rentalData.createdAt,
      updatedAt: rentalData.updatedAt,
    };
  }

  async findByRenterId(renterId: string): Promise<any[]> {
    const rentalsData = await prisma.rental.findMany({
      where: { renterId },
    });

    return rentalsData.map((rental: any) => ({
      id: rental.id,
      gearId: rental.gearId,
      renterId: rental.renterId,
      ownerId: rental.ownerId,
      startDate: rental.startDate,
      endDate: rental.endDate,
      status: rental.status,
      message: rental.message || undefined,
      paymentIntentId: rental.paymentIntentId || undefined,
      clientSecret: rental.clientSecret || undefined,
      paymentStatus: rental.paymentStatus || undefined,
      createdAt: rental.createdAt,
      updatedAt: rental.updatedAt,
    }));
  }

  async findByOwnerId(ownerId: string): Promise<any[]> {
    const rentalsData = await prisma.rental.findMany({
      where: { ownerId },
    });

    return rentalsData.map((rental: any) => ({
      id: rental.id,
      gearId: rental.gearId,
      renterId: rental.renterId,
      ownerId: rental.ownerId,
      startDate: rental.startDate,
      endDate: rental.endDate,
      status: rental.status,
      message: rental.message || undefined,
      paymentIntentId: rental.paymentIntentId || undefined,
      clientSecret: rental.clientSecret || undefined,
      paymentStatus: rental.paymentStatus || undefined,
      createdAt: rental.createdAt,
      updatedAt: rental.updatedAt,
    }));
  }

  async create(rental: any): Promise<any> {
    const rentalData = await prisma.rental.create({
      data: {
        id: rental.id,
        gearId: rental.gearId,
        renterId: rental.renterId,
        ownerId: rental.ownerId,
        startDate: rental.startDate,
        endDate: rental.endDate,
        status: rental.status,
        message: rental.message,
        paymentIntentId: rental.paymentIntentId,
        clientSecret: rental.clientSecret,
        paymentStatus: rental.paymentStatus,
      },
    });

    return {
      id: rentalData.id,
      gearId: rentalData.gearId,
      renterId: rentalData.renterId,
      ownerId: rentalData.ownerId,
      startDate: rentalData.startDate,
      endDate: rentalData.endDate,
      status: rentalData.status,
      message: rentalData.message || undefined,
      paymentIntentId: rentalData.paymentIntentId || undefined,
      clientSecret: rentalData.clientSecret || undefined,
      paymentStatus: rentalData.paymentStatus || undefined,
      createdAt: rentalData.createdAt,
      updatedAt: rentalData.updatedAt,
    };
  }

  async update(rental: any): Promise<any> {
    const rentalData = await prisma.rental.update({
      where: { id: rental.id },
      data: {
        gearId: rental.gearId,
        renterId: rental.renterId,
        ownerId: rental.ownerId,
        startDate: rental.startDate,
        endDate: rental.endDate,
        status: rental.status,
        message: rental.message,
        paymentIntentId: rental.paymentIntentId,
        clientSecret: rental.clientSecret,
        paymentStatus: rental.paymentStatus,
        updatedAt: new Date(),
      },
    });

    return {
      id: rentalData.id,
      gearId: rentalData.gearId,
      renterId: rentalData.renterId,
      ownerId: rentalData.ownerId,
      startDate: rentalData.startDate,
      endDate: rentalData.endDate,
      status: rentalData.status,
      message: rentalData.message || undefined,
      paymentIntentId: rentalData.paymentIntentId || undefined,
      clientSecret: rentalData.clientSecret || undefined,
      paymentStatus: rentalData.paymentStatus || undefined,
      createdAt: rentalData.createdAt,
      updatedAt: rentalData.updatedAt,
    };
  }
}