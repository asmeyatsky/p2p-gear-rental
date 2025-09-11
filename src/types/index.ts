export interface GearItem {
  id: string;
  title: string;
  description: string;
  dailyRate: number;
  weeklyRate?: number | null;
  monthlyRate?: number | null;
  images: string[];
  city: string;
  state: string;
  brand?: string | null;
  model?: string | null;
  condition?: string | null;
  category?: string | null;
  userId?: string | null;
  averageRating?: number | null;
  totalReviews: number;
  createdAt: string;
  updatedAt: string;
  features?: string[];
  user?: {
    id: string;
    email: string;
    full_name?: string | null;
    averageRating?: number | null;
    totalReviews: number;
  } | null;
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
