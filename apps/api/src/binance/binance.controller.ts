import { Controller, Post, Body, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery } from '@nestjs/swagger';
import { BinanceService } from '../services/binance.service';
import { SymbolsRepository } from '../repositories/symbols.repository';
import { CandlesticksRepository } from '../repositories/candlesticks.repository';

class SyncCandlesticksDto {
  symbol: string;
  interval: string;
}

class SyncMultipleSymbolsDto {
  symbols: string[];
  interval: string;
}

@ApiTags('binance')
@Controller('binance')
export class BinanceController {
  constructor(
    private readonly binanceService: BinanceService,
    private readonly symbolsRepository: SymbolsRepository,
    private readonly candlesticksRepository: CandlesticksRepository,
  ) {}

  @Post('sync')
  @ApiOperation({ summary: 'Sync candlesticks for a symbol and interval' })
  @ApiBody({ type: SyncCandlesticksDto })
  @ApiResponse({ status: 200, description: 'Sync completed successfully' })
  async syncCandlesticks(@Body() body: SyncCandlesticksDto) {
    return await this.binanceService.syncCandlesticks(body.symbol, body.interval);
  }

  @Post('sync-multiple')
  @ApiOperation({ summary: 'Sync candlesticks for multiple symbols' })
  @ApiBody({ type: SyncMultipleSymbolsDto })
  @ApiResponse({ status: 200, description: 'Multiple symbol sync completed' })
  async syncMultipleSymbols(@Body() body: SyncMultipleSymbolsDto) {
    return await this.binanceService.syncMultipleSymbols(body.symbols, body.interval);
  }

  @Get('symbols')
  @ApiOperation({ summary: 'Get all symbols from database' })
  async getSymbols() {
    return await this.symbolsRepository.findAll();
  }

  @Get('symbols/active')
  @ApiOperation({ summary: 'Get active symbols from database' })
  async getActiveSymbols() {
    return await this.symbolsRepository.findActive();
  }

  @Get('candlesticks/:symbolId')
  @ApiOperation({ summary: 'Get candlesticks for a symbol' })
  @ApiQuery({ name: 'interval', required: true })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getCandlesticks(
    @Param('symbolId') symbolId: string,
    @Query('interval') interval: string,
    @Query('limit') limit?: string,
  ) {
    return await this.candlesticksRepository.findLatest(
      parseInt(symbolId),
      interval,
      limit ? parseInt(limit) : undefined
    );
  }

  @Get('candlesticks/:symbolId/range')
  @ApiOperation({ summary: 'Get candlesticks for a symbol within time range' })
  @ApiQuery({ name: 'interval', required: true })
  @ApiQuery({ name: 'startTime', required: true, type: Number })
  @ApiQuery({ name: 'endTime', required: true, type: Number })
  async getCandlesticksInRange(
    @Param('symbolId') symbolId: string,
    @Query('interval') interval: string,
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
  ) {
    return await this.candlesticksRepository.findByTimeRange(
      parseInt(symbolId),
      interval,
      parseInt(startTime),
      parseInt(endTime)
    );
  }

  @Get('price/:symbol')
  @ApiOperation({ summary: 'Get current price from Binance' })
  async getCurrentPrice(@Param('symbol') symbol: string) {
    const price = await this.binanceService.getCurrentPrice(symbol);
    return { symbol, price };
  }

  @Get('symbol-info/:symbol')
  @ApiOperation({ summary: 'Get symbol information from Binance' })
  async getSymbolInfo(@Param('symbol') symbol: string) {
    return await this.binanceService.getSymbolInfo(symbol);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get database statistics' })
  async getStats() {
    const symbols = await this.symbolsRepository.findAll();
    const stats = [];

    for (const symbol of symbols) {
      const intervals = ['1m', '5m', '15m', '1h', '4h', '1d'];
      const symbolStats = {
        symbol: symbol.symbol,
        id: symbol.id,
        intervals: {} as Record<string, any>,
      };

      for (const interval of intervals) {
        const oldest = await this.candlesticksRepository.getOldestTimestamp(symbol.id, interval);
        const latest = await this.candlesticksRepository.getLatestTimestamp(symbol.id, interval);
        const count = oldest && latest ? 
          await this.candlesticksRepository.findByQuery({
            symbolId: symbol.id,
            interval,
          }).then(results => results.length) : 0;

        symbolStats.intervals[interval] = {
          count,
          oldest: oldest ? new Date(oldest).toISOString() : null,
          latest: latest ? new Date(latest).toISOString() : null,
        };
      }

      stats.push(symbolStats);
    }

    return stats;
  }
}