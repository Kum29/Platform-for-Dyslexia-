// LEXINOTE ENGINE - V5.4
// Features: Multi-word support with whitespace splitting, preserves case (small + capital), 
// spells full word after last letter of each word, improved centering & stability.

gsap.registerPlugin(MotionPathPlugin);

// --- STATE ---
let mode = "train";
let granularity = "letter";
let animType = "reveal";
let currentWordIndex = 0;
let currentLetterIndex = 0;
let wordArray = [];           // Array of words (preserves original case)
let autoAdvanceTimer = null;
let isDrawing = false;
let points = [];
let mainTimeline = null;

const ORIGINAL_WIDTH = 800;
const ORIGINAL_HEIGHT = 500;
const WORD_SPACING = 38;      // Balanced spacing

// PATH_DATA (from previous version - both upper and lower)
const PATH_DATA = {
    // UPPERCASE
    A: ["M400 120 L150 420", "M400 120 L650 420", "M240 320 L560 320"],
    B: ["M220 100 L220 420", "M220 100 C550 105 550 250 220 250", "M220 250 C600 255 600 420 220 420"],
    C: ["M580 180 C350 100 150 220 220 420 C300 480 500 450 580 380"],
    D: ["M220 100 L220 420", "M220 100 C650 110 650 420 220 420"],
    E: ["M230 100 L230 420", "M230 100 L580 100", "M230 260 L520 260", "M230 420 L580 420"],
    F: ["M230 100 L230 420", "M230 100 L580 100", "M230 260 L480 260"],
    G: ["M580 180 C350 100 150 220 220 420 C300 480 500 450 580 380", "M580 380 L580 300 L420 300"],
    H: ["M230 100 L230 420", "M580 100 L580 420", "M230 260 L580 260"],
    I: ["M400 100 L400 420", "M320 100 L480 100", "M320 420 L480 420"],
    J: ["M520 100 L520 380 C520 450 400 480 280 420"],
    K: ["M230 100 L230 420", "M580 100 L320 280", "M320 280 L580 420"],
    L: ["M230 100 L230 420", "M230 420 L580 420"],
    M: ["M220 420 L220 120", "M220 120 L400 320", "M400 320 L580 120", "M580 120 L580 420"],
    N: ["M230 100 L230 420", "M230 100 L580 420", "M580 100 L580 420"],
    O: ["M400 120 C250 120 180 220 180 300 C180 380 250 480 400 480 C550 480 620 380 620 300 C620 220 550 120 400 120"],
    P: ["M230 100 L230 420", "M230 100 C580 100 620 220 580 280 C540 340 400 340 230 280"],
    Q: ["M400 120 C250 120 180 220 180 300 C180 380 250 480 400 480 C550 480 620 380 620 300 C620 220 550 120 400 120", "M520 400 L620 480"],
    R: ["M230 100 L230 420", "M230 100 C580 100 620 220 580 280 C540 340 400 340 230 280", "M380 280 L580 420"],
    S: ["M550 150 C200 80 180 260 400 260 C650 260 620 450 220 410"],
    T: ["M230 100 L580 100", "M405 100 L405 420"],
    U: ["M230 120 L230 380 C230 460 300 480 400 480 C500 480 570 460 570 380 L570 120"],
    V: ["M230 120 L400 420", "M400 420 L570 120"],
    W: ["M200 120 L280 420", "M280 420 L400 220", "M400 220 L520 420", "M520 420 L600 120"],
    X: ["M250 120 L550 420", "M550 120 L250 420"],
    Y: ["M250 120 L400 280", "M400 280 L550 120", "M400 280 L400 420"],
    Z: ["M230 120 L580 120", "M580 120 L250 420", "M250 420 L580 420"],

    // LOWERCASE
    a: [
        "M520 280 C520 380 450 450 350 450 C250 450 180 380 180 280 C180 200 250 150 350 150 C450 150 520 200 520 280",
        "M520 280 L520 420"
    ],
    b: [
        "M240 100 L240 480",
        "M240 280 C240 180 310 130 410 130 C510 130 580 190 580 280 C580 370 510 430 410 430 C310 430 240 380 240 280"
    ],
    c: [
        "M520 280 C520 200 460 150 360 150 C260 150 190 210 190 290 C190 370 260 430 360 430 C460 430 520 380 520 280"
    ],
    d: [
        "M520 100 L520 480",
        "M520 280 C520 180 450 130 350 130 C250 130 180 200 180 280 C180 360 250 430 350 430 C450 430 520 380 520 280"
    ],
    e: [
        "M190 280 C190 200 260 150 360 150 C480 150 520 210 520 280 C520 340 470 400 360 400 C250 400 190 340 190 280",
        "M360 280 L520 280"
    ],
    f: [
        "M410 120 L410 420",
        "M310 180 L480 180",
        "M370 420 L470 420"
    ],
    g: [
        "M520 280 C520 180 450 130 350 130 C250 130 180 200 180 280 C180 360 250 430 350 430 C450 430 520 380 520 280",
        "M520 280 L520 480 C520 530 460 570 370 570 C280 570 220 520 220 450"
    ],
    h: [
        "M230 100 L230 480",
        "M230 280 C230 180 300 130 410 130 C510 130 580 190 580 280 C580 380 510 430 410 430"
    ],
    i: [
        "M380 150 L380 420",
        "M340 120 L420 120"
    ],
    j: [
        "M420 150 L420 420 C420 480 370 510 290 510",
        "M380 120 L460 120"
    ],
    k: [
        "M230 100 L230 480",
        "M230 280 L480 180",
        "M320 320 L510 480"
    ],
    l: [
        "M380 100 L380 480",
        "M320 480 L440 480"
    ],
    m: [
        "M200 280 L200 420",
        "M200 280 C200 180 270 130 350 130 C430 130 490 180 490 280 C490 380 550 430 630 430",
        "M490 280 L490 420"
    ],
    n: [
        "M230 280 L230 420",
        "M230 280 C230 180 300 130 410 130 C510 130 580 190 580 280 C580 380 510 430 410 430"
    ],
    o: [
        "M400 180 C290 180 210 230 210 300 C210 370 290 430 400 430 C510 430 590 370 590 300 C590 230 510 180 400 180"
    ],
    p: [
        "M230 280 L230 480",
        "M230 280 C230 180 300 130 410 130 C510 130 580 190 580 280 C580 370 510 430 410 430 C310 430 230 380 230 280"
    ],
    q: [
        "M520 280 C520 180 450 130 350 130 C250 130 180 200 180 280 C180 360 250 430 350 430 C450 430 520 380 520 280",
        "M520 280 L520 480"
    ],
    r: [
        "M240 280 L240 420",
        "M240 280 C240 200 300 150 410 150 C480 150 540 200 540 260"
    ],
    s: [
        "M480 220 C480 170 420 140 340 140 C260 140 200 180 200 240 C200 290 260 320 340 320 C420 320 480 350 480 400 C480 440 420 470 340 470 C260 470 200 440 200 400"
    ],
    t: [
        "M380 120 L380 420",
        "M290 280 L480 280",
        "M350 420 L430 420"
    ],
    u: [
        "M230 280 L230 420 C230 480 290 520 390 520 C490 520 540 460 540 380 L540 280"
    ],
    v: [
        "M240 280 L390 420",
        "M390 420 L540 280"
    ],
    w: [
        "M200 280 L270 420",
        "M270 420 L350 320",
        "M350 320 L430 420",
        "M430 420 L500 280"
    ],
    x: [
        "M260 280 L510 420",
        "M510 280 L260 420"
    ],
    y: [
        "M240 280 L390 420",
        "M390 420 L540 280",
        "M390 420 L390 520 C390 560 330 590 260 590"
    ],
    z: [
        "M240 280 L500 280",
        "M500 280 L260 420",
        "M260 420 L520 420"
    ],


    DEFAULT: ["M200 100 L600 100 L600 420 L200 420 Z"]
};

// --- DOM ---
const drawCanvas = document.getElementById("drawLayer");
const dctx = drawCanvas ? drawCanvas.getContext("2d") : null;
const svgOverlay = document.getElementById("svgOverlay");
const ghostDot = document.getElementById("ghostDot");

// --- INIT ---
function resizeCanvas() {
    if (!drawCanvas || !svgOverlay) return;
    const container = drawCanvas.parentElement;
    const rect = container.getBoundingClientRect();
    
    drawCanvas.width = rect.width;
    drawCanvas.height = rect.height;
    svgOverlay.setAttribute("viewBox", `0 0 ${rect.width} ${rect.height}`);
    
    if (wordArray.length > 0) renderCurrentStep();
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("DOMContentLoaded", () => {
    resizeCanvas();
    setAppMode("train");
});

// --- UI CONTROLS ---
window.setAppMode = function(newMode) {
    mode = newMode;
    document.getElementById("trainTab")?.classList.toggle("active-train", mode === "train");
    document.getElementById("testTab")?.classList.toggle("active-test", mode === "test");
    document.getElementById("submitBtn").style.display = mode === "test" ? "block" : "none";
    clearCanvas();
};

window.setGranularity = function(type) {
    granularity = type;
    document.getElementById("letterBtn")?.classList.toggle("active-gran", type === "letter");
    document.getElementById("wordBtn")?.classList.toggle("active-gran", type === "word");
};

window.setAnimType = function(type, el) {
    animType = type;
    document.querySelectorAll(".anim-type-card").forEach(c => c.classList.remove("selected"));
    el?.classList.add("selected");
};

// --- LAYOUT CALCULATION ---
function getLayout(word) {
    const w = drawCanvas.width;
    const h = drawCanvas.height;
    const topY = h * 0.18;

    if (granularity === "letter") {
        const scale = Math.min(w * 0.76 / ORIGINAL_WIDTH, h * 0.65 / ORIGINAL_HEIGHT);
        const startX = (w - ORIGINAL_WIDTH * scale) / 2;
        return { scale, startX, topY };
    } else {
        const num = word.length;
        const totalW = num * ORIGINAL_WIDTH + (num - 1) * WORD_SPACING;
        const scale = Math.min(w * 0.91 / totalW, h * 0.60 / ORIGINAL_HEIGHT);
        const startX = (w - totalW * scale) / 2;
        return { scale, startX, topY };
    }
}

// --- LIGHT GUIDE ---
function createLetterGroup(char, x, y, scale, isGuide = true) {
    const strokes = PATH_DATA[char] || PATH_DATA.DEFAULT;
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("transform", `translate(${x} ${y}) scale(${scale})`);
    group.setAttribute("class", isGuide ? "light-guide-group" : "gsap-path-container");

    strokes.forEach(d => {
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", d);
        path.setAttribute("fill", "none");
        path.setAttribute("stroke-linecap", "round");
        path.setAttribute("stroke-linejoin", "round");

        if (isGuide) {
            path.setAttribute("stroke", "#4a90e2");
            path.setAttribute("stroke-width", "24");
            path.setAttribute("opacity", "0.18");
        } else {
            path.setAttribute("stroke-width", "16");
            if (animType === "glow") {
                path.setAttribute("stroke", "#ffda79");
            } else {
                path.setAttribute("stroke", "#1e40af");
            }
        }
        group.appendChild(path);
    });
    return group;
}

function renderLightGuide() {
    svgOverlay.querySelectorAll('.light-guide-group').forEach(g => g.remove());
    const activeWord = wordArray[currentWordIndex];
    if (!activeWord || currentLetterIndex >= activeWord.length) return;

    const { scale, startX, topY } = getLayout(activeWord);

    if (granularity === "letter") {
        const x = startX;
        svgOverlay.appendChild(createLetterGroup(activeWord[currentLetterIndex], x, topY, scale));
    } else {
        let curX = startX;
        for (let i = 0; i < activeWord.length; i++) {
            svgOverlay.appendChild(createLetterGroup(activeWord[i], curX, topY, scale));
            curX += (ORIGINAL_WIDTH + WORD_SPACING) * scale;
        }
    }
}

// --- GSAP ANIMATION ---
function runGsapGuide(char) {
    if (mainTimeline) mainTimeline.kill();
    svgOverlay.querySelectorAll('.gsap-path-container').forEach(p => p.remove());

    const activeWord = wordArray[currentWordIndex];
    const { scale, startX, topY } = getLayout(activeWord);
    
    let letterX = startX;
    if (granularity === "word") {
        letterX = startX + currentLetterIndex * (ORIGINAL_WIDTH + WORD_SPACING) * scale;
    }

    const group = createLetterGroup(char, letterX, topY, scale, false);
    svgOverlay.appendChild(group);

    mainTimeline = gsap.timeline();

    const paths = group.querySelectorAll('path');
    paths.forEach((path, i) => {
        const length = path.getTotalLength();
        gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
        
        mainTimeline.to(path, {
            strokeDashoffset: 0,
            duration: 1.4,
            ease: "sine.inOut"
        }, i * 0.15);
    });
}

// --- SPEECH ---
function speak(text) {
    if (!text) return;
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.9;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
}

function spellCurrentWord() {
    const word = wordArray[currentWordIndex];
    if (!word) return;
    
    speak(word);                    // Spell the full word
    setTimeout(() => speak("Well done!"), 1400);
}

// --- MAIN ENGINE ---
window.startWritingEngine = function() {
    let input = document.getElementById("customTextInput")?.value.trim();
    if (!input) return alert("Enter text first!");

    // Split by whitespace and remove empty entries
    wordArray = input.split(/\s+/).filter(word => word.length > 0);
    
    currentWordIndex = 0;
    currentLetterIndex = 0;
    
    if (wordArray.length === 0) return alert("No valid words found!");
    
    renderCurrentStep();
};

function renderCurrentStep() {
    const activeWord = wordArray[currentWordIndex];
    if (!activeWord) {
        speak("All words completed. Excellent work!");
        return;
    }

    if (currentLetterIndex >= activeWord.length) {
        spellCurrentWord();           // Spell full word at end of each word
        return;
    }

    const char = activeWord[currentLetterIndex];
    speak(char);

    renderLightGuide();

    if (mode === "train") {
        runGsapGuide(char);
    }
}

// --- DRAWING & CONTROLS ---
drawCanvas.addEventListener("pointerdown", (e) => {
    isDrawing = true;
    const rect = drawCanvas.getBoundingClientRect();
    dctx.beginPath();
    dctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
});

drawCanvas.addEventListener("pointermove", (e) => {
    if (!isDrawing) return;
    const rect = drawCanvas.getBoundingClientRect();
    dctx.lineWidth = parseFloat(document.getElementById("strokeWeight")?.value) || 14;
    dctx.lineCap = "round";
    dctx.lineJoin = "round";
    dctx.strokeStyle = mode === "test" ? "#111" : "rgba(30, 64, 175, 0.85)";

    dctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    dctx.stroke();
});

drawCanvas.addEventListener("pointerup", () => {
    isDrawing = false;
    if (granularity === "letter") {
        clearTimeout(autoAdvanceTimer);
        autoAdvanceTimer = setTimeout(window.handleNextStep, 1600);
    }
});

window.handleNextStep = function() {
    const activeWord = wordArray[currentWordIndex];
    if (!activeWord) return;

    if (currentLetterIndex < activeWord.length - 1) {
        currentLetterIndex++;
    } else {
        // Move to next word
        currentWordIndex++;
        currentLetterIndex = 0;
        
        if (currentWordIndex >= wordArray.length) {
            speak("All words completed.");
            clearCanvas();
            return;
        }
        speak("Next word.");
    }

    dctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    points = [];
    renderCurrentStep();
};

window.clearCanvas = function() {
    if (mainTimeline) mainTimeline.kill();
    clearTimeout(autoAdvanceTimer);
    dctx?.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    svgOverlay?.querySelectorAll('.light-guide-group, .gsap-path-container').forEach(el => el.remove());
    points = [];
    document.getElementById("ptCount").innerText = "000";
};

window.triggerAnimation = function() {
    if (wordArray.length > 0) renderCurrentStep();
    else startWritingEngine();
};

// Extra safety functions
window.processAnalysis = () => alert("Analysis coming soon!");
window.downloadSession = () => alert("Session exported.");
window.toggleHeatmap = () => alert("Heatmap feature coming soon.");

console.log("%cLexiNote Engine V5.4 - Multi-word + Case Sensitive + Full Word Spelling", "color:#1e40af; font-weight:bold");
