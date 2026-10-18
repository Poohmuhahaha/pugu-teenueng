import { createApp } from 'vue'
import { VueQueryPlugin } from '@tanstack/vue-query'
import App from './App.vue'
import '@huuk/style.css'
import './styles/pugu.css'
import { router } from './router'

createApp(App).use(router).use(VueQueryPlugin).mount('#app')
