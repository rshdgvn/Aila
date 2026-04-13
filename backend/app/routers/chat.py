from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from .. import models, auth

router = APIRouter(prefix="/api/aila", tags=["Chat"])

class ChatRequest(BaseModel):
    text: str
    current_step: Optional[int] = 0
    total_steps: Optional[int] = 1

@router.post("/chat")
def aila_chat(body: ChatRequest, current_user: models.User = Depends(auth.get_current_user)):
    text = body.text.lower()
    current_step = body.current_step
    total_steps = body.total_steps
    aila_reply = "Hmm, let me think about that..."
    emotion = "thinking" 

    if any(k in text for k in ["malayo pa ba", "far", "malayo"]):
        emotion = "reading-map"
        if total_steps == 1:
          aila_reply = "Medyo malapit na tayo, buddy! Nasa huling stretch na tayo."
        else:
          remaining = total_steps - current_step
          aila_reply = f"May {remaining} steps pa tayo. Kapit lang!" if remaining > 1 else "Malapit na talaga tayo!"
    elif any(k in text for k in ["arrived", "nandito nako", "success", "thanks", "salamat"]):
        emotion = "celebrating"
        aila_reply = "Yay! You arrived! See you next trip!"
    else:
        emotion = "relax"
        aila_reply = "Ingat sa byahe! I'm just here reading the map for us."

    return {"text": aila_reply, "emotion": emotion}