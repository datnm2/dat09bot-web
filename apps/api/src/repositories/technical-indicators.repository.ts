import { Injectable } from '@nestjs/common';
import { eq, and, desc, asc, gte, lte, between } from 'drizzle-orm';
import { db } from '../database/drizzle';
import { technicalIndicators, NewTechnicalIndicator, TechnicalIndicator } from '../database/schema';

export interface TechnicalIndicatorQuery {
  symbolId: number;
  indicatorTypeId: number;
  interval: string;
  startTime?: number;
  endTime?: number;
  limit?: number;
}

@Injectable()
export class TechnicalIndicatorsRepository {
  async create(data: NewTechnicalIndicator): Promise<TechnicalIndicator> {
    const [indicator] = await db.insert(technicalIndicators).values(data).returning();
    return indicator;
  }

  async createMany(data: NewTechnicalIndicator[]): Promise<TechnicalIndicator[]> {
    if (data.length === 0) return [];
    return await db.insert(technicalIndicators).values(data).returning();
  }

  async findById(id: number): Promise<TechnicalIndicator | null> {
    const [result] = await db
      .select()
      .from(technicalIndicators)
      .where(eq(technicalIndicators.id, id))
      .limit(1);
    return result || null;
  }

  async findByQuery(query: TechnicalIndicatorQuery): Promise<TechnicalIndicator[]> {
    let whereConditions = [
      eq(technicalIndicators.symbolId, query.symbolId),
      eq(technicalIndicators.indicatorTypeId, query.indicatorTypeId),
      eq(technicalIndicators.interval, query.interval)
    ];

    // Add time range filters
    if (query.startTime && query.endTime) {
      whereConditions.push(between(technicalIndicators.timestamp, query.startTime, query.endTime));
    } else if (query.startTime) {
      whereConditions.push(gte(technicalIndicators.timestamp, query.startTime));
    } else if (query.endTime) {
      whereConditions.push(lte(technicalIndicators.timestamp, query.endTime));
    }

    let dbQuery = db
      .select()
      .from(technicalIndicators)
      .where(and(...whereConditions))
      .orderBy(asc(technicalIndicators.timestamp));

    // Apply limit
    if (query.limit) {
      return await dbQuery.limit(query.limit);
    }

    return await dbQuery;
  }

  async findLatest(
    symbolId: number,
    indicatorTypeId: number,
    interval: string,
    limit = 100
  ): Promise<TechnicalIndicator[]> {
    return await db
      .select()
      .from(technicalIndicators)
      .where(
        and(
          eq(technicalIndicators.symbolId, symbolId),
          eq(technicalIndicators.indicatorTypeId, indicatorTypeId),
          eq(technicalIndicators.interval, interval)
        )
      )
      .orderBy(desc(technicalIndicators.timestamp))
      .limit(limit);
  }

  async findByTimeRange(
    symbolId: number,
    indicatorTypeId: number,
    interval: string,
    startTime: number,
    endTime: number
  ): Promise<TechnicalIndicator[]> {
    return await db
      .select()
      .from(technicalIndicators)
      .where(
        and(
          eq(technicalIndicators.symbolId, symbolId),
          eq(technicalIndicators.indicatorTypeId, indicatorTypeId),
          eq(technicalIndicators.interval, interval),
          between(technicalIndicators.timestamp, startTime, endTime)
        )
      )
      .orderBy(asc(technicalIndicators.timestamp));
  }

  async findExisting(
    symbolId: number,
    indicatorTypeId: number,
    interval: string,
    timestamp: number
  ): Promise<TechnicalIndicator | null> {
    const [result] = await db
      .select()
      .from(technicalIndicators)
      .where(
        and(
          eq(technicalIndicators.symbolId, symbolId),
          eq(technicalIndicators.indicatorTypeId, indicatorTypeId),
          eq(technicalIndicators.interval, interval),
          eq(technicalIndicators.timestamp, timestamp)
        )
      )
      .limit(1);
    return result || null;
  }

  async update(id: number, data: Partial<NewTechnicalIndicator>): Promise<TechnicalIndicator | null> {
    const [updated] = await db
      .update(technicalIndicators)
      .set(data)
      .where(eq(technicalIndicators.id, id))
      .returning();
    return updated || null;
  }

  async upsert(data: NewTechnicalIndicator): Promise<TechnicalIndicator> {
    const existing = await this.findExisting(
      data.symbolId,
      data.indicatorTypeId,
      data.interval,
      data.timestamp
    );

    if (existing) {
      return await this.update(existing.id, data) || existing;
    } else {
      return await this.create(data);
    }
  }

  async delete(id: number): Promise<boolean> {
    const result = await db.delete(technicalIndicators).where(eq(technicalIndicators.id, id));
    return result.count > 0;
  }

  async deleteByTimeRange(
    symbolId: number,
    indicatorTypeId: number,
    interval: string,
    startTime: number,
    endTime: number
  ): Promise<number> {
    const result = await db
      .delete(technicalIndicators)
      .where(
        and(
          eq(technicalIndicators.symbolId, symbolId),
          eq(technicalIndicators.indicatorTypeId, indicatorTypeId),
          eq(technicalIndicators.interval, interval),
          between(technicalIndicators.timestamp, startTime, endTime)
        )
      );
    return result.count;
  }

  async getLatestTimestamp(
    symbolId: number,
    indicatorTypeId: number,
    interval: string
  ): Promise<number | null> {
    const [result] = await db
      .select({ timestamp: technicalIndicators.timestamp })
      .from(technicalIndicators)
      .where(
        and(
          eq(technicalIndicators.symbolId, symbolId),
          eq(technicalIndicators.indicatorTypeId, indicatorTypeId),
          eq(technicalIndicators.interval, interval)
        )
      )
      .orderBy(desc(technicalIndicators.timestamp))
      .limit(1);
    return result?.timestamp || null;
  }

  async findBySymbolAndInterval(
    symbolId: number,
    interval: string,
    limit?: number
  ): Promise<TechnicalIndicator[]> {
    const query = db
      .select()
      .from(technicalIndicators)
      .where(
        and(
          eq(technicalIndicators.symbolId, symbolId),
          eq(technicalIndicators.interval, interval)
        )
      )
      .orderBy(desc(technicalIndicators.timestamp));
    
    if (limit) {
      return await query.limit(limit);
    }

    return await query;
  }
}