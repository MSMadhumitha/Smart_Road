# Smart Road Damage Reporting & Monitoring System

A full-stack, production-quality web application built to empower citizens to report road hazards (potholes, cracks, etc.) and assist administrators in managing and tracking road repairs.

## 🚀 Key Features

*   **Citizen Features**:
    *   JWT registration and login.
    *   Submit a road damage report with an image upload and automatic GPS coordinate capture.
    *   Drag-and-drop or pin-drop location fallback on a Leaflet map if GPS permissions are denied.
    *   Track resolution progress through an audit timeline (`Pending` → `In Review` → `In Progress` → `Resolved` / `Rejected`).
*   **Gemini Vision AI Pipeline**:
    *   Automatic image analysis using `gemini-2.0-flash`.
    *   Classifies **Damage Type** (`Pothole`, `Crack`, `Other`), **Severity** (`Low`, `Medium`, `High`), and **Priority** (`Low`, `Medium`, `High`).
    *   Generates a descriptive, safety-focused summary.
    *   Gracefully falls back to manual review if the API is unavailable or returns an invalid structure.
*   **Sharp Image Processing**:
    *   Automatically compresses images to 80% JPEG quality and resizes them to max 1600px on the longest edge before local storage and Gemini processing.
*   **Admin Features**:
    *   Interactive metrics dashboard showing report breakdowns by classification and severity.
    *   Interactive 14-day Area Chart showing submission trends using Recharts.
    *   Multi-variable filterable reports database (filter by status, type, severity, priority, dates, or search text).
    *   Faint background color coding in table lists matching report priority (e.g. high priority is highlighted with a faint red border/background).
    *   Transition report states, apply administrative comments, and view complete audit history.

---

## 🛠️ Technology Stack

*   **Frontend**: React (Vite) + TailwindCSS v3 + React Router v7 + Axios + Leaflet + Recharts
*   **Backend**: Node.js + Express.js + Prisma ORM (MySQL connection pooling)
*   **Image Optimization**: Multer + Sharp
*   **AI Integration**: Google Gemini API via `@google/generative-ai`

---

## 📂 Project Structure

```
smart-road-damage-system/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma   # Prisma schema definitions (User, Report, History)
│   │   └── seed.js         # Seed script creating the default Admin account
│   ├── src/
│   │   ├── config/         # Database and Gemini client initializers
│   │   ├── controllers/    # Route controllers (Auth, Citizen Reports, Admin)
│   │   ├── middleware/     # JWT Auth, Sharp Multer Compress, Rate Limiter
│   │   ├── routes/         # Router endpoints
│   │   ├── services/       # Google Gemini Vision analyzer service
│   │   └── app.js          # Main entrypoint
│   ├── uploads/            # Local image storage folder
│   ├── .env.example        # Environment template config
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     # Navbar, MapView (Leaflet), Badge, Loader
│   │   ├── context/        # AuthContext.jsx session manager
│   │   ├── pages/          # Login, Register, SubmitReport, MyReports, Admin Dashboard
│   │   ├── services/       # axios api.js client config
│   │   ├── App.jsx         # Routes definition & route guards
│   │   ├── index.css       # Global styles & Leaflet overrides
│   │   └── main.jsx
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
└── README.md
```

---

## ⚙️ Prerequisites

1.  **Node.js** (v18+ recommended)
2.  **MySQL** (Ensure MySQL service is running locally on port 3306)
3.  **Google Gemini API Key** (Get a key from [Google AI Studio](https://aistudio.google.com/))

---

## 🛠️ Installation & Setup

### Step 1: Configure Backend Environment Variables

1.  Navigate to the `backend/` directory:
    ```bash
    cd backend
    ```
2.  Create a `.env` file from the example:
    ```bash
    cp .env.example .env
    ```
3.  Open `.env` and fill in your details:
    *   Ensure `DATABASE_URL` matches your local MySQL configuration (user, password, port, and database name). For example, if your password is `MyPassword123`, use:
        `DATABASE_URL="mysql://root:MyPassword123@localhost:3306/road_damage_db"`
        *(Note: URL-encode special characters in the password. For instance, `@` should be `%40`).*
    *   Input your `GEMINI_API_KEY` to enable the vision analysis feature.
    *   Confirm your default Admin credentials in `ADMIN_EMAIL` and `ADMIN_PASSWORD`.

### Step 2: Install Backend Dependencies & Run Database Migrations

1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Create the database, apply migrations, and seed the default Admin account:
    ```bash
    npx prisma migrate dev --name init
    ```
    *This command will create the tables in your local MySQL instance and run the seed script to register your admin user.*

### Step 3: Start the Backend Server

Start the API server in development mode:
```bash
npm run dev
```
The backend API will run on **`http://localhost:5000`**.

---

### Step 4: Install Frontend Dependencies & Start React

1.  Open a new terminal and navigate to the `frontend/` directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the Vite development server:
    ```bash
    npm run dev
    ```
The frontend application will boot on **`http://localhost:5173`**.

---

## 🔑 Default Accounts for Testing

### Admin Account (Seeded)
*   **Email**: `admin@smartroad.com`
*   **Password**: `AdminSecurePassword123!`

### Citizen Account
*   Navigate to **`http://localhost:5173/register`** to create a citizen account instantly.
