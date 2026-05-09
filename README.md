# Attendance Management System

This is a attendance management system built to manage employee attendance using location-based geofencing and selfie verification.

## 🏗 Architecture Overview

The project follows a **MERN Stack** (MongoDB, Express, React, Node.js) architecture:

*   **Frontend**: Built with **React** and **Vite** for a fast, responsive UI. It uses **Redux Toolkit (RTK Query)** for efficient data fetching and caching.
*   **Backend**: A **Node.js/Express** REST API that handles authentication, geofencing logic, and business rules.
*   **Database**: **MongoDB** is used for flexible, document-based storage.
*   **Storage**: **Cloudinary** is integrated for cloud storage of employee selfies.
*   **Authentication**: Secure **JWT (JSON Web Tokens)** are used for stateless authentication and Role-Based Access Control (RBAC).

## 🚀 Features Implemented

*   **Role-Based Access Control (RBAC)**: Distinct views and permissions for Employees, Managers, and Admins.
*   **Geofenced Punch In/Out**: Employees can only punch in if they are within a specific radius (e.g., 100m) of the office.
*   **Selfie Verification**: Captures a live webcam photo during attendance to prevent buddy-punching.
*   **Manager Dashboard**: Managers can view, review, and validate attendance and overtime requests for their specific team.
*   **Admin User Management**: Full control over user roles and organizational hierarchy (assigning employees to managers).
*   **Overtime System**: Manual request flow for employees with manager approval/rejection capability.

## 🛠 Setup Instructions

### 1. Prerequisites
*   Node.js installed
*   MongoDB Atlas account or local MongoDB instance
*   Cloudinary account (for image uploads)

### 2. Installation
Clone the repository to your local machine:
```bash
git clone https://github.com/enthoharsh/attendance-management-system
```

**Install Backend Dependencies**:
```bash
cd backend
npm install
```

**Install Frontend Dependencies**:
```bash
cd ../frontend
npm install
```

### 3. Environment Variables
Create a `.env` file in the `backend` folder:
```env
PORT=5001
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key

# Cloudinary Config
CLOUDINARY_CLOUD_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret

# Geofencing (Office Location)
OFFICE_LAT=23.2333
OFFICE_LNG=77.4333
ALLOWED_RADIUS=100
```

### 4. Running the App
**Start Backend**:
```bash
# Inside backend folder
npm run dev
```

**Start Frontend**:
```bash
# Inside frontend folder
npm run dev
```
The app will run on `http://localhost:5173`.

## 📝 Assumptions Made

*   **GPS Accuracy**: It is assumed that the user's device provides reasonably accurate geolocation data.
*   **Single Office**: The current version assumes a single fixed office location (configured via coordinates in `.env`).
*   **Work Hours**: A standard shift is assumed to be 8 hours. Records are marked "incomplete" if the duration is less than 8 hours.
*   **Connectivity**: Users are expected to have a stable internet connection and a working webcam for attendance.
*   **Browser Support**: The app assumes the use of modern browsers that support the Geolocation and MediaDevices (Webcam) APIs.
