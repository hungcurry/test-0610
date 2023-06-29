<template>
  <div class="wrapper">
    <div class="ems-layout" v-on="{ mousedown: reflashTimer }">
      <side-bar class="side-bar" />
      <div class="layout-right">
        <header-layout :left_component="MStore.header_left_component" />
        <main-content />
      </div>
      <p class="logout">{{ logoutTime }}</p>
    </div>
  </div>
</template>

<script setup>
import SideBar from '../components/SideBar.vue'
import HeaderLayout from '../components/HeaderLayout.vue'
import MainContent from '../components/MainContent.vue'
import { useMStore } from "../stores/m_cloud"
import { useRouter } from "vue-router"
import { onMounted, onUnmounted, ref } from 'vue'
import { ElMessageBox } from 'element-plus'
const MStore = useMStore()
const router = useRouter()
const logoutTime = ref(600)

let logoutTimer = null

const reflashTimer = () => {
  logoutTime.value = 600
}

const open = () => {
  ElMessageBox.alert('即將登出, 請點擊OK恢復', 'Title', {
    confirmButtonText: 'OK',
    callback: () => { logoutTime.value = 600 }
  })
}

const checkTime = () => {
  logoutTime.value--
  if (logoutTime.value === 30) {
    open()
  }
  if (logoutTime.value <= 0) {
    ElMessageBox.close()
    router.push({ name: 'login' })
  }
}

onMounted(() => {
  logoutTimer = setInterval(checkTime, 1000)
})

onUnmounted(() => {
  clearTimeout(logoutTimer)
})

</script>


<style lang="scss">
.wrapper {
  height: 100vh;
  width: 100vw;
}

.ems-layout {
  width: 100%;
  height: 100%;
  display: flex;

  .side-bar {
    width: 300px;
    height: 100%;
  }

  .layout-right {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;

    .header-layout {
      width: 100%;
      height: 60px;
      background-color: #c5cdd8;
    }

    .main-content {
      width: 100%;
      height: calc(100% - 60px);

    }
  }
}
.logout{
  bottom: 10px;
  left :10px ;
  font-size: 10px;
  position: absolute;
  color: #c5cdd8;

}
</style>