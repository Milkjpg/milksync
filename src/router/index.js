import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '../components/HomePage.vue';
import CalendarPage from '../components/CalendarPage.vue';
import DashboardPage from '../components/DashboardPage.vue';

const routes = [
  { path: '/', component: HomePage },
  { path: '/calendar', component: CalendarPage },
  { path: '/dashboard', component: DashboardPage },
  { path: '/games', component: () => import('../components/GamesPage.vue') }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
