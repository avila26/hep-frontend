import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

console.log('DATABASE_URL:', process.env.DATABASE_URL);

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function main() {
    try {
        for (const tableName of ['activos', 'actas_ingreso']) {
            const resCols = await pool.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = $1;
            `, [tableName]);
            console.log(`\n--- Columns in table "${tableName}" ---`);
            console.table(resCols.rows);
        }
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

main();
