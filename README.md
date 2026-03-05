# PerformOS Backend API

## Quick Start

### 1. Install MongoDB
- **Windows**: Download from https://www.mongodb.com/try/download/community
- **Mac**: `brew install mongodb-community`
- Start MongoDB: `mongod` (Windows) or `brew services start mongodb-community` (Mac)

### 2. Setup Backend
```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Create .env file (already included, change JWT_SECRET in production)

# Seed the database with sample data
npm run seed

# Start development server
npm run dev
```

### 3. API Runs on
```
http://localhost:5000
```

### 4. Default Login Credentials (after seeding)
| Role     | Email                    | Password      |
|----------|--------------------------|---------------|
| Admin    | admin@performos.com      | Admin@123     |
| Employee | karan@performos.com      | Employee@123  |
| Employee | arjun@performos.com      | Employee@123  |

---

## API Endpoints

### Auth
| Method | Endpoint                   | Access  | Description         |
|--------|----------------------------|---------|---------------------|
| POST   | /api/auth/login            | Public  | Login               |
| GET    | /api/auth/me               | Private | Get current user    |
| PUT    | /api/auth/change-password  | Private | Change password     |

### Employees (Admin only)
| Method | Endpoint                        | Description           |
|--------|---------------------------------|-----------------------|
| GET    | /api/employees                  | Get all employees     |
| POST   | /api/employees                  | Create employee       |
| GET    | /api/employees/:id              | Get employee by ID    |
| PUT    | /api/employees/:id              | Update employee       |
| DELETE | /api/employees/:id              | Delete employee       |
| PUT    | /api/employees/:id/performance  | Update performance    |

### Tasks
| Method | Endpoint                   | Access        | Description       |
|--------|----------------------------|---------------|-------------------|
| GET    | /api/tasks                 | Both          | Get tasks         |
| POST   | /api/tasks                 | Admin         | Create task       |
| GET    | /api/tasks/:id             | Both          | Get task by ID    |
| PUT    | /api/tasks/:id             | Both          | Update task       |
| DELETE | /api/tasks/:id             | Admin         | Delete task       |
| GET    | /api/tasks/stats/summary   | Admin         | Task stats        |

### Attendance
| Method | Endpoint                   | Access   | Description          |
|--------|----------------------------|----------|----------------------|
| POST   | /api/attendance/checkin    | Employee | Check in             |
| POST   | /api/attendance/checkout   | Employee | Check out            |
| GET    | /api/attendance/my         | Employee | My attendance        |
| GET    | /api/attendance/all        | Admin    | All attendance       |
| POST   | /api/attendance/mark       | Admin    | Mark manually        |

### Dashboard
| Method | Endpoint                   | Access   | Description          |
|--------|----------------------------|----------|----------------------|
| GET    | /api/dashboard/admin       | Admin    | Admin stats          |
| GET    | /api/dashboard/employee    | Employee | Employee stats       |

---

## Connect Frontend

Copy `FRONTEND_API_SERVICE.js` to `src/api.js` in your React project.

Then in `LoginPage.jsx`, replace the `handleSubmit`:
```js
import { authAPI } from './api';

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!email || !password) { setShake(true); setTimeout(() => setShake(false), 500); return; }
  setLoading(true);
  try {
    const data = await authAPI.login(email, password);
    if (data.user.role !== role) {
      setLoading(false);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    onLogin(data.user.role, data.user);
  } catch (err) {
    setLoading(false);
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }
};
```

## Project Structure
```
backend/
├── src/
│   ├── config/
│   │   ├── db.js          # MongoDB connection
│   │   └── seed.js        # Database seeder
│   ├── models/
│   │   ├── User.js        # User/Employee model
│   │   ├── Task.js        # Task model
│   │   └── Attendance.js  # Attendance model
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── employeeController.js
│   │   ├── taskController.js
│   │   ├── attendanceController.js
│   │   └── dashboardController.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── employees.js
│   │   ├── tasks.js
│   │   ├── attendance.js
│   │   └── dashboard.js
│   ├── middleware/
│   │   └── auth.js        # JWT protect + role guard
│   └── server.js          # Entry point
├── .env
├── .gitignore
├── package.json
├── FRONTEND_API_SERVICE.js  # Copy to React src/api.js
└── README.md
```
```
my-performance-portal/
│
├── public/
│   └── vite.svg                 # Static assets
│
├── src/
│   ├── AdminDashboard.jsx       # Admin dashboard UI
│   ├── Employeedashboard.jsx    # Employee dashboard UI
│   ├── Loginpage.jsx            # Login page
│   ├── App.jsx                  # Main application component
│   ├── App.css                  # Global styling
│   ├── index.css                # Base CSS styles
│   ├── main.jsx                 # React entry point
│   ├── api.js                   # API service for backend calls
│   ├── theme.js                 # Theme configuration
│   ├── ThemeToggle.jsx          # Dark/light theme toggle
│   │
│   └── assets/
│       └── react.svg            # React logo asset
│
├── index.html                   # Main HTML template
├── vite.config.js               # Vite configuration
├── eslint.config.js             # ESLint configuration
├── package.json                 # Project dependencies
├── package-lock.json            # Dependency lock file
├── README.md                    # Project documentation
└── .gitignore                   # Git ignore rules
```
## ER diagram
<img width="1413" height="735" alt="Screenshot 2026-03-04 233436" src="https://github.com/user-attachments/assets/98f32930-e64d-4dcf-be53-962b3c8f7a3f" />

## Database Scheme
<img width="1305" height="556" alt="Screenshot 2026-03-04 221003" src="https://github.com/user-attachments/assets/31a5fddd-61ea-4a01-ba62-6c35b08ae346" />

## Flow chart
<img width="864" height="737" alt="Screenshot 2026-03-04 215059" src="https://github.com/user-attachments/assets/ed018f03-17c8-437a-afcc-4f85bc67ae45" />

## Employee dashboard
<img width="15631" height="9414" alt="Frame 34" src="https://github.com/user-attachments/assets/ced4f1bc-455a-4529-a972-c7d8467f7bca" />

## Admin Dashboard
<img width="2795" height="1505" alt="Frame 33" src="https://github.com/user-attachments/assets/d3862c31-b558-485a-997b-11b65de9966e" />

## 🎨Wireframe (Figma)

View full design here:
https://www.figma.com/design/jbs6cthi2PWm1DEHaNb8Rx/Untitled?node-id=75-177&t=1ww3WGYU6c7lbLUj-0






