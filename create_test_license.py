import os
import time
os.environ["DATABASE_URL"] = "postgresql://neondb_owner:npg_VF7muQSwB5Uc@ep-solitary-king-ack0jv1l-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require"

from backend.database import SessionLocal, engine
from backend import models

# Create tables if they don't exist
models.Base.metadata.create_all(bind=engine)

db = SessionLocal()

# Check if test license exists
existing = db.query(models.License).filter(models.License.rut == "11.111.111-1").first()
if existing:
    print(f"License already exists: {existing.full_name}")
else:
    # Create test license
    test_license = models.License(
        id="11.111.111-1",
        rut="11.111.111-1",
        full_name="Juan Pérez González",
        license_number="TEST-001",
        category="B",
        last_control_date="2024-06",
        status="VALID",
        process_status="SUBIDA A CONASET",
        upload_date=int(time.time()),
        uploaded_by="admin",
        is_deleted=False
    )
    db.add(test_license)
    db.commit()
    print(f"Created test license: 11.111.111-1 - Juan Pérez González")

db.close()
