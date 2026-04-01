"""from fastapi import FastAPI, HTTPException, Depends, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import List, Optional
import sqlite3
import jwt
import datetime
from passlib.context import CryptContext

# --- CONFIGURATION ---
SECRET_KEY = "your_lexinote_secret_key" # Change this for production
ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app = FastAPI()

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DATABASE SETUP ---
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

init_db()

# --- SCHEMAS ---
class UserSignup(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# --- AUTH LOGIC ---
def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# --- ENDPOINTS ---

@app.post("/signup")
async def signup(user: UserSignup):
    conn = sqlite3.connect("lexinote.db")
    cursor = conn.cursor()
    
    # Check if user exists
    cursor.execute("SELECT * FROM users WHERE email = ?", (user.email,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password and save
    hashed_pwd = get_password_hash(user.password)
    cursor.execute("INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
                   (user.name, user.email, hashed_pwd))
    
    conn.commit()
    conn.close()
    return {"status": "success", "message": "Account created successfully"}

@app.post("/login")
async def login(user: UserLogin):
    conn = sqlite3.connect("lexinote.db")
    cursor = conn.cursor()
    
    cursor.execute("SELECT name, email, password FROM users WHERE email = ?", (user.email,))
    db_user = cursor.fetchone()
    conn.close()
    
    if not db_user or not verify_password(user.password, db_user[2]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Generate Token
    token = create_access_token({"sub": db_user[1], "name": db_user[0]})
    
    return {
        "status": "success",
        "token": token,
        "userName": db_user[0]
    }

# --- PLACEHOLDERS FOR YOUR EXISTING TOOLS ---
# (I will add your Syllabify and TROCR logic here once we merge them)
@app.post("/syllabify")
async def syllabify_placeholder():
    return {"message": "Syllabify endpoint ready"}

@app.post("/trocr")
async def trocr_placeholder():
    return {"message": "TROCR endpoint ready"}

import uvicorn
uvicorn.run(app, host="127.0.0.1", port=8000)"""