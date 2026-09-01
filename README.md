# P Streaming Frontend

React and Axios client for the P Streaming authentication experience. It provides responsive login and signup screens and sends requests to the companion FastAPI backend.

## Features

- Responsive login and signup flow designed for desktop and mobile screens.
- Login with either a user ID or email address.
- Client-side required-field, email, and password-length validation.
- Axios-based calls to the FastAPI signup and login endpoints.
- Success and error feedback from the API.
- Browser session display using `localStorage`, with logout support.

## Technology

- React 18
- Axios
- Vite 5
- CSS with responsive breakpoints and custom visual styling

## Prerequisites

- Node.js 18 or later
- npm
- The companion backend service running and reachable from the browser

## Run locally

```bash
npm install
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`.

## Available commands

```bash
npm run dev      # Start the Vite development server
npm run build    # Create a production build in dist/
npm run preview  # Preview the production build locally
```

## Configuration

The API base URL defaults to `http://127.0.0.1:8000`. To use a different backend URL, create a `.env` file with:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

The configured backend must allow the frontend origin through CORS.

## This repository's structure

```text
Frontend/
|- index.html                 # Vite HTML entry point and font loading
|- package.json               # React, Axios, and Vite dependencies/scripts
|- package-lock.json          # Locked npm dependency versions
|- vite.config.js             # Vite development configuration
`- src/
   |- main.jsx                # React application mount point
   |- App.jsx                 # Login, signup, validation, and session UI
   |- api.js                  # Axios client and auth API requests
   `- styles.css              # Responsive visual design and layout rules
```

## Backend reference structure

The following is a documentation-only reference to the companion backend repository. The backend code is maintained, versioned, and pushed in its own `Backend` repository; do not add or edit backend source files in this frontend repository.

```text
Backend/
|- main.py                    # FastAPI routes, application setup, and CORS
|- database.py                # SQLAlchemy engine, session, and base model setup
|- models.py                  # Database ORM models
|- schema.py                  # Request validation schemas
|- crud.py                    # Database queries and persistence helpers
|- auth.py                    # Password hashing and verification helpers
`- requirements.txt           # Python dependencies
```

## API integration

- `POST /signup` creates a user from `userId`, `username`, `email`, and `password`.
- `POST /login` accepts either `userId` or `email`, plus `password`.
- The backend must be running before submitting either form.

## Development notes

- This project intentionally contains only frontend source code and frontend tooling.
- Authentication details returned by the current API are stored under the browser key `pstream-user`; no access token is currently returned or persisted.
- Production deployments should set `VITE_API_BASE_URL` to the deployed backend URL before building.
