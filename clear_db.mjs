import { config } from 'dotenv';
config({ path: '.env.local' });
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL);

async function main() {
  console.log("Menghapus semua data tabel...");
  try {
    await sql`TRUNCATE TABLE expenses, payouts, reviews, promocodes, pricing_addons, products, favorites, drafts, orders, users CASCADE;`;
    console.log("Semua data berhasil dihapus (TRUNCATE CASCADE).");
  } catch (error) {
    console.error("Gagal menghapus:", error);
  } finally {
    process.exit(0);
  }
}
main();
