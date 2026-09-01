import { z } from 'zod';

export const healthResponseSchema = z.object({
  data: z.object({
    status: z.literal('ok'),
    service: z.string(),
    timestamp: z.string().datetime(),
  }),
  meta: z.object({
    version: z.string(),
  }),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
