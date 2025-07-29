import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  decimal,
  bigint,
  jsonb,
  index,
  integer,
  boolean,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Trading Symbols table
export const symbols = pgTable('symbols', {
  id: serial('id').primaryKey(),
  symbol: varchar('symbol', { length: 20 }).notNull().unique(),
  baseAsset: varchar('base_asset', { length: 10 }).notNull(),
  quoteAsset: varchar('quote_asset', { length: 10 }).notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  symbolIdx: index('symbol_idx').on(table.symbol),
}));

// Candlestick data table
export const candlesticks = pgTable('candlesticks', {
  id: serial('id').primaryKey(),
  symbolId: integer('symbol_id')
    .notNull()
    .references(() => symbols.id),
  interval: varchar('interval', { length: 10 }).notNull(), // 1m, 5m, 15m, 1h, 4h, 1d, etc.
  openTime: bigint('open_time', { mode: 'number' }).notNull(),
  closeTime: bigint('close_time', { mode: 'number' }).notNull(),
  open: decimal('open', { precision: 20, scale: 8 }).notNull(),
  high: decimal('high', { precision: 20, scale: 8 }).notNull(),
  low: decimal('low', { precision: 20, scale: 8 }).notNull(),
  close: decimal('close', { precision: 20, scale: 8 }).notNull(),
  volume: decimal('volume', { precision: 20, scale: 8 }).notNull(),
  quoteAssetVolume: decimal('quote_asset_volume', { precision: 20, scale: 8 }).notNull(),
  numberOfTrades: integer('number_of_trades').notNull(),
  takerBuyBaseAssetVolume: decimal('taker_buy_base_asset_volume', { precision: 20, scale: 8 }).notNull(),
  takerBuyQuoteAssetVolume: decimal('taker_buy_quote_asset_volume', { precision: 20, scale: 8 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  symbolIntervalTimeIdx: index('symbol_interval_time_idx').on(table.symbolId, table.interval, table.openTime),
  openTimeIdx: index('open_time_idx').on(table.openTime),
}));

// Technical Indicator Types table for extensibility
export const indicatorTypes = pgTable('indicator_types', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  description: text('description'),
  parameters: jsonb('parameters'), // Store parameter definitions as JSON
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Technical Indicators data table
export const technicalIndicators = pgTable('technical_indicators', {
  id: serial('id').primaryKey(),
  symbolId: integer('symbol_id')
    .notNull()
    .references(() => symbols.id),
  indicatorTypeId: integer('indicator_type_id')
    .notNull()
    .references(() => indicatorTypes.id),
  interval: varchar('interval', { length: 10 }).notNull(),
  timestamp: bigint('timestamp', { mode: 'number' }).notNull(),
  values: jsonb('values').notNull(), // Store indicator values as JSON (flexible for different indicators)
  parameters: jsonb('parameters'), // Store parameters used for this calculation
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  symbolIndicatorTimeIdx: index('symbol_indicator_time_idx').on(table.symbolId, table.indicatorTypeId, table.interval, table.timestamp),
  timestampIdx: index('timestamp_idx').on(table.timestamp),
}));

// Relations
export const symbolsRelations = relations(symbols, ({ many }) => ({
  candlesticks: many(candlesticks),
  technicalIndicators: many(technicalIndicators),
}));

export const candlesticksRelations = relations(candlesticks, ({ one }) => ({
  symbol: one(symbols, {
    fields: [candlesticks.symbolId],
    references: [symbols.id],
  }),
}));

export const indicatorTypesRelations = relations(indicatorTypes, ({ many }) => ({
  technicalIndicators: many(technicalIndicators),
}));

export const technicalIndicatorsRelations = relations(technicalIndicators, ({ one }) => ({
  symbol: one(symbols, {
    fields: [technicalIndicators.symbolId],
    references: [symbols.id],
  }),
  indicatorType: one(indicatorTypes, {
    fields: [technicalIndicators.indicatorTypeId],
    references: [indicatorTypes.id],
  }),
}));

// Type exports
export type Symbol = typeof symbols.$inferSelect;
export type NewSymbol = typeof symbols.$inferInsert;
export type Candlestick = typeof candlesticks.$inferSelect;
export type NewCandlestick = typeof candlesticks.$inferInsert;
export type IndicatorType = typeof indicatorTypes.$inferSelect;
export type NewIndicatorType = typeof indicatorTypes.$inferInsert;
export type TechnicalIndicator = typeof technicalIndicators.$inferSelect;
export type NewTechnicalIndicator = typeof technicalIndicators.$inferInsert;

// Enums for common intervals
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

// Common indicator types enum
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