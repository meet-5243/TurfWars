# TurfWars - Turf Booking Platform (Mid-1 Milestone)

A full-stack MERN (MongoDB, Express, React, Node.js) platform where users (players) can book sports turf slots and owners can manage multiple turf listings and manually verify offline payments.

---

## Folder Structure

```
turfwars/
├── backend/       # Express.js backend with Mongoose models and controllers
└── frontend/      # React (Vite) frontend with Tailwind CSS
```

---

## Setup Instructions

### 1. Database Requirement
Ensure you have a local MongoDB instance running on your system (defaulting to `mongodb://127.0.0.1:27017`).

### 2. Backend Setup
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Setup environment variables by copying `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   *(Update `MONGO_URI` or `JWT_SECRET` if needed. Default values are pre-configured for local hosting)*.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the Express server:
   ```bash
   npm start
   ```
   *(The server will start running on port `5000`)*.

### 3. Frontend Setup
1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
   *(The app will start hosting locally at `http://localhost:5173/`)*.

---

## Manual Testing & Credentials

For verification convenience, we have seeded a local database with pre-configured accounts:

### Pre-seeded Accounts
- **Player (User Role)**
  - Email: `player@example.com`
  - Password: `password123`
- **Turf Owner (Owner Role)**
  - Email: `owner@example.com`
  - Password: `password123`

### Suggested End-to-End Test Flow
1. Open `http://localhost:5173/` in your browser.
2. **Login as a Player**:
   - Go to Login, use `player@example.com` / `password123`.
   - Go to Home, find the seeded **Camp Nou Arena** and click **View Details**.
   - Book a tomorrow slot (e.g. `18:00` to `20:00`). Note the estimated price.
   - Click **Book Slot Now**. You will be redirected to the **My Bookings** page.
   - The booking will show as **Pending Approval** and **Unpaid**.
3. **Verify Conflict Prevention**:
   - Try booking another overlapping slot for the *same date* (e.g., `19:00` to `21:00`) on **Camp Nou Arena**.
   - The system will block the request and show an error: *"This slot overlaps with an existing booking."*
4. **Login as Turf Owner**:
   - Logout the player, and log in with `owner@example.com` / `password123`.
   - You will land on the **Owner Dashboard**.
   - Try to delete the **Camp Nou Arena** (click Trash icon). The system will prevent deletion and show an error: *"Cannot delete turf with active or pending bookings. You can deactivate it by editing the turf and setting Status to inactive."* (This prevents orphaned bookings).
   - Go to **Manage Bookings**.
   - Find the player's pending booking and click **Mark as Paid & Confirm**.
   - The statuses will update to **Confirmed** and **Paid**.
5. **Confirm Player Status Update**:
   - Logout the owner, and log back in as `player@example.com`.
   - Go to **My Bookings**. Confirm that the booking is now marked **Confirmed** and **Paid & Verified**.
