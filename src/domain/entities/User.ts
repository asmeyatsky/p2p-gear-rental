export interface UserProps {
  id: string;
  email: string;
  fullName?: string;
  averageRating?: number;
  totalReviews: number;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  private readonly _id: string;
  private _email: string;
  private _fullName?: string;
  private _averageRating?: number;
  private _totalReviews: number;
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: UserProps) {
    this._id = props.id;
    this._email = props.email;
    this._fullName = props.fullName;
    this._averageRating = props.averageRating;
    this._totalReviews = props.totalReviews;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;

    this.validate();
  }

  private validate(): void {
    if (!this._email.includes('@')) {
      throw new Error('Invalid email address');
    }
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get email(): string {
    return this._email;
  }

  get fullName(): string | undefined {
    return this._fullName;
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

  // Methods
  updateEmail(email: string): void {
    if (!email.includes('@')) {
      throw new Error('Invalid email address');
    }
    this._email = email;
    this._updatedAt = new Date();
  }

  updateFullName(fullName: string): void {
    this._fullName = fullName;
    this._updatedAt = new Date();
  }

  updateRating(averageRating: number, totalReviews: number): void {
    if (averageRating < 0 || averageRating > 5) {
      throw new Error('Rating must be between 0 and 5');
    }
    if (totalReviews < 0) {
      throw new Error('Total reviews cannot be negative');
    }
    this._averageRating = averageRating;
    this._totalReviews = totalReviews;
    this._updatedAt = new Date();
  }
}