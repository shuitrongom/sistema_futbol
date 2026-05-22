import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

let pool: Pool | null = null;

export function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL!;
  pool = new Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export async function cleanup(prisma: PrismaClient) {
  await prisma.$disconnect();
  if (pool) await pool.end();
}
