<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { ref } from 'vue'
import { resyncCollection } from '@/resync_collection'
import { inject } from 'vue'

const isSyncingDatabaseData = ref(false)

const db = inject('db')

function syncDatabaseData() {
  if (isSyncingDatabaseData.value) {
    return
  }

  isSyncingDatabaseData.value = true

  resyncCollection(db, console.log)
    .catch((error) => {
      console.error(error)
    })
    .finally(() => {
      isSyncingDatabaseData.value = false
    })
}
</script>

<template>
  <div class="common-layout">
    <el-container>
      <el-header>
        <el-menu mode="horizontal" @select="handleSelect">
          <el-menu-item index="1">Processing Center</el-menu-item>
          <el-sub-menu index="2">
            <template #title>Workspace</template>
            <el-menu-item index="2-1">item one</el-menu-item>
            <el-menu-item index="2-2">item two</el-menu-item>
            <el-menu-item index="2-3">item three</el-menu-item>
            <el-sub-menu index="2-4">
              <template #title>item four</template>
              <el-menu-item index="2-4-1">item one</el-menu-item>
              <el-menu-item index="2-4-2">item two</el-menu-item>
              <el-menu-item index="2-4-3">item three</el-menu-item>
            </el-sub-menu>
          </el-sub-menu>
          <el-menu-item index="3" disabled>Info</el-menu-item>
          <el-menu-item index="4">Orders</el-menu-item>
        </el-menu>
      </el-header>
      <el-main>
        <RouterView />
      </el-main>
      <el-footer>Footer</el-footer>
    </el-container>
  </div>
</template>

<style scoped></style>
