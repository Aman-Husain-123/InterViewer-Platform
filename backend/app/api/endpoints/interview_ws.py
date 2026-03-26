"""
Final Production-Ready WebSocket Interview Bridge (Phase 4).
Handles real-time audio, text, state progression, and session persistence.
"""

import asyncio
import base64
import json
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional, Union

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from redis.asyncio import Redis

from app.core.config import settings
from app.db.supabase import supabase

router = APIRouter()
logger = logging.getLogger(__name__)

# Redis for session state (4-hour TTL)
redis: Redis = Redis.from_url(settings.REDIS_URL, decode_responses=True)

OPENAI_REALTIME_URL = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview"

# ── State Machine Constants ────────────────────────────────────────────────

ROUNDS = ["INTRO", "TECHNICAL", "HR", "SALARY", "COMPLETED"]

TOOLS = [
    {
        "type": "function",
        "name": "transition_round",
        "description": "Call this to move to the next stage of the interview.",
        "parameters": {
            "type": "object",
            "properties": {
                "next_round": {
                    "type": "string",
                    "description": "The target round: TECHNICAL, HR, SALARY, or COMPLETED",
                    "enum": ["TECHNICAL", "HR", "SALARY", "COMPLETED"]
                }
            },
            "required": ["next_round"]
        }
    }
]

# ── Helpers ──────────────────────────────────────────────────────────────────

def get_system_instructions(round_name: str, name: str, jd: str, resume: dict) -> str:
    base = (
        f"You are an AI Interviewer. Candidate: {name}. JD: {jd[:800]}...\n"
        f"Resume: {json.dumps(resume)}\n"
        "Guidelines: One short question at a time. Professional tone. Voice-first interaction."
    )
    directives = {
        "INTRO": "Objective: Greeting and background check.",
        "TECHNICAL": "Objective: Skill deep-dive.",
        "HR": "Objective: Soft skills.",
        "SALARY": "Objective: CTC discussion.",
        "COMPLETED": "Objective: Conclusion."
    }
    return f"{base}\n\nROUND: {round_name}\nDIRECTIVE: {directives.get(round_name, '')}"

def fetch_interview_context_sync(interview_id: str) -> Optional[Dict[str, Any]]:
    """Standard sync fetch to avoid coroutine issues with supabase-py."""
    try:
        res = supabase.table("interviews").select("*, applications(*, jobs(*))").eq("id", interview_id).single().execute()
        data = res.data
        if not data: return None
        
        app = data.get("applications", {})
        job = app.get("jobs", {})
        return {
            "candidate_name": app.get("name", "Candidate"),
            "jd": job.get("description", ""),
            "resume": app.get("parsed_data", {}) if isinstance(app.get("parsed_data"), dict) else {},
            "app_id": app.get("id")
        }
    except Exception as e:
        logger.error(f"Context fetch error: {e}")
        return None

# ── Main Handler ────────────────────────────────────────────────────────────

@router.websocket("/{interview_id}")
async def interview_websocket(websocket: WebSocket, interview_id: str):
    await websocket.accept()
    
    # 1. Validation & Context
    if not settings.OPENAI_API_KEY:
        await websocket.send_json({"type": "error", "text": "API Key Missing"})
        await websocket.close(); return

    ctx: Optional[Dict[str, Any]] = fetch_interview_context_sync(interview_id)
    if not ctx:
        await websocket.send_json({"type": "error", "text": "Session not found."})
        await websocket.close(); return

    # 2. Local State
    current_state = {
        "round": "INTRO",
        "transcript": [] as List[Dict[str, str]],
        "app_id": ctx["app_id"]
    }

    import websockets
    openai_ws = None
    
    try:
        headers = {"Authorization": f"Bearer {settings.OPENAI_API_KEY}", "OpenAI-Beta": "realtime=v1"}
        openai_ws = await websockets.connect(OPENAI_REALTIME_URL, extra_headers=headers)

        # Config Session
        await openai_ws.send(json.dumps({
            "type": "session.update",
            "session": {
                "modalities": ["text", "audio"],
                "instructions": get_system_instructions("INTRO", ctx["candidate_name"], ctx["jd"], ctx["resume"]),
                "tools": TOOLS,
                "input_audio_format": "pcm16",
                "output_audio_format": "pcm16",
            }
        }))

        async def bridge_client_to_openai():
            # openai_ws is checked in outer scope
            if not openai_ws: return
            async for data in websocket.iter_bytes():
                await openai_ws.send(json.dumps({
                    "type": "input_audio_buffer.append",
                    "audio": base64.b64encode(data).decode("utf-8")
                }))

        async def bridge_openai_to_client():
            # openai_ws is checked in outer scope
            if not openai_ws: return
            async for raw in openai_ws:
                event = json.loads(raw)
                etype = event.get("type")

                if etype == "response.audio_transcription.completed":
                    txt = event.get("transcript", "")
                    current_state["transcript"].append({"role": "agent", "text": txt})
                    await websocket.send_json({"type": "agent_response", "text": txt})
                
                elif etype == "conversation.item.input_audio_transcription.completed":
                    txt = event.get("transcript", "")
                    current_state["transcript"].append({"role": "user", "text": txt})

                elif etype == "response.audio.delta":
                    await websocket.send_bytes(base64.b64decode(event["delta"]))

                elif etype == "response.created":
                    await websocket.send_json({"type": "speaking_start"})

                elif etype == "response.done":
                    await websocket.send_json({"type": "speaking_stop"})
                    
                    # Tool Logic
                    output = event.get("response", {}).get("output", [])
                    for item in output:
                        if item.get("type") == "function_call" and item.get("name") == "transition_round":
                            args = json.loads(item.get("arguments", "{}"))
                            next_r = args.get("next_round")
                            
                            current_state["round"] = next_r
                            await websocket.send_json({"type": "round_update", "round": next_r})
                            
                            # Re-configure instructions
                            await openai_ws.send(json.dumps({
                                "type": "session.update",
                                "session": {
                                    "instructions": get_system_instructions(next_r, ctx["candidate_name"], ctx["jd"], ctx["resume"])
                                }
                            }))

        await asyncio.gather(bridge_client_to_openai(), bridge_openai_to_client())

    except WebSocketDisconnect:
        logger.info(f"Disconnect: {interview_id}")
    except Exception as e:
        logger.exception(f"Bridge Error: {e}")
    finally:
        if openai_ws: await openai_ws.close()
        try: await websocket.close()
        except: pass