const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- API Proxy Endpoint (Alibaba Cloud DashScope) ---
app.post('/api/chat', async (req, res) => {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key DashScope belum diatur di .env' });
  }

  const { messages, temperature } = req.body || {};

  try {
    // Menggunakan endpoint internasional Singapura
    const response = await fetch('https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'qwen-max',
        input: { messages },
        parameters: { 
          result_format: 'message', // Membuat output compatible dengan struktur app.js asli
          temperature: temperature ?? 0.8
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('DashScope Error:', data);
      return res.status(response.status).json({ error: data.message || 'Gagal memanggil DashScope' });
    }

    // Mapping output DashScope agar sesuai dengan ekspektasi app.js Qoder
    // app.js mengharapkan data.choices[0].message.content
    res.json(data.output);
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Gagal terhubung ke layanan Alibaba Cloud.' });
  }
});

app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Ramadan Persona Generator (Official Alibaba Version) running on port ${PORT}`);
});