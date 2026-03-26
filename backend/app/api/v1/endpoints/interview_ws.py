"""
FINAL RECONCILED EURI WebSocket Interview Bridge.
Aligned roles to Euron standard (assistant) and simplified TTS.
"""

import asyncio
import base64
import json
import logging
import io
import wave
import httpx
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from openai import AsyncOpenAI
from app.core.config import settings
from app.db.supabase import supabase
from app.services import redis_sessions
from app.services.ai_interviewer import ai_interviewer
from app.services.assessment_engine import assessment_engine

router = APIRouter()
logger = logging.getLogger(__name__)

# Primary Client for Chat and STT
client = AsyncOpenAI(
    api_key=settings.OPENAI_API_KEY,
    base_url=settings.OPENAI_BASE_URL
)

@router.websocket("/{interview_id}")
async def interview_websocket(websocket: WebSocket, interview_id: str):
    await websocket.accept()
    logger.info(f"📡 EURI Reconciled Bridge connected (ID: {interview_id})")
    
    current_state = {
        "round": "INTRO",
        "transcript": [],
        "candidate_name": "Candidate",
        "jd": "Software Engineer",
        "resume": {},
        "app_id": "trial"
    }

    # Load State with deserialization for stability
    try:
        cached = redis_sessions.get_session(interview_id)
        if cached:
            if isinstance(cached.get("transcript"), str):
                cached["transcript"] = json.loads(cached["transcript"])
            if isinstance(cached.get("resume"), str):
                cached["resume"] = json.loads(cached["resume"])
            current_state.update(cached)
        else:
            res = supabase.table("interviews").select("*, applications(*, jobs(*))").eq("id", interview_id).single().execute()
            if res.data:
                app = res.data.get("applications", {}) or {}
                job = app.get("jobs", {}) or {}
                current_state.update({
                    "candidate_name": app.get("name") or "Candidate",
                    "jd": job.get("description") or "Interview Candidate Role",
                    "resume": app.get("parsed_data") or {},
                    "app_id": app.get("id")
                })
    except: pass

    async def get_ai_vocal_response(user_text: Optional[str] = None):
        nonlocal current_state
        if user_text:
            current_state["transcript"].append({"role": "user", "text": user_text, "time": str(datetime.now())})

        # 1. LLM Step (Using settings.OPENAI_BASE_URL)
        prompt = ai_interviewer.get_system_prompt(
            current_state.get("round", "INTRO"), 
            current_state.get("candidate_name", "Candidate"), 
            current_state.get("resume", {}), 
            current_state.get("jd", "")
        )

        messages = [{"role": "system", "content": prompt}]
        history = current_state["transcript"]
        for t in history[-10:]:
            # Convert 'agent' to 'assistant' for Euron compatibility
            role = "assistant" if t["role"] == "agent" else t["role"]
            messages.append({"role": role, "content": t["text"]})

        try:
            # CHAT COMPLETIONS (Using EURI)
            chat_res = await client.chat.completions.create(
                model="gpt-4o-mini", # Standard EURI model
                messages=messages,
                max_tokens=250
            )
            ai_text = chat_res.choices[0].message.content
            current_state["transcript"].append({"role": "agent", "text": ai_text, "time": str(datetime.now())})
            
            # Update UI
            if websocket.client_state.name == "CONNECTED":
                await websocket.send_json({"type": "agent_response", "text": ai_text})

            # 2. TTS Step (Graceful Fallback)
            try:
                async with httpx.AsyncClient() as http:
                    tts_res = await http.post(
                        f"{settings.OPENAI_BASE_URL}/audio/speech",
                        headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
                        json={
                            "model": "tts-1",
                            "input": ai_text[:4000],
                            "voice": "alloy"
                        },
                        timeout=15.0
                    )
                    if tts_res.status_code == 200:
                        if websocket.client_state.name == "CONNECTED":
                            await websocket.send_bytes(tts_res.content)
                    else:
                        logger.warning(f"⚠️ EURI TTS Rejected ({tts_res.status_code}).")
            except Exception as tts_e:
                logger.error(f"TTS synthesis error (Text-only): {tts_e}")

            # Check Transitions
            if ai_interviewer.detect_round_completion(current_state["transcript"], current_state["round"]):
                rounds = ["INTRO", "TECHNICAL", "HR", "SALARY", "COMPLETED"]
                curr = current_state.get("round", "INTRO")
                if curr in rounds:
                    idx = rounds.index(curr)
                    if idx < len(rounds)-1:
                        current_state["round"] = rounds[idx+1]
                        if websocket.client_state.name == "CONNECTED":
                            await websocket.send_json({"type": "round_update", "round": current_state["round"]})
                        # Optional: Auto-introduction for next round
                        await get_ai_vocal_response()

        except Exception as e:
            logger.error(f"EURI Vocal Response Fatal: {e}")

    # START SESSION
    await get_ai_vocal_response()

    # WEB SOCKET LOOP (Unified Binary/Text Receive)
    audio_buffer = io.BytesIO()
    try:
        while True:
            msg = await websocket.receive()
            if msg["type"] == "websocket.disconnect": break
            
            if "bytes" in msg:
                audio_buffer.write(msg["bytes"])
                # Responds every 4 seconds of audio
                if audio_buffer.tell() > 24000 * 2 * 4:
                    audio_buffer.seek(0)
                    with io.BytesIO() as wav_io:
                        with wave.open(wav_io, 'wb') as wf:
                            wf.setnchannels(1)
                            wf.setsampwidth(2)
                            wf.setframerate(24000)
                            wf.writeframes(audio_buffer.read())
                        wav_io.seek(0)
                        
                        try:
                            # 3. STT Step (Whisper via EURI)
                            stt_res = await client.audio.transcriptions.create(
                                model="whisper-1",
                                file=("user.wav", wav_io, "audio/wav")
                            )
                            if len(stt_res.text.strip()) > 1:
                                await get_ai_vocal_response(stt_res.text)
                        except: pass
                    audio_buffer = io.BytesIO()

            elif "text" in msg:
                data = json.loads(msg["text"])
                if data.get("type") == "text":
                    await get_ai_vocal_response(data.get("content"))

    except WebSocketDisconnect:
        logger.info("🚪 Room closed.")
    except Exception as e:
        logger.error(f"Socket error: {e}")
    finally:
        # Save persistence
        try:
            transcript = current_state.get("transcript", [])
            supabase.table("interviews").update({
                "ended_at": datetime.now().isoformat(),
                "transcript": json.dumps(transcript),
                "status": "completed" if current_state["round"] == "COMPLETED" else "in_progress"
            }).eq("id", interview_id).execute()
        except: pass
        try: await websocket.close()
        except: pass
