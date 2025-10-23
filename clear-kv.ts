// Utility script to clear all posted entries from Deno KV

const kv = await Deno.openKv();

console.log("Clearing all posted entries from Deno KV...");

let count = 0;
const entries = kv.list({ prefix: ["posted"] });

for await (const entry of entries) {
  await kv.delete(entry.key);
  count++;
  console.log(`Deleted: ${entry.key}`);
}

console.log(`\nCleared ${count} entries from KV store`);

kv.close();
