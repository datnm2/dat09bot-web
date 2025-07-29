import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { SymbolsRepository } from '../repositories/symbols.repository';
import { CandlesticksRepository } from '../repositories/candlesticks.repository';
import { NewCandlestick, TimeInterval } from '../database/schema';

interface BinanceKline {
  0: number;  // Open time
  1: string;  // Open
  2: string;  // High
  3: string;  // Low
  4: string;  // Close
  5: string;  // Volume
  6: number;  // Close time
  7: string;  // Quote asset volume
  8: number;  // Number of trades
  9: string;  // Taker buy base asset volume
  10: string; // Taker buy quote asset volume
  11: string; // Ignore
}

export interface SyncCandlestickOptions {
  symbol: string;
  interval: string;
  limit?: number;
  startTime?: number;
  endTime?: number;
}

@Injectable()
export class BinanceService {
  private readonly logger = new Logger(BinanceService.name);
  private readonly httpClient: AxiosInstance;
  private readonly baseUrl = 'https://api.binance.com';

  constructor(
    private readonly symbolsRepository: SymbolsRepository,
    private readonly candlesticksRepository: CandlesticksRepository,
  ) {
    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async syncCandlesticks(symbol: string, interval: string): Promise<{
    success: boolean;
    message: string;
    candlesticksAdded: number;
    latestTimestamp?: number;
  }> {
    try {
      this.logger.log(`Starting sync for ${symbol} ${interval}`);

      // Find or create symbol in database
      let dbSymbol = await this.symbolsRepository.findBySymbol(symbol);
      if (!dbSymbol) {
        // Extract base and quote assets from symbol (e.g., BTCUSDT -> BTC, USDT)
        const { baseAsset, quoteAsset } = this.parseSymbol(symbol);
        dbSymbol = await this.symbolsRepository.create({
          symbol,
          baseAsset,
          quoteAsset,
          isActive: true,
        });
        this.logger.log(`Created new symbol: ${symbol}`);
      }

      // Get the latest candlestick timestamp from database
      const latestTimestamp = await this.candlesticksRepository.getLatestTimestamp(
        dbSymbol.id,
        interval
      );

      let startTime: number | undefined;
      if (latestTimestamp) {
        // Start from the next candle after the latest one
        startTime = latestTimestamp + this.getIntervalMs(interval);
        this.logger.log(`Syncing from timestamp: ${new Date(startTime).toISOString()}`);
      } else {
        // If no data exists, fetch last 1000 candles by default
        this.logger.log('No existing data found, fetching last 1000 candles');
      }

      // Fetch candlesticks from Binance
      const binanceKlines = await this.fetchKlines({
        symbol,
        interval,
        startTime,
        limit: latestTimestamp ? 1000 : 1000, // Binance API limit
      });

      if (binanceKlines.length === 0) {
        return {
          success: true,
          message: 'No new candlesticks to sync',
          candlesticksAdded: 0,
          latestTimestamp,
        };
      }

      // Convert Binance klines to database format
      const candlesticks: NewCandlestick[] = binanceKlines.map((kline) => ({
        symbolId: dbSymbol!.id,
        interval,
        openTime: kline[0],
        closeTime: kline[6],
        open: kline[1],
        high: kline[2],
        low: kline[3],
        close: kline[4],
        volume: kline[5],
        quoteAssetVolume: kline[7],
        numberOfTrades: kline[8],
        takerBuyBaseAssetVolume: kline[9],
        takerBuyQuoteAssetVolume: kline[10],
      }));

      // Filter out existing candlesticks to avoid duplicates
      const newCandlesticks: NewCandlestick[] = [];
      for (const candlestick of candlesticks) {
        const existing = await this.candlesticksRepository.findExisting(
          candlestick.symbolId,
          candlestick.interval,
          candlestick.openTime
        );
        if (!existing) {
          newCandlesticks.push(candlestick);
        }
      }

      // Batch insert new candlesticks
      let insertedCandlesticks: any[] = [];
      if (newCandlesticks.length > 0) {
        insertedCandlesticks = await this.candlesticksRepository.createMany(newCandlesticks);
        this.logger.log(`Inserted ${insertedCandlesticks.length} new candlesticks for ${symbol} ${interval}`);
      }

      const newLatestTimestamp = candlesticks.length > 0 
        ? Math.max(...candlesticks.map(c => c.openTime))
        : latestTimestamp;

      return {
        success: true,
        message: `Successfully synced ${insertedCandlesticks.length} candlesticks`,
        candlesticksAdded: insertedCandlesticks.length,
        latestTimestamp: newLatestTimestamp,
      };

    } catch (error) {
      this.logger.error(`Failed to sync candlesticks for ${symbol} ${interval}:`, error);
      return {
        success: false,
        message: `Sync failed: ${error.message}`,
        candlesticksAdded: 0,
      };
    }
  }

  private async fetchKlines(options: SyncCandlestickOptions): Promise<BinanceKline[]> {
    const params: Record<string, any> = {
      symbol: options.symbol,
      interval: options.interval,
    };

    if (options.startTime) {
      params.startTime = options.startTime;
    }
    if (options.endTime) {
      params.endTime = options.endTime;
    }
    if (options.limit) {
      params.limit = Math.min(options.limit, 1000); // Binance API limit
    }

    try {
      const response = await this.httpClient.get('/api/v3/klines', { params });
      return response.data as BinanceKline[];
    } catch (error) {
      if (error.response?.status === 429) {
        this.logger.warn('Binance API rate limit hit, waiting 1 second...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.fetchKlines(options);
      }
      throw new Error(`Binance API error: ${error.response?.data?.msg || error.message}`);
    }
  }

  private parseSymbol(symbol: string): { baseAsset: string; quoteAsset: string } {
    // Common quote assets in order of priority
    const commonQuotes = ['USDT', 'BUSD', 'BTC', 'ETH', 'BNB', 'USDC', 'USD'];
    
    for (const quote of commonQuotes) {
      if (symbol.endsWith(quote)) {
        return {
          baseAsset: symbol.slice(0, -quote.length),
          quoteAsset: quote,
        };
      }
    }

    // Fallback: assume last 4 characters are quote asset
    if (symbol.length > 4) {
      return {
        baseAsset: symbol.slice(0, -4),
        quoteAsset: symbol.slice(-4),
      };
    }

    // Ultimate fallback
    return {
      baseAsset: symbol,
      quoteAsset: 'UNKNOWN',
    };
  }

  private getIntervalMs(interval: string): number {
    const intervalMap: Record<string, number> = {
      '1m': 60 * 1000,
      '3m': 3 * 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '30m': 30 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '2h': 2 * 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '8h': 8 * 60 * 60 * 1000,
      '12h': 12 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000,
      '3d': 3 * 24 * 60 * 60 * 1000,
      '1w': 7 * 24 * 60 * 60 * 1000,
      '1M': 30 * 24 * 60 * 60 * 1000, // Approximate
    };

    return intervalMap[interval] || 60 * 1000; // Default to 1 minute
  }

  async getSymbolInfo(symbol: string) {
    try {
      const response = await this.httpClient.get('/api/v3/exchangeInfo', {
        params: { symbol }
      });
      return response.data.symbols[0];
    } catch (error) {
      throw new Error(`Failed to get symbol info: ${error.response?.data?.msg || error.message}`);
    }
  }

  async getCurrentPrice(symbol: string): Promise<string> {
    try {
      const response = await this.httpClient.get('/api/v3/ticker/price', {
        params: { symbol }
      });
      return response.data.price;
    } catch (error) {
      throw new Error(`Failed to get current price: ${error.response?.data?.msg || error.message}`);
    }
  }

  async syncMultipleSymbols(symbols: string[], interval: string): Promise<{
    results: Array<{
      symbol: string;
      success: boolean;
      message: string;
      candlesticksAdded: number;
    }>;
    totalCandlesticksAdded: number;
  }> {
    const results = [];
    let totalCandlesticksAdded = 0;

    for (const symbol of symbols) {
      const result = await this.syncCandlesticks(symbol, interval);
      results.push({
        symbol,
        success: result.success,
        message: result.message,
        candlesticksAdded: result.candlesticksAdded,
      });
      totalCandlesticksAdded += result.candlesticksAdded;

      // Add small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return {
      results,
      totalCandlesticksAdded,
    };
  }
}