import { User } from './User';
import { Rental } from './Rental';

export interface GearProps {
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
  averageRating?: number;
  totalReviews: number;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  rentals?: Rental[];
}

export class Gear {
  private readonly _id: string;
  private _title: string;
  private _description: string;
  private _dailyRate: number;
  private _weeklyRate?: number;
  private _monthlyRate?: number;
  private _images: string[];
  private _city: string;
  private _state: string;
  private _brand?: string;
  private _model?: string;
  private _condition?: string;
  private _category?: string;
  private _userId?: string;
  private _averageRating?: number;
  private _totalReviews: number;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _user?: User;
  private _rentals?: Rental[];

  constructor(props: GearProps) {
    this._id = props.id;
    this._title = props.title;
    this._description = props.description;
    this._dailyRate = props.dailyRate;
    this._weeklyRate = props.weeklyRate;
    this._monthlyRate = props.monthlyRate;
    this._images = props.images;
    this._city = props.city;
    this._state = props.state;
    this._brand = props.brand;
    this._model = props.model;
    this._condition = props.condition;
    this._category = props.category;
    this._userId = props.userId;
    this._averageRating = props.averageRating;
    this._totalReviews = props.totalReviews;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
    this._user = props.user;
    this._rentals = props.rentals || [];

    this.validate();
  }

  private validate(): void {
    if (this._title.length === 0) {
      throw new Error('Title cannot be empty');
    }
    if (this._title.length > 100) {
      throw new Error('Title cannot exceed 100 characters');
    }
    if (this._description.length < 10) {
      throw new Error('Description must be at least 10 characters');
    }
    if (this._dailyRate <= 0) {
      throw new Error('Daily rate must be positive');
    }
    if (this._dailyRate > 10000) {
      throw new Error('Daily rate cannot exceed $10,000');
    }
    if (this._city.length === 0) {
      throw new Error('City is required');
    }
    if (this._state.length !== 2) {
      throw new Error('State must be 2 characters');
    }
    if (this._condition && !['new', 'like-new', 'good', 'fair', 'poor'].includes(this._condition)) {
      throw new Error('Invalid condition');
    }
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get title(): string {
    return this._title;
  }

  get description(): string {
    return this._description;
  }

  get dailyRate(): number {
    return this._dailyRate;
  }

  get weeklyRate(): number | undefined {
    return this._weeklyRate;
  }

  get monthlyRate(): number | undefined {
    return this._monthlyRate;
  }

  get images(): string[] {
    return this._images;
  }

  get city(): string {
    return this._city;
  }

  get state(): string {
    return this._state;
  }

  get brand(): string | undefined {
    return this._brand;
  }

  get model(): string | undefined {
    return this._model;
  }

  get condition(): string | undefined {
    return this._condition;
  }

  get category(): string | undefined {
    return this._category;
  }

  get userId(): string | undefined {
    return this._userId;
  }

  get averageRating(): number | undefined {
    return this._averageRating;
  }

  get totalReviews(): number {
    return this._totalReviews;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get user(): User | undefined {
    return this._user;
  }

  get rentals(): Rental[] {
    return this._rentals || [];
  }

  // Methods
  updateTitle(title: string): void {
    if (title.length === 0) {
      throw new Error('Title cannot be empty');
    }
    if (title.length > 100) {
      throw new Error('Title cannot exceed 100 characters');
    }
    this._title = title;
    this._updatedAt = new Date();
  }

  updateDescription(description: string): void {
    if (description.length < 10) {
      throw new Error('Description must be at least 10 characters');
    }
    this._description = description;
    this._updatedAt = new Date();
  }

  updateRates(dailyRate: number, weeklyRate?: number, monthlyRate?: number): void {
    if (dailyRate <= 0) {
      throw new Error('Daily rate must be positive');
    }
    if (dailyRate > 10000) {
      throw new Error('Daily rate cannot exceed $10,000');
    }
    if (weeklyRate && weeklyRate <= 0) {
      throw new Error('Weekly rate must be positive');
    }
    if (monthlyRate && monthlyRate <= 0) {
      throw new Error('Monthly rate must be positive');
    }

    this._dailyRate = dailyRate;
    if (weeklyRate !== undefined) this._weeklyRate = weeklyRate;
    if (monthlyRate !== undefined) this._monthlyRate = monthlyRate;
    this._updatedAt = new Date();
  }

  updateLocation(city: string, state: string): void {
    if (city.length === 0) {
      throw new Error('City is required');
    }
    if (state.length !== 2) {
      throw new Error('State must be 2 characters');
    }
    this._city = city;
    this._state = state;
    this._updatedAt = new Date();
  }

  updateImages(images: string[]): void {
    if (images.length === 0) {
      throw new Error('At least one image is required');
    }
    if (images.length > 10) {
      throw new Error('Maximum 10 images allowed');
    }
    // Validate each URL
    for (const url of images) {
      try {
        new URL(url);
      } catch {
        throw new Error('Invalid image URL');
      }
    }
    this._images = images;
    this._updatedAt = new Date();
  }

  updateCategory(category: string): void {
    if (category && !['cameras', 'lenses', 'lighting', 'audio', 'drones', 'accessories', 'tripods', 'monitors', 'other'].includes(category)) {
      throw new Error('Invalid category');
    }
    this._category = category;
    this._updatedAt = new Date();
  }

  updateCondition(condition: string): void {
    if (condition && !['new', 'like-new', 'good', 'fair', 'poor'].includes(condition)) {
      throw new Error('Invalid condition');
    }
    this._condition = condition;
    this._updatedAt = new Date();
  }

  updateBrandModel(brand?: string, model?: string): void {
    if (brand && brand.length > 50) {
      throw new Error('Brand must be less than 50 characters');
    }
    if (model && model.length > 50) {
      throw new Error('Model must be less than 50 characters');
    }
    this._brand = brand;
    this._model = model;
    this._updatedAt = new Date();
  }

  // Add rental to the gear
  addRental(rental: Rental): void {
    if (!this._rentals) {
      this._rentals = [];
    }
    this._rentals.push(rental);
  }

  // Check if gear is available for a date range
  isAvailable(startDate: Date, endDate: Date): boolean {
    if (!this._rentals || this._rentals.length === 0) {
      return true;
    }

    for (const rental of this._rentals) {
      if (rental.status === 'pending' || rental.status === 'approved' || rental.status === 'confirmed') {
        // Check for date overlap
        if (startDate <= rental.endDate && endDate >= rental.startDate) {
          return false;
        }
      }
    }

    return true;
  }
}