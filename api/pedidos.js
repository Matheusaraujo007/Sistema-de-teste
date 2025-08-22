// /api/pedidos.js
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Coloque no painel do Vercel
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  const client = await pool.connect();

  try {
    if (req.method === 'GET') {
      // Busca todos os pedidos
      const result = await client.query('SELECT * FROM pedidos ORDER BY id DESC');
      res.status(200).json(result.rows);

    } else if (req.method === 'POST') {
      // Cria um novo pedido, incluindo vendedor e telefone_cliente
      const { nomeCliente, telefoneCliente, vendedor, itens, valorTotal, valorRecebido, dataPedido, dataEntrega, status } = req.body;

      await client.query(
        `INSERT INTO pedidos 
          (vendedor, nome_cliente, telefone_cliente, itens, valor_total, valor_recebido, data_pedido, data_entrega, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          vendedor,
          nomeCliente,
          telefoneCliente,
          JSON.stringify(itens),
          valorTotal,
          valorRecebido || 0,
          dataPedido,
          dataEntrega,
          status || 'Aguardando Retorno'
        ]
      );

      res.status(201).json({ message: 'Pedido criado com sucesso!' });

    } else if (req.method === 'PUT') {
      // Atualiza pedido (pode ser valor recebido, status, vendedor, telefone_cliente OU itens)
      const { id, valorRecebido, status, vendedor, telefoneCliente, itens, valor_total } = req.body;

      if (itens) {
        // Atualiza os itens e valor_total se fornecido
        await client.query(
          `UPDATE pedidos 
           SET itens = $1,
               valor_total = $2
           WHERE id = $3`,
          [JSON.stringify(itens), valor_total, id]
        );
      } else {
        // Atualiza dados básicos
        await client.query(
          `UPDATE pedidos 
           SET valor_recebido = $1, status = $2, vendedor = $3, telefone_cliente = $4
           WHERE id = $5`,
          [valorRecebido, status, vendedor, telefoneCliente, id]
        );
      }

      res.status(200).json({ message: 'Pedido atualizado com sucesso!' });

    } else if (req.method === 'DELETE') {
      // Remove pedido
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
