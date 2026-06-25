/**
 * 数据库迁移脚本
 * 使用 Drizzle ORM migrator 执行 pending 迁移
 *
 * 使用方式：npx tsx src/lib/db/migrate.ts
 * 连接：从 DATABASE_URL 环境变量读取
 */

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

async function runMigrations() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error("❌ DATABASE_URL 环境变量未设置");
    process.exit(1);
  }

  const pool = new Pool({
    connectionString,
    max: 1,
    connectionTimeoutMillis: 5_000,
  });

  const db = drizzle(pool);

  console.log("⏳ 正在执行数据库迁移...");

  try {
    await migrate(db, {
      migrationsFolder: "src/lib/db/migrations",
    });
    console.log("✅ 数据库迁移执行成功");
  } catch (error) {
    console.error("❌ 数据库迁移失败:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
