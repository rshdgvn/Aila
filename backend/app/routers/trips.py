from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from .. import models, schemas, database, auth

router = APIRouter(prefix="/api/trips", tags=["Trips"])

class StatusUpdateRequest(BaseModel):
    status: str

@router.post("/", response_model=schemas.TripResponse)
def create_trip(trip: schemas.TripCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    new_trip = models.Trip(**trip.model_dump(), user_id=current_user.id)
    db.add(new_trip)
    db.commit()
    db.refresh(new_trip)
    return new_trip

@router.get("/", response_model=list[schemas.TripResponse])
def get_trips(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.Trip).filter(models.Trip.user_id == current_user.id).order_by(models.Trip.created_at.desc()).all()

@router.put("/{trip_id}/status", response_model=schemas.TripResponse)
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