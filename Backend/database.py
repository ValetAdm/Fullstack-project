# Database connection for NY State Patrol API

import MySQLdb

def get_connection():
    """
    Creates a connection to the ny_patrol_db MySQL database.
    Returns a MySQLdb connection object.
    """
    conn = MySQLdb.connect(
        host="localhost",
        port=3306,
        user="root",
        passwd="Pitardasosisona1",  
        db="ny_patrol_db",
        charset="utf8mb4"
    )
    return conn




def test_connection():
    """
    Test function to verify database connection works.
    Returns count of drivers in the database.
    """
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM driver;")
    (count,) = cursor.fetchone()
    cursor.close()
    conn.close()
    return count