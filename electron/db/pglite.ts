import { app } from "electron";
import * as path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";

let dbInstance: PGlite | null = null;

export async function getDb() {
  if (dbInstance) return dbInstance;

  const userDataPath = app.getPath("userData");
  const dbFile = path.join(userDataPath, "lw-minimart.db");

  const db = new PGlite(dbFile);

  const schemaSql = readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  const seedSql = readFileSync(path.join(__dirname, "seed.sql"), "utf8");

  await db.exec(schemaSql);
  await db.exec(seedSql);

  dbInstance = db;
  return dbInstance;
}
