<script setup>
import SideBar from '@/components/SideBar.vue'
import HeaderLayout from '@/components/HeaderLayout.vue'
import MainContent from '@/components/MainContent.vue'
import { storeToRefs } from 'pinia'
import { useSideMenuStore } from '@/stores/sidemenu'
import { useRouter } from 'vue-router'
import { onMounted, onUnmounted, ref } from 'vue'
import { ElMessageBox } from 'element-plus'
const router = useRouter()
const sideMenuStore = useSideMenuStore()
const { handleClose } = sideMenuStore
const { layoutRight, isCollapse } = storeToRefs(sideMenuStore)
const counter = ref(0)
const logoutTime = ref(0)
logoutTime.value = Date.now() / 1000 + 600
let logoutTimer = null

const reflashTimer = () => {
  logoutTime.value = Date.now() / 1000 + 600
}
const open = () => {
  ElMessageBox.alert('System is about to log out, Please click "OK" resume', 'Title', {
    confirmButtonText: 'OK',
    callback: () => {
      reflashTimer()
    },
  })
}
const checkTime = () => {
  counter.value = parseInt(logoutTime.value) - parseInt(Date.now() / 1000)
  if (parseInt(logoutTime.value - Date.now() / 1000) == 30) open()
  if (Date.now() / 1000 >= logoutTime.value) {
    ElMessageBox.close()
    router.push({ name: 'login' })
    isCollapse.value = true
  }
}
const menuClose = () => {
  handleClose()
}
onMounted(() => {
  logoutTimer = setInterval(checkTime, 1000)
})
onUnmounted(() => {
  clearTimeout(logoutTimer)
})
</script>

<template>
  <header-layout @mousedown="reflashTimer" @click.stop="menuClose" />
  <div class="ems-layout" v-on="{ mousedown: reflashTimer }">
    <SideBar />
    <div ref="layoutRight" @click.stop="menuClose" class="layout-right">
      <main-content />
    </div>
    <!-- <p class="logout">{{ counter }}</p> -->
  </div>
</template>

<style lang="scss" scoped>
.ems-layout {
  position: relative;
  .sidebar {
    height: 100%;
    position: fixed;
    top: 0;
    left: 0;
    flex-shrink: 0;
    background-color: var(--primary);
    z-index: 99;
  }
  .layout-right {
    padding-left: 7.2rem;
    .main-content {
      width: 100%;
      height: calc(100vh - 60px);
    }
  }
  // .logout {
  //   bottom: 10px;
  //   left: 10px;
  //   font-size: 10px;
  //   position: fixed;
  //   color: #c5cdd8;
  //   z-index: 99;
  // }
}
</style>