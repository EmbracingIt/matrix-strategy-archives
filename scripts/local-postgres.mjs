import EmbeddedPostgres from 'embedded-postgres';
import { existsSync } from 'node:fs';
const pg = new EmbeddedPostgres({ databaseDir: './local-preview-pg', user: 'matrix', password: 'local-preview-only', port: 55432, persistent: true, onLog: () => {}, onError: console.error });
if (!existsSync('./local-preview-pg/PG_VERSION')) await pg.initialise();
await pg.start();
const client = pg.getPgClient('postgres', '127.0.0.1');
await client.connect();
const existing = await client.query("SELECT 1 FROM pg_database WHERE datname = 'matrix_rebuild'");
if (!existing.rowCount) await client.query("CREATE DATABASE matrix_rebuild ENCODING 'UTF8' TEMPLATE template0 LC_COLLATE 'C' LC_CTYPE 'C'");
await client.end();
console.log('Local PostgreSQL listening on 127.0.0.1:55432');
await new Promise(() => {});

