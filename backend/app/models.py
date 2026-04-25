from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String)
    last_name = Column(String)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    profile_picture = Column(String, nullable=True)
    trips = relationship("Trip", back_populates="owner")
    saved_places = relationship("SavedPlace", back_populates="owner")

class Trip(Base):
    __tablename__ = "trips"
    id = Column(Integer, primary_key=True, index=True)
    origin = Column(String)
    destination = Column(String)
    
    origin_lat = Column(Float, nullable=True)
    origin_lng = Column(Float, nullable=True)
    dest_lat = Column(Float, nullable=True)
    dest_lng = Column(Float, nullable=True)
    route_polyline = Column(String, nullable=True)
    
    mode = Column(String)
    distance_km = Column(Float)
    duration_mins = Column(Integer)
    total_fare = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="trips")
    status = Column(String, default="ongoing")

class SavedPlace(Base):
    __tablename__ = "saved_places"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    address = Column(String)
    lat = Column(Float)
    lng = Column(Float)
    user_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="saved_places")