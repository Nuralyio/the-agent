import { z } from 'zod';

/**
 * Zod schemas for structured AI output validation
 */

// Action target schema
export const ActionTargetSchema = z.object({
  selector: z.string().describe('CSS selector for the target element'),
  description: z.string().describe('Human-readable description of the target')
});

// Action step schema
export const ActionStepSchema = z.object({
  type: z.enum([
    'NAVIGATE', 'CLICK', 'TYPE', 'FILL', 'SCROLL',
    'WAIT', 'EXTRACT', 'SCREENSHOT'
  ]).describe('The type of browser action to perform'),
  target: ActionTargetSchema.optional().describe('Target element information (not needed for NAVIGATE, SCREENSHOT, WAIT)'),
  value: z.string().optional().describe('Value to use for the action (URL for NAVIGATE, text for TYPE, etc.)'),
  description: z.string().describe('Human-readable description of what this step does')
});

// Main action plan schema
export const ActionPlanSchema = z.object({
  steps: z.array(ActionStepSchema).min(1).describe('Array of browser automation steps to execute'),
  reasoning: z.string().describe('Brief explanation of the approach taken')
});

// Type exports for TypeScript
export type ActionTarget = z.infer<typeof ActionTargetSchema>;
export type ActionStepInput = z.infer<typeof ActionStepSchema>;
export type ActionPlanInput = z.infer<typeof ActionPlanSchema>;
