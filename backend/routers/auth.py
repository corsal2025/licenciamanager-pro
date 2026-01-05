from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from .. import models, schemas, database, logger
from datetime import datetime, timedelta
# Import passlib and jose here, assuming utils for hashing/token will be added or inline for now
from passlib.context import CryptContext
from jose import JWTError, jwt

router = APIRouter(
    tags=["auth"]
)

# Configuration (Move to .env later)
SECRET_KEY = "tu_clave_secreta_super_segura" # CAMBIAR EN PRODUCCION
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/token", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        # LOG: Failed Login
        logger.log_action(db, username=form_data.username, action="LOGIN_FAILED", details="Incorrect password or user not found")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    # LOG: Login
    logger.log_action(db, username=user.username, action="LOGIN", details="User logged in via Token endpoint")

    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/users/", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = get_password_hash(user.password)
    new_user = models.User(
        id=user.username, # Using username as ID for simplicity
        username=user.username,
        hashed_password=hashed_password,
        full_name=user.full_name,
        role=user.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # LOG: Create User
    logger.log_action(db, username="SYSTEM", action="CREATE_USER", details=f"Created user: {user.username}")
    
    return new_user

@router.get("/users/", response_model=list[schemas.UserResponse])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: str = Depends(oauth2_scheme)):
    # Verify admin role (simplified logic, ideally check current_user role)
    # For now we just check if token is valid via Depends(oauth2_scheme)
    users = db.query(models.User).offset(skip).limit(limit).all()
    return users

@router.delete("/users/{username}")
def delete_user(username: str, db: Session = Depends(get_db), current_user: str = Depends(oauth2_scheme)):
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    db.commit()
    
    # LOG: Delete
    logger.log_action(db, username="SYSTEM", action="DELETE_USER", details=f"Deleted user: {username}")
    
    return {"message": "User deleted successfully"}

@router.put("/users/{username}", response_model=schemas.UserResponse)
def update_user(username: str, user_update: schemas.UserUpdate, db: Session = Depends(get_db), current_user: str = Depends(oauth2_scheme)):
    db_user = db.query(models.User).filter(models.User.username == username).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_update.full_name:
        db_user.full_name = user_update.full_name
    
    if user_update.role:
        db_user.role = user_update.role
        
    if user_update.password:
        db_user.hashed_password = get_password_hash(user_update.password)
        
    db.commit()
    db.refresh(db_user)
    
    # LOG: Update
    logger.log_action(db, username=username, action="UPDATE_USER", details="Updated user profile")

    return db_user
