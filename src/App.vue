<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="common-layout">
    <el-container>
      <el-header class="header">
        <el-menu
          default-active="home"
          mode="horizontal"
          menu-trigger="click"
          router
        >
          <el-sub-menu index="1">
            <template #title>Plateaux aux conjurés</template>
            <el-menu-item index="home" :route="{name: 'home'}">Jeux du moment</el-menu-item>
            <el-menu-item index="about" :route="{name: 'about'}">A propos</el-menu-item>
          </el-sub-menu>
        </el-menu>
      </el-header>
      <el-main>
        <RouterView />
      </el-main>
      <el-footer class="footer"> &copy; 2023 les conjurés du temporel</el-footer>
    </el-container>
  </div>
</template>

<style scoped>
.header {
  padding: 0;
}

.footer {
  font-size: smaller;
  color: #333;
  text-align: right;
}

.submenu {
  color: red;
  background-color: red;
  z-index: 1000;
  position: relative;
}
</style>
