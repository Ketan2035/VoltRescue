import Booking from '../models/Booking.js';
import Operator from '../models/Operator.js';
import AppError from '../utils/AppError.js';
import { calculatePrice } from './price.service.js';
import { createOrder } from './payment.service.js';

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP
};

export const createBooking = async (data) => {
  const { customerId, date, timeSlot, userLocation, connectorType, chargingType, batteryPercentage, requestedEnergyKWh, estimatedDuration, travelDistance, couponCode, paymentMethod } = data;

  // Calculate pricing
  const pricing = calculatePrice(requestedEnergyKWh, travelDistance, connectorType, chargingType, couponCode);

  const otp = generateOTP();

  const booking = await Booking.create({
    customerId,
    date,
    timeSlot,
    userLocation: {
      type: 'Point',
      coordinates: userLocation.coordinates,
      address: userLocation.address,
    },
    connectorType,
    chargingType,
    batteryPercentage,
    requestedEnergyKWh,
    estimatedDuration,
    travelDistance,
    pricing,
    paymentMethod,
    otp,
    status: 'PENDING',
  });

  return booking;
};

export const updateBookingStatus = async (bookingId, status, operatorId = null, extraData = {}) => {
  const validTransitions = {
    'PENDING': ['CONFIRMED', 'VEHICLE_ASSIGNED', 'CANCELLED'],
    'CONFIRMED': ['VEHICLE_ASSIGNED', 'CANCELLED'],
    'VEHICLE_ASSIGNED': ['DRIVER_STARTED', 'CANCELLED', 'REJECTED'],
    'DRIVER_STARTED': ['ARRIVING', 'CANCELLED'],
    'ARRIVING': ['OTP_VERIFIED', 'CANCELLED'],
    'OTP_VERIFIED': ['CHARGING_STARTED', 'CANCELLED'],
    'CHARGING_STARTED': ['CHARGING_COMPLETED'],
    'CHARGING_COMPLETED': ['COMPLETED'],
    'COMPLETED': [],
    'CANCELLED': [],
    'REJECTED': [],
    'EXPIRED': [],
    'REFUNDED': []
  };

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new AppError(404, 'Booking not found');
  }

  const allowedNextStates = validTransitions[booking.status];
  if (!allowedNextStates || !allowedNextStates.includes(status)) {
    throw new AppError(400, `Invalid state transition from ${booking.status} to ${status}`);
  }

  // Verification for OTP
  if (status === 'OTP_VERIFIED') {
    if (extraData.otp !== booking.otp) {
      throw new AppError(401, 'Invalid OTP');
    }
  } else if (status === 'CHARGING_STARTED') {
    booking.timeline.chargingStartedOn = new Date();
  }

  if (status === 'CONFIRMED') {
    booking.timeline.confirmedOn = new Date();
  } else if (status === 'VEHICLE_ASSIGNED') {
    booking.timeline.operatorAssignedOn = new Date();
    if (operatorId) booking.operatorId = operatorId;
  } else if (status === 'DRIVER_STARTED') {
    booking.timeline.driverStartedOn = new Date();
  } else if (status === 'ARRIVING') {
    booking.timeline.arrivingOn = new Date();
  } else if (status === 'CHARGING_COMPLETED') {
    booking.timeline.chargingCompletedOn = new Date();
    if (extraData.deliveredEnergyKWh) {
      booking.deliveredEnergyKWh = extraData.deliveredEnergyKWh;
      // Recalculate price based on actual delivered energy
      const newPricing = calculatePrice(booking.deliveredEnergyKWh, booking.travelDistance, booking.connectorType, booking.chargingType, booking.pricing.couponCode);
      booking.pricing = newPricing;
    }
    
    // Create Razorpay Order if payment is Online and pending
    if (booking.paymentMethod === 'Online' && booking.paymentStatus === 'Pending') {
       try {
         const order = await createOrder(booking.pricing.totalAmount, booking._id.toString());
         booking.razorpayOrderId = order.id;
       } catch (error) {
         console.error('Failed to create Razorpay order', error);
       }
    }
  } else if (status === 'COMPLETED') {
    booking.timeline.completedOn = new Date();
  } else if (status === 'CANCELLED' || status === 'REJECTED') {
    booking.timeline.cancelledOn = new Date();
    booking.cancellationReason = extraData.cancellationReason || 'User cancelled';
  }

  booking.status = status;
  await booking.save();
  
  // Free up operator if completed or cancelled
  if (['COMPLETED', 'CANCELLED', 'REJECTED'].includes(status) && booking.operatorId) {
     await Operator.findByIdAndUpdate(booking.operatorId, { currentBookingId: null, status: 'ONLINE' });
  }

  return booking;
};

export const getBookingDetails = async (bookingId) => {
  const booking = await Booking.findById(bookingId)
    .populate('operatorId', 'name phone vehicleDetails location rating profileImageUrl')
    .populate('customerId', 'name phone');
  if (!booking) {
    throw new AppError(404, 'Booking not found');
  }
  return booking;
};

export const getCustomerBookings = async (customerId) => {
  return await Booking.find({ customerId }).sort({ 'timeline.createdOn': -1 }).populate('operatorId', 'name vehicleDetails rating');
};

export const getOperatorBookings = async (operatorId, filter = {}) => {
  return await Booking.find({ operatorId, ...filter }).sort({ 'timeline.createdOn': -1 }).populate('customerId', 'name phone');
};
