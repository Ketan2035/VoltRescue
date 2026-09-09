import { z } from 'zod';

export const createBookingSchema = z.object({
  body: z.object({
    userLocation: z.tuple([z.number(), z.number()]),
    requestedEnergyKWh: z.number().positive(),
  }),
});

export const updateStatusSchema = z.object({
  body: z.object({
    status: z.enum([
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
      'OTP_VERIFIED',
      'WAITING_TO_START_CHARGING',
      'CHARGING_STARTED',
      'CHARGING_IN_PROGRESS',
      'CHARGING_COMPLETED',
      'INVOICE_GENERATED',
      'PAYMENT_PENDING',
      'PAYMENT_SUCCESS',
      'COMPLETED',
      'BOOKING_COMPLETED',
      'REVIEW_SUBMITTED',
      'CANCELLED',
      'REJECTED',
      'EXPIRED',
      'REFUNDED'
    ]),
    otp: z.string().optional(),
    deliveredEnergyKWh: z.number().optional(),
    cancellationReason: z.string().optional(),
  }),
});
