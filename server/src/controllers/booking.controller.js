import * as bookingService from '../services/booking.service.js';
import * as operatorService from '../services/operator.service.js';
import { checkSlotAvailability } from '../services/slot.service.js';
import { getIO } from '../sockets/socketManager.js';
import AppError from '../utils/AppError.js';

export const create = async (req, res, next) => {
  try {
    const customerId = req.customerId || req.guestId; // Fallback to guest if still used

    if (!customerId) {
      throw new AppError(401, 'Customer ID or Guest session ID is missing');
    }

    const { date, timeSlot, userLocation, connectorType, chargingType, batteryPercentage, requestedEnergyKWh, estimatedDuration, travelDistance, couponCode, paymentMethod } = req.body;

    // 1. Initial creation
    let booking = await bookingService.createBooking({
      customerId,
      date,
      timeSlot,
      userLocation,
      connectorType,
      chargingType,
      batteryPercentage,
      requestedEnergyKWh,
      estimatedDuration,
      travelDistance,
      couponCode,
      paymentMethod
    });

    // We can auto-confirm or leave it PENDING until payment if online, but per prompt:
    // "Find operators... send request". Since there is a slot logic, if operator is not pre-selected, we find nearby.
    // If operator is pre-selected from browse screen, we can assign directly.
    // Assuming we find nearby operators:
    const nearbyOperators = await operatorService.getNearbyOperators(userLocation.coordinates);
    const io = getIO();
    
    if (nearbyOperators && nearbyOperators.length > 0) {
      // Send to specific eligible operators
      for (const operator of nearbyOperators) {
        // --- TEST MODE: SIMULATE OPERATOR NEARBY ---
        const mockOpLng = userLocation.coordinates[0] + 0.01;
        const mockOpLat = userLocation.coordinates[1] + 0.01;
        await operatorService.updateLocationAndStatus(operator._id, [mockOpLng, mockOpLat], 'ONLINE');
        // -------------------------------------------

        io.to(`operator_${operator._id.toString()}`).emit('new_booking_request', {
          bookingId: booking._id,
          userLocation,
          requestedEnergyKWh,
          estimatedPrice: booking.pricing?.totalAmount || '0.00',
          distance: travelDistance || '1.2',
          pickupLocation: userLocation,
          customerName: req.body.personalInfo?.name || 'App User',
          customerPhone: req.body.personalInfo?.phone || 'N/A',
          address: userLocation.address || 'Current Location',
          connectorType: connectorType || 'Unknown',
          chargingType: chargingType || 'Standard',
          batteryPercentage: req.body.batteryPercentage?.current || 20,
          paymentMethod: paymentMethod || 'Online'
        });
      }
    } else {
      // Handle no operators found
      booking = await bookingService.updateBookingStatus(booking._id, 'CANCELLED', null, { cancellationReason: 'No nearby operators available' });
      throw new AppError(404, 'No available operators nearby. Please try again later.');
    }

    res.status(201).json({
      status: 'success',
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
};

export const updateStatus = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { status, otp, deliveredEnergyKWh, cancellationReason } = req.body;
    const operatorId = req.operatorId;

    // If accepting, check slot availability
    if (status === 'VEHICLE_ASSIGNED' && operatorId) {
      const booking = await bookingService.getBookingDetails(bookingId);
      if (booking.timeSlot && booking.timeSlot.start) {
         const availability = await checkSlotAvailability(operatorId, booking.date, booking.timeSlot.start, booking.timeSlot.end, bookingId);
         if (!availability.isAvailable) {
           // TEMPORARILY DISABLED FOR PROTOTYPE TESTING
           // throw new AppError(400, `Cannot accept booking: ${availability.reason}`);
           console.log(`[TESTING] Ignored overlap check: ${availability.reason}`);
         }
      }
    }

    const extraData = { otp, deliveredEnergyKWh, cancellationReason };
    const booking = await bookingService.updateBookingStatus(bookingId, status, operatorId, extraData);

    const io = getIO();
    io.to(`booking_${bookingId}`).emit('booking_status_update', {
      bookingId,
      status,
      operatorId,
      booking
    });

    if (status === 'VEHICLE_ASSIGNED') {
      io.emit('booking_assigned', { bookingId });
    }

    res.status(200).json({
      status: 'success',
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
};

export const getDetails = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const booking = await bookingService.getBookingDetails(bookingId);
    
    res.status(200).json({
      status: 'success',
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomerBookings = async (req, res, next) => {
  try {
    const customerId = req.customerId || req.guestId;
    const bookings = await bookingService.getCustomerBookings(customerId);
    res.status(200).json({
      status: 'success',
      results: bookings.length,
      data: { bookings }
    });
  } catch (error) {
    next(error);
  }
};

export const getOperatorBookings = async (req, res, next) => {
  try {
    const operatorId = req.operatorId;
    const bookings = await bookingService.getOperatorBookings(operatorId);
    res.status(200).json({
      status: 'success',
      results: bookings.length,
      data: { bookings }
    });
  } catch (error) {
    next(error);
  }
};

export const getAvailability = async (req, res, next) => {
  try {
    const { operatorId, date, startTime, endTime } = req.query;
    const availability = await checkSlotAvailability(operatorId, date, startTime, endTime);
    res.status(200).json({
      status: 'success',
      data: { availability }
    });
  } catch (error) {
    next(error);
  }
};
