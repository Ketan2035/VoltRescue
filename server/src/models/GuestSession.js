import mongoose from 'mongoose';

const guestSessionSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    fcmToken: {
      type: String, // For push notifications
    },
    activeBookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const GuestSession = mongoose.model('GuestSession', guestSessionSchema);
export default GuestSession;
