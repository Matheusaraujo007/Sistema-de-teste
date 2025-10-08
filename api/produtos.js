import { Pool } from 'pg';

// Conexão com o Neon usando a URL que você forneceu
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // vamos colocar sua URL como variável de ambiente
  ssl: { rejectUnauthorized: false },
});

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { nome, descricao, preco, imagens, videos } = req.body;

    try {
      const client = await pool.connect();

      // Salva o produto no banco
      const result = await client.query(
        `INSERT INTO produtos (nome, descricao, preco, imagens, videos)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id;`,
        [nome, descricao, preco, imagens, videos]
      );

      client.release();

      res.status(200).json({
        message: 'Produto salvo com sucesso!',
        produtoId: result.rows[0].id,
      });
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      res.status(500).json({ error: 'Erro ao salvar produto no banco.' });
    }
  } else {
    res.status(405).json({ error: 'Método não permitido' });
  }
}
