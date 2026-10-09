import postgres from 'postgres';
const sql = postgres('postgresql://postgres.tiuoovyqwuvbzzraxmmh:Baskara2009%2A@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres', { prepare: false });
async function test() {
  try {
    const res = await sql`SELECT 1 as num`;
    console.log("Success:", res);
  } catch (e) {
    console.error("Error:", e);
  }
  process.exit(0);
}
test();
