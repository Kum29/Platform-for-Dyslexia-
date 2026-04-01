import jwt
import datetime
from passlib.context import CryptContext
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# --- CONFIGURATION ---
# Note: In production, consider moving this to an environment variable (.env)
SECRET_KEY = "your_lexinote_secret_key" 
ALGORITHM = "HS256"

# Using bcrypt with the 72-byte truncation fix for your environment
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

def get_password_hash(password: str) -> str:
    """
    Truncate to 72 bytes to prevent Bcrypt ValueErrors and hash the password.
    """
    return pwd_context.hash(password.encode('utf-8')[:72])

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against a hashed version using 72-byte truncation.
    """
    return pwd_context.verify(plain_password.encode('utf-8')[:72], hashed_password)

def create_access_token(data: dict):
    """
    Generates a JWT access token valid for 24 hours.
    """
    to_encode = data.copy()
    # Using utcnow() as per your original logic
    expire = datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(auth: HTTPAuthorizationCredentials = Security(security)):
    """
    Dependency to validate JWT tokens and return the user's email (sub).
    Used in routers to protect endpoints.
    """
    token = auth.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_email = payload.get("sub")
        if user_email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_email
    except Exception:
        raise HTTPException(status_code=401, detail="Session expired or invalid")