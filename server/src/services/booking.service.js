import Booking from '../models/Booking.js';
import Operator from '../models/Operator.js';
import AppError from '../utils/AppError.js';
import { calculatePrice } from './price.service.js';
import { createOrder } from './payment.service.js';

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP
};

export const createBooking = async (data) => {
  const { customerId, date, timeSlot, userLocation, personalInfo, vehicleModel, remarks, connectorType, chargingType, batteryPercentage, requestedEnergyKWh, estimatedDuration, travelDistance, couponCode, paymentMethod } = data;

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
    personalInfo,
    vehicleModel: vehicleModel || 'Tata Nexon EV',
    remarks,
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

export const ACTIVE_BOOKING_STATUSES = [
  'PENDING',
  'CREATED',
  'CONFIRMED',
  'SEARCHING_OPERATOR',
  'REQUEST_SENT',
  'OPERATOR_ASSIGNED',
  'OPERATOR_ACCEPTED',
  'VEHICLE_ASSIGNED',
  'DRIVER_STARTED',
  'OPERATOR_NAVIGATING',
  'ARRIVING',
  'OPERATOR_ARRIVED',
  'WAITING_TO_START_CHARGING',
  'OTP_VERIFIED',
  'CHARGING_STARTED',
  'CHARGING_IN_PROGRESS',
  'CHARGING_COMPLETED',
  'INVOICE_GENERATED',
  'PAYMENT_PENDING',
];

export const acceptBookingAtomic = async (bookingId, operatorId) => {
  const openStatuses = ['PENDING', 'CREATED', 'CONFIRMED', 'SEARCHING_OPERATOR', 'REQUEST_SENT'];
  const updated = await Booking.findOneAndUpdate(
    {
      _id: bookingId,
      status: { $in: openStatuses },
      $or: [{ operatorId: null }, { operatorId: { $exists: false } }],
    },
    {
      $set: {
        operatorId,
        status: 'VEHICLE_ASSIGNED',
        'timeline.operatorAssignedOn': new Date(),
      },
      $inc: { version: 1 },
    },
    { new: true }
  )
    .populate('operatorId', 'name phone vehicleDetails location rating profileImageUrl')
    .populate('customerId', 'name phone');

  if (!updated) {
    const existing = await Booking.findById(bookingId)
      .populate('operatorId', 'name phone vehicleDetails location rating profileImageUrl')
      .populate('customerId', 'name phone');
    if (existing && existing.operatorId?._id?.toString() === operatorId.toString()) {
      return existing;
    }
    throw new AppError(409, 'This rescue request has already been accepted by another technician or is no longer available.');
  }

  if (operatorId) {
    await Operator.findByIdAndUpdate(operatorId, {
      currentBookingId: bookingId,
      status: 'BUSY',
    });
  }

  return updated;
};

export const getActiveBookingForCustomer = async (customerId) => {
  return await Booking.findOne({
    customerId,
    status: { $in: ACTIVE_BOOKING_STATUSES },
  })
    .sort({ createdAt: -1 })
    .populate('operatorId', 'name phone vehicleDetails location rating profileImageUrl');
};

export const getActiveBookingForOperator = async (operatorId) => {
  return await Booking.findOne({
    operatorId,
    status: { $in: ACTIVE_BOOKING_STATUSES },
  })
    .sort({ createdAt: -1 })
    .populate('customerId', 'name phone');
};

export const updateBookingStatus = async (bookingId, status, operatorId = null, extraData = {}) => {
  const validTransitions = {
    'PENDING': ['CONFIRMED', 'VEHICLE_ASSIGNED', 'OPERATOR_ASSIGNED', 'DRIVER_STARTED', 'ARRIVING', 'OPERATOR_ARRIVED', 'CANCELLED'],
    'CREATED': ['CONFIRMED', 'VEHICLE_ASSIGNED', 'OPERATOR_ASSIGNED', 'CANCELLED'],
    'CONFIRMED': ['VEHICLE_ASSIGNED', 'OPERATOR_ASSIGNED', 'DRIVER_STARTED', 'ARRIVING', 'CANCELLED'],
    'SEARCHING_OPERATOR': ['OPERATOR_ASSIGNED', 'VEHICLE_ASSIGNED', 'CANCELLED'],
    'REQUEST_SENT': ['OPERATOR_ACCEPTED', 'VEHICLE_ASSIGNED', 'CANCELLED', 'REJECTED'],
    'OPERATOR_ASSIGNED': ['OPERATOR_ACCEPTED', 'DRIVER_STARTED', 'OPERATOR_NAVIGATING', 'ARRIVING', 'CANCELLED'],
    'OPERATOR_ACCEPTED': ['DRIVER_STARTED', 'OPERATOR_NAVIGATING', 'ARRIVING', 'CANCELLED'],
    'VEHICLE_ASSIGNED': ['DRIVER_STARTED', 'OPERATOR_NAVIGATING', 'ARRIVING', 'OPERATOR_ARRIVED', 'OTP_VERIFIED', 'CANCELLED', 'REJECTED'],
    'DRIVER_STARTED': ['OPERATOR_NAVIGATING', 'ARRIVING', 'OPERATOR_ARRIVED', 'OTP_VERIFIED', 'CHARGING_STARTED', 'CANCELLED'],
    'OPERATOR_NAVIGATING': ['ARRIVING', 'OPERATOR_ARRIVED', 'OTP_VERIFIED', 'CHARGING_STARTED', 'CANCELLED'],
    'ARRIVING': ['OPERATOR_ARRIVED', 'OTP_VERIFIED', 'WAITING_TO_START_CHARGING', 'CHARGING_STARTED', 'CANCELLED'],
    'OPERATOR_ARRIVED': ['OTP_VERIFIED', 'WAITING_TO_START_CHARGING', 'CHARGING_STARTED', 'CANCELLED'],
    'WAITING_TO_START_CHARGING': ['OTP_VERIFIED', 'CHARGING_STARTED', 'CANCELLED'],
    'OTP_VERIFIED': ['CHARGING_STARTED', 'CHARGING_IN_PROGRESS', 'CHARGING_COMPLETED', 'CANCELLED'],
    'CHARGING_STARTED': ['CHARGING_IN_PROGRESS', 'CHARGING_COMPLETED', 'INVOICE_GENERATED', 'CANCELLED'],
    'CHARGING_IN_PROGRESS': ['CHARGING_COMPLETED', 'INVOICE_GENERATED', 'CANCELLED'],
    'CHARGING_COMPLETED': ['INVOICE_GENERATED', 'PAYMENT_PENDING', 'PAYMENT_SUCCESS', 'COMPLETED', 'BOOKING_COMPLETED'],
    'INVOICE_GENERATED': ['PAYMENT_PENDING', 'PAYMENT_SUCCESS', 'COMPLETED', 'BOOKING_COMPLETED'],
    'PAYMENT_PENDING': ['PAYMENT_SUCCESS', 'COMPLETED', 'BOOKING_COMPLETED'],
    'PAYMENT_SUCCESS': ['COMPLETED', 'BOOKING_COMPLETED', 'REVIEW_SUBMITTED'],
    'COMPLETED': ['REVIEW_SUBMITTED'],
    'BOOKING_COMPLETED': ['REVIEW_SUBMITTED'],
    'REVIEW_SUBMITTED': [],
    'CANCELLED': [],
    'REJECTED': [],
    'EXPIRED': [],
    'REFUNDED': []
  };

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new AppError(404, 'Booking not found');
  }

  // Idempotent: If booking is already in the requested status, return gracefully
  if (booking.status === status) {
    return booking;
  }

  // Define state progression order to prevent stale requests from crashing the UI
  const STATUS_ORDER = {
    'PENDING': 1,
    'CREATED': 1,
    'CONFIRMED': 2,
    'SEARCHING_OPERATOR': 2,
    'REQUEST_SENT': 2,
    'OPERATOR_ASSIGNED': 3,
    'OPERATOR_ACCEPTED': 3,
    'VEHICLE_ASSIGNED': 3,
    'DRIVER_STARTED': 4,
    'OPERATOR_NAVIGATING': 4,
    'ARRIVING': 5,
    'OPERATOR_ARRIVED': 6,
    'WAITING_TO_START_CHARGING': 6,
    'OTP_VERIFIED': 7,
    'CHARGING_STARTED': 8,
    'CHARGING_IN_PROGRESS': 9,
    'CHARGING_COMPLETED': 10,
    'INVOICE_GENERATED': 11,
    'PAYMENT_PENDING': 12,
    'PAYMENT_SUCCESS': 13,
    'COMPLETED': 14,
    'BOOKING_COMPLETED': 14,
    'REVIEW_SUBMITTED': 15,
  };

  // If already completed or in final state, don't fail subsequent completion calls
  const finalStates = ['COMPLETED', 'BOOKING_COMPLETED', 'PAYMENT_SUCCESS'];
  if (finalStates.includes(booking.status) && (status === 'COMPLETED' || status === 'PAYMENT_SUCCESS' || status === 'BOOKING_COMPLETED')) {
    if (status === 'COMPLETED' && booking.status !== 'COMPLETED') {
      booking.status = 'COMPLETED';
      booking.version = (booking.version || 1) + 1;
      booking.timeline.completedOn = new Date();
      await booking.save();
    }
    return booking;
  }

  // Stale request guard: If booking is already past the requested state in the happy path, return current booking
  if (
    STATUS_ORDER[booking.status] && 
    STATUS_ORDER[status] && 
    STATUS_ORDER[booking.status] > STATUS_ORDER[status] && 
    status !== 'CANCELLED' && 
    status !== 'REJECTED'
  ) {
    console.log(`[Status Ignored] Booking ${bookingId} is already at ${booking.status}; ignoring stale request for ${status}`);
    return booking;
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
  booking.version = (booking.version || 1) + 1;
  await booking.save();
  
  // Free up operator if completed or cancelled
  if (['COMPLETED', 'CANCELLED', 'REJECTED'].includes(status) && booking.operatorId) {
     await Operator.findByIdAndUpdate(booking.operatorId, { currentBookingId: null, status: 'ONLINE' });
  }

  return await Booking.findById(booking._id)
    .populate('operatorId', 'name phone vehicleDetails location rating profileImageUrl')
    .populate('customerId', 'name phone');
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
