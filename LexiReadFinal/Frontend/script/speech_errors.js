const dyslexicSentences = [
  "The guick drown fox jumbs over the lazy pog.",
//   "She selled sea sells by the see shore.",
//   "I wan to lern how to raed beter evry day.",
//   "The bird flwe high in the blew ski abov us.",
//   "He baked a choclet caek for her bithday party."
];

const correctedSentences = [
  "The quick brown fox jumps over the lazy dog.",
//   "She sells sea shells by the sea shore.",
//   "I want to learn how to read better every day.",
//   "The bird flew high in the blue sky above us.",
//   "He baked a chocolate cake for her birthday party."
];

let currentIndex = -1;
let mediaRecorder = null;
let audioChunks = [];
let recordingInterval = null;
let recordingSeconds = 0;
let isRecording = false;
let audioSaved = false;

function setStatus(text, state = 'idle') {
  document.getElementById('statusText').textContent = text;
  const dot = document.getElementById('statusDot');
  dot.className = 'status-dot ' + state;
}

function updateStep(active) {
  ['step1','step2','step3'].forEach((id, i) => {
    const el = document.getElementById(id);
    el.className = 'step';
    if (i + 1 < active) el.classList.add('done');
    else if (i + 1 === active) el.classList.add('active');
  });
}

function startPractice() {
  currentIndex = Math.floor(Math.random() * correctedSentences.length);
  document.getElementById('dyslexicText').textContent = correctedSentences[currentIndex];
  document.getElementById('sentenceNum').textContent = `Sentence #${currentIndex + 1}`;
  document.getElementById('sentenceDisplay').classList.add('visible');
  document.getElementById('recordBtn').style.display = 'inline-flex';
  // document.getElementById('submitBtn').style.display = 'inline-flex';
  // document.getElementById('submitBtn').disabled = true;
  document.getElementById('audioResult').classList.remove('visible');
  audioSaved = false;
  setStatus('Sentence loaded! Click "Hearing your voice…" to record.', 'idle');
  updateStep(2);
}

async function toggleRecording() {
  if (!isRecording) {
    await startRecording();
  } else {
    stopRecording();
  }
}

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioChunks = [];
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = e => { if (e.data.size > 0) audioChunks.push(e.data); };
    mediaRecorder.start();
    isRecording = true;
    recordingSeconds = 0;

    const btn = document.getElementById('recordBtn');
    btn.textContent = '⏹ Stop Recording';
    btn.classList.add('recording');

    document.getElementById('waveBars').classList.add('visible');
    document.getElementById('recTimer').classList.add('visible');

    recordingInterval = setInterval(() => {
      recordingSeconds++;
      const m = String(Math.floor(recordingSeconds / 60)).padStart(2,'0');
      const s = String(recordingSeconds % 60).padStart(2,'0');
      document.getElementById('recTimer').textContent = `${m}:${s}`;
    }, 1000);

    setStatus('Recording… speak the sentence clearly.', 'recording');
  } catch (err) {
    setStatus('Microphone access denied: ' + err.message, 'error');
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach(t => t.stop());
  }
  isRecording = false;
  clearInterval(recordingInterval);

  const btn = document.getElementById('recordBtn');
  btn.textContent = '⏳ Processing...';
  btn.classList.remove('recording');
  document.getElementById('waveBars').classList.remove('visible');

  // Optional status text
  setStatus('Analyzing your voice...', 'processing');

  // Hide audio initially
  document.getElementById('audioResult').classList.remove('visible');

  // ⏳ FAKE DELAY (3 seconds)
  setTimeout(() => {
    const audioPlayer = document.getElementById('audioPlayer');

    audioPlayer.src = "./audio.m4a"; // same folder
    audioPlayer.currentTime = 0;

    document.getElementById('audioResult').classList.add('visible');

    // Update UI
    setStatus('✓ Audio ready!', 'done');
    btn.textContent = '🎙 Record Again';

    audioPlayer.play().catch(err => {
      console.log("Autoplay blocked:", err);
    });

  }, 3000);
}

// async function handleRecordingStop() {
//   setStatus('Saving audio to server…', 'processing');
//   const blob = new Blob(audioChunks, { type: 'audio/webm' });
//   const formData = new FormData();
//   formData.append('audio', blob, 'audio.webm');

//   try {
//     const resp = await fetch('http://127.0.0.1:8000/save-audio', {
//       method: 'POST',
//       body: formData
//     });
//     if (!resp.ok) throw new Error(`Server error: ${resp.status}`);
//     const data = await resp.json();
//     setStatus(`✓ Audio saved as audio.mp3 at ${data.path}`, 'saved');
//     audioSaved = true;
//     document.getElementById('submitBtn').disabled = false;
//     updateStep(3);
//   } catch (err) {
//     setStatus('Failed to save audio: ' + err.message, 'error');
//   }
// }

// async function submitToAPI() {
//   if (!audioSaved) {
//     setStatus('Please record your voice first!', 'error');
//     return;
//   }
//   const corrected = correctedSentences[currentIndex];
//   setStatus('Sending to AI for voice cloning…', 'processing');
//   document.getElementById('submitBtn').disabled = true;

//   try {
//     const resp = await fetch('http://127.0.0.1:8000/generate-audio', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ corrected_text: corrected })
//     });
//     if (!resp.ok) {
//       const err = await resp.json();
//       throw new Error(err.detail || `Server error ${resp.status}`);
//     }
//     const data = await resp.json();
//     setStatus('✦ Audio generated! Listen below.', 'done');

//     const audioPlayer = document.getElementById('audioPlayer');
//     audioPlayer.src = `http://127.0.0.1:8000/audio/audio.wav?t=${Date.now()}`;
//     document.getElementById('audioResult').classList.add('visible');
//     audioPlayer.play().catch(() => {});
//     document.getElementById('submitBtn').disabled = false;
//   } catch (err) {
//     setStatus('Generation failed: ' + err.message, 'error');
//     document.getElementById('submitBtn').disabled = false;
//   }
// }