

import os
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import google.generativeai as genai
from fastapi import APIRouter
from faster_whisper import WhisperModel
import whisper
router = APIRouter()
# ── Config ──────────────────────────────────────────────────────────────────
# GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "AIzaSyAv9W10XhhC2UE7ByfOjMQuwCAQteMYUCY")
SAVED_AUDIO_PATH = Path("recorded_audio.webm")   # saved in the same folder as server.py
# genai.configure(api_key=GEMINI_API_KEY)


@router.post("/save-audio")
async def save_audio(audio: UploadFile = File(...)):
    """
    Receives the recorded audio blob from the browser and saves it to disk
    as `recorded_audio.webm` in the current working directory.
    """
    try:
        contents = await audio.read()
        SAVED_AUDIO_PATH.write_bytes(contents)
        return JSONResponse({
            "status": "saved",
            "path": str(SAVED_AUDIO_PATH.resolve()),
            "size_bytes": len(contents)
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save audio: {e}")


model = WhisperModel("base", compute_type="int8")

@router.post("/transcribe")
async def transcribe():
    if not SAVED_AUDIO_PATH.exists():
        raise HTTPException(
            status_code=404,
            detail="No recorded audio found. Please call /save-audio first."
        )
    try:
        model = whisper.load_model("base")
        # 2. Transcribe the audio file
        result = model.transcribe(r"D:\prj\deslexia\LLexiReadFinal\LexiReadFinal\Frontend\Recording (2).m4a")
        print("--- Transcription ---", result["text"])
        return JSONResponse({
            "text": result
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {e}")

# ── Health check ─────────────────────────────────────────────────────────────

# @app.get("/")
# def health():
#     return {"status": "ok", "service": "VoiceShape API"}
