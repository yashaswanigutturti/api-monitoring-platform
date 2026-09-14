# API Monitoring Platform

A web-based API monitoring platform built with **Python and Flask** that allows users to register, log in, monitor API services, track their health and response status, and manage incidents through a dashboard.

## Features

* User registration and login
* JWT-based authentication
* Add and manage API services
* Automatic API health checking
* Response time monitoring
* Service status tracking
* Incident detection and management
* Monitoring scheduler
* Dashboard for service health
* SQLite database with SQLAlchemy
* Automated API tests

## Tech Stack

* **Backend:** Python, Flask
* **Database:** SQLite
* **ORM:** Flask-SQLAlchemy
* **Authentication:** Flask-JWT-Extended
* **API Requests:** Requests
* **Scheduling:** Python Scheduler
* **Frontend:** HTML, CSS, JavaScript
* **Testing:** Python unittest
* **Deployment:** Gunicorn

## Project Structure

```text
api-monitoring-platform/
│
├── app.py
├── config.py
├── requirements.txt
├── README.md
├── .gitignore
│
├── database/
│   ├── db.py
│   └── models.py
│
├── monitoring/
│   ├── checker.py
│   └── scheduler.py
│
├── routes/
│   ├── auth.py
│   ├── incidents.py
│   └── services.py
│
├── static/
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── dashboard.js
│
├── templates/
│   ├── dashboard.html
│   ├── login.html
│   └── register.html
│
└── tests/
    └── test_api.py
```

## How It Works

```text
User
  │
  ▼
Login / Register
  │
  ▼
Dashboard
  │
  ├── Add API Service
  │
  ├── Monitor Service
  │
  └── View Incidents
          │
          ▼
    API Health Checker
          │
          ├── Response Status
          ├── Response Time
          └── Availability
```

The monitoring component periodically checks registered APIs and records their health status. When an API becomes unavailable or encounters an error, the platform can create an incident for tracking.

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/yashaswanigutturti/api-monitoring-platform.git
cd api-monitoring-platform
```

### 2. Create a virtual environment

Windows:

```powershell
python -m venv venv
```

Activate it:

```powershell
venv\Scripts\activate
```

### 3. Install dependencies

```powershell
pip install -r requirements.txt
```

### 4. Run the application

```powershell
python app.py
```

Open the application in your browser at:

```text
http://127.0.0.1:5000
```

## Testing

Run the test suite with:

```powershell
python -m unittest discover tests
```

## Environment Variables

For production deployments, sensitive configuration such as secret keys should be stored as environment variables rather than directly in the source code.

Example:

```text
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret-key
```

## Future Improvements

* Email and Slack notifications for incidents
* API uptime percentage and historical analytics
* Response-time graphs
* Custom monitoring intervals
* PostgreSQL support
* Role-based access control
* Docker deployment
* Improved monitoring logs
* Cloud deployment
* Rate-limit monitoring

## Author

**Gutturti Yashaswani**

GitHub: [yashaswanigutturti](https://github.com/yashaswanigutturti)
