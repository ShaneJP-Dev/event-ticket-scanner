# Event Ticket Scanner

Event Ticket Scanner is a comprehensive, full-stack application built with Next.js and Prisma for managing and validating event tickets. It provides a robust dashboard for event and ticket management, including bulk CSV imports, and features a real-time QR code scanning interface for efficient check-ins.

## Features

*   **Event Management**: Full CRUD (Create, Read, Update, Delete) functionality for events.
*   **Ticket Management**: Create individual tickets, bulk import attendees via CSV, edit details, and track usage status.
*   **Real-time QR Code Scanning**: A continuous scanning mode using the device's camera for fast, automated ticket validation and check-in.
*   **Manual Lookup**: A fallback option to search for tickets by their unique code.
*   **Live Dashboard**: An overview of ticket scanning activity, usage statistics (used, unused, total), and real-time updates.
*   **Responsive Design**: A clean, modern UI built with shadcn/ui and Tailwind CSS that works on both desktop and mobile devices.

## Tech Stack

*   **Framework**: Next.js 15 (App Router)
*   **Database**: PostgreSQL
*   **ORM**: Prisma
*   **Styling**: Tailwind CSS & shadcn/ui
*   **Data Fetching**: TanStack Query (React Query)
*   **Forms**: React Hook Form & Zod
*   **QR Scanning**: `qr-scanner` Library

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

*   Node.js (v20 or later)
*   npm, yarn, or pnpm
*   A running PostgreSQL database instance

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/shanejp-dev/event-ticket-scanner.git
    cd event-ticket-scanner
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project and add your PostgreSQL connection string.
    ```env
    DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
    ```

4.  **Run database migrations:**
    This command will set up the `Event` and `Ticket` tables in your database based on the schema in `prisma/schema.prisma`.
    ```bash
    npx prisma migrate dev
    ```

5.  **Run the development server:**
    ```bash
    npm run dev
    ```

6.  Open `http://localhost:3000` in your browser to see the application.

## Project Structure

The repository is organized to separate concerns, making it easier to navigate and maintain.

```
/app
├── api/          # API routes for events and tickets
├── dashboard/    # Main dashboard UI for managing Events and Tickets
└── scanner/      # The QR code scanning page
/components/
├── QRScanner/    # QR scanner and manual search components
├── forms/        # Reusable forms for adding events and tickets
├── modals/       # Dialog components for user interactions (e.g., adding items, CSV uploads)
└── ui/           # Core UI components from shadcn/ui
/hooks/           # Custom React Query hooks for data fetching and mutations
/prisma/          # Prisma schema definition and client setup
/lib/             # Utility functions, type definitions, and server actions
```

## API Endpoints

The application exposes a set of RESTful API endpoints for managing events and tickets.

| Method   | Endpoint                  | Description                                            |
| :------- | :------------------------ | :----------------------------------------------------- |
| `GET`    | `/api/events`             | Fetches all events with their ticket counts.           |
| `POST`   | `/api/events`             | Creates a new event.                                   |
| `GET`    | `/api/events/[id]`        | Fetches a single event by its ID.                      |
| `PUT`    | `/api/events/[id]`        | Updates an existing event.                             |
| `DELETE` | `/api/events/[id]`        | Deletes an event (only if it has no tickets).          |
| `GET`    | `/api/tickets`            | Fetches all tickets with their associated event details. |
| `POST`   | `/api/tickets`            | Creates a new ticket for an event.                     |
| `POST`   | `/api/tickets/bulk`       | Creates multiple tickets from a data array.            |
| `GET`    | `/api/tickets/check/[code]` | Fetches a ticket by its unique code for validation.    |
| `GET`    | `/api/tickets/[id]`       | Fetches a single ticket by its ID.                     |
| `PUT`    | `/api/tickets/[id]`       | Updates a ticket's details or status (e.g., marks as used). |
| `DELETE` | `/api/tickets/[id]`       | Deletes a ticket.                                      |
