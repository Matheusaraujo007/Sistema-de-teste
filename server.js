import express from "express";
import pkg from "pg";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const { Pool } = pkg;

const app = express();
app.use(cors());
app.use(express.json());

// 🧩 Conexão com Neon
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // configure sua variável no .env
  ssl: { rejectUnauthorized: false }
});

// ✅ Rota para cadastrar produto
app.post("/api/produtos", async (req, res) => {
  try {
    const { nome, descricao, preco, imagens, video } = req.body;

    if (!nome || !descricao || !preco) {
      return res.status(400).json({ error: "Campos obrigatórios faltando" });
    }

    const imagensArray = Array.isArray(imagens) ? imagens : [imagens];

    const query = `
      INSERT INTO produtos (nome, descricao, preco, imagens, video)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;

    const values = [nome, descricao, preco, imagensArray, video];
    const result = await pool.query(query, values);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ Erro ao cadastrar produto:", err.message);
    res.status(500).json({ error: "Erro ao cadastrar produto" });
  }
});

// ✅ Teste simples para ver se o servidor está no ar
app.get("/", (req, res) => {
  res.send("Servidor rodando com sucesso!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
