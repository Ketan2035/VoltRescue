import mongoose from 'mongoose';

const operatorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      index: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false, // Exclude from default queries
    },
    profileImageUrl: {
      type: String,
    },
    vehicleDetails: {
      make: String,
      model: String,
      licensePlate: String,
      capacityKWh: Number,
      supportedConnectors: {
        type: [String],
        default: ['CCS2', 'CHAdeMO', 'Type2'],
      }
    },
    fcmToken: {
      type: String, // For push notifications
    },
    walletBalance: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['ONLINE', 'OFFLINE', 'ON_TRIP', 'CHARGING'],
      default: 'OFFLINE',
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
    },
    currentBookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
    },
    rating: {
      type: Number,
      default: 5.0,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Geospatial index for location-based queries
operatorSchema.index({ location: '2dsphere' });

const Operator = mongoose.model('Operator', operatorSchema);
export default Operator;
