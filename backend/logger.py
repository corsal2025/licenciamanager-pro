from sqlalchemy.orm import Session
from . import models
import uuid
import time

def log_action(db: Session, username: str, action: str, details: str = None):
    """
    Persists an action to the audit_logs table.
    Does not raise exceptions to avoid breaking the main flow.
    """
    try:
        new_log = models.AuditLog(
            id=str(uuid.uuid4()),
            timestamp=int(time.time()),
            username=username,
            action=action,
            details=details
        )
        db.add(new_log)
        db.commit()
    except Exception as e:
        print(f"❌ Failed to write audit log: {e}")
        # Build robustness: failure to log should not crash the app
        try:
            db.rollback()
        except:
            pass
