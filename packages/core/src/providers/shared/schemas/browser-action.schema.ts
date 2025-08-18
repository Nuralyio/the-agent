import { z } from 'zod';

/**
 * Schema for structured browser actions
 * Used by AI providers to generate structured responses for browser automation
 */
export const BrowserActionSchema = z.object({
  action: z.enum(['click', 'type', 'scroll', 'wait', 'hover', 'extract'])
    .describe('The action to perform'),

  selector: z.string().optional()
    .describe('CSS selector for the target element'),

  value: z.string().optional()
    .describe('Value to type or text to extract'),

  coordinates: z.object({
    x: z.number(),
    y: z.number()
  }).optional()
    .describe('X,Y coordinates for click or hover actions'),

  waitTime: z.number().optional()
    .describe('Time to wait in milliseconds'),

  scrollDirection: z.enum(['up', 'down', 'left', 'right']).optional()
    .describe('Direction to scroll'),

  scrollAmount: z.number().optional()
    .describe('Amount to scroll in pixels'),

  reasoning: z.string()
    .describe('Explanation of why this action is needed')
});

export type BrowserAction = z.infer<typeof BrowserActionSchema>;
