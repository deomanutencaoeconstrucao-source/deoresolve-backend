/* ============================================================================
   DEOResolve - Backend EXEMPLO (Node.js + Mercado Pago)
   ----------------------------------------------------------------------------
   1) Instale:  npm install express mercadopago cors dotenv
   2) Crie um arquivo .env com:  MP_ACCESS_TOKEN=APP_USR-...  (credencial da sua
      conta Mercado Pago -> Seu negócio -> Configurações -> Credenciais)
   3) Rode:     node backend-exemplo.js   (ou publique no Render/Railway/Fly.io)
   4) No app (painel ADM -> Pagamentos), informe:
        Public Key ......... sua Public Key (APP_USR-... ou TEST-...)
        URL do backend ..... https://sua-api.onrender.com
      e DESMARQUE o "modo demonstração".
   5) No painel do Mercado Pago, configure as "back_urls" abaixo para a URL
      pública do seu app (ex.: https://deoresolveapp.tiiny.site/).
   ========================================================================== */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MercadoPagoConfig, Preference } = require('mercadopago');

const app = express();
app.use(cors());
app.use(express.json());

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

const APP_URL = process.env.APP_URL || 'https://deoresolveapp.tiiny.site/';

app.post('/criar-preferencia', async (req, res) => {
  try {
    const { titulo, valor, externalReference, cliente } = req.body;
    if (!titulo || !valor) return res.status(400).json({ erro: 'titulo e valor são obrigatórios' });

    const preference = await new Preference(client).create({
      body: {
        items: [{ title: String(titulo).slice(0, 120), quantity: 1, unit_price: Number(valor), currency_id: 'BRL' }],
        payer: { name: cliente && cliente.nome, email: cliente && cliente.email },
        external_reference: String(externalReference || ''),
        back_urls: { success: APP_URL, failure: APP_URL, pending: APP_URL },
        auto_return: 'approved',
        statement_descriptor: 'DEORESOLVE'
      }
    });
    res.json({ preferenceId: preference.id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Falha ao criar preferência de pagamento' });
  }
});

/* Webhook (opcional, recomendado): o Mercado Pago avisa cada mudança de status.
   Com um banco de dados real, marque a OS como paga aqui. */
app.post('/webhook', (req, res) => {
  console.log('Webhook MP:', JSON.stringify(req.body).slice(0, 300));
  res.sendStatus(200);
});

app.get('/', (req, res) => res.send('DEOResolve pagamentos OK'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Servidor rodando na porta ' + PORT));
