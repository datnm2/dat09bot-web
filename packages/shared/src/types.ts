export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: 'owner' | 'member';
  createdAt: Date;
  updatedAt: Date;
}

export interface Team {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripeProductId?: string;
  planName?: string;
  subscriptionStatus?: string;
}

export interface TeamMember {
  id: string;
  userId: string;
  teamId: string;
  role: 'owner' | 'member';
  joinedAt: Date;
}

export interface ActivityLog {
  id: string;
  teamId: string;
  userId?: string;
  action: string;
  timestamp: Date;
  ipAddress?: string;
}

// Trading related types
export interface Symbol {
  id: number;
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Candlestick {
  id: number;
  symbolId: number;
  interval: string;
  openTime: number;
  closeTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  quoteAssetVolume: string;
  numberOfTrades: number;
  takerBuyBaseAssetVolume: string;
  takerBuyQuoteAssetVolume: string;
  createdAt: Date;
}

export interface IndicatorType {
  id: number;
  name: string;
  description?: string;
  parameters?: Record<string, any>;
  createdAt: Date;
}

export interface TechnicalIndicator {
  id: number;
  symbolId: number;
  indicatorTypeId: number;
  interval: string;
  timestamp: number;
  values: Record<string, any>;
  parameters?: Record<string, any>;
  createdAt: Date;
}

// Enums
export enum TimeInterval {
  ONE_MINUTE = '1m',
  THREE_MINUTES = '3m',
  FIVE_MINUTES = '5m',
  FIFTEEN_MINUTES = '15m',
  THIRTY_MINUTES = '30m',
  ONE_HOUR = '1h',
  TWO_HOURS = '2h',
  FOUR_HOURS = '4h',
  SIX_HOURS = '6h',
  EIGHT_HOURS = '8h',
  TWELVE_HOURS = '12h',
  ONE_DAY = '1d',
  THREE_DAYS = '3d',
  ONE_WEEK = '1w',
  ONE_MONTH = '1M',
}

export enum IndicatorTypeEnum {
  RSI = 'RSI',
  MACD = 'MACD',
  BOLLINGER_BANDS = 'BOLLINGER_BANDS',
  SMA = 'SMA',
  EMA = 'EMA',
  STOCHASTIC = 'STOCHASTIC',
  ATR = 'ATR',
  ADX = 'ADX',
}

// Request/Response DTOs
export interface CreateSymbolRequest {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
}

export interface CreateCandlestickRequest {
  symbolId: number;
  interval: string;
  openTime: number;
  closeTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  quoteAssetVolume: string;
  numberOfTrades: number;
  takerBuyBaseAssetVolume: string;
  takerBuyQuoteAssetVolume: string;
}

export interface CreateTechnicalIndicatorRequest {
  symbolId: number;
  indicatorTypeId: number;
  interval: string;
  timestamp: number;
  values: Record<string, any>;
  parameters?: Record<string, any>;
}

export interface CandlestickQueryParams {
  symbolId: number;
  interval: string;
  startTime?: number;
  endTime?: number;
  limit?: number;
}

export interface TechnicalIndicatorQueryParams {
  symbolId: number;
  indicatorTypeId: number;
  interval: string;
  startTime?: number;
  endTime?: number;
  limit?: number;
}