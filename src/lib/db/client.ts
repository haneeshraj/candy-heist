import 'server-only';
import { MongoClient, type Db } from 'mongodb';
import { readDbConfig } from './config';
import { ensureIndexes } from './collections';

// The one connection the server keeps to the database.
//
// Opened once and reused: a serverless function that stays warm handles
// many requests, and opening a connection per request would spend most of
// each one on the handshake. In development the module is reloaded on every
// change, so the connection hangs off globalThis rather than a module
// variable, or each save would leave another one open.

export class DatabaseUnavailableError extends Error {
  constructor() {
    super('The database is not configured: set MONGODB_URI and MONGODB_DB.');
    this.name = 'DatabaseUnavailableError';
  }
}

interface Connection {
  key: string;
  db: Promise<Db>;
}

const store = globalThis as typeof globalThis & {
  __candyHeistDb?: Connection;
};

export function getDb(): Promise<Db> {
  const config = readDbConfig(process.env);
  if (!config) return Promise.reject(new DatabaseUnavailableError());

  const key = `${config.uri}\u0000${config.name}`;
  if (store.__candyHeistDb?.key !== key) {
    const db = new MongoClient(config.uri, { appName: 'candy-heist' })
      .connect()
      .then(async (client) => {
        const database = client.db(config.name);
        await ensureIndexes(database);
        return database;
      });
    // A failed connection isn't kept, so the next request tries again.
    db.catch(() => {
      if (store.__candyHeistDb?.db === db) store.__candyHeistDb = undefined;
    });
    store.__candyHeistDb = { key, db };
  }
  return store.__candyHeistDb.db;
}
