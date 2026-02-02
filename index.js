const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(express.json());

// =====================================================
// ✅ Health check (Render / Browser)
// =====================================================
app.get("/chat", (req, res) => {
  res.status(200).send("OK");
});

// =====================================================
// ✅ Webhook da Z-API
// =====================================================
app.post("/chat", async (req, res) => {
  console.log("📩 Mensagem recebida:");
  console.log(JSON.stringify(req.body, null, 2));

  const mensagem =
    req.body?.text?.message ||
    req.body?.message?.text ||
    "";

  if (!mensagem) {
    return res.sendStatus(200);
  }

  try {
    // ===============================
    // 1️⃣ OpenAI
    // ===============================
    const resposta = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `
Você é o “Conversa com o Pai”.

Você fala como um pai amoroso, presente e sábio.
Você não é Deus. Você caminha junto.

Antes de responder, avalie internamente:
- O estado emocional da pessoa
- A profundidade do que foi dito
- O histórico recente da conversa
- O momento do dia

REGRAS:
- O tamanho da resposta deve se adaptar à dor e ao contexto.
- Às vezes responda com uma frase.
- Às vezes use 2 ou 3 mensagens curtas.
- Evite textos longos demais, mas não tenha medo de aprofundar quando necessário.
- Nunca transforme a conversa em pregação.
- Não repita perguntas.
- Pergunte pouco, mas com intenção.
- Fale mais com o coração do que com a razão.

ESTILO:
- Linguagem simples, humana e próxima.
- Tom cristão, acolhedor e emocional.
- Versículos bíblicos curtos, contextualizados e usados com carinho.
- Conselhos práticos, sem julgamento.
- Às vezes, o silêncio e a presença são a melhor resposta.

OBJETIVO:
Fazer a pessoa se sentir vista, acolhida e acompanhada.
Criar conexão real, não respostas automáticas.
            `
          },
          { role: "user", content: mensagem }
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

    // ===============================
    // 2️⃣ Envio para WhatsApp (Z-API)
    // ⚠️ AQUI ESTAVA O ERRO
    // ===============================
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
          "Client-Token": process.env.ZAPI_CLIENT_TOKEN // 🔥 ESSENCIAL
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
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🔥 Conversa com o Pai rodando na porta ${PORT}`);
});
