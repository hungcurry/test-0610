<script setup>
import i18n from '@/locales'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
const route = useRoute()
const router = useRouter()
const reset_password_visible = ref(false)

const English = () => {
  i18n.global.locale.value = 'en_us'
}
const Chinese = () => {
  i18n.global.locale.value = 'zh_tw'
}
const Personal_Info = () => {
  router.push({ name: 'user' })
}
const logOut = () => {
  router.push({ name: 'login' })
}
const resetPW = () => {
  reset_password_visible.value = true
}
const emitCallBack = (res) => {
  reset_password_visible.value = res
}
</script>

<template>
  <div class="header-layout">
    <div class="left-header">
      <div class="station_map" v-if="route.path === '/station'">
        <!-- <div class="station_map" > -->
        <img src="@/assets/img/station_available.png" />
        <!-- <p>{{$t('account')}}</p> -->
        <p>Available</p>
        <img src="@/assets/img/station_charging.png" />
        <p>Charging / Full Charged</p>
        <img src="@/assets/img/station_offline.png" />
        <p>Offline</p>
        <img src="@/assets/img/station_error.png" />
        <p>Error</p>
      </div>
    </div>
    <div class="common-header">
      <!-- <el-dropdown>
        <el-button class="user"><font-awesome-icon icon="fa-solid fa-user" /></el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="English()">English</el-dropdown-item>
            <el-dropdown-item @click="Chinese()">�c��</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown> -->

      <!-- <el-button class="gear"><font-awesome-icon icon="fa-solid fa-gear" /></el-button>
      <el-button class="bell"><font-awesome-icon icon="fa-solid fa-bell" /></el-button> -->

      <el-dropdown trigger="click">
        <el-button class="user"><font-awesome-icon icon="fa-solid fa-user" /></el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="logOut()">Log Out</el-dropdown-item>
            <el-dropdown-item @click="resetPW()">Reset Password</el-dropdown-item>
            <!-- <el-dropdown-item @click="Personal_Info()">Personal Info</el-dropdown-item> -->
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
  z-index: 98;
  .station_map {
    display: flex;
    align-items: center;
    margin-left: 20px;
    img {
      width: 36px;
      height: 36px;
    }
    p {
      font-size: 18px;
      margin-right: 40px;
      color: #414c58;
    }
  }
  .gear {
    width: 60px;
    height: 60px;
    background-color: transparent;
    border-style: none;
  }
  .bell {
    width: 60px;
    height: 60px;
    background-color: transparent;
    border-style: none;
  }
  .user {
    width: 60px;
    height: 60px;
    background-color: transparent;
    border-style: none;
  }
}
</style>
