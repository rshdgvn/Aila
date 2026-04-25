from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .. import models, schemas, database, auth

router = APIRouter(prefix="/api/users", tags=["Users"])

@router.put("/profile", response_model=schemas.UserResponse)
def update_profile(profile: schemas.UserUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if profile.firstName is not None:
        current_user.first_name = profile.firstName
    if profile.lastName is not None:
        current_user.last_name = profile.lastName
    if profile.profile_picture is not None:
        current_user.profile_picture = profile.profile_picture
        
    db.commit()
    db.refresh(current_user)
    
    return {
        "id": current_user.id,
        "firstName": current_user.first_name,
        "lastName": current_user.last_name,
        "email": current_user.email,
        "profile_picture": current_user.profile_picture
    }