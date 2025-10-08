import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  const client = await pool.connect();

  try {
    if (req.method === 'POST') {
      const { nome, descricao, preco, imagens, videos } = req.body;

      await client.query(
        `INSERT INTO produtos (nome, descricao, preco, imagens, video, criado_em)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [nome, descricao, preco, imagens, videos[0] || null] // salva apenas 1 vídeo
      );

      res.status(201).json({ message: '✅ Produto cadastrado com sucesso!' });
    } 
    else if (req.method === 'GET') {
      const result = await client.query('SELECT * FROM produtos ORDER BY id DESC');
      res.status(200).json(result.rows);
    } 
    else {
      res.status(405).json({ error: 'Método não permitido' });
    }

  } catch (err) {
    console.error('Erro:', err);
    res.status(500).json({ error: 'Erro no servidor', details: err.message });
  } finally {
    client.release();
  }
}
