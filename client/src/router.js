import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue'; // Or any component you want to render

const routes = [
  {
    path: '/pages/:slug(.*)*', // Match any /pages/... route pattern
    component: App,
  },
  {
    path: '/:catchAll(.*)',    // Match any other routes (fallback)
    component: App,           // You can use a different component here if needed
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
