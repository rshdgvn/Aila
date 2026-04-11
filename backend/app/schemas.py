from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class UserCreate(BaseModel):
    firstName: str
    lastName: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    firstName: str
    lastName: str
    email: str

class TripCreate(BaseModel):
    origin: str
    destination: str
    mode: str
    distance_km: float
    duration_mins: int
    total_fare: float
    status: Optional[str] = "ongoing"

class TripResponse(TripCreate):
    id: int
    created_at: datetime
    user_id: int
    status: str

    class Config:
        from_attributes = True

class Token(BaseModel):
    token: str
    user: UserResponse