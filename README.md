# Real-time Visitor Counter in Turbo Monorepo

This project is a **real-time visitor counter** built using **Vue 3**, **Vite**, **Cloudflare Durable Objects**, and WebSockets, all organized within a **Turbo Monorepo**. The app tracks visitors in real-time across different "rooms" (URLs) and displays total visitors across all active rooms.

## Demo

<https://demo-serverless-livecount-client.pages.dev>

## Project Overview

This project is organized as a monorepo using **Turborepo** for managing both the front-end (Vue app) and back-end (Cloudflare Worker) within a single repository. The Vue application interacts with a Cloudflare Worker, which uses Durable Objects to track active rooms and visitors in real-time.

- **Frontend**: Vue 3 + Vite
- **Backend**: Cloudflare Workers + Durable Objects
- **Monorepo Tool**: Turborepo

## Features

- Real-time visitor counting per room (each unique URL is treated as a room).
- Total visitor count across all active rooms.
- WebSocket-based communication between Vue front-end and Cloudflare Worker.
- Dynamic switching between local (development) and production WebSocket servers.
- Turbo Monorepo structure for efficient builds and management.

## Prerequisites

- **Node.js** and **pnpm** installed.
- **Cloudflare Account** with Workers enabled.
- **Turborepo** installed globally:

  ```bash
  pnpm install turbo -g
  ```

## Project Structure

```sh
.
| 
├── client/                # Vue 3 app with Vite
├── server/                # Cloudflare Worker with Durable Objects
├── turbo.json             # Turbo configuration file
├── package.json           # Root package.json for managing dependencies
└── README.md              # This README file
```

## Installation

### 1. Clone the Repository

### 2. Install Dependencies

Install dependencies for the entire monorepo:

```bash
pnpm install
```

### 3. Install Turbo CLI & Wrangler (If you haven't already)

```bash
pnpm install turbo -g
pnpm install wrangler -g
```

### 4. Configure Cloudflare Worker

```bash
wrangler login
```

And edit the `wrangler.toml` file in both `server/` and `client/`.

## Running Locally

```bash
turbo dev
```

This will start the Cloudflare Worker on `http://localhost:8787`.

### 3. WebSocket Behaviour

The application is designed to switch between WebSocket URLs depending on the environment:

- **Development**: Uses `ws://localhost:8787` for WebSockets.
- **Production**: Uses `wss://your-worker-url.workers.dev` for WebSockets (edit in client).

## Deployment

### Deploy the Repository

Navigate to the `apps/worker` directory:

```bash
turbo deploy
```

## Environment Variables

### Cloudflare Worker (`wrangler.toml`)

```toml
[vars]
nameId = "your-domain.com"
```

This variable is used by the worker to dynamically assign a `counterId`.

## Testing

1. Open the Vue frontend at `http://localhost:5175`.
2. Open multiple browser tabs or devices to see real-time visitor counts update dynamically.
3. Ensure rooms are created dynamically based on the URL (e.g., `/about`, `/contact`).

## Troubleshooting

- If you experience issues with WebSocket connections, ensure that:
  - The WebSocket URL is correctly pointing to either `localhost:8787` (for dev) or your Cloudflare Worker URL (for production).
  - Your Cloudflare Worker is deployed and accessible.

## Licence

This project is licensed under the MIT Licence.

## Contributing

Feel free to fork this repository and submit pull requests if you'd like to contribute!

---

### Key Sections

1. **Overview**: Explains what the project is.
2. **Installation**: How to set up the project locally and run it.
3. **Deployment**: Instructions for deploying both the front-end and the Cloudflare Worker.
4. **Environment Variables**: Documented where to configure environment variables, especially for the worker.
5. **Troubleshooting**: Common issues with WebSocket connections and how to resolve them.
