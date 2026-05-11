Team Task Manager

A full-stack collaborative task management app built with React, Node.js, Express, and PostgreSQL. It includes role-based access, secure login/register, project membership, task assignment, and a Kanban-style task board.

Features

- Authentication: Register/login with JWT tokens and bcrypt password hashing.
- Role-based access:
  - Admin users can create projects, add project members, create/edit/delete tasks, and assign tasks.
  - Member users can view assigned/project tasks and update task status.
- Project management: Create projects and add registered users as project members.
- Task management: Create, edit, assign, delete, and move tasks across Todo, In Progress, and Completed.
- Dashboard: Shows task totals, completion stats, and overdue counts.

Tech Stack

- Frontend: React, Vite, Tailwind CSS, Lucide React, Framer Motion, Axios
- Backend: Node.js, Express
- Database: PostgreSQL hosted on Render
- Security: JWT, bcryptjs, Helmet, CORS

Database Setup On Render

1. In Render, create a PostgreSQL database.
2. Copy the connection URLs from the Render database dashboard.
3. Use the correct URL depending on where the backend runs:
   - Local development: use the External Database URL.
   - Render deployment: use the Internal Database URL only when the backend web service and database are in the same Render private network.

The server automatically creates the required tables on startup:

- users
- projects
- project_members
- tasks

Environment Variables

Create server/.env for local development:

PORT=5000
DATABASE_URL=your_render_external_postgresql_url
DATABASE_SSL=true
JWT_SECRET=replace_with_a_long_random_secret
NODE_ENV=development

For Render deployment, add these variables in the web service Environment tab:

DATABASE_URL=your_render_internal_postgresql_url
DATABASE_SSL=true
JWT_SECRET=replace_with_a_long_random_secret
NODE_ENV=production

Do not commit real database URLs, passwords, or JWT secrets. Keep them only in .env locally and Render environment variables in production.

Local Installation

Install dependencies from the repository root:

npm install
npm install --prefix client
npm install --prefix server

Or use:

npm run install-all

Running Locally

Start the backend:

cd server
npm start

Start the frontend in another terminal:

cd client
npm run dev

Open:

http://127.0.0.1:5173/

The Vite frontend proxies API requests to:

http://localhost:5000/api

Render Deployment

This project can deploy as one Render web service that builds the frontend and serves it through the Express backend.

Recommended Render web service settings:

- Root Directory: leave empty / repository root
- Build Command:
  npm install && npm run build
- Start Command:
  npm start

Required Render environment variables:

- DATABASE_URL
- DATABASE_SSL=true
- JWT_SECRET
- NODE_ENV=production

First Use

1. Start the backend and frontend.
2. Register an Admin account.
3. Log in as Admin.
4. Create a project.
5. Register one or more Member accounts.
6. Log back in as Admin, open the project, add members, then assign tasks to them.

License

MIT

