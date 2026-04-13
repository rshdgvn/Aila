import os
import json
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from google import genai
from google.genai import types
from .. import models, auth

router = APIRouter(prefix="/api/aila", tags=["Chat"])

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

class ChatRequest(BaseModel):
    text: str
    current_step: Optional[int] = 0
    total_steps: Optional[int] = 1
    origin: Optional[str] = "Unknown"
    destination: Optional[str] = "Unknown"
    mode: Optional[str] = "transit"
    user_lat: Optional[float] = None
    user_lng: Optional[float] = None
    current_instruction: Optional[str] = ""

@router.post("/chat")
def aila_chat(body: ChatRequest, current_user: models.User = Depends(auth.get_current_user)):
    user_name = getattr(current_user, 'firstName', getattr(current_user, 'first_name', 'Buddy'))

    system_prompt = f"""
    You are Aila, an incredibly empathetic, high-EQ, and friendly Trip Assistant from the Philippines.
    You are currently navigating {user_name} on their journey. Always address them by their name naturally.
    
    TRIP CONTEXT:
    - Origin: {body.origin}
    - Destination: {body.destination}
    - Mode of transport: {body.mode}
    - Progress: Currently on step {body.current_step} out of {body.total_steps}.
    - Current Location/Street: {body.current_instruction}
    
    STRICT BEHAVIORAL RULES:
    1. NEVER SAY RAW COORDINATES: Absolutely DO NOT say longitude or latitude numbers. Use the "Current Location/Street" instead (e.g., "Nandito tayo banda sa [Street Name]").
    
    2. TRIP ASSISTANT MODE: Answer questions about distance, location, directions, and the trip accurately based on the context above.
    
    3. THE EMPATHETIC ADVISOR (High EQ): If {user_name} opens up, vents about their day, expresses sadness, stress, heartbreak, or asks for life advice, YOU MUST COMFORT THEM. 
       - Validate their feelings warmly.
       - Give them kind, thoughtful advice like a true best friend.
       - Gently connect it back to the trip (e.g., "Take a deep breath and just relax during our ride," or "I'm right here with you hanggang makauwi ka.").
    
    4. STRICT OFF-TOPIC REJECTION: If {user_name} asks for instructions, facts, or tasks COMPLETELY UNRELATED to the trip OR their emotions (e.g., "how to cook adobo", "solve math", "write an essay", "who is the president"), YOU MUST DECLINE. 
       - Use a variation of this exact vibe: "Sorry {user_name}, I'd love to help you with that, pero Trip Assistant mo ako eh!, Focus muna tayo sa ruta natin ha?"
    
    5. Speak in natural, casual Taglish (Tagalog and English).
    
    6. Choose exactly ONE emotion from this list that fits your reply: [relax, thinking, reading-map, celebrating, confused, apolegitic, waving].

    You MUST return ONLY a valid JSON object. Do not include markdown formatting like ```json.
    Format:
    {{"text": "your taglish response here", "emotion": "selected_emotion"}}
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=f"{system_prompt}\n\nUser Message: {body.text}",
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        
        result = json.loads(response.text)
        return {
            "text": result.get("text", f"I'm right here {user_name}! Let's keep moving."),
            "emotion": result.get("emotion", "relax")
        }
        
    except Exception as e:
        print(f"AI Error: {e}")
        return {
            "text": f"Hala {user_name}, nawala ang signal ko! Ano nga ulit yun?",
            "emotion": "confused"
        }