import { Module } from '@nestjs/common';
import { BinanceService } from '../services/binance.service';
import { BinanceController } from './binance.controller';
import { SymbolsRepository } from '../repositories/symbols.repository';
import { CandlesticksRepository } from '../repositories/candlesticks.repository';
import { IndicatorTypesRepository } from '../repositories/indicator-types.repository';
import { TechnicalIndicatorsRepository } from '../repositories/technical-indicators.repository';

@Module({
  controllers: [BinanceController],
  providers: [
    BinanceService,
    SymbolsRepository,
    CandlesticksRepository,
    IndicatorTypesRepository,
    TechnicalIndicatorsRepository,
  ],
  exports: [
    BinanceService,
    SymbolsRepository,
    CandlesticksRepository,
    IndicatorTypesRepository,
    TechnicalIndicatorsRepository,
  ],
})
export class BinanceModule {}