import mongoose from 'mongoose';

const availabilitySchema = new mongoose.Schema(
  {
    operatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Operator',
      required: true,
      index: true,
    },
    workingDays: {
      type: [String], // e.g., ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    },
    workingHours: {
      start: {
        type: String, // e.g., '08:00'
        default: '08:00',
      },
      end: {
        type: String, // e.g., '20:00'
        default: '20:00',
      },
    },
    breakHours: {
      start: {
        type: String, // e.g., '13:00'
      },
      end: {
        type: String, // e.g., '14:00'
      },
    },
    maximumBookingsPerDay: {
      type: Number,
      default: 10,
    },
    unavailableDates: {
      type: [Date], // specific days off
      default: [],
    },
    holidays: {
      type: [String], // e.g., ['2026-12-25']
      default: [],
    }
  },
  { timestamps: true }
);

const Availability = mongoose.model('Availability', availabilitySchema);
export default Availability;
