// /api/pedidos.js
import pkg from 'pg';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

const { Pool } = pkg;
dayjs.extend(utc);
dayjs.extend(timezone);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Função para calcular o valor total de um pedido
function calcularTotal(itens) {
  if (!itens || !Array.isArray(itens)) return 0;
  return itens.reduce(
    (acc, i) => acc + (parseFloat(i.quantidade) || 0) * (parseFloat(i.valorUnit) || 0),
    0
  );
}

// Formata datas no padrão YYYY-MM-DD
function formatarDataDB(dataStr) {
  if (!dataStr) return null;
  return dayjs(dataStr).tz('America/Sao_Paulo').format('YYYY-MM-DD');
}

// Retorna a data atual em Brasília
function dataAtualBrasilia() {
  return dayjs().tz('America/Sao_Paulo').format('YYYY-MM-DD');
}

export default async function handler(req, res) {
  const client = await pool.connect();

  try {
    if (req.method === 'GET') {
      const result = await client.query('SELECT * FROM pedidos ORDER BY id DESC');
      res.status(200).json(result.rows);

    } else if (req.method === 'POST') {
      const { nomeCliente, telefoneCliente, vendedor, itens, valorRecebido, dataEntrega, status, anotacoes } = req.body;

      const total = calcularTotal(itens);

      await client.query(
        `INSERT INTO pedidos 
          (vendedor, nome_cliente, telefone_cliente, itens, valor_total, valor_recebido, data_pedido, data_entrega, status, anotacoes)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          vendedor,
          nomeCliente,
          telefoneCliente,
          JSON.stringify(itens),
          total,
          valorRecebido || 0,
          dataAtualBrasilia(),          // <-- data correta de Brasília
          formatarDataDB(dataEntrega),
          status || 'Aguardando Retorno',
          anotacoes || ""
        ]
      );

      res.status(201).json({ message: 'Pedido criado com sucesso!' });

    } else if (req.method === 'PUT') {
      const { id, valorRecebido, status, vendedor, telefoneCliente, itens, anotacoes } = req.body;

      if (itens && Array.isArray(itens)) {
        const total = calcularTotal(itens);
        await client.query(
          `UPDATE pedidos SET itens = $1, valor_total = $2, anotacoes = $3 WHERE id = $4`,
          [JSON.stringify(itens), total, anotacoes || "", id]
        );
      }

      await client.query(
        `UPDATE pedidos SET valor_recebido = $1, status = $2, vendedor = $3, telefone_cliente = $4, anotacoes = $5 WHERE id = $6`,
        [valorRecebido || 0, status, vendedor, telefoneCliente, anotacoes || "", id]
      );

      res.status(200).json({ message: 'Pedido atualizado com sucesso!' });

    } else if (req.method === 'DELETE') {
      const { id } = req.query;
      await client.query(`DELETE FROM pedidos WHERE id = $1`, [id]);
      res.status(200).json({ message: 'Pedido removido com sucesso!' });

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
