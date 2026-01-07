import { PrismaClient } from '@prisma/client';

type GlobalPrisma = {
  prisma: PrismaClient | undefined;
};

const globalForPrisma = globalThis as unknown as GlobalPrisma;

function createPrismaClient() {
  // Настройки для SQLite - увеличиваем таймауты и пул соединений
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

  // Обработка ошибок подключения
  client.$on('error' as never, (e: any) => {
    console.error('Prisma error:', e);
  });

  // Подключаемся к базе при создании клиента
  // Для SQLite используем более агрессивные настройки
  if (process.env.NODE_ENV === 'production') {
    client.$connect().catch((error) => {
      console.error('Не удалось подключиться к базе Prisma:', error);
    });
  }

  return client;
}

const prismaClient =
  process.env.NODE_ENV === 'production'
    ? globalForPrisma.prisma ?? createPrismaClient()
    : globalForPrisma.prisma ?? (globalForPrisma.prisma = createPrismaClient());

if (process.env.NODE_ENV === 'production' && !globalForPrisma.prisma) {
  globalForPrisma.prisma = prismaClient;
}

export const prisma = prismaClient;


