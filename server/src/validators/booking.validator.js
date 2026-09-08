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
      'CREATED',
      'SEARCHING_OPERATOR',
      'REQUEST_SENT',
      'OPERATOR_ASSIGNED',
      'OPERATOR_ACCEPTED',
      'OPERATOR_NAVIGATING',
      'OPERATOR_ARRIVED',
      'WAITING_TO_START_CHARGING',
      'CHARGING_STARTED',
      'CHARGING_IN_PROGRESS',
      'CHARGING_COMPLETED',
      'INVOICE_GENERATED',
      'PAYMENT_PENDING',
      'PAYMENT_SUCCESS',
      'BOOKING_COMPLETED',
      'REVIEW_SUBMITTED',
      'CANCELLED'
    ]),
  }),
});
