import { Injectable } from '@nestjs/common';
import { eq, desc } from 'drizzle-orm';
import { db } from '../database/drizzle';
import { indicatorTypes, NewIndicatorType, IndicatorType } from '../database/schema';

@Injectable()
export class IndicatorTypesRepository {
  async create(data: NewIndicatorType): Promise<IndicatorType> {
    const [indicatorType] = await db.insert(indicatorTypes).values(data).returning();
    return indicatorType;
  }

  async findAll(): Promise<IndicatorType[]> {
    return await db.select().from(indicatorTypes).orderBy(desc(indicatorTypes.createdAt));
  }

  async findByName(name: string): Promise<IndicatorType | null> {
    const [result] = await db
      .select()
      .from(indicatorTypes)
      .where(eq(indicatorTypes.name, name))
      .limit(1);
    return result || null;
  }

  async findById(id: number): Promise<IndicatorType | null> {
    const [result] = await db
      .select()
      .from(indicatorTypes)
      .where(eq(indicatorTypes.id, id))
      .limit(1);
    return result || null;
  }

  async update(id: number, data: Partial<NewIndicatorType>): Promise<IndicatorType | null> {
    const [updated] = await db
      .update(indicatorTypes)
      .set(data)
      .where(eq(indicatorTypes.id, id))
      .returning();
    return updated || null;
  }

  async delete(id: number): Promise<boolean> {
    const result = await db.delete(indicatorTypes).where(eq(indicatorTypes.id, id));
    return result.count > 0;
  }

  async createDefaultIndicators(): Promise<IndicatorType[]> {
    const defaultIndicators: NewIndicatorType[] = [
      {
        name: 'RSI',
        description: 'Relative Strength Index',
        parameters: {
          period: { type: 'number', default: 14, min: 2, max: 100 }
        }
      },
      {
        name: 'MACD',
        description: 'Moving Average Convergence Divergence',
        parameters: {
          fastPeriod: { type: 'number', default: 12, min: 2, max: 100 },
          slowPeriod: { type: 'number', default: 26, min: 2, max: 100 },
          signalPeriod: { type: 'number', default: 9, min: 2, max: 100 }
        }
      },
      {
        name: 'BOLLINGER_BANDS',
        description: 'Bollinger Bands',
        parameters: {
          period: { type: 'number', default: 20, min: 2, max: 100 },
          standardDeviations: { type: 'number', default: 2, min: 0.1, max: 5 }
        }
      },
      {
        name: 'SMA',
        description: 'Simple Moving Average',
        parameters: {
          period: { type: 'number', default: 20, min: 2, max: 200 }
        }
      },
      {
        name: 'EMA',
        description: 'Exponential Moving Average',
        parameters: {
          period: { type: 'number', default: 20, min: 2, max: 200 }
        }
      },
      {
        name: 'STOCHASTIC',
        description: 'Stochastic Oscillator',
        parameters: {
          kPeriod: { type: 'number', default: 14, min: 2, max: 100 },
          dPeriod: { type: 'number', default: 3, min: 2, max: 100 }
        }
      },
      {
        name: 'ATR',
        description: 'Average True Range',
        parameters: {
          period: { type: 'number', default: 14, min: 2, max: 100 }
        }
      },
      {
        name: 'ADX',
        description: 'Average Directional Index',
        parameters: {
          period: { type: 'number', default: 14, min: 2, max: 100 }
        }
      }
    ];

    const created: IndicatorType[] = [];
    for (const indicator of defaultIndicators) {
      const existing = await this.findByName(indicator.name);
      if (!existing) {
        const newIndicator = await this.create(indicator);
        created.push(newIndicator);
      } else {
        created.push(existing);
      }
    }

    return created;
  }
}