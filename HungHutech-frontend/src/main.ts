/**
 * Hung Hutech - Hệ thống Quản lý Nhân sự
 * Copyright (C) 2024 Hung Hutech
 */

import {createApp} from 'vue';
import App from './App.vue';
import router from './router';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import '@/assets/styles/theme.scss';

const app = createApp(App);

// Register all Element Plus icons
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

// Use Element Plus UI Library
app.use(ElementPlus);

// Sử dụng router
app.use(router);

// @ts-expect-error: appGlobal is not in window object by default
const baseUrl = window.appGlobal?.baseUrl || 'http://localhost:5000';

app.config.globalProperties.global = {
  baseUrl,
};

app.mount('#app');
