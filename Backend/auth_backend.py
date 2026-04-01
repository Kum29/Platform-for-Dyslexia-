import sqlite3
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from auth_utils import get_password_hash, verify_password, create_access_token

# ================= ROUTER SETUP =================
router = APIRouter(tags=["Authentication"])

def init_db():
    conn = sqlite3.connect("lexinote.db")
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

# Initialize the database when the module is loaded
init_db()

# ================= SCHEMAS =================
class UserSignup(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# ================= ROUTES =================

@router.post("/signup")
async def signup(user: UserSignup):
    conn = sqlite3.connect("lexinote.db")
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM users WHERE email = ?", (user.email,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Email already registered")
        
        hashed_pwd = get_password_hash(user.password)
        cursor.execute(
            "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
            (user.name, user.email, hashed_pwd)
        )
        conn.commit()
        return {"status": "success", "message": "Account created!"}
    finally:
        conn.close()

@router.post("/login")
async def login(user: UserLogin):
    conn = sqlite3.connect("lexinote.db")
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT name, email, password FROM users WHERE email = ?", (user.email,))
        db_user = cursor.fetchone()
        
        if not db_user or not verify_password(user.password, db_user[2]):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # db_user[1] is email, db_user[0] is name
        token = create_access_token({"sub": db_user[1], "name": db_user[0]})
        return {
            "status": "success", 
            "token": token, 
            "userName": db_user[0]
        }
    finally:
        conn.close()