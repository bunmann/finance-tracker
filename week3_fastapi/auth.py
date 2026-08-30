# ============================================================================
# File: auth.py
# Description: Performs password hashing/verification using raw bcrypt.
#              Generates JWT access tokens for authenticated sessions and
#              implements the get_current_user FastAPI dependency.
# ============================================================================
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db
import models
import bcrypt

# ====== Configuration ======
import os
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-this-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
ABSOLUTE_SESSION_EXPIRE_HOURS = 12  # 12-hour maximum daily session hard cap

# ====== Password Hashing ======
def hash_password(password: str) -> str:
    """Convert a plain password into a bcrypt hash."""
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed_pwd = bcrypt.hashpw(pwd_bytes, salt)
    return hashed_pwd.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Check if a plain password matches a stored hash."""
    pwd_bytes = plain_password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(pwd_bytes, hashed_bytes)

# ====== JWT Token Creation ======
def create_access_token(data: dict, login_ts: Optional[float] = None) -> str:
    """Create a JWT token with an expiration time and immutable login timestamp."""
    to_encode = data.copy()
    now_utc = datetime.now(timezone.utc)
    expire = now_utc + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # If this is the initial login, stamp the exact login epoch time
    if login_ts is None:
        login_ts = now_utc.timestamp()
        
    to_encode.update({
        "exp": expire,
        "login_ts": login_ts
    })
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# ====== Token Verification (Dependency) ======
security = HTTPBearer()

def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Extract and verify the user from a JWT token, enforcing absolute daily hard caps."""
    credentials_exception = HTTPException(
        status_code=401,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    token = credentials.credentials
    try:
        # Decode the token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        login_ts = payload.get("login_ts")
        
        if user_id is None:
            raise credentials_exception
            
        now_ts = datetime.now(timezone.utc).timestamp()
        
        # Enforce 12-hour absolute session hard cap (`May not roll continuously across days`)
        if login_ts is not None and (now_ts - float(login_ts)) >= (ABSOLUTE_SESSION_EXPIRE_HOURS * 3600):
            raise HTTPException(
                status_code=401,
                detail="Your 12-hour maximum daily session has expired. Please log in again for security.",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        # Check if sliding token renewal is needed (`< 15 mins remaining on current 1-hour token`)
        exp_ts = payload.get("exp")
        if exp_ts and (float(exp_ts) - now_ts) < 900:
            request.state.needs_token_refresh = True
            request.state.token_payload = payload
            
    except JWTError:
        raise credentials_exception

    # Look up the user in the database
    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception

    return user
