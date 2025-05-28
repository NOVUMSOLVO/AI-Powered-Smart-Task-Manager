# AI-Powered Smart Task Manager

**© 2025 NOVUMSOLVO, Inc. All Rights Reserved.**

*A proprietary enterprise-grade productivity platform utilizing advanced artificial intelligence for optimal workflow management and organizational efficiency.*

## Project Overview

This enterprise solution delivers a state-of-the-art productivity management platform leveraging proprietary algorithms to transform organizational efficiency. The platform utilizes protected intellectual property to deliver competitive advantage through:

- User authentication and secure access
- Task creation, editing, and management
- AI-powered task prioritization
- Calendar view with task scheduling
- Google Calendar and Microsoft Outlook integrations
- Personalized AI recommendations

## Architecture

The project is built with a modern full-stack architecture:

### Backend
- FastAPI for high-performance API
- SQLAlchemy for database ORM
- JWT-based authentication system
- AI prioritization microservice

### Frontend
- React.js with modern hooks and context API
- Material UI for responsive UI components
- Axios for API communication
- React Router for navigation

## Getting Started

### Prerequisites

- Python 3.8+
- Node.js 14+
- PostgreSQL (or SQLite for development)

### Backend Setup

1. Navigate to the backend directory:
```
cd AI_Powered_Smart_Task_Manager/backend
```

2. Create and activate a virtual environment:
```
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```
pip install -r requirements.txt
```

4. Create a `.env` file in the backend directory with these variables:
```
DATABASE_URL=sqlite:///./smarttask.db  # For dev, use PostgreSQL in production
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

5. Run the application:
```
cd app
uvicorn main:app --reload
```

The backend API will be available at http://localhost:8000.

### Frontend Setup

1. Navigate to the frontend directory:
```
cd AI_Powered_Smart_Task_Manager/frontend
```

2. Install dependencies:
```
npm install
```

3. Create a `.env` file in the frontend directory:
```
REACT_APP_API_BASE_URL=http://localhost:8000/api
```

4. Start the development server:
```
npm start
```

The frontend application will be available at http://localhost:3000.

## Enterprise Solution Features

### Advanced Identity Management
- Enterprise user registration and authentication system
- Role-based access control with JWT security implementation
- Multi-factor authentication capability

### Strategic Task Orchestration
- Comprehensive task lifecycle management
- Proprietary multi-dimensional prioritization matrix
- Enterprise-grade workflow dependency engine

### Proprietary Task Intelligence
- Advanced workflow optimization (patent pending)
- Proprietary recommendation algorithms
- Enterprise productivity analytics suite

### Calendar Integration
- Calendar view with tasks
- Google Calendar integration
- Microsoft Outlook/Graph API integration

## Security Features

- Secure password hashing
- JWT-based authentication
- CORS protection
- Input validation
- Role-based access control

## API Documentation

API documentation is automatically generated using FastAPI's OpenAPI integration and can be accessed at:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## License

This project is licensed under the NOVUMSOLVO Proprietary License - see the LICENSE file for details. This software is proprietary and confidential. Unauthorized use, copying, modification, or distribution is strictly prohibited.
