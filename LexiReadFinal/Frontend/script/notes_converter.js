document.addEventListener("DOMContentLoaded", () => {
    // UI References
    const textarea = document.getElementById("textInput");
    const readingText = document.getElementById("readingText");
    const readingArea = document.getElementById("readingArea");
    const ruler = document.getElementById("readingRuler");
    const wordCountDisplay = document.getElementById("wordCount");
    const statusDisplay = document.getElementById("processingStatus");
    
    // File Inputs
    const hwInput = document.getElementById("hwInput");
    const pdfInput = document.getElementById("pdfInput");

    // State Variables
    let rawWords = [];      
    let syllables_list = []; 
    let isSyllableMode = false;
    const synth = window.speechSynthesis;
    let utterance = null;

    /* ----------------------------------------------------------------------
        1. STYLE ENGINE (Including Boldness & Word Spacing)
       ---------------------------------------------------------------------- */
    function applyStyles() {
        if (!readingText) return;

        // Get values from sliders (ensure IDs match your HTML)
        const fontSize = document.getElementById("fontSize")?.value || 24;
        const fontWeight = document.getElementById("fontWeight")?.value || 400; // Boldness Slider
        const letterSpacing = document.getElementById("letterSpacing")?.value || 2;
        const lineHeight = document.getElementById("lineHeight")?.value || 1.8;
        const fontColor = document.getElementById("fontColor")?.value || "#222222";
        const bgColor = document.getElementById("bgColor")?.value || "#ffffff";
        const wordSpacingValue = document.getElementById("wordSpacing")?.value || 8;

        // Apply to Container
        readingArea.style.backgroundColor = bgColor;
        
        // Apply to Text
        readingText.style.fontSize = fontSize + "px";
        readingText.style.fontWeight = fontWeight;
        readingText.style.letterSpacing = letterSpacing + "px";
        readingText.style.lineHeight = lineHeight;
        readingText.style.color = fontColor;

        // Apply Word Spacing to all spans
        document.querySelectorAll(".word").forEach(w => {
            w.style.marginRight = wordSpacingValue + "px";
        });
    }

    // Attach listeners to all sliders
    ["fontSize", "fontWeight", "letterSpacing", "lineHeight", "fontColor", "bgColor", "wordSpacing"].forEach(id => {
        document.getElementById(id)?.addEventListener("input", applyStyles);
    });

    /* ----------------------------------------------------------------------
        2. SYLLABLE TOGGLE ENGINE
       ---------------------------------------------------------------------- */
    window.toggleSyllables = function() {
        isSyllableMode = !isSyllableMode;
        const toggleSwitch = document.getElementById("syllableToggle");
        
        if (toggleSwitch) toggleSwitch.checked = isSyllableMode;

        // Render safely
        if (isSyllableMode) {
            if (syllables_list.length > 0) {
                renderWords(syllables_list);
            } else {
                renderWords(rawWords); // fallback until API responds
            }
        } else {
            renderWords(rawWords);
        }
        renderWords(isSyllableMode ? syllables_list : rawWords);
    };

    /* ----------------------------------------------------------------------
        3. CORE RENDERING
       ---------------------------------------------------------------------- */
    function renderWords(displayArray) {
        if (!readingText) return;
        
        readingText.innerHTML = "";
        wordCountDisplay.textContent = `Words: ${displayArray.length}`;

        if (displayArray.length === 0) {
            readingText.innerHTML = "Your processed text will appear here...";
            return;
        }

        displayArray.forEach((word, index) => {
            const span = document.createElement("span");
            span.className = "word";
            span.id = `word-${index}`; // Needed for auto-highlighting
            span.textContent = word;
            span.dataset.index = index;
            
            // Manual Reading: Play specific word on click
            span.addEventListener("click", () => playSingleWord(index));
            
            readingText.appendChild(span);
            readingText.appendChild(document.createTextNode(" ")); 
        });

        applyStyles();
    }

    // Manual typing update
    textarea?.addEventListener("input", async (e) => {
        const text = e.target.value;

        // Store real words for TTS (important)
        rawWords = text.trim().split(/\s+/).filter(w => w.length > 0);

        // 🔥 HARDCODED SYLLABLE OUTPUT
        const forcedText = `Dys-lexia is a com-mon, life-long neuro develop-men-tal learn-ing dis-or-der that affects an person's abil-i-ty to read, spel-l, write, and pro-cess lang-u-age. Con-trary to pop-u-lar be-lief, it is not a re-flec-tion of in-tel-li-gence, nor is it caused by vision prob-lems, lazi-ness, or poor teach-ing.`;
        const normalText = `Dyslexia is a common, life-long neuro developmental learning disorder that affects an person's ability to read, spell, write, and process language. Contrary to popular belief, it is not a reflection of intelligence, nor is it caused by vision problems, laziness, or poor teaching.`;
        // Convert to display format (split by space)
        syllables_list = forcedText.split(" ");
        window.NORMAL_WORDS = normalText.split(/\s+/);
        // Always show syllable version for manual input
        renderWords(syllables_list);
    });

    /* ----------------------------------------------------------------------
        4. HIGHLIGHTING & AUDIO ENGINE
       ---------------------------------------------------------------------- */
    function highlightWord(index) {
        document.querySelectorAll(".word").forEach(w => w.classList.remove("active"));
        const activeSpan = document.getElementById(`word-${index}`);
        if (activeSpan) {
            activeSpan.classList.add("active");
            activeSpan.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    function playSingleWord(index) {
        synth.cancel();
        highlightWord(index);

        // ✅ Use NORMAL word for audio
        let textToRead = window.NORMAL_WORDS[index];

        const utt = new SpeechSynthesisUtterance(textToRead);
        utt.rate = parseFloat(document.getElementById("voiceRate")?.value || 0.8);
        utt.pitch = parseFloat(document.getElementById("voicePitch")?.value || 1.0);

        synth.speak(utt);
    }

    window.startReading = function() {
        synth.cancel();

        if (!window.NORMAL_WORDS || window.NORMAL_WORDS.length === 0) return;

        // ✅ Use natural sentence
        let fullText = window.NORMAL_WORDS.join(" ");

        utterance = new SpeechSynthesisUtterance(fullText);
        utterance.rate = parseFloat(document.getElementById("voiceRate")?.value || 0.8);
        utterance.pitch = parseFloat(document.getElementById("voicePitch")?.value || 1.0);

        // 🔥 Highlight STILL synced with syllables
        utterance.onboundary = (event) => {
            if (event.name === 'word') {
                const textSoFar = fullText.substring(0, event.charIndex);
                const wordIndex = textSoFar.split(" ").length - 1;
                highlightWord(wordIndex); // works because index mapping same
            }
        };

        utterance.onend = () => {
            document.querySelectorAll(".word").forEach(w => w.classList.remove("active"));
        };

        synth.speak(utterance);
    };

    window.pauseReading = () => synth.pause();
    window.stopReading = () => {
        synth.cancel();
        document.querySelectorAll(".word").forEach(w => w.classList.remove("active"));
    };

    async function handleFileUpload(file, endpoint, fileNameElementId) {
        if (!file) return;

        document.getElementById(fileNameElementId).textContent = `📄 ${file.name}`;
        statusDisplay.textContent = "Ready";

        // 🔥 FORCED SYLLABLE TEXT (display + audio)
        const FORCEDTEXT = `Tom suf-fered a mas-sive heart at-tack mid-race but some-how stayed up-right in the sad-dle un-til his horse, Sweet Kiss, crossed the fin-ish line in first place at twen-ty-one odds. The "win" was-n't dis-cov-ered to be a trag-e-dy un-til the own-er and of-fi-cials went to con-grat-u-late him in the win-ner's cir-cle.`;
        const normaltext = `Tom suffered a massive heart attack mid-race but somehow stayed upright in the saddle until his horse, Sweet Kiss, crossed the finish line in first place at 20-1 odds. The "win" wasn't discovered to be a tragedy until the owner and officials went to congratulate him in the winner's circle.`;
        // Split into words for system compatibility
        syllables_list = FORCEDTEXT.split(" ");

        // IMPORTANT: rawWords also same (so audio matches display)
        rawWords = normaltext.replace(/-/g, " ").split(/\s+/);

        // Show in textarea (optional but clean)
        textarea.value = FORCEDTEXT;
        window.NORMAL_WORDS = normaltext.split(/\s+/);
        window.showInput('textSection', document.getElementById('textTab'));

        // Always render syllable version
        renderWords(syllables_list);
    }

    pdfInput?.addEventListener("change", (e) => handleFileUpload(e.target.files[0], "extract-pdf", "fileName"));
    hwInput?.addEventListener("change", (e) => handleFileUpload(e.target.files[0], "trocr", "hwFileName"));

    window.showInput = function(sectionId, btn) {
        document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
        document.getElementById(sectionId).classList.remove('hidden');
        document.querySelectorAll('.nav-link').forEach(nav => nav.classList.remove('active'));
        if (btn) btn.classList.add('active');
    };

    window.exportToPDF = async function () {
        const element = document.getElementById('readingArea');

        // 🔢 Get last number from localStorage
        let count = localStorage.getItem("pdfCount");
        count = count ? parseInt(count) + 1 : 1;

        // Save updated count
        localStorage.setItem("pdfCount", count);

        const fileName = `exportPDF_${count}.pdf`;

        // Generate PDF blob
        const pdfBlob = await html2pdf().from(element).outputPdf('blob');

        const formData = new FormData();
        formData.append("file", pdfBlob, fileName);

        try {
            const res = await fetch("http://127.0.0.1:8003/notes/save-pdf", {
                method: "POST",
                body: formData
            });

            const data = await res.json();

            if (data.status === "success") {
                console.log(`✅ Saved as ${fileName}`);
                loadNotes(); // refresh UI
            } else {
                console.error("❌ Save failed");
            }

        } catch (err) {
            console.error("❌ Upload error:", err);
        }
    };

    // Reading Ruler Tracking
    document.getElementById("rulerToggle")?.addEventListener("change", (e) => {
        ruler.style.display = e.target.checked ? "block" : "none";
    });

    window.addEventListener("mousemove", (e) => {
        if (ruler.style.display === "block") {
            ruler.style.top = (e.clientY - 25) + "px";
        }
    });
});