// Fixed reference timestamp used across the prototype so the seeded mock
// data and all relative-time formatting produce identical output during SSR
// and client hydration (avoiding React hydration mismatches).
export const REFERENCE_NOW = new Date(
  "2026-04-16T12:00:00.000Z"
).getTime();
