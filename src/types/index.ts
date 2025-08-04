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
  createdAt: string;
  updatedAt: string;
  features?: string[];
  category?: string;
}
