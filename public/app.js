// ============================================================
// Ramadan Persona Generator - Main Application Logic
// ============================================================

// --- State ---
const state = {
  playerName: '',
  tone: '',        // 'receh' or 'serius'
  questions: [],   // Array of { question, options, correctIndex }
  currentQ: 0,
  score: 0,
  answers: [],     // Track user answers for persona generation
  persona: null,   // { name, emoji, description }
};

// --- API Configuration ---
// All AI requests go through the backend proxy (API key is stored server-side)
const API_PROXY = '/api/chat';

// --- Toast Notification ---
function showToast(message, duration = 3000) {
  const toast = document.getElementById('toast-error');
  const msgEl = document.getElementById('toast-message');
  msgEl.textContent = message;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), duration);
}

// --- Page Navigation ---
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- Starfield Background ---
function createStarfield() {
  const container = document.getElementById('starfield');
  const count = 60;
  for (let i = 0; i < count; i++) {
    const star = document.createElement('div');
    star.classList.add('star');
    star.style.left = Math.random() * 100 + '%';
    star.style.top = Math.random() * 100 + '%';
    star.style.setProperty('--duration', (2 + Math.random() * 4) + 's');
    star.style.setProperty('--opacity', (0.3 + Math.random() * 0.7).toString());
    star.style.animationDelay = Math.random() * 4 + 's';
    container.appendChild(star);
  }
}

// --- Tone Selection ---
function selectTone(tone) {
  state.tone = tone;
  document.querySelectorAll('.tone-card').forEach(card => {
    card.classList.toggle('selected', card.dataset.tone === tone);
  });
  validateEntryForm();
}

// --- Entry Form Validation ---
function validateEntryForm() {
  const name = document.getElementById('input-name').value.trim();
  const btn = document.getElementById('btn-start');
  btn.disabled = !(name && state.tone);
}

// --- AI API Call (via backend proxy) ---
async function callAI(systemPrompt, userPrompt) {
  let response;
  try {
    response = await fetch(API_PROXY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: systemPrompt + '\n\n' + userPrompt },
        ],
        temperature: 0.8,
        max_tokens: 2000,
      }),
    });
  } catch (networkErr) {
    throw new Error('Tidak bisa terhubung ke server. Periksa koneksi internet kamu.');
  }

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const msg = errData.error || `Server error: ${response.status}`;
    if (response.status === 401) {
      throw new Error('API key server tidak valid. Hubungi admin untuk mengganti API key.');
    }
    if (response.status === 402) {
      throw new Error('Kredit AI habis. Hubungi admin untuk top up.');
    }
    if (response.status === 500 && msg.includes('not configured')) {
      throw new Error('Server belum dikonfigurasi. Hubungi admin untuk setup API key.');
    }
    throw new Error(msg);
  }

  const data = await response.json();
  if (!data.choices || !data.choices[0]) {
    throw new Error('Response AI tidak valid. Coba lagi.');
  }
  return data.choices[0].message.content;
}

// --- Generate Quiz Questions via AI ---
async function fetchQuestions() {
  const toneDesc = state.tone === 'receh'
    ? 'lucu, santai, dan receh (gen Z humor Indonesia). Gunakan bahasa gaul.'
    : 'serius, mendalam, dan edukatif. Gunakan bahasa yang sopan dan informatif.';

  const systemPrompt = `Kamu adalah pembuat kuis Ramadan yang ${toneDesc}
Tugas kamu: buat 5 pertanyaan trivia multiple choice tentang Ramadan.
Topik bisa meliputi: sejarah Ramadan, tradisi Ramadan di Indonesia, hukum puasa, makanan berbuka/sahur, budaya mudik, zakat, lailatul qadr, tarawih, dll.

PENTING: Kamu HARUS merespons HANYA dalam format JSON array yang valid, tanpa teks lain.
Setiap item harus memiliki struktur:
{
  "question": "Pertanyaan di sini?",
  "options": ["Opsi A", "Opsi B", "Opsi C", "Opsi D"],
  "correctIndex": 0
}

correctIndex adalah index (0-3) dari jawaban yang benar.
Pastikan pertanyaan bervariasi dan menarik.`;

  const userPrompt = `Buatkan 5 pertanyaan trivia Ramadan untuk ${state.playerName}. Format: JSON array saja.`;

  const raw = await callAI(systemPrompt, userPrompt);

  // Extract JSON from the response
  let jsonStr = raw.trim();
  // Try to find JSON array in the response
  const match = jsonStr.match(/\[[\s\S]*\]/);
  if (match) {
    jsonStr = match[0];
  }

  const parsed = JSON.parse(jsonStr);
  if (!Array.isArray(parsed) || parsed.length < 5) {
    throw new Error('Format pertanyaan dari AI tidak valid.');
  }

  return parsed.slice(0, 5).map(q => ({
    question: q.question,
    options: q.options,
    correctIndex: q.correctIndex,
  }));
}

// --- Generate Persona via AI ---
async function fetchPersona() {
  const toneDesc = state.tone === 'receh'
    ? 'lucu, receh, dan kocak ala gen Z Indonesia. Gunakan bahasa gaul, slang, dan humor.'
    : 'bijaksana, mendalam, dan inspiratif. Gunakan bahasa yang sopan dan bermakna.';

  const answersDetail = state.questions.map((q, i) => {
    const userAnswer = state.answers[i];
    const isCorrect = userAnswer === q.correctIndex;
    return `Q${i+1}: "${q.question}" - Jawaban: "${q.options[userAnswer]}" (${isCorrect ? 'BENAR' : 'SALAH'})`;
  }).join('\n');

  const systemPrompt = `Kamu adalah interpreter persona Ramadan yang ${toneDesc}

Berdasarkan hasil kuis seseorang, kamu harus menentukan "Persona Ramadan" mereka.
Contoh persona: "Sultan Takjil", "Sahur Strategist", "Raja Rebahan Ramadan", "Tarawih Warrior", "Ngabuburit Navigator", "Imam Dadakan", "Master Kolak", "Si Tukang Ngeluh Lapar", "Pejuang Khatam Quran", dll.

PENTING: Kamu HARUS merespons HANYA dalam format JSON yang valid, tanpa teks lain:
{
  "name": "Nama Persona",
  "emoji": "emoji yang cocok (1 emoji saja)",
  "description": "Deskripsi persona 2-3 kalimat yang ${toneDesc}"
}`;

  const userPrompt = `Nama: ${state.playerName}
Skor: ${state.score}/5
Detail jawaban:
${answersDetail}

Tentukan persona Ramadan untuk orang ini. Format: JSON saja.`;

  const raw = await callAI(systemPrompt, userPrompt);

  let jsonStr = raw.trim();
  const match = jsonStr.match(/\{[\s\S]*\}/);
  if (match) {
    jsonStr = match[0];
  }

  return JSON.parse(jsonStr);
}

// --- Start Quiz ---
async function startQuiz() {
  state.playerName = document.getElementById('input-name').value.trim();
  if (!state.playerName || !state.tone) return;

  // Reset state
  state.questions = [];
  state.currentQ = 0;
  state.score = 0;
  state.answers = [];
  state.persona = null;

  // Switch to quiz page
  showPage('page-quiz');
  document.getElementById('quiz-player-name').textContent = state.playerName;
  document.getElementById('quiz-loading').classList.remove('hidden');
  document.getElementById('quiz-content').classList.add('hidden');

  try {
    state.questions = await fetchQuestions();
    showQuestion(0);
  } catch (err) {
    showToast(err.message || 'Gagal memuat pertanyaan. Coba lagi.');
    showPage('page-entry');
  }
}

// --- Show Question ---
function showQuestion(index) {
  const q = state.questions[index];
  state.currentQ = index;

  document.getElementById('quiz-loading').classList.add('hidden');
  document.getElementById('quiz-content').classList.remove('hidden');

  // Update header
  document.getElementById('quiz-current').textContent = index + 1;
  document.getElementById('quiz-total').textContent = state.questions.length;
  document.getElementById('quiz-progress').style.width = ((index) / state.questions.length * 100) + '%';

  // Set question
  document.getElementById('quiz-question').textContent = q.question;

  // Set options
  const optContainer = document.getElementById('quiz-options');
  optContainer.innerHTML = '';

  const labels = ['A', 'B', 'C', 'D'];
  q.options.forEach((opt, i) => {
    const div = document.createElement('div');
    div.className = 'option-card glass rounded-xl p-4 cursor-pointer animate-slide-up';
    div.style.animationDelay = (i * 0.1) + 's';
    div.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-bold text-sm shrink-0">
          ${labels[i]}
        </div>
        <span class="text-sm font-medium">${opt}</span>
      </div>
    `;
    div.onclick = () => selectAnswer(i);
    optContainer.appendChild(div);
  });

  // Hide next button
  const btnNext = document.getElementById('btn-next');
  btnNext.classList.add('hidden');
  btnNext.disabled = true;

  // Update button text
  if (index === state.questions.length - 1) {
    btnNext.textContent = 'Lihat Hasil 🎉';
  } else {
    btnNext.textContent = 'Lanjut ➡️';
  }
}

// --- Select Answer ---
function selectAnswer(optionIndex) {
  const q = state.questions[state.currentQ];

  // Prevent re-selection
  if (state.answers[state.currentQ] !== undefined) return;

  state.answers[state.currentQ] = optionIndex;
  const isCorrect = optionIndex === q.correctIndex;
  if (isCorrect) state.score++;

  // Visual feedback
  const options = document.querySelectorAll('#quiz-options .option-card');
  options.forEach((opt, i) => {
    opt.style.pointerEvents = 'none';
    if (i === q.correctIndex) {
      opt.classList.add('correct');
    }
    if (i === optionIndex && !isCorrect) {
      opt.classList.add('wrong');
    }
  });

  // Show next button
  const btnNext = document.getElementById('btn-next');
  btnNext.classList.remove('hidden');
  btnNext.disabled = false;
}

// --- Next Question ---
async function nextQuestion() {
  const nextIdx = state.currentQ + 1;

  // Update progress bar
  document.getElementById('quiz-progress').style.width = ((nextIdx) / state.questions.length * 100) + '%';

  if (nextIdx >= state.questions.length) {
    // Show results
    await showResults();
  } else {
    showQuestion(nextIdx);
  }
}

// --- Show Results ---
async function showResults() {
  showPage('page-result');
  document.getElementById('result-loading').classList.remove('hidden');
  document.getElementById('result-content').classList.add('hidden');

  try {
    state.persona = await fetchPersona();
    displayResults();
  } catch (err) {
    // Fallback persona if AI fails
    state.persona = generateFallbackPersona();
    displayResults();
  }
}

// --- Fallback Persona ---
function generateFallbackPersona() {
  const personas = [
    { name: 'Sultan Takjil', emoji: '👑', description: 'Kamu adalah raja/ratu berbuka puasa! Koleksi takjil kamu legendary, dari kolak sampai es buah premium.' },
    { name: 'Sahur Strategist', emoji: '⏰', description: 'Kamu punya strategi sahur yang matang. Alarm 5 kali, menu sudah direncanakan dari malam.' },
    { name: 'Tarawih Warrior', emoji: '🦸', description: 'Kamu adalah pejuang tarawih sejati. 23 rakaat? No problem. Hatam Quran? InsyaAllah on track!' },
    { name: 'Ngabuburit Navigator', emoji: '🧭', description: 'Kamu jago banget ngabuburit. Setiap sore punya destinasi baru buat nunggu berbuka.' },
    { name: 'Pejuang Khatam', emoji: '📖', description: 'Target kamu jelas: khatam Quran di bulan Ramadan. Fokus dan istiqomah!' },
  ];

  const scoreIndex = Math.min(state.score, personas.length - 1);
  return personas[scoreIndex];
}

// --- Display Results ---
function displayResults() {
  document.getElementById('result-loading').classList.add('hidden');
  document.getElementById('result-content').classList.remove('hidden');

  document.getElementById('result-player-name').textContent = state.playerName;
  document.getElementById('result-emoji').textContent = state.persona.emoji || '🌟';
  document.getElementById('result-persona').textContent = state.persona.name;
  document.getElementById('result-score').textContent = state.score;
  document.getElementById('result-description').textContent = state.persona.description;

  // Animate score bar
  setTimeout(() => {
    document.getElementById('result-score-bar').style.width = (state.score / 5 * 100) + '%';
  }, 300);

  // Confetti!
  launchConfetti();
}

// --- Confetti Effect ---
function launchConfetti() {
  const colors = ['#7c3aed', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];
  const shapes = ['circle', 'square'];

  for (let i = 0; i < 50; i++) {
    const piece = document.createElement('div');
    piece.classList.add('confetti-piece');
    const color = colors[Math.floor(Math.random() * colors.length)];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];

    piece.style.left = Math.random() * 100 + 'vw';
    piece.style.background = color;
    piece.style.borderRadius = shape === 'circle' ? '50%' : '2px';
    piece.style.width = (5 + Math.random() * 10) + 'px';
    piece.style.height = (5 + Math.random() * 10) + 'px';
    piece.style.animationDuration = (2 + Math.random() * 2) + 's';
    piece.style.animationDelay = Math.random() * 0.5 + 's';

    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 4000);
  }
}

// --- Share to WhatsApp ---
function shareToWhatsApp() {
  const score = state.score;
  const total = state.questions.length;
  const persona = state.persona.name;
  const emoji = state.persona.emoji || '🌟';

  const text = `🌙 *Ramadan Persona Generator* 🌙

Hai! Aku ${state.playerName} dan persona Ramadan aku adalah:

${emoji} *${persona}* ${emoji}

Skor trivia: ${score}/${total} ✨

${state.persona.description}

Coba juga yuk! Temukan persona Ramadan kamu 👇
${window.location.href}`;

  const encoded = encodeURIComponent(text);
  window.open(`https://wa.me/?text=${encoded}`, '_blank');
}

// --- Restart Quiz ---
function restartQuiz() {
  state.questions = [];
  state.currentQ = 0;
  state.score = 0;
  state.answers = [];
  state.persona = null;

  showPage('page-entry');
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  createStarfield();

  // Name input listener
  document.getElementById('input-name').addEventListener('input', validateEntryForm);

  // Allow Enter key to start
  document.getElementById('input-name').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const btn = document.getElementById('btn-start');
      if (!btn.disabled) startQuiz();
    }
  });
});
