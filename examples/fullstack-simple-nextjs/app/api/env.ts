export function requireEnv(key: string) {
  const value = process.env[key];
  if (value == null) throw new Error(`missing value for env variable "${key}"`);
  return value;
}

export function hasEnv(key: string) {
  return process.env[key] != null;
}

export function getEnv(key: string, defaultValue: string) {
  return process.env[key] ?? defaultValue;
}

export const SERVER_SETUP = requireEnv("OPAQUE_SERVER_SETUP");
export const ENABLE_REDIS = hasEnv("ENABLE_REDIS");
export const REDIS_URL = getEnv("REDIS_URL", "redis://127.0.0.1:6379");
