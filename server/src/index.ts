interface Env {
	counter: DurableObjectNamespace;
	nameId: string; // The environment variable from which we will get the counter ID
  }

  export class Counter {
	private connsByRoom: Map<string, Map<WebSocket, string>> = new Map();  // Map to store clients and their IDs per room
	private roomCounts: Map<string, number> = new Map();                    // Store visitor count per room
	private totalVisitors = 0;                                              // Track total number of visitors

	constructor(private state: DurableObjectState, private env: Env) {}

	// Generate a unique random ID for each user
	private generateClientId(): string {
	  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
	}

	// Broadcast message to all clients in a specific room
	private broadcast(room: string, message: any) {
	  const roomConns = this.connsByRoom.get(room);
	  if (!roomConns) return;

	  for (const [conn, clientId] of roomConns) {
		try {
		  conn.send(JSON.stringify({ ...message, clientId }));
		} catch {
		  roomConns.delete(conn);  // Remove closed connections
		}
	  }
	}

	// Broadcast the total count and active rooms to all clients in all rooms
	private broadcastToAll(message: any) {
	  for (const [room, conns] of this.connsByRoom.entries()) {
		for (const conn of conns.keys()) {
		  try {
			conn.send(JSON.stringify(message));
		  } catch {
			conns.delete(conn);
		  }
		}
	  }
	}

	// Increment visitor count for a room and broadcast it
	async increment(room: string) {
	  const count = this.roomCounts.get(room) ?? 0;
	  const newCount = count + 1;
	  this.roomCounts.set(room, newCount);
	  this.totalVisitors++;
	  this.state.storage.put(room, newCount);

	  // Broadcast updated count to this room
	  this.broadcast(room, { type: "update/count", room, count: newCount });
	  // Broadcast total visitors and active rooms to all clients
	  this.broadcastToAll({
		type: "update/rooms",
		rooms: Object.fromEntries(this.roomCounts),
		totalVisitors: this.totalVisitors,
	  });

	  return newCount;
	}

	// Decrement visitor count for a room and broadcast it
	async decrement(room: string) {
	  const count = this.roomCounts.get(room) ?? 0;
	  const newCount = Math.max(0, count - 1); // Ensure count doesn't go below 0
	  if (newCount === 0) {
		this.roomCounts.delete(room); // Remove room if no users left
	  } else {
		this.roomCounts.set(room, newCount);
	  }
	  this.totalVisitors = Math.max(0, this.totalVisitors - 1);  // Ensure total visitors doesn't go below 0
	  this.state.storage.put(room, newCount);

	  // Broadcast updated count to this room
	  this.broadcast(room, { type: "update/count", room, count: newCount });
	  // Broadcast total visitors and active rooms to all clients
	  this.broadcastToAll({
		type: "update/rooms",
		rooms: Object.fromEntries(this.roomCounts),
		totalVisitors: this.totalVisitors,
	  });

	  return newCount;
	}

	// Handle incoming WebSocket connections
	async fetch(request: Request) {
	  const [client, server] = Object.values(new WebSocketPair());

	  // Extract the room from the request's URL
	  const url = new URL(request.url);
	  const room = url.pathname || "/";  // Default to root room if no path

	  server.addEventListener("message", async (event: MessageEvent) => {
		const data = typeof event.data === 'string' ? event.data : new TextDecoder().decode(event.data);
		const action = JSON.parse(data);

		if (action.type === "join") {
		  const clientId = this.generateClientId();  // Generate a unique ID for each client
		  this.addConnection(room, server, clientId); // Add connection to the room
		  const newCount = await this.increment(room);
		  this.broadcast(room, { type: "update/count", room, count: newCount });
		} else if (action.type === "message") {
		  this.broadcast(room, { type: "message", payload: action.payload });
		}
	  });

	  server.addEventListener("close", async () => {
		// Remove only this specific connection and decrement count
		await this.removeConnection(server, room);
	  });

	  server.accept();

	  return new Response(null, {
		status: 101,
		webSocket: client,
	  });
	}

	// Add a connection to a specific room with a unique client ID
	private addConnection(room: string, conn: WebSocket, clientId: string) {
	  if (!this.connsByRoom.has(room)) {
		this.connsByRoom.set(room, new Map());
	  }
	  this.connsByRoom.get(room)?.set(conn, clientId);
	}

	// Remove a connection from all rooms
	private async removeConnection(conn: WebSocket, room: string) {
	  const conns = this.connsByRoom.get(room);
	  if (conns && conns.has(conn)) {
		conns.delete(conn);  // Remove only this connection
		await this.decrement(room);  // Decrement count when a user disconnects
	  }
	}
  }

  // Handle WebSocket connections
  async function handleRequest(request: Request, env: Env) {
	const upgradeHeader = request.headers.get("Upgrade");

	if (!upgradeHeader || upgradeHeader !== "websocket") {
	  return new Response("Expected Upgrade: websocket", { status: 426 });
	}

	// Use the env variable for counter ID (grab from vars)
	const counterId = env.counter.idFromName(env.nameId); // Dynamic room ID from environment variable
	const counter = env.counter.get(counterId);

	return await counter.fetch(request);
  }

  export default {
	fetch: handleRequest,
  };
