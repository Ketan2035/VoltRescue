import { z } from 'zod';

export const updateStatusSchema = z.object({
  body: z.object({
    status: z.enum(['ONLINE', 'OFFLINE', 'ON_TRIP', 'CHARGING']).optional(),
    coordinates: z.tuple([z.number(), z.number()]).optional(),
  }),
});

export const getNearbySchema = z.object({
  query: z.object({
    lng: z.string().regex(/^-?\d+(\.\d+)?$/, 'Must be a valid number'),
    lat: z.string().regex(/^-?\d+(\.\d+)?$/, 'Must be a valid number'),
  }),
});
