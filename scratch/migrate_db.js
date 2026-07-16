import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function main() {
    console.log('Starting migration...');
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log('Adding columns to "activos"...');
        await client.query(`
            ALTER TABLE public.activos 
            ADD COLUMN IF NOT EXISTS numero_contrato VARCHAR(100);
        `);

        console.log('Adding columns to "actas_ingreso"...');
        await client.query(`
            ALTER TABLE public.actas_ingreso 
            ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'Borrador',
            ADD COLUMN IF NOT EXISTS administrador_orden_compra VARCHAR(150),
            ADD COLUMN IF NOT EXISTS fecha_orden_compra TIMESTAMP,
            ADD COLUMN IF NOT EXISTS tiene_garantia BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS tiempo_garantia VARCHAR(50),
            ADD COLUMN IF NOT EXISTS tecnico_receptor VARCHAR(150),
            ADD COLUMN IF NOT EXISTS responsable_entrega VARCHAR(150),
            ADD COLUMN IF NOT EXISTS numero_contrato VARCHAR(100),
            ADD COLUMN IF NOT EXISTS valor_unitario NUMERIC(15, 2),
            ADD COLUMN IF NOT EXISTS fecha_dns TIMESTAMP,
            ADD COLUMN IF NOT EXISTS bloqueado BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS fecha_memorando TIMESTAMP,
            ADD COLUMN IF NOT EXISTS remitente_origen VARCHAR(150),
            ADD COLUMN IF NOT EXISTS asunto_memorando TEXT,
            ADD COLUMN IF NOT EXISTS fecha_suscripcion TIMESTAMP,
            ADD COLUMN IF NOT EXISTS fecha_vigencia TIMESTAMP,
            ADD COLUMN IF NOT EXISTS administrador_contrato VARCHAR(150),
            ADD COLUMN IF NOT EXISTS fecha_inicio_garantia TIMESTAMP,
            ADD COLUMN IF NOT EXISTS fecha_fin_garantia TIMESTAMP;
        `);

        await client.query('COMMIT');
        console.log('Migration completed successfully!');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

main();
