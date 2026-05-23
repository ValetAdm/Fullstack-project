# Fullstack-project
# 🚔 NY State Patrol – Citation Management System

A full-stack web application for managing traffic correction notices, built for the CMP2812 module at the University of Lincoln.

## ✨ Features

- 🪪 **Driver Portal** – Search citations by plate number, view notices, update profile
- 🛡️ **Admin Portal** – Create, update, and delete correction notices
- 🔐 **JWT Authentication** – Role-based access (driver / officer / admin)
- 📱 **Responsive Design** – Works on desktop, tablet, and mobile
- ✅ **Form Validation** – Real-time client-side validation on all forms
- 🗄️ **Relational Database** – 5-table MySQL schema with foreign key constraints

## 🚀 How to Run

1. Start **MySQL** and run the script from `assessment-1/` to set up the database
2. Start the **API**: `cd assessment-2 && python -m uvicorn main:app --reload`
3. Start the **frontend**: `cd assessment-3 && python -m http.server 5500`
4. Open `http://localhost:5500` in your browser

> Test credentials — Admin: `admin / password123` · Driver: `public / password123`

## 🛠️ Technologies

- **Database** – MySQL 8
- **Backend** – Python, FastAPI, JWT, bcrypt
- **Frontend** – HTML5, CSS3 (Flexbox), Vanilla JavaScript
- **Auth** – OAuth2 + JWT (sessionStorage, 30-min expiry)
