import postgres from 'postgres';
import 'dotenv/config';

const sql = postgres(process.env.DATABASE_URL);

async function main() {
  try {
    // Drop the orders table entirely, or alter it
    // Wait, let's just alter it properly
    await sql`ALTER TABLE "orders" ALTER COLUMN "event_date" TYPE timestamp without time zone USING "event_date"::timestamp without time zone`;
    console.log("Successfully altered event_date column.");
    process.exit(0);
  } catch (error) {
    console.error("Error altering column:", error);
    process.exit(1);
  }
}

main();
