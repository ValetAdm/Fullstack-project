# Pydantic models for NY State Patrol API

from pydantic import BaseModel
from datetime import date, time
from typing import Optional


#Driver model
class Driver(BaseModel):
    """Model for reading driver data from database"""
    driver_id: int
    last_name: str
    first_name: str
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    dl_number: str
    licence_state: Optional[str] = None
    birth_date: Optional[date] = None
    height: Optional[str] = None
    weight: Optional[str] = None
    eye_colour: Optional[str] = None


#Vehicle model
class Vehicle(BaseModel):
    """Model for reading vehicle data from database"""
    vehicle_id: int
    vin: str
    make: Optional[str] = None
    colour: Optional[str] = None
    year: Optional[int] = None
    type: Optional[str] = None
    vehicle_licence: Optional[str] = None
    licence_state: Optional[str] = None
    registered_owner_id: Optional[int] = None



#Officer model
class Officer(BaseModel):
    """Model for reading officer data from database"""
    officer_id: int
    officer_name: str
    personal_number: str



#Notice model
class Notice(BaseModel):
    """Model for reading notice data from database"""
    notice_id: int
    violation_date: date
    violation_time: time
    district: Optional[str] = None
    detachment: Optional[str] = None
    location: Optional[str] = None
    violation_description: Optional[str] = None
    vehicle_id: int
    officer_id: int


#Violation model
class Violation(BaseModel):
    """Model for reading violation data from database"""
    violation_id: int
    notice_id: int
    violation_description: Optional[str] = None
    action_taken: Optional[str] = None



class NoticeCreate(BaseModel):
    """Model for creating a new notice (POST)"""
    violation_date: date
    violation_time: time
    district: str
    detachment: str
    location: str
    violation_description: str
    vehicle_id: int
    officer_id: int


class ViolationCreate(BaseModel):
    """Model for creating a new violation (POST)"""
    notice_id: int
    violation_description: str
    action_taken: str



class DriverUpdate(BaseModel):
    """Model for updating driver information (PUT)"""
    last_name: str
    first_name: str
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    dl_number: str
    licence_state: Optional[str] = None
    birth_date: Optional[date] = None
    height: Optional[str] = None
    weight: Optional[str] = None
    eye_colour: Optional[str] = None


class NoticeLocationUpdate(BaseModel):
    """Model for updating notice location (PUT)"""
    location: str


class UserRegister(BaseModel):
    """Model for user registration"""
    username: str
    email: str
    password: str