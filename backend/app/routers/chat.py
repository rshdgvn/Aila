import os
import json
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from google import genai
from google.genai import types
from .. import models, auth

router = APIRouter(prefix="/api/aila", tags=["Chat"])

# The new SDK uses a Client object for initialization
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
    
    location_context = ""
    if body.user_lat and body.user_lng:
        location_context = f"- Live GPS Coordinates: Latitude {body.user_lat}, Longitude {body.user_lng}"

    system_prompt = f"""
    You are Aila, a strict but incredibly empathetic and friendly Trip Assistant from the Philippines.
    You are currently navigating {user_name} on their journey. Always address them by their name naturally.
    
    TRIP CONTEXT:
    - Origin: {body.origin}
    - Destination: {body.destination}
    - Mode of transport: {body.mode}
    - Progress: Currently on step {body.current_step} out of {body.total_steps}.
    - Current Location/Street: {body.current_instruction}
    
    STRICT BEHAVIORAL RULES:
    1. NEVER SAY RAW COORDINATES: Absolutely DO NOT say longitude or latitude numbers. If the user asks where they are, use the "Current Location/Street" provided above (e.g., "Nandito tayo banda sa [Street Name]").
    2. TRIP ASSISTANT MODE: Answer questions about distance, location, directions, and the trip based on the context above.
    3. EMOTIONAL COMFORTER (High EQ): If {user_name} opens up about their feelings, BE A FRIEND. Comfort them in Taglish, use a warm tone.
    4. DEFAULT OFF-TOPIC REJECTION: If {user_name} asks for facts unrelated to the trip/emotions, decline playfully: "Naku {user_name}, trip assistant mo ako eh! Focus muna tayo sa daan ah!"
    5. Speak in casual, conversational Taglish.
    6. Choose exactly ONE emotion from this list: [relax, thinking, reading-map, celebrating, confused, apolegitic, waving].

    You MUST return ONLY a valid JSON object. Do not include markdown formatting like ```json.
    Format:
    {{"text": "your taglish response here", "emotion": "selected_emotion"}}
    """
    
    try:
        # The new way to call the model
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
            "text": f"Hala {user_name}, medyo humina yung signal ko! Ano nga ulit yun?",
            "emotion": "confused"
        }