# TrustLens – Real-Time Personal Trust Scoring System

TrustLens is a full-stack security application designed to analyze the trust level of URLs, Email addresses, and Phone numbers using weighted scoring algorithms.

## Tech Stack
- **Frontend**: Vanilla JS, CSS3, (Chart.js for visualization)
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Security**: JWT Auth, bcrypt password hashing

## Features
- Real-time Trust Scoring (0-100)
- Risk Classification (Low, Medium, High)
- Cyber-themed Dashboard with Glassmorphism
- Analysis History Tracking
- Community Complaint Submission

## Installation and Setup

1. **Clone the project**
2. **Setup Environment Variables**:
   Create a `.env` file in the root directory with:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/trustlens
   JWT_SECRET=your_jwt_secret_key
   ```
3. **Install Dependencies**:
   ```bash
   npm install
   ```
4. **Seed Sample Data**:
   ```bash
   node server/seed.js
   ```
5. **Start the Server**:
   ```bash
   npm start (if defined in package.json) or node server/server.js
   ```

## Running Locally
Access the application at `http://localhost:5000`.

1. Register a new account.
2. Login to access the Dashboard.
3. Enter a URL (e.g., `example.com`), Email, or Phone to see the Trust Score.
4. View the dynamic graph and explanation breakdown.
5. Check your history below or report a suspicious entity.
