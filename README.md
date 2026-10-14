# University Research Opportunity Portal

## Overview

The University Research Opportunity Portal is a web application for managing university research opportunities. Faculty members can create, view, update, close, and delete opportunities. Students can browse available opportunities and view their details.

The project uses Node.js, Express.js, MySQL, HTML, CSS, and JavaScript.

**GitHub Repository:** https://github.com/manahilfatima12/research-opportunity-portal

## Features

- Create new research opportunities.
- View all opportunities and their details.
- Search opportunities and filter them by status.
- Edit existing opportunities.
- Close opportunities by changing their status to Closed.
- Delete opportunities.
- Validate required fields and display success or error messages.
- Provide REST API endpoints for CRUD operations.
- Store opportunity records in a MySQL database.

## Technologies Used

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js and Express.js
- Database: MySQL
- API testing: Postman-compatible collection

## Project Structure

- `backend/` — Express server, database connection, and API routes.
- `frontend/` — HTML, CSS, and JavaScript files.
- `database/schema.sql` — SQL script to create the database and table.
- `postman/research-portal.postman_collection.json` — API test collection.
- `README.md` — Project documentation.

## Requirements

Install the following before running the project:

- Node.js and npm
- MySQL Server

## Database Setup

1. Start your MySQL server.
2. Run the SQL script in `database/schema.sql` using a MySQL account with permission to create databases and tables.
3. Configure the database connection using environment variables in `backend/.env`.

The environment file should contain these variables:

- `DB_HOST` — MySQL host
- `DB_USER` — MySQL username
- `DB_PASSWORD` — MySQL password
- `DB_NAME` — Database name (`research_portal`)

Do not upload your actual `.env` file or passwords to GitHub.

## Backend Setup

Open a terminal and run:

```bash
cd backend
npm install
npm start
```

The API server runs on port `3000` by default.

Check the database connection using:

`http://localhost:3000/api/health`

## Frontend Setup

After starting the backend, open `frontend/index.html` in a browser. The frontend communicates with the API running at `http://localhost:3000`.

Keep the backend running while using the frontend.

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check server and database connection |
| POST | `/api/opportunities` | Create an opportunity |
| GET | `/api/opportunities` | Retrieve all opportunities |
| GET | `/api/opportunities/:id` | Retrieve one opportunity |
| PUT | `/api/opportunities/:id` | Update an opportunity |
| DELETE | `/api/opportunities/:id` | Delete an opportunity |

The API validates input and returns appropriate HTTP status codes, including `200`, `201`, `400`, `404`, and `500`.

## API Testing

Import `postman/research-portal.postman_collection.json` into Postman to run the included API requests.

The collection covers creating, listing, viewing, updating, closing, and deleting opportunities, as well as invalid input and not-found responses.

Ensure the backend and database are running before testing.

## Author

**Project:** University Research Opportunity Portal
