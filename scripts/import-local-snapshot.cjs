/* eslint-disable @typescript-eslint/no-require-imports -- Node-only snapshot utility */
const fs = require('node:fs');
const { PrismaClient } = require('@prisma/client');
if (!/^postgresql:\/\/[^@]+@(?:127\.0\.0\.1|localhost):/.test(process.env.STORAGE_DATABASE_URL || '')) throw new Error('Snapshot import is local-only');
const db = new PrismaClient();
(async()=>{
 const data=JSON.parse(fs.readFileSync('local-archive-snapshot.json','utf8'));
 for(const [key,rows] of Object.entries(data)) {
   if(await db[key].count()) throw new Error(`Local table ${key} is not empty; do not overwrite it`);
   if(rows.length) await db[key].createMany({data:rows});
 }
 console.log('Copied existing records/history to local PostgreSQL; production was read only.');
})().finally(()=>db.$disconnect());
