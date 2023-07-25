<script setup>
import i18n from '@/locales'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useSideMenuStore } from '@/stores/sidemenu'
const route = useRoute()
const router = useRouter()
const reset_password_visible = ref(false)
const sideMenuStore = useSideMenuStore()
const { isCollapse } = storeToRefs(sideMenuStore)

const English = () => {
  i18n.global.locale.value = 'en_us'
}
const Chinese = () => {
  i18n.global.locale.value = 'zh_tw'
}
const Admin_Info = () => {
  router.push({ name: 'adminInfo' })
}
const logOut = () => {
  router.push({ name: 'login' })
  isCollapse.value = true
}
const resetPW = () => {
  reset_password_visible.value = true
}
const emitCallBack = (res) => {
  reset_password_visible.value = res
}
</script>

<template>
  <div class="header-layout overflow-x-auto">
    <div class="left-header flex-grow">
      <ul class="station_map list-none hidden md:flex items-center m-0 px-15px md:px-40px" v-if="route.path === '/station'">
        <!-- <div class="station_map" > -->
        <!-- <p>{{$t('account')}}</p> -->
        <li class="flex items-center mr-20px">
          <img class="w-36px mr-10px" src="@/assets/img/station_available.png" />
          <p class="text-16px text-blue-1200">Available</p>
        </li>
        <li class="flex items-center mr-20px">
          <img class="w-36px mr-10px" src="@/assets/img/station_charging.png" />
          <p class="text-16px text-blue-1200">Charging</p>
        </li>
        <li class="flex items-center mr-20px">
          <img class="w-36px mr-10px" src="@/assets/img/station_offline.png" />
          <p class="text-16px text-blue-1200">Offline</p>
        </li>
        <li class="flex items-center mr-0px">
          <img class="w-36px mr-10px" src="@/assets/img/station_error.png" />
          <p class="text-16px text-blue-1200">Error</p>
        </li>
      </ul>
    </div>
    <div class="common-header shrink-0">
      <!-- <el-dropdown>
        <el-button class="user"><font-awesome-icon icon="fa-solid fa-user" /></el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="English()">English</el-dropdown-item>
            <el-dropdown-item @click="Chinese()">繁體中文</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown> -->

      <!-- <el-button class="gear"><font-awesome-icon icon="fa-solid fa-gear" /></el-button>
      <el-button class="bell m-0"><font-awesome-icon icon="fa-solid fa-bell" /></el-button> -->

      <el-dropdown trigger="click">
        <el-button class="user"><font-awesome-icon icon="fa-solid fa-user" /></el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="logOut()">Log Out</el-dropdown-item>
            <el-dropdown-item @click="resetPW()">Reset Password</el-dropdown-item>
            <el-dropdown-item @click="Admin_Info()">Admin Info</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
  <PasswordModal :modal="reset_password_visible" @closeModal="emitCallBack" />
</template>

<style lang="scss" scoped>
.header-layout {
  width: 100%;
  height: 60px;
  background-color: #c5cdd8;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  right: 0;
  z-index: 90;
  .gear,.bell,.user {
    width: 60px;
    height: 60px;
    background-color: transparent;
    border-style: none;
  }
  .el-button + .el-button {
    margin-left: 0px;
  }
}
</style>
