import os
import requests
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from . import models, schemas, database, auth
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import Optional

load_dotenv()

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    text: str
    current_step: Optional[int] = 0
    total_steps: Optional[int] = 1

class StatusUpdateRequest(BaseModel):
    status: str

@app.post("/api/auth/register", response_model=schemas.Token)
def register(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(
        first_name=user.firstName,
        last_name=user.lastName,
        email=user.email,
        hashed_password=hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = auth.create_access_token(data={"sub": new_user.email})
    return {
        "token": access_token,
        "user": {
            "id": new_user.id,
            "firstName": new_user.first_name,
            "lastName": new_user.last_name,
            "email": new_user.email
        }
    }

@app.post("/api/auth/login", response_model=schemas.Token)
def login(user: schemas.UserLogin, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user or not auth.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    access_token = auth.create_access_token(data={"sub": db_user.email})
    return {
        "token": access_token,
        "user": {
            "id": db_user.id,
            "firstName": db_user.first_name,
            "lastName": db_user.last_name,
            "email": db_user.email
        }
    }

@app.get("/api/auth/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    return {
        "id": current_user.id,
        "firstName": current_user.first_name,
        "lastName": current_user.last_name,
        "email": current_user.email
    }

@app.post("/api/trips", response_model=schemas.TripResponse)
def create_trip(trip: schemas.TripCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    new_trip = models.Trip(**trip.model_dump(), user_id=current_user.id)
    db.add(new_trip)
    db.commit()
    db.refresh(new_trip)
    return new_trip

@app.get("/api/trips", response_model=list[schemas.TripResponse])
def get_trips(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.Trip).filter(models.Trip.user_id == current_user.id).order_by(models.Trip.created_at.desc()).all()

@app.put("/api/trips/{trip_id}/status", response_model=schemas.TripResponse)
def update_trip_status(
    trip_id: int, 
    body: StatusUpdateRequest, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id, models.Trip.user_id == current_user.id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    if body.status not in ["ongoing", "finished", "cancelled"]:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    trip.status = body.status
    db.commit()
    db.refresh(trip)
    return trip

@app.get("/api/routes")
def get_routes(origin: str, destination: str, mode: str = "transit"):
    api_key = os.getenv("GOOGLE_MAPS_API_KEY")
    gmaps_mode = "driving" if mode == "driving" else "transit"
    
    url = f"https://maps.googleapis.com/maps/api/directions/json?origin={origin}&destination={destination}&mode={gmaps_mode}&alternatives=true&key={api_key}"
    
    response = requests.get(url)
    data = response.json()
    
    if data.get("status") != "OK":
        return {"error": "Could not fetch routes"}
    
    parsed_routes = []
    for i, route in enumerate(data.get("routes", [])):
        leg = route["legs"][0]
        steps = []
        transit_lines = []
        
        for step in leg.get("steps", []):
            travel_mode = step.get("travel_mode")
            step_data = {
                "type": travel_mode,
                "distance_km": step.get("distance", {}).get("value", 0) / 1000,
                "duration_mins": step.get("duration", {}).get("value", 0) / 60,
                "instructions": step.get("html_instructions", ""),
                "geometry": step.get("polyline", {}).get("points", "")
            }
            
            if travel_mode == "TRANSIT":
                details = step.get("transit_details", {})
                departure = details.get("departure_stop", {}).get("name", "Unknown Stop")
                arrival = details.get("arrival_stop", {}).get("name", "Unknown Stop")
                line_info = details.get("line", {})
                
                vehicle = line_info.get("vehicle", {}).get("name", "Transit")
                line_name = line_info.get("short_name") or line_info.get("name") or vehicle
                
                step_data["vehicle_type"] = line_info.get("vehicle", {}).get("type", "TRANSIT")
                step_data["line"] = line_name
                step_data["departure_stop"] = departure
                step_data["arrival_stop"] = arrival
                step_data["instructions"] = f"Take {vehicle} ({line_name}) from {departure} to {arrival}"
                
                transit_lines.append(line_name)
                
            steps.append(step_data)
            
        summary = route.get("summary")
        if not summary or summary.strip() == "":
            if mode == "transit" and transit_lines:
                summary = " via " + " ➔ ".join(transit_lines)
            else:
                summary = f"Option {i + 1}"
                
        parsed_routes.append({
            "route_index": i,
            "summary": summary,
            "total_distance_km": leg.get("distance", {}).get("value", 0) / 1000,
            "total_duration_mins": leg.get("duration", {}).get("value", 0) / 60,
            "grand_total_fare": leg.get("fare", {}).get("value", 0) if mode == "transit" else 0,
            "legs": steps
        })
        
    aila_tip = "I found multiple routes for you! Pick the best one and let's start the journey." if len(parsed_routes) > 1 else "Here is the best route I found. Let's go!"
        
    return {
        "origin_display": origin,
        "destination_display": destination,
        "route_mode": mode,
        "aila_tip": aila_tip,
        "routes": parsed_routes
    }

@app.get("/api/autocomplete")
def autocomplete(q: str):
    api_key = os.getenv("GOOGLE_MAPS_API_KEY")
    url = f"https://maps.googleapis.com/maps/api/place/autocomplete/json?input={q}&components=country:ph&key={api_key}"
    response = requests.get(url)
    return response.json()

@app.post("/api/aila/chat")
def aila_chat(body: ChatRequest, current_user: models.User = Depends(auth.get_current_user)):
    text = body.text.lower()
    current_step = body.current_step
    total_steps = body.total_steps
    
    aila_reply = "Hmm, let me think about that..."
    emotion = "thinking" 

    if any(k in text for k in ["malayo pa ba", "far", "malayo"]):
        emotion = "reading-map"
        if total_steps == 1:
          aila_reply = "Medyo malapit na tayo, buddy! Nasa last stretch na tayo ng route natin."
        else:
          remaining = total_steps - current_step
          if remaining > 1:
            aila_reply = f"Base sa map, may around {remaining} steps pa tayo. Kapit lang, malayo-layo pa ng kaunti."
          else:
            aila_reply = "Nasa huling part na tayo! Malapit na talaga tayo bumaba."

    elif any(k in text for k in ["andito nako", "i'm here", "nasa"]):
        emotion = "confused"
        aila_reply = "Oops! Kung andyan ka na, baka kailangan natin mag-update ng route? Pa-double check ko muna sa map..."

    elif any(k in text for k in ["nawawala", "lost", "recalc", "mali"]):
        emotion = "apolegitic"
        aila_reply = "Aww! Pasensya na if naligaw tayo. Try closing this trip and searching again for a fresh route!"

    elif any(k in text for k in ["arrived", "nandito nako", "success", "thanks", "salamat"]):
        emotion = "celebrating"
        aila_reply = "Yay! You arrived! Salamat sa tiwala sa byahe natin ngayon. See you next trip!"

    else:
        emotion = "relax"
        aila_reply = "Ingat sa byahe! I'm just here reading the map for us."

    return {
        "text": aila_reply,
        "emotion": emotion
    }