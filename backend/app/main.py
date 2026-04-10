from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-pro') 

app = FastAPI(title="Sakai API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "Sakai Backend is running smoothly!"}

class RouteRequest(BaseModel):
    origin: str
    destination: str
    budget: float
    mode: str  

@app.post("/api/plan-route")
def plan_route(request: RouteRequest):
    prompt = f"""
    You are the Sakai AI route planner for the Philippines.
    A user wants to go from {request.origin} to {request.destination}.
    They have a budget of ₱{request.budget} and prefer '{request.mode}' mode.
    Give a brief, realistic 3-step commute suggestion.
    """
    
    try:
        response = model.generate_content(prompt)
        return {"success": True, "ai_suggestion": response.text}
    except Exception as e:
        return {"success": False, "error": str(e)}