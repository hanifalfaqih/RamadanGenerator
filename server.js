const express = require('express');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/chat', async (req, res) => {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API Key DashScope hilang!' });

  const { type, tone, name, score } = req.body;
  let systemPrompt = "";
  let userPrompt = "";

  if (type === 'quiz') {
    systemPrompt = `Kamu adalah pembuat kuis Ramadan bergaya ${tone === 'receh' ? 'receh Gen Z' : 'bijak serius'}.`;
    userPrompt = `Buatkan 5 soal trivia Ramadan. WAJIB kembalikan HANYA JSON array dengan struktur ini, TANPA TEKS LAIN SEBELUM ATAU SESUDAHNYA:
[{"question":"...","options":["A","B","C","D"],"correctIndex":0}]`;
  } else if (type === 'persona') {
    systemPrompt = `Kamu analis kepribadian bergaya ${tone === 'receh' ? 'sangat gaul' : 'sangat puitis'}.`;
    userPrompt = `Analisis user bernama ${name} skor ${score}/5. WAJIB kembalikan HANYA JSON object dengan struktur ini, TANPA TEKS LAIN SEBELUM ATAU SESUDAHNYA:
{
  "name": "Nama Persona",
  "emoji": "😎",
  "description": "Deskripsi panjang...",
  "superpower": "Kekuatan...",
  "weakness": "Kelemahan...",
  "advice": "Saran...",
  "funStats": "Statistik...",
  "meme": { "setup": "Meme setup...", "punchline": "Meme punchline..." }
}`;
  } else {
    return res.status(400).json({ error: 'Invalid type' });
  }

  try {
    const response = await axios.post(
      'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions',
      {
        model: 'qwen-plus',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );

    let rawContent = response.data.choices[0].message.content;
    const jsonMatch = rawContent.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const cleanJson = JSON.parse(jsonMatch[0]);
      res.json(cleanJson);
    } else {
      throw new Error("AI tidak mengembalikan JSON yang valid");
    }

  } catch (err) {
    console.error('\n=== 🚨 ERROR DIAGNOSIS 🚨 ===');
    if (err.response) {
      console.error('Status HTTP:', err.response.status);
      console.error('Alasan dari Alibaba:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error('Sistem/Parsing Error:', err.message);
    }
    console.error('=============================\n');
    res.status(500).json({ error: 'Gagal memproses AI' });
  }
});

app.listen(PORT, () => console.log(`🚀 Ramadan Persona Engine berjalan di Port ${PORT}`));