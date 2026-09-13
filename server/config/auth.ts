import dotenv from 'dotenv';
dotenv.config();

let cachedSecret: string | null = null;

export function getJwtSecret(): string {
  if (cachedSecret) return cachedSecret;

  const envSecret = process.env.JWT_SECRET?.trim();
  if (envSecret) {
    cachedSecret = envSecret;
    return cachedSecret;
  }

  // Security warning when relying on fallback in non-test mode
  console.warn(
    '\n⚠️  [SECURITY WARNING] No JWT_SECRET environment variable provided!\n' +
    '   Using default demo secret key. For production/defense deployment, please define JWT_SECRET in your .env file.\n'
  );

  cachedSecret = 'fleet_management_academic_jwt_secret_key_2025';
  return cachedSecret;
}
