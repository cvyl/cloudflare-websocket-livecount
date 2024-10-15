<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

// Reactive variables for WebSocket and real-time visitor tracking
const socket = ref(null);
const connectionStatus = ref('Disconnected');
const isConnected = ref(false);
const visitorCount = ref(0);         // Visitors in the current room
const totalVisitors = ref(0);        // Total visitors across all rooms
const activeRooms = ref({});         // Object storing active rooms and their visitor counts
const room = ref(window.location.pathname);  // Set the current room based on the URL path

// Determine the WebSocket URL based on the environment (http/https)
const wsBaseUrl = window.location.protocol === 'http:' 
  ? 'ws://localhost:8787'          // Development: localhost WebSocket
  : 'wss://demo-serverless-livecount-server.cvyl.workers.dev';  // Production: Live WebSocket

// Method to update connection status
const updateStatus = (status, connected) => {
  connectionStatus.value = status;
  isConnected.value = connected;
};

// Method to connect to the WebSocket server
const connectSocket = () => {
  socket.value = new WebSocket(wsBaseUrl + room.value);  // Use the current room slug in WebSocket URL

  // Handle WebSocket open event
  socket.value.addEventListener('open', () => {
    updateStatus('Connected', true);
    socket.value.send(JSON.stringify({ type: 'join' })); // Send join without room (room already bound to URL)
  });

  // Handle incoming WebSocket messages
  socket.value.addEventListener('message', (event) => {
    try {
      const messageData = JSON.parse(event.data);

      // Update the visitor count for the current room
      if (messageData.type === 'update/count' && messageData.room === room.value) {
        visitorCount.value = messageData.count;
      }

      // Update total visitors and active rooms across all rooms
      if (messageData.type === 'update/rooms') {
        activeRooms.value = messageData.rooms;
        totalVisitors.value = messageData.totalVisitors;
      }
    } catch (error) {
      console.error('Error parsing WebSocket message', error);
    }
  });

  // Handle WebSocket close event
  socket.value.addEventListener('close', () => {
    updateStatus('Disconnected', false);
  });

  // Handle WebSocket error event
  socket.value.addEventListener('error', (error) => {
    console.error('WebSocket Error:', error);
    updateStatus('Error', false);
  });
};

// Lifecycle hook: Connect to WebSocket when component is mounted
onMounted(() => {
  connectSocket();
});

// Lifecycle hook: Ensure the WebSocket is closed when the component is unmounted
onBeforeUnmount(() => {
  if (socket.value && socket.value.readyState === WebSocket.OPEN) {
    socket.value.close();
  }
});
</script>

<template>
  <div>
    <h1>Real-time Visitor Counter</h1>
    <div :class="['status', { disconnected: !isConnected }]">
      Status: {{ connectionStatus }}
    </div>
    <div>Room: {{ room }}</div>
    <div>
      Visitor Count (current room): <span>{{ visitorCount }}</span>
    </div>
    <div>
      Total Visitors (all rooms): <span>{{ totalVisitors }}</span>
    </div>
    <div>Active Rooms:</div>
    <ul>
      <li v-for="(count, room) in activeRooms" :key="room">{{ room }}: {{ count }} visitors</li>
    </ul>
  </div>
</template>

<style scoped>
.status {
  margin-top: 10px;
  color: green;
}
.status.disconnected {
  color: red;
}
ul {
  margin-top: 20px;
}
</style>
