'use client';

import { useSyncExternalStore } from 'react';

// In-memory cache so getSnapshot devuelve referencias estables — requisito de
// useSyncExternalStore para evitar bucles infinitos.
const cache = new Map<string, { raw: string | null; parsed: unknown }>();
const subscribers = new Set<() => void>();

function notify() {
  for (const cb of subscribers) cb();
}

function getSnapshot<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  const raw = window.sessionStorage.getItem(key);
  const cached = cache.get(key);
  if (cached && cached.raw === raw) return cached.parsed as T | null;
  let parsed: T | null = null;
  if (raw) {
    try {
      parsed = JSON.parse(raw) as T;
    } catch {
      parsed = null;
    }
  }
  cache.set(key, { raw, parsed });
  return parsed;
}

export function useSessionValue<T>(key: string): T | null {
  return useSyncExternalStore(
    (cb) => {
      subscribers.add(cb);
      return () => {
        subscribers.delete(cb);
      };
    },
    () => getSnapshot<T>(key),
    () => null,
  );
}

export function writeSessionValue<T>(key: string, value: T): void {
  window.sessionStorage.setItem(key, JSON.stringify(value));
  cache.delete(key);
  notify();
}

export function clearSessionValue(key: string): void {
  window.sessionStorage.removeItem(key);
  cache.delete(key);
  notify();
}