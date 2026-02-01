const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(express.json());

// =====================================================
// ✅ Endpoint de verificação (Render / Browser / Healthcheck)
// =====================================================
app.get("/chat", (req, res) => {
  res.status(200).send("OK");
});

// =====================================================
// ✅ Webhook principal da Z-API
// =====================================================
app.post("/chat", async (req, res) => {
  console.log("📩 Mensagem recebida:");
  console.log(JSON.stringify(req.body, null, 2));

  const mensagem =
    req.body?.text?.message ||
    req.body?.message?.text ||
    "";

  // Se não houver mensagem, apenas confirma recebimento
  if (!mensagem) {
    return res.sendStatus(200);
  }

  try {
    // =====================================================
    // 1️⃣ Chamada à OpenAI
    // =====================================================
    const resposta = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `
Você é o Conversa com o Pai.

Fale como um pai amoroso, sábio e presente.
Seja humano, profundo e empático.
Nunca seja genérico.
Nunca repita respostas.
Não se apresente como Deus.
Não prometa milagres.
Acolha a dor antes de aconselhar.
Use princípios cristãos com naturalidade.
Evite excesso de versículos, mas quando usar, faça com contexto e carinho.
Fale como um melhor amigo espiritual.
            `
          },
          {
            role: "user",
            content: mensagem
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const texto = resposta.data.choices[0].message.content;

    // =====================================================
    // 2️⃣ Envio da resposta para o WhatsApp (Z-API)
    // =====================================================
    const zapiUrl = `https://api.z-api.io/instances/${process.env.ZAPI_INSTANCE_ID}/token/${process.env.ZAPI_TOKEN}/send-text`;

    await axios.post(
      zapiUrl,
      {
        phone: req.body.phone || req.body.from,
        message: texto
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Client-Token": process.env.ZAPI_CLIENT_TOKEN
        }
      }
    );

    console.log("📤 Resposta enviada ao WhatsApp");
    return res.sendStatus(200);

  } catch (err) {
    console.error("❌ ERRO:", err.response?.data || err.message);
    return res.sendStatus(200);
  }
});

// =====================================================
// ✅ Porta dinâmica (OBRIGATÓRIA para Render)
// =====================================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🔥 Conversa com o Pai rodando na porta ${PORT}`);
});
