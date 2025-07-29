import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

export const createTeamSchema = z.object({
  name: z.string().min(1),
});

export type LoginRequest = z.infer<typeof loginSchema>;
export type RegisterRequest = z.infer<typeof registerSchema>;
export type CreateTeamRequest = z.infer<typeof createTeamSchema>;

// Trading schemas
export const createSymbolSchema = z.object({
  symbol: z.string().min(1).max(20),
  baseAsset: z.string().min(1).max(10),
  quoteAsset: z.string().min(1).max(10),
});

export const createCandlestickSchema = z.object({
  symbolId: z.number().int().positive(),
  interval: z.string().min(1).max(10),
  openTime: z.number().int().positive(),
  closeTime: z.number().int().positive(),
  open: z.string().regex(/^\d+\.?\d*$/),
  high: z.string().regex(/^\d+\.?\d*$/),
  low: z.string().regex(/^\d+\.?\d*$/),
  close: z.string().regex(/^\d+\.?\d*$/),
  volume: z.string().regex(/^\d+\.?\d*$/),
  quoteAssetVolume: z.string().regex(/^\d+\.?\d*$/),
  numberOfTrades: z.number().int().min(0),
  takerBuyBaseAssetVolume: z.string().regex(/^\d+\.?\d*$/),
  takerBuyQuoteAssetVolume: z.string().regex(/^\d+\.?\d*$/),
});

export const createTechnicalIndicatorSchema = z.object({
  symbolId: z.number().int().positive(),
  indicatorTypeId: z.number().int().positive(),
  interval: z.string().min(1).max(10),
  timestamp: z.number().int().positive(),
  values: z.record(z.any()),
  parameters: z.record(z.any()).optional(),
});

export const candlestickQuerySchema = z.object({
  symbolId: z.number().int().positive(),
  interval: z.string().min(1).max(10),
  startTime: z.number().int().positive().optional(),
  endTime: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(1000).optional(),
});

export const technicalIndicatorQuerySchema = z.object({
  symbolId: z.number().int().positive(),
  indicatorTypeId: z.number().int().positive(),
  interval: z.string().min(1).max(10),
  startTime: z.number().int().positive().optional(),
  endTime: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(1000).optional(),
});

export const createIndicatorTypeSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().optional(),
  parameters: z.record(z.any()).optional(),
});

export const timeIntervalSchema = z.enum([
  '1m', '3m', '5m', '15m', '30m',
  '1h', '2h', '4h', '6h', '8h', '12h',
  '1d', '3d', '1w', '1M'
]);

export const indicatorTypeEnumSchema = z.enum([
  'RSI', 'MACD', 'BOLLINGER_BANDS', 'SMA', 'EMA',
  'STOCHASTIC', 'ATR', 'ADX'
]);

// Type exports
export type CreateSymbolRequest = z.infer<typeof createSymbolSchema>;
export type CreateCandlestickRequest = z.infer<typeof createCandlestickSchema>;
export type CreateTechnicalIndicatorRequest = z.infer<typeof createTechnicalIndicatorSchema>;
export type CandlestickQueryParams = z.infer<typeof candlestickQuerySchema>;
export type TechnicalIndicatorQueryParams = z.infer<typeof technicalIndicatorQuerySchema>;
export type CreateIndicatorTypeRequest = z.infer<typeof createIndicatorTypeSchema>;