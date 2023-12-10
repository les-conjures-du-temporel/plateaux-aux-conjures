<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="common-layout">
    <el-container>
      <el-header class="header">
        <el-menu mode="horizontal" :ellipsis="false" router :default-active="$route.name">
          <el-menu-item index="home" :route="{ name: 'home' }">Plateaux aux Conjurés</el-menu-item>
          <div class="flex-grow" />
          <el-menu-item index="about" :route="{ name: 'about' }">About</el-menu-item>
        </el-menu>
      </el-header>
      <el-main>
        <RouterView />
      </el-main>
      <el-footer class="footer">
        &copy; 2023 les conjurés du temporel
      </el-footer>
    </el-container>
  </div>
</template>

<style scoped>
.flex-grow {
  flex-grow: 1;
}

.header {
  padding: 0;
}

.footer {
  font-size: smaller;
  color: #333;
  text-align: right;
}
</style>
