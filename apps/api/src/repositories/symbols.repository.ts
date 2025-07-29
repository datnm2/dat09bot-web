import { Injectable } from '@nestjs/common';
import { eq, desc } from 'drizzle-orm';
import { db } from '../database/drizzle';
import { symbols, NewSymbol, Symbol } from '../database/schema';

@Injectable()
export class SymbolsRepository {
  async create(data: NewSymbol): Promise<Symbol> {
    const [symbol] = await db.insert(symbols).values(data).returning();
    return symbol;
  }

  async findAll(): Promise<Symbol[]> {
    return await db.select().from(symbols).orderBy(desc(symbols.createdAt));
  }

  async findBySymbol(symbol: string): Promise<Symbol | null> {
    const [result] = await db
      .select()
      .from(symbols)
      .where(eq(symbols.symbol, symbol))
      .limit(1);
    return result || null;
  }

  async findById(id: number): Promise<Symbol | null> {
    const [result] = await db
      .select()
      .from(symbols)
      .where(eq(symbols.id, id))
      .limit(1);
    return result || null;
  }

  async findActive(): Promise<Symbol[]> {
    return await db
      .select()
      .from(symbols)
      .where(eq(symbols.isActive, true))
      .orderBy(desc(symbols.createdAt));
  }

  async update(id: number, data: Partial<NewSymbol>): Promise<Symbol | null> {
    const [updated] = await db
      .update(symbols)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(symbols.id, id))
      .returning();
    return updated || null;
  }

  async delete(id: number): Promise<boolean> {
    const result = await db.delete(symbols).where(eq(symbols.id, id));
    return result.count > 0;
  }

  async deactivate(id: number): Promise<Symbol | null> {
    return this.update(id, { isActive: false });
  }

  async activate(id: number): Promise<Symbol | null> {
    return this.update(id, { isActive: true });
  }
}