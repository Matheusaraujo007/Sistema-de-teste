import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  const client = await pool.connect();

  try {
    if (req.method === 'GET') {
      const result = await client.query('SELECT * FROM produtos ORDER BY id DESC');
      res.status(200).json(result.rows);

    } else if (req.method === 'POST') {
      const { nome, descricao, preco, imagens, video, categoria } = req.body;

      await client.query(
        `INSERT INTO produtos (nome, descricao, preco, imagens, video, categoria)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [nome, descricao, preco, JSON.stringify(imagens), video, categoria]
      );

      res.status(201).json({ message: '✅ Produto cadastrado com sucesso!' });

    } else if (req.method === 'PUT') {
      const { id, nome, descricao, preco, imagens, video, categoria } = req.body;

      await client.query(
        `UPDATE produtos
         SET nome=$1, descricao=$2, preco=$3, imagens=$4, video=$5, categoria=$6
         WHERE id=$7`,
        [nome, descricao, preco, JSON.stringify(imagens), video, categoria, id]
      );

      res.status(200).json({ message: 'Produto atualizado com sucesso!' });

    } else if (req.method === 'DELETE') {
      const { id } = req.query;
      await client.query('DELETE FROM produtos WHERE id=$1', [id]);
      res.status(200).json({ message: 'Produto excluído com sucesso!' });

    } else {
      res.status(405).json({ error: 'Método não permitido' });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no servidor', details: err.message });
  } finally {
    client.release();
  }
}
