import { Injectable } from '@nestjs/common';
import { eq, and, desc, asc, gte, lte, between } from 'drizzle-orm';
import { db } from '../database/drizzle';
import { candlesticks, NewCandlestick, Candlestick, TimeInterval } from '../database/schema';

export interface CandlestickQuery {
  symbolId: number;
  interval: string;
  startTime?: number;
  endTime?: number;
  limit?: number;
}

@Injectable()
export class CandlesticksRepository {
  async create(data: NewCandlestick): Promise<Candlestick> {
    const [candlestick] = await db.insert(candlesticks).values(data).returning();
    return candlestick;
  }

  async createMany(data: NewCandlestick[]): Promise<Candlestick[]> {
    if (data.length === 0) return [];
    return await db.insert(candlesticks).values(data).returning();
  }

  async findById(id: number): Promise<Candlestick | null> {
    const [result] = await db
      .select()
      .from(candlesticks)
      .where(eq(candlesticks.id, id))
      .limit(1);
    return result || null;
  }

  async findByQuery(query: CandlestickQuery): Promise<Candlestick[]> {
    let whereConditions = [
      eq(candlesticks.symbolId, query.symbolId),
      eq(candlesticks.interval, query.interval)
    ];

    // Add time range filters
    if (query.startTime && query.endTime) {
      whereConditions.push(between(candlesticks.openTime, query.startTime, query.endTime));
    } else if (query.startTime) {
      whereConditions.push(gte(candlesticks.openTime, query.startTime));
    } else if (query.endTime) {
      whereConditions.push(lte(candlesticks.openTime, query.endTime));
    }

    let dbQuery = db
      .select()
      .from(candlesticks)
      .where(and(...whereConditions))
      .orderBy(asc(candlesticks.openTime));

    // Apply limit
    if (query.limit) {
      return await dbQuery.limit(query.limit);
    }

    return await dbQuery;
  }

  async findLatest(symbolId: number, interval: string, limit = 100): Promise<Candlestick[]> {
    return await db
      .select()
      .from(candlesticks)
      .where(
        and(
          eq(candlesticks.symbolId, symbolId),
          eq(candlesticks.interval, interval)
        )
      )
      .orderBy(desc(candlesticks.openTime))
      .limit(limit);
  }

  async findByTimeRange(
    symbolId: number,
    interval: string,
    startTime: number,
    endTime: number
  ): Promise<Candlestick[]> {
    return await db
      .select()
      .from(candlesticks)
      .where(
        and(
          eq(candlesticks.symbolId, symbolId),
          eq(candlesticks.interval, interval),
          between(candlesticks.openTime, startTime, endTime)
        )
      )
      .orderBy(asc(candlesticks.openTime));
  }

  async findExisting(
    symbolId: number,
    interval: string,
    openTime: number
  ): Promise<Candlestick | null> {
    const [result] = await db
      .select()
      .from(candlesticks)
      .where(
        and(
          eq(candlesticks.symbolId, symbolId),
          eq(candlesticks.interval, interval),
          eq(candlesticks.openTime, openTime)
        )
      )
      .limit(1);
    return result || null;
  }

  async update(id: number, data: Partial<NewCandlestick>): Promise<Candlestick | null> {
    const [updated] = await db
      .update(candlesticks)
      .set(data)
      .where(eq(candlesticks.id, id))
      .returning();
    return updated || null;
  }

  async upsert(data: NewCandlestick): Promise<Candlestick> {
    const existing = await this.findExisting(
      data.symbolId,
      data.interval,
      data.openTime
    );

    if (existing) {
      return await this.update(existing.id, data) || existing;
    } else {
      return await this.create(data);
    }
  }

  async delete(id: number): Promise<boolean> {
    const result = await db.delete(candlesticks).where(eq(candlesticks.id, id));
    return result.count > 0;
  }

  async deleteByTimeRange(
    symbolId: number,
    interval: string,
    startTime: number,
    endTime: number
  ): Promise<number> {
    const result = await db
      .delete(candlesticks)
      .where(
        and(
          eq(candlesticks.symbolId, symbolId),
          eq(candlesticks.interval, interval),
          between(candlesticks.openTime, startTime, endTime)
        )
      );
    return result.count;
  }

  async getOldestTimestamp(symbolId: number, interval: string): Promise<number | null> {
    const [result] = await db
      .select({ openTime: candlesticks.openTime })
      .from(candlesticks)
      .where(
        and(
          eq(candlesticks.symbolId, symbolId),
          eq(candlesticks.interval, interval)
        )
      )
      .orderBy(asc(candlesticks.openTime))
      .limit(1);
    return result?.openTime || null;
  }

  async getLatestTimestamp(symbolId: number, interval: string): Promise<number | null> {
    const [result] = await db
      .select({ openTime: candlesticks.openTime })
      .from(candlesticks)
      .where(
        and(
          eq(candlesticks.symbolId, symbolId),
          eq(candlesticks.interval, interval)
        )
      )
      .orderBy(desc(candlesticks.openTime))
      .limit(1);
    return result?.openTime || null;
  }
}