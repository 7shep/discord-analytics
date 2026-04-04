import dotenv from "dotenv";

dotenv.config();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const config = {
  discord: {
    token: requireEnv("DISCORD_TOKEN"),
    clientId: requireEnv("DISCORD_CLIENT_ID"),
    clientSecret: requireEnv("DISCORD_CLIENT_SECRET"),
  },
  database: {
    url: requireEnv("DATABASE_URL"),
  },
  supabase: {
    url: requireEnv("SUPABASE_URL"),
    anonKey: requireEnv("SUPABASE_ANON_KEY"),
  },
  api: {
    port: parseInt(process.env.PORT ?? "3000", 10),
    jwtSecret: requireEnv("JWT_SECRET"),
    frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173",
    publicUrl: process.env.PUBLIC_URL ?? "",
    adminIds: (process.env.ADMIN_IDS ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
  },
};
