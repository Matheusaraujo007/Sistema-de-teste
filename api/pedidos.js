import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Função para calcular o valor total de um pedido
function calcularTotal(itens) {
  if (!itens || !Array.isArray(itens)) return 0;
  return itens.reduce((acc, i) => acc + (parseFloat(i.quantidade) || 0) * (parseFloat(i.valorUnit) || 0), 0);
}

// Função para formatar datas no padrão YYYY-MM-DD
function formatarDataDB(dataStr) {
  if (!dataStr) return null;
  const data = new Date(dataStr);
  if (isNaN(data)) return null;
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

// Função para gerar data atual no fuso local
function dataAtualFormatada() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const [{ value: dia }, , { value: mes }, , { value: ano }] = formatter.formatToParts(now);
  return `${ano}-${mes}-${dia}`;
}

export default async function handler(req, res) {
  const client = await pool.connect();

  try {
    if (req.method === 'GET') {
      // Retorna todos os pedidos
      const result = await client.query('SELECT * FROM pedidos ORDER BY id DESC');
      res.status(200).json(result.rows);

    } else if (req.method === 'POST') {
      // Cria um novo pedido
      const { nomeCliente, telefoneCliente, vendedor, itens, valorRecebido, dataEntrega, status, anotacoes } = req.body;

      const total = calcularTotal(itens);

      await client.query(
        `INSERT INTO pedidos 
          (vendedor, nome_cliente, telefone_cliente, itens, valor_total, valor_recebido, data_pedido, data_entrega, status, anotacoes)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          vendedor || "",
          nomeCliente || "",
          telefoneCliente || "",
          JSON.stringify(itens) || "[]",
          total,
          valorRecebido || 0,
          dataAtualFormatada(),
          formatarDataDB(dataEntrega),
          status || 'Aguardando Retorno',
          anotacoes || ""
        ]
      );

      res.status(201).json({ message: 'Pedido criado com sucesso!' });

    } else if (req.method === 'PUT') {
      // Atualiza um pedido existente
      const { id, valorRecebido, status, vendedor, telefoneCliente, itens, anotacoes } = req.body;

      let total = null;
      let itensJSON = null;

      if (itens && Array.isArray(itens)) {
        total = calcularTotal(itens);
        itensJSON = JSON.stringify(itens);
      }

      await client.query(
        `UPDATE pedidos SET 
          valor_recebido = $1, 
          status = $2, 
          vendedor = $3, 
          telefone_cliente = $4,
          anotacoes = $5,
          itens = COALESCE($6, itens),
          valor_total = COALESCE($7, valor_total)
        WHERE id = $8`,
        [
          valorRecebido || 0,
          status || 'Aguardando Retorno',
          vendedor || "",
          telefoneCliente || "",
          anotacoes || "",
          itensJSON,
          total,
          id
        ]
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
