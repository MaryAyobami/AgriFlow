# AgriFlow: Commercial Farm Management System

AgriFlow is a comprehensive web-based management system designed for commercial livestock operations (Goats, Sheep, and Cattle).

## Features

- **Animal Registry**: Track individual animals with breed, pedigree, and status.
- **Breeding Management**: Record mating, estrous, and birth events.
- **Growth Tracking**: Log weights and monitor Average Daily Gain (ADG).
- **Feed Management**: Manage ingredients, costs, and formulations.
- **Health Records**: Track vaccinations, treatments, and mortality.
- **Financial Dashboard**: Monitor profitability, sales, and expenses.
- **Investor Portal**: Secure access for investors to track their allocated animals.

## Deployment on Replit

1. **Import Code**: Copy the files into a new Replit project.
2. **Environment Variables**:
   - Add `JWT_SECRET` to your Replit Secrets (optional, a default is used).
   - Ensure `GEMINI_API_KEY` is set if you plan to use AI features.
3. **Install Dependencies**: Replit should automatically detect `package.json` and run `npm install`.
4. **Run**: Click the "Run" button. The system uses `tsx server.ts` to start the Express server on port 3000.
5. **Database**: The system uses SQLite (`farm.db`), which will be created automatically on the first run.

## Default Credentials

- **Username**: `admin`
- **Password**: `admin`

## Technical Stack

- **Frontend**: React 19, Tailwind CSS, Recharts, Lucide Icons.
- **Backend**: Node.js, Express.
- **Database**: SQLite (better-sqlite3).
- **Authentication**: JWT (JSON Web Tokens).
