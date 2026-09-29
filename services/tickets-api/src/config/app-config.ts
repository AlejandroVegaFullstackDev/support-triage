export interface AppConfig {
  port: number;
  corsOrigin: string;
  rabbitmqUrl: string;
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
  };
}

export const APP_CONFIG = Symbol('APP_CONFIG');

function required(env: NodeJS.ProcessEnv, key: string): string {
  const value = env[key];
  if (!value) {
    throw new Error(`Missing required environment variable ${key}`);
  }
  return value;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return {
    port: Number(env.PORT ?? 3000),
    corsOrigin: env.CORS_ORIGIN ?? 'http://localhost:5173',
    rabbitmqUrl: required(env, 'RABBITMQ_URL'),
    database: {
      host: env.POSTGRES_HOST ?? 'localhost',
      port: Number(env.POSTGRES_PORT ?? 5432),
      name: required(env, 'POSTGRES_DB'),
      user: required(env, 'POSTGRES_USER'),
      password: required(env, 'POSTGRES_PASSWORD'),
    },
  };
}
