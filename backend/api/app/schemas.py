# schemas.py
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    role: str
    status: str = "pending"
    phone: Optional[str] = None
    location: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    password: Optional[str] = None

class User(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

# New schema for checking if a user exists
class UserCheck(BaseModel):
    email: EmailStr


# Add these schemas to your schemas.py file

from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserUpdate(BaseModel):
    """Schema for updating user profile"""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None

class PasswordChange(BaseModel):
    """Schema for changing password"""
    current_password: str
    new_password: str = Field(..., min_length=6)

class UserResponse(BaseModel):
    """Schema for user response (without sensitive data)"""
    id: int
    email: str
    first_name: str
    last_name: str
    role: str
    status: str
    phone: Optional[str] = None
    location: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True