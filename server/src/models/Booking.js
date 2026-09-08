import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      index: true,
      required: true,
    },
    operatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Operator',
      index: true,
    },
    status: {
      type: String,
      enum: [
        'PENDING',
        'CONFIRMED',
        'VEHICLE_ASSIGNED',
        'DRIVER_STARTED',
        'ARRIVING',
        'OTP_VERIFIED',
        'CHARGING_STARTED',
        'CHARGING_COMPLETED',
        'COMPLETED',
        'CANCELLED',
        'REJECTED',
        'EXPIRED',
        'REFUNDED'
      ],
      default: 'PENDING',
    },
    date: {
      type: Date,
      required: true,
    },
    timeSlot: {
      start: String, // e.g. "14:00"
      end: String,   // e.g. "15:00"
    },
    userLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
      address: String,
    },
    connectorType: {
      type: String,
      required: true,
    },
    chargingType: {
      type: String,
    },
    batteryPercentage: {
      current: Number,
      target: Number,
    },
    requestedEnergyKWh: {
      type: Number,
      required: true,
    },
    deliveredEnergyKWh: {
      type: Number,
      default: 0,
    },
    estimatedDuration: {
      type: Number, // in minutes
    },
    travelDistance: {
      type: Number, // in km
    },
    pricing: {
      baseFare: { type: Number, default: 0 },
      energyCost: { type: Number, default: 0 },
      tax: { type: Number, default: 0 },
      serviceCharge: { type: Number, default: 0 },
      travelCharge: { type: Number, default: 0 },
      emergencyCharge: { type: Number, default: 0 },
      nightCharge: { type: Number, default: 0 },
      peakHourCharge: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      couponCode: { type: String },
      totalAmount: { type: Number, default: 0 },
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'UPI', 'Debit Card', 'Credit Card', 'Wallet', 'Online'],
      default: 'Online',
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
      default: 'Pending',
    },
    razorpayOrderId: {
      type: String,
    },
    razorpayPaymentId: {
      type: String,
    },
    otp: {
      type: String,
    },
    cancellationReason: {
      type: String,
    },
    rating: {
      score: { type: Number, min: 1, max: 5 },
      review: String,
    },
    timeline: {
      createdOn: { type: Date, default: Date.now },
      confirmedOn: { type: Date },
      operatorAssignedOn: { type: Date },
      driverStartedOn: { type: Date },
      arrivingOn: { type: Date },
      chargingStartedOn: { type: Date },
      chargingCompletedOn: { type: Date },
      completedOn: { type: Date },
      cancelledOn: { type: Date }
    }
  },
  { timestamps: true }
);

bookingSchema.index({ userLocation: '2dsphere' });

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
