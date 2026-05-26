# TicketFlow - Ticket Booking Microservice System

TicketFlow is a scalable, distributed microservices-based backend system designed for ticket booking applications. It provides a robust architecture for managing users, events, bookings, payments, and notifications.

## 🏗️ Architecture Overview

The system is built using Node.js and relies on several independent microservices communicating with each other. It uses **MongoDB** as its primary database, **Redis** for caching, and **RabbitMQ** for asynchronous message brokering between services.

### Microservices

1. **API Gateway (`api-gateway`) - Port 3006**
   - The main entry point for all client requests.
   - Routes incoming requests to the appropriate underlying microservices.

2. **User Service (`user-service`) - Port 3001**
   - Handles user registration, authentication (JWT), and profile management.
   - Database: MongoDB (`ticketflow_users`)

3. **Event Service (`event-service`) - Port 3002**
   - Manages events, ticket availability, and event details.
   - Database: MongoDB (`ticketflow_events`)
   - Caching: Redis

4. **Booking Service (`booking-service`) - Port 3003**
   - Handles the core ticket booking logic and reservations.
   - Communicates asynchronously via RabbitMQ.
   - Database: MongoDB (`ticketflow_bookings`)
   - Caching: Redis

5. **Payment Service (`payment-service`) - Port 3004**
   - Processes payments for booked tickets.
   - Listens to booking events via RabbitMQ.
   - Database: MongoDB (`ticketflow_payments`)

6. **Notification Service (`notification-service`) - Port 3005**
   - Sends emails/alerts to users regarding their bookings and payments.
   - Listens to events from RabbitMQ to trigger notifications.
   - Database: MongoDB (`ticketflow_notifications`)

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Message Broker**: RabbitMQ
- **Caching**: Redis
- **Containerization**: Docker, Docker Compose
- **Authentication**: JSON Web Tokens (JWT)

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your local machine:
- [Node.js](https://nodejs.org/) (v16+)
- [Docker](https://www.docker.com/) and Docker Compose
- [MongoDB](https://www.mongodb.com/) (If running locally instead of Docker)

### Installation & Running Locally

#### 1. Clone the repository
```bash
git clone https://github.com/Naveen5676/Ticket-Booking-Microservice-.git
cd "Ticket-Booking-Microservice-"
```

#### 2. Install dependencies for all services
From the root directory, install the root packages:
```bash
npm install
```

*(Note: You may need to run `npm install` inside each individual service folder if you are not using Docker)*

#### 3. Run using Docker Compose (Recommended)
This will spin up all the microservices, Redis, and RabbitMQ simultaneously.

```bash
npm run docker:up
```
Or manually:
```bash
docker-compose up --build
```

#### 4. Run Locally (Without Docker)
Make sure you have Redis, RabbitMQ, and MongoDB running locally on your machine. Then, start all services using `concurrently`:

```bash
npm run dev:all
```
You can also run individual services using scripts like `npm run dev:gateway`, `npm run dev:user`, etc.

## 📝 API Documentation
A Postman collection is included in the root directory: `TicketFlow API.postman_collection.json`. You can import this into Postman to test the various API endpoints.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/Naveen5676/Ticket-Booking-Microservice-/issues).

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
