const state = { name: '', tone: '', questions: [], currentQ: 0, score: 0, answers: [], persona: null };

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function selectTone(tone) {
  state.tone = tone;
  document.querySelectorAll('.tone-card').forEach(c => {
    c.style.borderColor = c.dataset.tone === tone ? '#34d399' : 'transparent';
    c.style.background = c.dataset.tone === tone ? 'rgba(52, 211, 153, 0.1)' : 'rgba(255, 255, 255, 0.05)';
  });
  checkStartReady();
}

document.getElementById('input-name').addEventListener('input', (e) => {
  state.name = e.target.value.trim();
  checkStartReady();
});

function checkStartReady() {
  const btn = document.getElementById('btn-start');
  const ready = state.name.length > 0 && state.tone !== '';
  btn.disabled = !ready;
  btn.classList.toggle('opacity-50', !ready);
  btn.classList.toggle('cursor-not-allowed', !ready);
}

async function apiCall(payload) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('API Error');
  return await res.json();
}

async function startQuiz() {
  showPage('page-quiz');
  document.getElementById('quiz-player-name').textContent = state.name;
  
  try {
    state.questions = await apiCall({ type: 'quiz', tone: state.tone });
    showQuestion(0);
  } catch (err) {
    alert('Gagal memuat kuis. Coba lagi!');
    window.location.reload();
  }
}

function showQuestion(idx) {
  state.currentQ = idx;
  const q = state.questions[idx];
  
  document.getElementById('quiz-loading').classList.add('hidden');
  document.getElementById('quiz-content').classList.remove('hidden');
  
  document.getElementById('quiz-current').textContent = idx + 1;
  document.getElementById('quiz-progress').style.width = `${((idx + 1) / 5) * 100}%`;
  document.getElementById('quiz-question').textContent = q.question;
  
  const optionsBox = document.getElementById('quiz-options');
  optionsBox.innerHTML = '';
  
  q.options.forEach((opt, i) => {
    const div = document.createElement('div');
    div.className = 'glass p-4 rounded-xl cursor-pointer hover:bg-slate-700/50 border border-slate-600 font-medium transition-all';
    div.textContent = opt;
    div.onclick = () => handleAnswer(i, q.correctIndex, div);
    optionsBox.appendChild(div);
  });
}

function handleAnswer(selectedIndex, correctIndex, el) {
  // Mencegah klik dua kali
  if (state.answers[state.currentQ] !== undefined) return; 
  
  state.answers[state.currentQ] = selectedIndex;
  const isCorrect = selectedIndex === correctIndex;
  if (isCorrect) state.score++;
  
  // 1. Warnai pilihan yang diklik user (Hijau jika benar, Merah jika salah)
  el.style.background = isCorrect ? 'rgba(52, 211, 153, 0.2)' : 'rgba(244, 63, 94, 0.2)';
  el.style.borderColor = isCorrect ? '#34d399' : '#f43f5e';
  
  // 2. FITUR KEMBALI: Jika jawaban user salah, sorot jawaban yang benar
  if (!isCorrect) {
    const optionsBox = document.getElementById('quiz-options');
    // Mencari elemen HTML dari jawaban yang benar berdasarkan index
    const correctEl = optionsBox.children[correctIndex];
    if (correctEl) {
      correctEl.style.background = 'rgba(52, 211, 153, 0.2)'; // Background hijau
      correctEl.style.borderColor = '#34d399'; // Border hijau
    }
  }
  
  document.getElementById('btn-next').classList.remove('hidden');
}

function nextQuestion() {
  document.getElementById('btn-next').classList.add('hidden');
  if (state.currentQ < 4) {
    showQuestion(state.currentQ + 1);
  } else {
    generatePersona();
  }
}

async function generatePersona() {
  showPage('page-result');
  document.getElementById('result-loading').classList.remove('hidden');
  document.getElementById('result-content').classList.add('hidden');
  
  try {
    const data = await apiCall({ type: 'persona', name: state.name, score: state.score, tone: state.tone });
    state.persona = data;
    
    // Gunakan Optional Chaining (?.) dan Operator OR (||) agar tidak crash kalau data kosong
    document.getElementById('res-score').textContent = state.score;
    document.getElementById('res-emoji').textContent = data?.emoji || '😎';
    document.getElementById('res-player').textContent = state.name;
    document.getElementById('res-persona').textContent = data?.name || 'Persona Misterius';
    document.getElementById('res-desc').textContent = `"${data?.description || 'Kamu terlalu keren buat dideskripsikan AI.'}"`;
    
    // Cek dulu apakah elemen HTML-nya ada sebelum diisi teks (menghindari error null)
    const elSuper = document.getElementById('res-super');
    if (elSuper) elSuper.textContent = data?.superpower || '-';
    
    const elWeak = document.getElementById('res-weak');
    if (elWeak) elWeak.textContent = data?.weakness || '-';
    
    const elAdvice = document.getElementById('res-advice');
    if (elAdvice) elAdvice.textContent = data?.advice || '-';
    
    const elStats = document.getElementById('res-stats');
    if (elStats) elStats.textContent = `📊 ${data?.funStats || 'Statistik tidak diketahui'}`;
    
    const elMemeSetup = document.getElementById('res-meme-setup');
    if (elMemeSetup) elMemeSetup.textContent = data?.meme?.setup || 'AI gagal mikir tebak-tebakan...';
    
    const elMemePunch = document.getElementById('res-meme-punch');
    if (elMemePunch) elMemePunch.textContent = data?.meme?.punchline || '';
    
    document.getElementById('result-loading').classList.add('hidden');
    document.getElementById('result-content').classList.remove('hidden');
  } catch (err) {
    // Kunci Debugging: Print error aslinya ke console biar kita tahu persis apa yang rusak
    console.error("DOM/JS Error detail:", err);
    alert('Waduh, gagal nampilin hasil. Coba cek console inspect element ya!');
  }
}

function shareWhatsApp() {
  const p = state.persona;
  const text = `🌙 *Ramadan Persona Generator*\n\nAku ${state.name}!\nPersona Ramadan aku: ${p.emoji} *${p.name}*\nSkor Kuis: ${state.score}/5\n\n_"${p.description}"_\n\nKelemahan: ${p.weakness}\nSaran: ${p.advice}\n\nCek persona kamu di: http://8.215.95.232`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
}

function downloadStory() {
  const target = document.getElementById('capture-area');
  const btn = event.currentTarget;
  const originalText = btn.innerHTML;
  btn.innerHTML = '⏳ Sedang merender gambar...';
  
  // TRIK SULAP: Ambil elemen teks judul persona
  const personaTitle = document.getElementById('res-persona');
  // Simpan class asli yang ada gradasinya
  const originalClasses = personaTitle.className;
  // Ubah SEMENTARA jadi warna solid (tidak transparan) agar html2canvas bisa membacanya
  personaTitle.className = "text-3xl font-extrabold text-emerald-400 mb-4";

  html2canvas(target, { 
    scale: 2, 
    backgroundColor: '#0f172a', 
    useCORS: true 
  }).then(canvas => {
    // KEMBALIKAN: Segera kembalikan class aslinya agar web tetap terlihat glowing
    personaTitle.className = originalClasses;
    btn.innerHTML = originalText;
    
    // Proses download
    const link = document.createElement('a');
    link.download = `Ramadan_Persona_${state.name}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }).catch(err => {
    // KEMBALIKAN: Kalaupun error, UI harus tetap kembali normal
    personaTitle.className = originalClasses;
    alert("Gagal membuat gambar. Coba lagi!");
    btn.innerHTML = originalText;
  });
}