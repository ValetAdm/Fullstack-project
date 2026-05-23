# FastAPI application connecting to ny_patrol_db MySQL database
import bcrypt
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import FastAPI, HTTPException, Depends
from typing import List
from jose import JWTError, jwt
from datetime import datetime, timedelta
import MySQLdb
from database import get_connection
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from models import (
    Driver, Vehicle, Officer, Notice, Violation,
    NoticeCreate, ViolationCreate,
    DriverUpdate, NoticeLocationUpdate,
    UserRegister
)



# JWT Configuration
SECRET_KEY = "ny-patrol-secret-key-2025"  
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30


# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

security = HTTPBearer()

# Create the app
app = FastAPI(title="NY State Patrol API")

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "NY State Patrol API is running"}



def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash using bcrypt directly"""
    return bcrypt.checkpw(
        plain_password.encode('utf-8'), 
        hashed_password.encode('utf-8')
    )


def create_access_token(data: dict):
    """Create a JWT access token"""
    # Check if data is provided
    if not data:
        raise ValueError("Data cannot be empty")
    
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    
    # Encode token
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    # Make sure token was created
    if not encoded_jwt:
        raise Exception("Failed to create token")
    
    return encoded_jwt



@app.get("/notices/recent")
def get_recent_notices():
    """
    Get the 50 most recent notices with driver, vehicle, and officer details.
    Based on Workshop 11 GET /books-db approach with JOIN queries.
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    # Complex JOIN query from Assessment 1 (Query #1)
    query = """
        SELECT 
            n.notice_id,
            d.last_name AS driver_surname,
            d.first_name AS driver_name,
            v.make AS car_make,
            v.year AS car_year,
            n.violation_date,
            n.location,
            o.officer_name AS issuing_officer
        FROM notice n
        INNER JOIN vehicle v ON n.vehicle_id = v.vehicle_id
        INNER JOIN driver d ON v.registered_owner_id = d.driver_id
        INNER JOIN officer o ON n.officer_id = o.officer_id
        ORDER BY n.violation_date DESC
        LIMIT 50
    """
    
    cursor.execute(query)
    results = cursor.fetchall()
    cursor.close()
    conn.close()
    
    # Convert to list of dictionaries
    notices = []
    for row in results:
        notices.append({
            "notice_id": row[0],
            "driver_surname": row[1],
            "driver_name": row[2],
            "car_make": row[3],
            "car_year": row[4],
            "violation_date": str(row[5]),  # Convert date to string
            "location": row[6],
            "issuing_officer": row[7]
        })
    
    return {"notices": notices, "count": len(notices)}


@app.get("/drivers/{driver_id}/violations")
def get_driver_violations(driver_id: int):
    """
    Get all violations for a specific driver by driver ID.
    Shows driver info, their vehicles, and all notices.
    """
    # Connect to database
    conn = get_connection()
    cursor = conn.cursor()
    
    # Check if driver exists in database
    cursor.execute("SELECT * FROM driver WHERE driver_id = %s", (driver_id,))
    driver = cursor.fetchone()
    
    # If driver not found, return 404 error
    if driver is None:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Driver not found")
    
    # Query to get all violations - using JOINs from Assessment 1
    query = """
        SELECT 
            n.notice_id,
            v.make,
            v.vehicle_licence,
            n.violation_date,
            n.location,
            n.violation_description,
            viol.action_taken,
            o.officer_name
        FROM driver d
        INNER JOIN vehicle v ON d.driver_id = v.registered_owner_id
        INNER JOIN notice n ON v.vehicle_id = n.vehicle_id
        LEFT JOIN violation viol ON n.notice_id = viol.notice_id
        INNER JOIN officer o ON n.officer_id = o.officer_id
        WHERE d.driver_id = %s
        ORDER BY n.violation_date DESC
    """
    
    cursor.execute(query, (driver_id,))
    violation_rows = cursor.fetchall()
    
    # Close database connection
    cursor.close()
    conn.close()
    
    # Create response dictionary
    # driver[0] is driver_id, driver[1] is last_name, driver[2] is first_name
    driver_name = driver[2] + " " + driver[1]  # first name + last name
    
    result = {
        "driver_id": driver[0],
        "name": driver_name,
        "dl_number": driver[7],
        "violations": []
    }
    
    # Loop through all violations and add to result
    # TODO: this could be slow with many violations
    for violation in violation_rows:
        violation_dict = {
            "notice_id": violation[0],
            "vehicle_make": violation[1],
            "vehicle_plate": violation[2],
            "violation_date": str(violation[3]),  # Convert date to string
            "location": violation[4],
            "description": violation[5],
            "action_taken": violation[6],
            "officer": violation[7]
        }
        result["violations"].append(violation_dict)
    
    # Count total violations
    total = len(result["violations"])
    result["total_violations"] = total
    
    return result



@app.get("/vehicles/plate/{vehicle_licence}")
def get_vehicle_by_plate(vehicle_licence: str):
    """
    Search for a vehicle by license plate number.
    Returns vehicle info, owner details, and all notices for this vehicle.
    """
    # Connect to DB
    conn = get_connection()
    cursor = conn.cursor()
    
    # Query to find vehicle by plate number - joins with driver to get owner
    query = """
        SELECT 
            v.vehicle_id,
            v.vin,
            v.make,
            v.colour,
            v.year,
            v.vehicle_licence,
            d.driver_id,
            d.first_name,
            d.last_name,
            d.dl_number,
            d.address,
            d.city
        FROM vehicle v
        INNER JOIN driver d ON v.registered_owner_id = d.driver_id
        WHERE v.vehicle_licence = %s
    """
    
    cursor.execute(query, (vehicle_licence,))
    vehicle = cursor.fetchone()
    
    # Check if vehicle exists
    if vehicle is None:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    # Get all notices for this vehicle
    # NOTE: using vehicle[0] which is vehicle_id
    cursor.execute("""
        SELECT notice_id, violation_date, location, violation_description
        FROM notice
        WHERE vehicle_id = %s
        ORDER BY violation_date DESC
    """, (vehicle[0],))
    
    notice_rows = cursor.fetchall()
    
    # Done with database
    cursor.close()
    conn.close()
    
    # Build vehicle information section
    vehicle_info = {
        "vehicle_id": vehicle[0],
        "vin": vehicle[1],
        "make": vehicle[2],
        "colour": vehicle[3],
        "year": vehicle[4],
        "plate": vehicle[5]
    }
    
    # Build owner information section
    owner_name = vehicle[7] + " " + vehicle[8]  # first + last name
    owner_address = vehicle[10] + ", " + vehicle[11]  # address + city
    
    owner_info = {
        "driver_id": vehicle[6],
        "name": owner_name,
        "dl_number": vehicle[9],
        "address": owner_address
    }
    
    # Build notices list
    notices_list = []
    for notice in notice_rows:
        notice_dict = {
            "notice_id": notice[0],
            "date": str(notice[1]),
            "location": notice[2],
            "description": notice[3]
        }
        notices_list.append(notice_dict)
    
    # Put it all together
    result = {
        "vehicle_info": vehicle_info,
        "owner": owner_info,
        "notices": notices_list,
        "total_notices": len(notices_list)
    }
    
    return result


@app.post("/notices", status_code=201)
def create_notice(notice: NoticeCreate):
    """
    Create a new correction notice.
    Based on Workshop 11 POST /books-db approach.
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    # Check if vehicle exists
    cursor.execute("SELECT vehicle_id FROM vehicle WHERE vehicle_id = %s", 
                   (notice.vehicle_id,))
    if cursor.fetchone() is None:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    # Check if officer exists
    cursor.execute("SELECT officer_id FROM officer WHERE officer_id = %s", 
                   (notice.officer_id,))
    if cursor.fetchone() is None:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Officer not found")
    
    # Insert new notice
    insert_query = """
        INSERT INTO notice 
        (violation_date, violation_time, district, detachment, location, 
         violation_description, vehicle_id, officer_id)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """
    
    cursor.execute(insert_query, (
        notice.violation_date,
        notice.violation_time,
        notice.district,
        notice.detachment,
        notice.location,
        notice.violation_description,
        notice.vehicle_id,
        notice.officer_id
    ))
    
    conn.commit()
    new_notice_id = cursor.lastrowid  # Get AUTO_INCREMENT ID
    cursor.close()
    conn.close()
    
    return {
        "message": "Notice created successfully",
        "notice_id": new_notice_id,
        "vehicle_id": notice.vehicle_id,
        "officer_id": notice.officer_id
    }


@app.post("/violations", status_code=201)
def create_violation(violation: ViolationCreate):
    """
    Create a violation record for an existing notice.
    Validates that notice exists and doesn't already have a violation (1:1 relationship).
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    # Check if notice exists
    cursor.execute("SELECT notice_id FROM notice WHERE notice_id = %s", 
                   (violation.notice_id,))
    if cursor.fetchone() is None:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Notice not found")
    
    # Check if violation already exists for this notice (UNIQUE constraint)
    cursor.execute("SELECT violation_id FROM violation WHERE notice_id = %s", 
                   (violation.notice_id,))
    if cursor.fetchone() is not None:
        cursor.close()
        conn.close()
        raise HTTPException(
            status_code=400, 
            detail="Violation already exists for this notice"
        )
    
    # Insert new violation
    insert_query = """
        INSERT INTO violation (notice_id, violation_description, action_taken)
        VALUES (%s, %s, %s)
    """
    
    cursor.execute(insert_query, (
        violation.notice_id,
        violation.violation_description,
        violation.action_taken
    ))
    
    conn.commit()
    new_violation_id = cursor.lastrowid
    cursor.close()
    conn.close()
    
    return {
        "message": "Violation created successfully",
        "violation_id": new_violation_id,
        "notice_id": violation.notice_id
    }


@app.post("/token")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Login endpoint - returns JWT token.
    Username and password are validated against users table.
    Based on Workshop 12 OAuth2 authentication.
    """
    # Get database connection
    conn = get_connection()
    cursor = conn.cursor()
    
    # Search for user in database by username
    username_to_find = form_data.username
    query = "SELECT user_id, username, email, password_hash, role FROM users WHERE username = %s"
    cursor.execute(query, (username_to_find,))
    user_record = cursor.fetchone()
    
    # Close database connection
    cursor.close()
    conn.close()
    
    # Check if user exists
    if user_record is None:
        # User not found - return 401 error
        raise HTTPException(
            status_code=401,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get password hash from database
    # user_record[3] is the password_hash column
    stored_password_hash = user_record[3]
    entered_password = form_data.password
    
    # Verify password matches
    is_password_correct = verify_password(entered_password, stored_password_hash)
    
    if not is_password_correct:
        # Wrong password - return 401 error
        raise HTTPException(
            status_code=401,
            detail="Incorrect password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Password is correct - create JWT token
    # user_record[1] is username, user_record[4] is role
    token_data = {"sub": user_record[1], "role": user_record[4]}
    access_token = create_access_token(data=token_data)
    
    # Return token and user info
    response = {
        "access_token": access_token,
        "token_type": "bearer",
        "username": user_record[1],
        "role": user_record[4]
    }
    
    return response

@app.put("/token")
def login_put(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Alternative login endpoint using PUT method.
    Does the same thing as POST /token but using PUT.
    """
    # Connect to database
    conn = get_connection()
    cursor = conn.cursor()
    
    # Look up user by username
    username = form_data.username
    query = "SELECT user_id, username, email, password_hash, role FROM users WHERE username = %s"
    cursor.execute(query, (username,))
    user_data = cursor.fetchone()
    

    cursor.close()
    conn.close()
    
    # If user doesn't exist, return error
    if user_data is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    # Check if password is correct
    password_from_form = form_data.password
    hash_from_db = user_data[3]
    password_matches = verify_password(password_from_form, hash_from_db)
    
    # If password wrong, return error
    if not password_matches:
        raise HTTPException(status_code=401, detail="Incorrect password")
    
    # Everything is correct - make token
    user_username = user_data[1]
    user_role = user_data[4]
    
    token = create_access_token(data={"sub": user_username, "role": user_role})
    
    # Return the token
    result = {
        "access_token": token,
        "token_type": "bearer",
        "username": user_username,
        "role": user_role
    }
    
    return result


@app.put("/drivers/{driver_id}")
def update_driver(driver_id: int, driver: DriverUpdate):
    """
    Update driver information by driver ID.
    Full update - similar to Workshop 11 PUT approach.
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    # Check if driver exists
    cursor.execute("SELECT driver_id FROM driver WHERE driver_id = %s", (driver_id,))
    driver_exists = cursor.fetchone()
    
    if driver_exists is None:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Driver not found")
    
  
    # cursor.execute("UPDATE driver SET last_name=%s, first_name=%s
    
    # Better way - build the query separately
    update_query = """
        UPDATE driver SET
            last_name = %s,
            first_name = %s,
            address = %s,
            city = %s,
            state = %s,
            zip_code = %s,
            dl_number = %s,
            licence_state = %s,
            birth_date = %s,
            height = %s,
            weight = %s,
            eye_colour = %s
        WHERE driver_id = %s
    """
    
    # Execute update with all driver fields
    cursor.execute(update_query, (
        driver.last_name,
        driver.first_name,
        driver.address,
        driver.city,
        driver.state,
        driver.zip_code,
        driver.dl_number,
        driver.licence_state,
        driver.birth_date,
        driver.height,
        driver.weight,
        driver.eye_colour,
        driver_id  
    ))
    
    # Save changes to database
    conn.commit()
    cursor.close()
    conn.close()
    
    response = {
        "message": "Driver updated successfully",
        "driver_id": driver_id
    }
    
    return response


@app.put("/notices/{notice_id}/location")
def update_notice_location(notice_id: int, location_update: NoticeLocationUpdate):
    """
    Update the location field of a specific notice.
    And it's only updates the location field.
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    # Check if notice exists
    cursor.execute("SELECT notice_id FROM notice WHERE notice_id = %s", (notice_id,))
    if cursor.fetchone() is None:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Notice not found")
    
    # Update only the location field
    update_query = "UPDATE notice SET location = %s WHERE notice_id = %s"
    
    cursor.execute(update_query, (location_update.location, notice_id))
    
    conn.commit()
    cursor.close()
    conn.close()
    
    return {
        "message": "Notice location updated successfully",
        "notice_id": notice_id,
        "new_location": location_update.location
    }


@app.delete("/token")
def delete_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Delete JWT token.It requires valid JWT token for verification before deletion.
    Similar to when websites ask you to verify yourself before deleting important data.
    """
    try:
        # Get token from credentials
        token = credentials.credentials
        
        # Verify token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        return {
            "message": "Token successfully invalidated",
            "username": username,
            "detail": "User logged out"
        }
        
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    


@app.delete("/vehicles/{vehicle_id}")
def delete_vehicle(vehicle_id: int):
    """
    Delete a vehicle by ID.
    Only allows deletion if no notices exist for this vehicle.
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    # Check if vehicle exists
    cursor.execute("SELECT vehicle_id FROM vehicle WHERE vehicle_id = %s", (vehicle_id,))
    if cursor.fetchone() is None:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    # Check if vehicle has any notices (FK constraint)
    cursor.execute("SELECT COUNT(*) FROM notice WHERE vehicle_id = %s", (vehicle_id,))
    (notice_count,) = cursor.fetchone()
    
    if notice_count > 0:
        cursor.close()
        conn.close()
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete vehicle with {notice_count} existing notice(s)"
        )
    
    # Delete vehicle
    cursor.execute("DELETE FROM vehicle WHERE vehicle_id = %s", (vehicle_id,))
    
    conn.commit()
    cursor.close()
    conn.close()
    
    return {
        "message": "Vehicle deleted successfully",
        "vehicle_id": vehicle_id
    }


@app.delete("/notices/{notice_id}")
def delete_notice(notice_id: int):
    """
    Delete a notice and its associated violation.
    It removes violation first, then notice (FK constraint order).
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    # Check if notice exists
    cursor.execute("SELECT notice_id FROM notice WHERE notice_id = %s", (notice_id,))
    if cursor.fetchone() is None:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Notice not found")
    
    # Delete associated violation first (if exists) - FK constraint order
    cursor.execute("SELECT violation_id FROM violation WHERE notice_id = %s", (notice_id,))
    violation = cursor.fetchone()
    
    if violation is not None:
        cursor.execute("DELETE FROM violation WHERE notice_id = %s", (notice_id,))
    
    # Now delete the notice
    cursor.execute("DELETE FROM notice WHERE notice_id = %s", (notice_id,))
    
    conn.commit()
    cursor.close()
    conn.close()
    
    return {
        "message": "Notice and associated violation deleted successfully",
        "notice_id": notice_id,
        "violation_deleted": violation is not None
    }

@app.post("/register", status_code=201)
def register(user: UserRegister):
    """Register a new driver/public user account."""
    conn = get_connection()
    cursor = conn.cursor()

    # Check if username already exists
    cursor.execute("SELECT user_id FROM users WHERE username = %s", (user.username,))
    if cursor.fetchone() is not None:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=400, detail="Username already taken")

    # Check if email already exists
    cursor.execute("SELECT user_id FROM users WHERE email = %s", (user.email,))
    if cursor.fetchone() is not None:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash the password
    hashed_password = bcrypt.hashpw(
        user.password.encode('utf-8'),
        bcrypt.gensalt()
    ).decode('utf-8')

    # Insert new user
    cursor.execute(
        "INSERT INTO users (username, email, password_hash, role) VALUES (%s, %s, %s, %s)",
        (user.username, user.email, hashed_password, "user")
    )

    conn.commit()
    new_id = cursor.lastrowid
    cursor.close()
    conn.close()

    return {
        "message": "User registered successfully",
        "user_id": new_id,
        "username": user.username,
        "role": "user"
    }