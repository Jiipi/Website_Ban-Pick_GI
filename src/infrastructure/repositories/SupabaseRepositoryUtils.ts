import { createSupabaseDataClient } from "@/lib/supabase-data";

export type DbRow = Record<string, unknown>;

export function supabase() {
  return createSupabaseDataClient();
}

export function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function cleanForSupabase(data: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(data)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, value instanceof Date ? value.toISOString() : value]),
  );
}

export function requireRow<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(error.message);
  if (data === null) throw new Error("Supabase query returned no row");
  return data;
}

export function optionalRows<T>(data: T[] | null, error: { message: string } | null): T[] {
  if (error) throw new Error(error.message);
  return data ?? [];
}

export function optionalCount(count: number | null, error: { message: string } | null): number {
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export function toDate(value: unknown): Date {
  return value instanceof Date ? value : new Date(String(value));
}

export function toNullableDate(value: unknown): Date | null {
  return value == null ? null : toDate(value);
}

export function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

export function toJsonObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}
