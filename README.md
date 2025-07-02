# 🛠️ Backend Setup (Monorepo)

This repository is structured as a monorepo containing the **backend** and the **frontend** .

## 📁 Project Structure

```
.
├── baceknd/                # NestJS backend
├── frontend/           # (To be added)
├── README.md
└── ...
```

---

## ✅ Prerequisites

Make sure you have the following installed on your machine:

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- [Node.js](https://nodejs.org/) (only needed if running the backend manually without Docker)
- [Git](https://git-scm.com/) (to clone the repo)

---

## ⚙️ Environment Variables

Inside the `backend/` directory, create a `.env` file with the following content:

```env
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=USER_NAME
DB_PASSWORD=DB_PASSWORD
DB_NAME=DB_NAME
```

---

## 🐳 Running the Backend with Docker Compose

This project includes a `docker-compose.yml` file at the root level, which simplifies the development setup.

### ▶️ Step-by-step Instructions

1. **Open your terminal** and navigate to the root of the project.
2. **Run the following command** to build and start the containers:

```bash
docker-compose up --build
```

This will:

- Build the NestJS backend from the `backend/` folder
- Start a PostgreSQL container with the specified credentials
- Automatically run database migrations or sync (if configured in your code)

---

## 🚀 Accessing the Backend

Once the containers are running, the backend API will be accessible at:

```
http://localhost:3000
```

You can test it in your browser or with tools like [Postman](https://www.postman.com/) or [Insomnia](https://insomnia.rest/).

---

## 🔧 Useful Docker Commands

```bash
# Stop containers
docker-compose down

# Stop and remove volumes (clean database)
docker-compose down -v

# Rebuild and restart only the backend service
docker-compose up --build api
```

---

## 💻 Running the Backend Locally (without Docker)

If you prefer to run the backend manually:

1. Go to the backend folder:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Create the `.env` file as shown above.

4. Make sure you have a local PostgreSQL database running with the same credentials.

5. Start the development server:

```bash
npm run start:dev
```

---

## 🧪 Testing the API

You can test your backend routes using:

- Swagger (if enabled in your project): `http://localhost:3000/api`
- Postman or Insomnia
- Browser (for simple GET routes)

---

## 📌 Notes

- Make sure ports `3000` (backend) and `5432` (PostgreSQL) are available on your system.
- Database data is stored in a Docker volume, so it persists between restarts unless you use `-v` to remove volumes.
- If you encounter permission or volume issues on Linux/Mac, try running Docker with `sudo` or adjust your Docker daemon settings.

---

## 🧩 Frontend (Coming Soon)

The frontend will be added in the `frontend/` folder in future updates. Stay tuned!

---

## 📝 License

This project is licensed under the MIT License. Feel free to use and modify it.
