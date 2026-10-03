import { createActor } from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import type { Backend } from "@/backend";

/**
 * Single shared accessor for the backend actor. Every React Query hook calls
 * this so the actor is created once and reused across the app.
 */
export function useBackendActor(): {
  actor: Backend | null;
  isFetching: boolean;
} {
  return useActor(createActor);
}

/** Convert a Motoko nanosecond timestamp into a JS Date, or null when invalid. */
export function timestampToDate(timestamp: bigint): Date | null {
  const date = new Date(Number(timestamp / 1_000_000n));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Human-readable byte size, e.g. "1.2 MB". */
export function formatBytes(bytes: bigint): string {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(
    Math.floor(Math.log(value) / Math.log(1024)),
    units.length - 1,
  );
  const scaled = value / 1024 ** exponent;
  const rounded = scaled >= 10 || exponent === 0 ? Math.round(scaled) : scaled.toFixed(1);
  return `${rounded} ${units[exponent]}`;
}

/** Compact relative time, e.g. "3m ago", "2d ago". */
export function formatRelativeTime(timestamp: bigint): string {
  const date = timestampToDate(timestamp);
  if (!date) return "unknown";
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
