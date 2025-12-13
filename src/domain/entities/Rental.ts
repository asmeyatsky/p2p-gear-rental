export interface RentalProps {
  id: string;
  gearId: string;
  gear?: any; // Will be updated with actual Gear type once created
  renterId: string;
  ownerId: string;
  startDate: Date;
  endDate: Date;
  status: string;
  message?: string;
  paymentIntentId?: string;
  clientSecret?: string;
  paymentStatus?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Rental {
  private readonly _id: string;
  private _gearId: string;
  private _gear?: any;
  private _renterId: string;
  private _ownerId: string;
  private _startDate: Date;
  private _endDate: Date;
  private _status: string;
  private _message?: string;
  private _paymentIntentId?: string;
  private _clientSecret?: string;
  private _paymentStatus?: string;
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: RentalProps) {
    this._id = props.id;
    this._gearId = props.gearId;
    this._gear = props.gear;
    this._renterId = props.renterId;
    this._ownerId = props.ownerId;
    this._startDate = props.startDate;
    this._endDate = props.endDate;
    this._status = props.status;
    this._message = props.message;
    this._paymentIntentId = props.paymentIntentId;
    this._clientSecret = props.clientSecret;
    this._paymentStatus = props.paymentStatus;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;

    this.validate();
  }

  private validate(): void {
    if (!['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'].includes(this._status)) {
      throw new Error('Invalid rental status');
    }
    if (this._startDate >= this._endDate) {
      throw new Error('End date must be after start date');
    }
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get gearId(): string {
    return this._gearId;
  }

  get gear(): any {
    return this._gear;
  }

  get renterId(): string {
    return this._renterId;
  }

  get ownerId(): string {
    return this._ownerId;
  }

  get startDate(): Date {
    return this._startDate;
  }

  get endDate(): Date {
    return this._endDate;
  }

  get status(): string {
    return this._status;
  }

  get message(): string | undefined {
    return this._message;
  }

  get paymentIntentId(): string | undefined {
    return this._paymentIntentId;
  }

  get clientSecret(): string | undefined {
    return this._clientSecret;
  }

  get paymentStatus(): string | undefined {
    return this._paymentStatus;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // Methods
  approve(): void {
    if (this._status !== 'PENDING') {
      throw new Error('Can only approve pending rentals');
    }
    this._status = 'APPROVED';
    this._updatedAt = new Date();
  }

  reject(): void {
    if (this._status !== 'PENDING') {
      throw new Error('Can only reject pending rentals');
    }
    this._status = 'REJECTED';
    this._updatedAt = new Date();
  }

  complete(): void {
    if (this._status !== 'APPROVED') {
      throw new Error('Can only complete approved rentals');
    }
    this._status = 'COMPLETED';
    this._updatedAt = new Date();
  }

  updateDates(startDate: Date, endDate: Date): void {
    if (startDate >= endDate) {
      throw new Error('End date must be after start date');
    }
    this._startDate = startDate;
    this._endDate = endDate;
    this._updatedAt = new Date();
  }

  updateMessage(message: string): void {
    this._message = message;
    this._updatedAt = new Date();
  }

  updatePaymentStatus(paymentStatus: string): void {
    this._paymentStatus = paymentStatus;
    this._updatedAt = new Date();
  }
}