// __mocks__/@/lib/prisma.ts
// This is a centralized mock for the Prisma client.
// All Prisma client methods used in the application should be mocked here.

const createMockModel = () => ({
  findUnique: jest.fn(),
  findMany: jest.fn(),
  findFirst: jest.fn(),
  create: jest.fn(),
  createMany: jest.fn(),
  update: jest.fn(),
  updateMany: jest.fn(),
  upsert: jest.fn(),
  delete: jest.fn(),
  deleteMany: jest.fn(),
  count: jest.fn(),
  aggregate: jest.fn(),
  groupBy: jest.fn(),
});

const prisma = {
  gear: createMockModel(),
  rental: createMockModel(),
  user: createMockModel(),
  payment: createMockModel(),
  review: createMockModel(),
  dispute: createMockModel(),
  message: createMockModel(),
  notification: createMockModel(),
  $queryRaw: jest.fn(),
  $queryRawUnsafe: jest.fn(),
  $executeRaw: jest.fn(),
  $executeRawUnsafe: jest.fn(),
  $transaction: jest.fn(),
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  $on: jest.fn(),
  $extends: jest.fn(),
};

export { prisma };