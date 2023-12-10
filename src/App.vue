<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { ref } from 'vue'
</script>

<template>
  <div class="common-layout">
    <el-container>
      <el-header>
        <el-menu mode="horizontal" :ellipsis="false" router>
          <el-menu-item index="1" :route="{ name: 'home' }">Plateaux aux Conjurés</el-menu-item>
          <div class="flex-grow" />
          <el-menu-item index="2" :route="{ name: 'about' }">About</el-menu-item>
        </el-menu>
      </el-header>
      <el-main>
        <RouterView />
      </el-main>
      <el-footer>Footer</el-footer>
    </el-container>
  </div>
</template>

<style scoped>
.flex-grow {
  flex-grow: 1;
}
</style>
