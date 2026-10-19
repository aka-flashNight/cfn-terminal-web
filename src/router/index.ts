import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import ConfigWindow from '../views/ConfigWindow.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/config',
    name: 'ConfigWindow',
    component: ConfigWindow
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
