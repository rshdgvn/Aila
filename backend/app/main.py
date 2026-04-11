from fastapi import FastAPI, Query, HTTPException, Depends, Request, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, validator
import requests
import os
import jwt
import time
import bcrypt
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

USERS_DB: dict[str, dict] = {} 

from .router import calculate_fare_logic, filter_routes_by_mode

app = FastAPI(title="Aila PH Transit API 2026", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "your-google-maps-api-key-here")
JWT_SECRET = os.getenv("JWT_SECRET", "aila-change-this-in-production-please")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 72


class RegisterRequest(BaseModel):
    firstName: str
    lastName: str
    email: EmailStr
    password: str

    @validator("password")
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @validator("firstName", "lastName")
    def name_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Name cannot be empty")
        return v.strip()


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


def create_jwt(user: dict) -> str:
    payload = {
        "sub": user["id"],
        "email": user["email"],
        "firstName": user["firstName"],
        "lastName": user["lastName"],
        "iat": int(time.time()),
        "exp": int(time.time()) + JWT_EXPIRY_HOURS * 3600,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_jwt(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired. Please log in again.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token.")


def get_current_user(request: Request) -> dict:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required.")
    return decode_jwt(auth.split(" ", 1)[1])


@app.post("/api/auth/register", status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest):
    email_key = body.email.lower()
    if email_key in USERS_DB:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    hashed = bcrypt.hashpw(body.password.encode(), bcrypt.gensalt()).decode()
    user_id = f"user_{int(time.time() * 1000)}"

    user = {
        "id": user_id,
        "firstName": body.firstName,
        "lastName": body.lastName,
        "email": email_key,
        "hashed_password": hashed,
        "created_at": int(time.time()),
    }
    USERS_DB[email_key] = user
    token = create_jwt(user)

    return {
        "token": token,
        "user": {
            "id": user_id,
            "firstName": body.firstName,
            "lastName": body.lastName,
            "email": email_key,
        },
    }


@app.post("/api/auth/login")
def login(body: LoginRequest):
    email_key = body.email.lower()
    user = USERS_DB.get(email_key)

    if not user or not bcrypt.checkpw(body.password.encode(), user["hashed_password"].encode()):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    token = create_jwt(user)
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "firstName": user["firstName"],
            "lastName": user["lastName"],
            "email": user["email"],
        },
    }


@app.get("/api/auth/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["sub"],
        "firstName": current_user["firstName"],
        "lastName": current_user["lastName"],
        "email": current_user["email"],
    }


def map_vehicle(google_vehicle_type: str, line_name: str, route_mode: str = "balanced") -> str:
    v = google_vehicle_type.upper()
    line = (line_name or "").upper()

    if any(kw in v for kw in ["RAIL", "TRAIN", "TRAM", "SUBWAY", "METRO"]):
        if "LRT" in line and ("1" in line or "LINE 1" in line):
            return "train.LRT1"
        if "LRT" in line and ("2" in line or "LINE 2" in line):
            return "train.LRT2"
        return "train.MRT3"

    if "BUS" in v:
        if "CAROUSEL" in line or "EDSA" in line:
            return "bus.edsa_carousel"
        if route_mode == "komportable" and ("P2P" in line or "POINT" in line):
            return "bus.p2p"
        if any(k in line for k in ["PROVINCIAL", "VICTORY", "GENESIS", "FIVE STAR", "JAC", "PARTAS"]):
            return "bus.provincial_ordinary"
        if "AIRCON" in line or "AIRCONDITIONED" in line:
            return "bus.aircon"
        return "bus.ordinary"

    if any(kw in v for kw in ["SHARE_TAXI", "TAXI", "VAN"]):
        if route_mode == "komportable":
            return "tnvs.grab_car"
        if route_mode == "mabilis":
            return "motorcycle_taxi.angkas"
        return "fx_uv.regular"

    return "jeepney.modern" if route_mode == "mabilis" else "jeepney.traditional"


def resolve_place_name(location_str: str) -> str:
    parts = location_str.strip().split(",")
    try:
        lat, lng = float(parts[0]), float(parts[1])
    except (ValueError, IndexError):
        return location_str
    try:
        r = requests.get(
            "https://maps.googleapis.com/maps/api/geocode/json",
            params={"latlng": f"{lat},{lng}", "key": GOOGLE_MAPS_API_KEY},
            timeout=5,
        )
        data = r.json()
        if data.get("status") == "OK" and data.get("results"):
            for res in data["results"]:
                for comp in res.get("address_components", []):
                    if "locality" in comp.get("types", []):
                        return comp["long_name"]
            return data["results"][0].get("formatted_address", location_str)
    except Exception:
        pass
    return location_str


@app.get("/api/routes")
def get_routes(
    origin: str,
    destination: str,
    user_type: str = "regular",
    route_mode: str = "balanced"
):
    valid_modes = {"tipid", "mabilis", "komportable", "balanced"}
    if route_mode not in valid_modes:
        raise HTTPException(400, detail=f"route_mode must be one of {valid_modes}")

    origin_display = resolve_place_name(origin)
    dest_display = resolve_place_name(destination)

    resp = requests.get(
        "https://maps.googleapis.com/maps/api/directions/json",
        params={
            "origin": origin,
            "destination": destination,
            "mode": "transit",
            "alternatives": "true",
            "language": "en",
            "departure_time": "now",
            "key": GOOGLE_MAPS_API_KEY,
        },
        timeout=10,
    )
    data = resp.json()
    status_code = data.get("status")

    if status_code != "OK":
        error_msg = data.get("error_message", "")
        if status_code == "ZERO_RESULTS":
            return {"error": "Wala akong nakitang transit route dyan. Try mo ng mas specific na lugar name!"}
        return {"error": f"Maps error ({status_code}): {error_msg}"}

    all_routes = []
    for idx, route in enumerate(data.get("routes", [])):
        leg = route["legs"][0]
        legs_out = []
        total_fare = 0.0

        for step in leg.get("steps", []):
            mode = step["travel_mode"]
            dist_km = step["distance"]["value"] / 1000
            dur_mins = step["duration"]["value"] / 60
            geom = step["polyline"]["points"]

            if mode == "WALKING":
                instr = step.get("html_instructions", "Walk")
                for tag in ["<b>", "</b>", "<div>", "</div>", "<wbr/>"]:
                    instr = instr.replace(tag, " ")
                legs_out.append({
                    "type": "WALKING", "instructions": instr.strip(),
                    "distance_km": round(dist_km, 2), "duration_mins": round(dur_mins),
                    "fare": 0.0, "geometry": geom,
                })
            elif mode == "TRANSIT":
                t = step.get("transit_details", {})
                line_info = t.get("line", {})
                veh = line_info.get("vehicle", {})
                g_type = veh.get("type", "BUS")
                line_name = line_info.get("short_name") or line_info.get("name", "Transit")
                aila_mode = map_vehicle(g_type, line_name, route_mode)
                fare = calculate_fare_logic(dist_km, aila_mode, user_type)
                total_fare += fare
                legs_out.append({
                    "type": "TRANSIT",
                    "vehicle_type": g_type,
                    "aila_mode": aila_mode,
                    "line": line_name,
                    "line_color": line_info.get("color", "#1B2F6E"),
                    "headsign": t.get("headsign", ""),
                    "origin": t.get("departure_stop", {}).get("name", "—"),
                    "destination": t.get("arrival_stop", {}).get("name", "—"),
                    "num_stops": t.get("num_stops", 0),
                    "distance_km": round(dist_km, 2),
                    "duration_mins": round(dur_mins),
                    "fare": fare,
                    "geometry": geom,
                })

        all_routes.append({
            "route_index": idx,
            "summary": route.get("summary", f"Route {idx + 1}"),
            "origin_name": leg.get("start_address", origin_display),
            "destination_name": leg.get("end_address", dest_display),
            "grand_total_fare": round(total_fare, 2),
            "total_distance_km": round(leg["distance"]["value"] / 1000, 2),
            "total_duration_mins": round(leg["duration"]["value"] / 60),
            "legs": legs_out,
        })

    sorted_routes = filter_routes_by_mode(all_routes, route_mode)

    aila_tips = {
        "tipid": "Pinili ko ang pinakamurang ruta para sa'yo!",
        "mabilis": "Bilis! Ito ang pinakamabilis na daan!",
        "komportable": "Komportable at kaunting transfer lang.",
        "balanced": "Best of both worlds — okay oras, okay presyo!",
    }

    return {
        "origin_display": origin,
        "destination_display": destination,
        "user_type": user_type,
        "route_mode": route_mode,
        "aila_tip": aila_tips.get(route_mode, ""),
        "routes": sorted_routes,
    }


@app.get("/api/autocomplete")
def autocomplete(q: str = Query(..., min_length=2)):
    r = requests.get(
        "https://maps.googleapis.com/maps/api/place/autocomplete/json",
        params={"input": q, "components": "country:ph", "key": GOOGLE_MAPS_API_KEY},
        timeout=5,
    )
    data = r.json()
    if data.get("status") != "OK":
        return {"suggestions": []}
    return {
        "suggestions": [
            {"description": p["description"], "place_id": p["place_id"]}
            for p in data.get("predictions", [])
        ]
    }