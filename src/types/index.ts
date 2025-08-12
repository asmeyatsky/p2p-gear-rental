export interface GearItem {
  id: string;
  title: string;
  description: string;
  dailyRate: number;
  weeklyRate?: number;
  monthlyRate?: number;
  images: string[];
  city: string;
  state: string;
  brand?: string;
  model?: string;
  condition?: string;
  category?: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
  features?: string[];
}

export interface RentalItem {
  id: string;
  gearId: string;
  gear?: GearItem;
  renterId: string;
  ownerId: string;
  startDate: string;
  endDate: string;
  status: string;
  message?: string;
  paymentIntentId?: string;
  clientSecret?: string;
  paymentStatus?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  createdAt: string;
  updatedAt: string;
}
