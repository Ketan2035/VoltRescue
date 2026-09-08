import Booking from '../models/Booking.js';
import Availability from '../models/Availability.js';

/**
 * Parses time string HH:mm into minutes since start of day
 */
const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Checks if a specific timeslot for an operator on a specific date is available
 * taking into account working hours, break hours, holidays, and existing bookings.
 */
export const checkSlotAvailability = async (operatorId, date, startTime, endTime, excludeBookingId = null) => {
  const queryDate = new Date(date);
  queryDate.setHours(0, 0, 0, 0);

  let availability = await Availability.findOne({ operatorId });
  if (!availability) {
    // Provide lenient defaults if not configured
    availability = {
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      workingHours: { start: '00:00', end: '23:59' },
      breakHours: null,
      holidays: [],
      unavailableDates: [],
      maximumBookingsPerDay: 50
    };
  }

  // 2. Check Holidays & Unavailable Dates
  const dateStr = queryDate.toISOString().split('T')[0];
  if (availability.holidays.includes(dateStr)) {
    return { isAvailable: false, reason: 'Operator is on holiday' };
  }
  const isUnavailableDate = availability.unavailableDates.some(
    (uDate) => new Date(uDate).getTime() === queryDate.getTime()
  );
  if (isUnavailableDate) {
    return { isAvailable: false, reason: 'Operator is unavailable on this date' };
  }

  // 3. Check Working Days
  const dayOfWeek = queryDate.toLocaleDateString('en-US', { weekday: 'long' });
  if (!availability.workingDays.includes(dayOfWeek)) {
    return { isAvailable: false, reason: 'Operator does not work on this day' };
  }

  const reqStart = timeToMinutes(startTime);
  const reqEnd = timeToMinutes(endTime);

  // 4. Check Working Hours
  const workStart = timeToMinutes(availability.workingHours.start);
  const workEnd = timeToMinutes(availability.workingHours.end);
  if (reqStart < workStart || reqEnd > workEnd) {
    return { isAvailable: false, reason: 'Requested time is outside working hours' };
  }

  // 5. Check Break Hours
  if (availability.breakHours && availability.breakHours.start && availability.breakHours.end) {
    const breakStart = timeToMinutes(availability.breakHours.start);
    const breakEnd = timeToMinutes(availability.breakHours.end);
    
    // Check overlap with break time
    if (Math.max(reqStart, breakStart) < Math.min(reqEnd, breakEnd)) {
      return { isAvailable: false, reason: 'Requested time overlaps with break time' };
    }
  }

  // 6. Check existing bookings
  const nextDay = new Date(queryDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const query = {
    operatorId,
    date: {
      $gte: queryDate,
      $lt: nextDay
    },
    status: { $nin: ['CANCELLED', 'REJECTED', 'EXPIRED', 'REFUNDED'] } // Ignore cancelled ones
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const existingBookings = await Booking.find(query);

  if (existingBookings.length >= availability.maximumBookingsPerDay) {
    return { isAvailable: false, reason: 'Operator has reached maximum bookings for the day' };
  }

  // Check overlap with any existing booking
  for (const booking of existingBookings) {
    if (booking.timeSlot && booking.timeSlot.start && booking.timeSlot.end) {
      const bStart = timeToMinutes(booking.timeSlot.start);
      const bEnd = timeToMinutes(booking.timeSlot.end);

      if (Math.max(reqStart, bStart) < Math.min(reqEnd, bEnd)) {
        return { isAvailable: false, reason: 'Requested time slot overlaps with another booking' };
      }
    }
  }

  return { isAvailable: true };
};
