<template>
  <router-view />
</template>

<script setup lang="ts">
// App component chỉ render router-view
// Layout và navigation được xử lý bởi MainLayout.vue
</script>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
    'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: #f9fafb;
}

#app {
  min-height: 100vh;
}

/* Global styles */
button {
  font-family: inherit;
}

input,
textarea,
select {
  font-family: inherit;
}

/* Scrollbar customization */
::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 5px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
