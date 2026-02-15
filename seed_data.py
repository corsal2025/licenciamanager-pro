from backend.database import SessionLocal, engine, Base
from backend import models
from passlib.context import CryptContext

# Create DB tables if they don't exist
Base.metadata.create_all(bind=engine)

db = SessionLocal()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_initial_user():
    username = "admin"
    password = "admin123" # Default password
    
    existing_user = db.query(models.User).filter(models.User.username == username).first()
    if existing_user:
        print(f"User '{username}' already exists.")
        return

    hashed_password = pwd_context.hash(password)
    user = models.User(
        id=username,
        username=username,
        full_name="Administrador Principal",
        hashed_password=hashed_password,
        role=models.UserRole.ADMIN
    )
    db.add(user)
    db.commit()
    print(f"Created user: {username} / {password}")

if __name__ == "__main__":
    create_initial_user()
    db.close()
