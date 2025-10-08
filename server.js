import express from 'express';
import cors from 'cors';
import pkg from 'pg';
const { Pool } = pkg;

const app = express();
const port = 3000;

// --- Configurações ---
app.use(cors()); // libera acesso de qualquer origem
app.use(express.json({ limit: '50mb' })); // para receber imagens grandes em base64

// --- Conexão com Neon ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// --- ROTAS ---

// 🟢 Produtos
app.post('/api/produtos', async (req, res) => {
  const client = await pool.connect();
  try {
    const { nome, descricao, preco, imagens, videos } = req.body;

    await client.query(
      `INSERT INTO produtos (nome, descricao, preco, imagens, video, criado_em)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [nome, descricao, preco, imagens, videos[0] || null] // salva apenas o primeiro vídeo
    );

    res.status(201).json({ message: '✅ Produto cadastrado com sucesso!' });
  } catch (err) {
    console.error('Erro produtos:', err);
    res.status(500).json({ error: 'Erro ao cadastrar produto', details: err.message });
  } finally {
    client.release();
  }
});

app.get('/api/produtos', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM produtos ORDER BY id DESC');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Erro GET produtos:', err);
    res.status(500).json({ error: 'Erro ao listar produtos', details: err.message });
  } finally {
    client.release();
  }
});

// 🟢 Pedidos (exemplo)
app.post('/api/pedidos', async (req, res) => {
  const client = await pool.connect();
  try {
    const { cliente, produto, valor } = req.body;
    await client.query(
      `INSERT INTO pedidos (cliente, produto, valor, criado_em)
       VALUES ($1, $2, $3, NOW())`,
      [cliente, produto, valor]
    );
    res.status(201).json({ message: '✅ Pedido cadastrado com sucesso!' });
  } catch (err) {
    console.error('Erro pedidos:', err);
    res.status(500).json({ error: 'Erro ao cadastrar pedido', details: err.message });
  } finally {
    client.release();
  }
});

app.get('/api/pedidos', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM pedidos ORDER BY id DESC');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Erro GET pedidos:', err);
    res.status(500).json({ error: 'Erro ao listar pedidos', details: err.message });
  } finally {
    client.release();
  }
});

// --- INICIAR SERVIDOR ---
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
