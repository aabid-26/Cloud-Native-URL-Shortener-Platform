# 🔗 Cloud-Native URL Shortener Platform

A full-stack, cloud-native URL shortener built with **Ballerina**, **React**, **PostgreSQL**, **Docker**, and **Kubernetes**. Designed to demonstrate modern backend engineering, API design, containerisation, and container orchestration.

---

## 🌐 Live Demo

> Deploy to Render or GKE and paste your URL here.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                   User Browser                  │
└─────────────────────┬───────────────────────────┘
                      │ HTTP
┌─────────────────────▼───────────────────────────┐
│           React Frontend (nginx :80)            │
│         Tailwind CSS · QR Code · Analytics      │
└─────────────────────┬───────────────────────────┘
                      │ Proxy /api/*
┌─────────────────────▼───────────────────────────┐
│         Ballerina Backend API (:8080)           │
│     POST /api/shorten · GET /{code}             │
│              GET /api/stats/{code}              │
└─────────────────────┬───────────────────────────┘
                      │ SQL
┌─────────────────────▼───────────────────────────┐
│            PostgreSQL Database (:5432)          │
│          urls table · click tracking           │
└─────────────────────────────────────────────────┘

All services containerised with Docker
Orchestrated with Kubernetes (Minikube locally)
```

---

## ✨ Features

- 🔗 Shorten any valid URL to a 6-character code
- ↩️ Instant redirect via short code
- 📊 Click analytics per short URL
- 📋 One-click copy to clipboard
- 🔲 QR code generation
- ♻️ Idempotent — same URL always returns the same short code
- 🏥 `/health` endpoint for Kubernetes liveness/readiness probes

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Tailwind CSS, Axios |
| Backend | Ballerina (Swan Lake 2201.13.2) |
| Database | PostgreSQL 16 |
| Containerisation | Docker, Docker Compose |
| Orchestration | Kubernetes, Minikube |
| Web Server | nginx (serving React build) |

---

## 📁 Project Structure

```
url-shortener-platform/
├── backend/
│   ├── main.bal              # Ballerina REST API
│   ├── Ballerina.toml        # Package config & dependencies
│   ├── Config.toml           # Runtime config (DB credentials)
│   ├── db_setup.sql          # Database schema
│   └── Dockerfile            # Multi-stage backend image
├── frontend/
│   ├── src/
│   │   ├── App.js            # Main React component
│   │   └── index.css         # Tailwind directives
│   ├── nginx.conf            # nginx config with API proxy
│   └── Dockerfile            # Multi-stage frontend image
├── kubernetes/
│   ├── namespace.yaml        # urlshortener namespace
│   ├── postgres-deployment.yaml
│   ├── backend-deployment.yaml
│   └── frontend-deployment.yaml
├── docker-compose.yml        # Full local stack
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version | Install |
|---|---|---|
| Ballerina | Swan Lake 2201.13.x | [ballerina.io](https://ballerina.io) |
| Node.js | 20+ | [nodejs.org](https://nodejs.org) |
| PostgreSQL | 16 | `brew install postgresql@16` |
| Docker Desktop | Latest | [docker.com](https://www.docker.com/products/docker-desktop) |
| Minikube | 1.38+ | `brew install minikube` |

---

### Option 1 — Run locally (development)

**1. Start PostgreSQL and create the database:**
```bash
brew services start postgresql@16
psql postgres -f backend/db_setup.sql
```

**2. Start the Ballerina backend:**
```bash
cd backend
bal run
# API running at http://localhost:8080
```

**3. Start the React frontend:**
```bash
cd frontend
npm install
npm start
# UI running at http://localhost:3000
```

---

### Option 2 — Run with Docker Compose

```bash
docker compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8080 |
| PostgreSQL | localhost:5432 |

---

### Option 3 — Deploy to Kubernetes (Minikube)

**1. Start Minikube and point Docker to its registry:**
```bash
minikube start
eval $(minikube docker-env)
```

**2. Build images inside Minikube:**
```bash
docker compose build
```

**3. Apply Kubernetes manifests:**
```bash
kubectl apply -f kubernetes/namespace.yaml
kubectl apply -f kubernetes/postgres-deployment.yaml
kubectl apply -f kubernetes/backend-deployment.yaml
kubectl apply -f kubernetes/frontend-deployment.yaml
```

**4. Check pods are running:**
```bash
kubectl get pods -n urlshortener
```

Expected output:
```
NAME                      READY   STATUS    RESTARTS   AGE
backend-xxx               1/1     Running   0          1m
frontend-xxx              1/1     Running   0          1m
postgres-xxx              1/1     Running   0          1m
```

**5. Open the app:**
```bash
minikube service frontend -n urlshortener
```

---

## 📡 API Reference

### POST `/api/shorten`
Shorten a URL.

**Request:**
```json
{ "url": "https://example.com/very/long/path" }
```

**Response `201`:**
```json
{
  "short_code": "xK7pQr",
  "short_url": "http://localhost:8080/xK7pQr",
  "original_url": "https://example.com/very/long/path"
}
```

---

### GET `/{shortCode}`
Redirect to the original URL.

**Response:** `302 Found` with `Location` header set to the original URL.

---

### GET `/api/stats/{shortCode}`
Get click analytics for a short URL.

**Response `200`:**
```json
{
  "short_code": "xK7pQr",
  "short_url": "http://localhost:8080/xK7pQr",
  "original_url": "https://example.com/very/long/path",
  "clicks": 42,
  "created_at": "2026-05-21 15:13:31+05:30"
}
```

---

### GET `/health`
Health check for Kubernetes probes.

**Response `200`:**
```json
{ "status": "ok", "timestamp": "2026-05-21T15:13:31Z" }
```

---

## 🗄️ Database Schema

```sql
CREATE TABLE urls (
    id           SERIAL PRIMARY KEY,
    original_url TEXT        NOT NULL,
    short_code   VARCHAR(10) NOT NULL UNIQUE,
    clicks       INT         NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_short_code ON urls (short_code);
```

---

## ☸️ Kubernetes Concepts Demonstrated

| Concept | Where used |
|---|---|
| **Namespace** | `urlshortener` namespace isolates all resources |
| **Deployment** | One per service — manages pod lifecycle |
| **Service** | Internal DNS (`postgres`, `backend`) + NodePort for frontend |
| **PersistentVolumeClaim** | PostgreSQL data survives pod restarts |
| **Liveness Probe** | Restarts backend if `/health` fails |
| **Readiness Probe** | Holds traffic until service is ready |
| **imagePullPolicy: Never** | Uses locally built Minikube images |

---

## 🔧 Useful Commands

```bash
# View all resources
kubectl get all -n urlshortener

# View logs
kubectl logs -n urlshortener deployment/backend
kubectl logs -n urlshortener deployment/frontend
kubectl logs -n urlshortener deployment/postgres

# Scale the backend to 3 replicas
kubectl scale deployment backend -n urlshortener --replicas=3

# Restart a deployment
kubectl rollout restart deployment/backend -n urlshortener

# Stop everything
docker compose down -v        # Docker
minikube stop                 # Kubernetes
```

---

## 📝 Resume Description

> Built and deployed a cloud-native URL shortener platform using **Ballerina**, **React**, **PostgreSQL**, **Docker**, and **Kubernetes**. Implemented a REST API with URL shortening, redirect, and analytics endpoints. Containerised all services with multi-stage Docker builds and orchestrated them on a local Kubernetes cluster using Minikube, applying deployments, services, persistent volumes, and health probes.

---

## 👤 Author

**Aabid Zimal**
- GitHub: [@aabidzimal](https://github.com/aabidzimal)

---

## 📄 License

MIT
