from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .. import models, schemas, database, auth

router = APIRouter(prefix="/api/places", tags=["Saved Places"])

@router.post("/", response_model=schemas.SavedPlaceResponse)
def create_place(place: schemas.SavedPlaceCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    new_place = models.SavedPlace(**place.model_dump(), user_id=current_user.id)
    db.add(new_place)
    db.commit()
    db.refresh(new_place)
    return new_place

@router.get("/", response_model=list[schemas.SavedPlaceResponse])
def get_places(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.SavedPlace).filter(models.SavedPlace.user_id == current_user.id).all()

@router.delete("/{place_id}")
def delete_place(place_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    place = db.query(models.SavedPlace).filter(models.SavedPlace.id == place_id, models.SavedPlace.user_id == current_user.id).first()
    if place:
        db.delete(place)
        db.commit()
    return {"status": "success"}