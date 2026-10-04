# Docker_VaibhavNaik

Full-stack application containerized with Docker and Docker Compose: an
**Express** frontend serving a registration form that forwards submissions to a
**Flask** backend over a shared Docker Compose network.

## Folder structure

```
Docker_VaibhavNaik/
├── backend/                 Flask API
│   ├── app.py               Flask application and endpoints
│   ├── requirements.txt     Python dependencies
│   ├── Dockerfile           Backend image definition
│   └── .dockerignore
├── frontend/                Express web server
│   ├── server.js            Express app, proxies to the backend
│   ├── package.json         Node dependencies
│   ├── Dockerfile           Frontend image definition
│   ├── .dockerignore
│   ├── views/
│   │   └── index.html       Student registration form
│   └── public/
│       ├── style.css        Styling
│       └── app.js           Form submit + record list logic
├── docker-compose.yml       Builds and connects both services
├── .gitignore
└── README.md
```

## How the request flows

```
Browser  ──POST /submit──▶  frontend (Express :3000)
                                │
                                └─POST /submissions──▶  backend (Flask :5000)
                                                            │
                                                            ├─ validates name / email / course
                                                            ├─ stores the processed record
                                                            └─ returns JSON
```

The frontend reaches the backend at `http://backend:5000` — the Compose service
name, resolved by Docker's embedded DNS on the `docker-network` bridge network.
No `localhost` is used between containers.

## Endpoints

| Service  | Method | Route                     | Description                              |
| -------- | ------ | ------------------------- | ---------------------------------------- |
| frontend | GET    | `/`                       | Registration form                        |
| frontend | POST   | `/submit`                 | Validates, then forwards to the backend   |
| frontend | GET    | `/submissions`            | Proxies the backend's stored records      |
| frontend | GET    | `/health`                 | Frontend health plus backend health       |
| backend  | GET    | `/health`                 | Backend health check                     |
| backend  | POST   | `/submissions`            | Validates and stores a submission         |
| backend  | GET    | `/submissions`            | Returns every stored submission          |
| backend  | POST   | `/process`                | Alias of `POST /submissions`              |

## Build and run

```bash
docker compose build
docker compose up -d
docker compose ps
```

Then open <http://localhost:3000>.

Inspect logs:

```bash
docker compose logs -f
docker compose logs -f backend
```

Stop and clean up:

```bash
docker compose down
docker compose down --rmi local --volumes
```

## Pull and run the published images

Both images are published on Docker Hub as two tags of a single repository:

```bash
docker pull bobooo404/docker_vaibhavnaik:backend
docker pull bobooo404/docker_vaibhavnaik:frontend
```

Running them without Compose requires one extra flag. The frontend resolves the
backend as `http://backend:5000`, and `backend` is a **network alias**. Compose
creates that alias automatically, but `docker run` does not — without
`--network-alias backend` the frontend fails with
`Backend unreachable at http://backend:5000`.

```bash
docker network create docker-network

docker run -d --name docker-backend --network docker-network \
  --network-alias backend -p 5000:5000 \
  bobooo404/docker_vaibhavnaik:backend

docker run -d --name docker-frontend --network docker-network -p 3000:3000 \
  -e BACKEND_URL=http://backend:5000 \
  bobooo404/docker_vaibhavnaik:frontend
```

Verify the two containers can see each other:

```bash
docker exec docker-frontend getent hosts backend
docker logs docker-backend      # shows requests from the frontend's IP
```

Clean up:

```bash
docker rm -f docker-frontend docker-backend
docker network rm docker-network
```

## Test the API from the command line

```bash
# through the frontend
curl -X POST http://localhost:3000/submit \
  -H "Content-Type: application/json" \
  -d '{"name":"Vaibhav Naik","email":"vaibhavnaik20@gmail.com","course":"Computer Engineering"}'

# straight to the backend
curl -X POST http://localhost:5000/submissions \
  -H "Content-Type: application/json" \
  -d '{"name":"Vaibhav Naik","email":"vaibhavnaik20@gmail.com","course":"Computer Engineering"}'

curl http://localhost:5000/submissions
curl http://localhost:3000/health
```

## Run without Docker

Backend:

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py            # http://localhost:5000
```

Frontend:

```bash
cd frontend
npm install
BACKEND_URL=http://localhost:5000 npm start   # http://localhost:3000
```

## Docker Hub

Both services are published as two tags of one repository:

| Tag      | Service                | Hub link |
| -------- | ---------------------- | -------- |
| `backend`  | Flask API            | https://hub.docker.com/r/bobooo404/docker_vaibhavnaik/tags |
| `frontend` | Express web server  | https://hub.docker.com/r/bobooo404/docker_vaibhavnaik/tags |

Build and push:

```bash
docker login
docker compose build
docker push bobooo404/docker_vaibhavnaik:backend
docker push bobooo404/docker_vaibhavnaik:frontend
```