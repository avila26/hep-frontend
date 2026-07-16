import { Pool } from 'pg';

// Inicialización del Pool de conexiones de PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Función auxiliar para ejecutar consultas con logging para depuración
export async function query(text: string, params?: any[]) {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('SQL Executed:', { 
            query: text.slice(0, 100) + (text.length > 100 ? '...' : ''), 
            durationMs: duration, 
            rows: res.rowCount 
        });
        return res;
    } catch (error) {
        console.error('SQL Error executing query:', text, error);
        throw error;
    }
}

export default pool;
