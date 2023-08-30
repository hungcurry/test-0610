<script setup>
import i18n from '@/locales'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useSideMenuStore } from '@/stores/sidemenu'
import { useI18n } from "vue-i18n"
const route = useRoute()
const router = useRouter()
const reset_password_visible = ref(false)
const sideMenuStore = useSideMenuStore()
const { isCollapse } = storeToRefs(sideMenuStore)
const { t } = useI18n()

const changeLanguage = (lang) => {
  switch (lang) {
    case 'EN' :
      i18n.global.locale.value = 'en_us'
      break
    case 'ZH' :
      i18n.global.locale.value = 'zh_tw'
      break
    default:
      i18n.global.locale.value = 'en_us'
      break
  }
  localStorage.setItem("lang", i18n.global.locale.value)
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
  <nav class="header-layout overflow-x-auto">
    <div class="left-header flex-grow">
      <ul class="station_map list-none hidden md:flex items-center m-0 px-15px md:px-40px" v-if="route.path === '/station'">
        <!-- <div class="station_map" > -->
        <!-- <p>{{$t('account')}}</p> -->
        <li class="flex items-center mr-20px">
          <img class="w-36px mr-10px" src="@/assets/img/station_available.png" />
          <p class="text-16px text-blue-1200"> {{t('available')}}</p>
        </li>
        <li class="flex items-center mr-20px">
          <img class="w-36px mr-10px" src="@/assets/img/station_charging.png" />
          <p class="text-16px text-blue-1200"> {{ t('charging') }} </p>
        </li>
        <li class="flex items-center mr-20px">
          <img class="w-36px mr-10px" src="@/assets/img/station_offline.png" />
          <p class="text-16px text-blue-1200"> {{ t('offline') }} </p>
        </li>
        <li class="flex items-center mr-0px">
          <img class="w-36px mr-10px" src="@/assets/img/station_error.png" />
          <p class="text-16px text-blue-1200"> {{ t('error') }} </p>
        </li>
      </ul>
    </div>
    <div class="common-header shrink-0">
      <el-dropdown trigger="click">
        <el-button class="user">        
          <span class="material-symbols-outlined">translate</span>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="changeLanguage('EN')">English</el-dropdown-item>
            <el-dropdown-item @click="changeLanguage('ZH')">繁體中文</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <!-- <el-button class="gear"><font-awesome-icon icon="fa-solid fa-gear" /></el-button>
      <el-button class="bell m-0"><font-awesome-icon icon="fa-solid fa-bell" /></el-button> -->

      <el-dropdown trigger="click">
        <el-button class="user"><font-awesome-icon icon="fa-solid fa-user" /></el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="logOut()"> {{ t('log_out') }}</el-dropdown-item>
            <el-dropdown-item @click="resetPW()"> {{ t('reset_password') }}</el-dropdown-item>
            <el-dropdown-item @click="Admin_Info()"> {{t('admin_info')}}</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
    <PasswordModal :modal="reset_password_visible" @closeModal="emitCallBack" />
  </nav>
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
