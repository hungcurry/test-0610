<script setup>
import { onMounted, ref, watch } from 'vue'
import { useMStore } from '../stores/m_cloud'
import { storeToRefs } from 'pinia'
import { useSideMenuStore } from '@/stores/sidemenu'
import { useRoute } from 'vue-router'
import {
  Menu as IconMenu,
  Calendar,
  Postcard,
  Location,
  UserFilled,
  InfoFilled,
  EditPen,
  View,
} from '@element-plus/icons-vue'
const MStore = useMStore()
const company = MStore?.permission?.company?.name
const user = MStore?.permission?.user?.name
const dev_member = ref(false)
const sideMenuStore = useSideMenuStore()
const route = useRoute()
const path = ref('')
const { isCollapse } = storeToRefs(sideMenuStore)

const pathResetHandler = () => {
  path.value = route.path
  watch(
    () => route.path,
    (newV) => {
      path.value = newV
    }
  )
  path.value = path.value.slice(1)
}
onMounted(async () => {
  if (
    MStore.user_data.first_name === 'Steven'
  ) {
    dev_member.value = true
  }
  pathResetHandler()
})
</script>

<template>
  <el-menu
    :default-active="path"
    class="el-menu-vertical-demo"
    text-color="#fff"
    active-text-color="#61a8d8"
    router
    :collapse="isCollapse"
  >
    <el-menu-item index="dashboard">
      <el-icon class="opacity-70"><icon-menu /></el-icon>
      <template #title>
        <span>Dashboard</span>
      </template>
    </el-menu-item>
    <el-menu-item v-if="user === 'AdminUser' || user === undefined" index="payment">
      <el-icon class="opacity-50"><Postcard /></el-icon>
      <template #title>
        <span>Payment</span>
      </template>
    </el-menu-item>

    <el-sub-menu index="station">
      <template #title>
        <el-icon class="opacity-70"><Location /></el-icon>
        <span>EVSE Management</span>
      </template>
      <el-menu-item class="collapse" index="station" :route="{ path: 'station' }"
        >By Station</el-menu-item
      >
      <el-menu-item class="collapse" index="evse">By EVSE</el-menu-item>
      <el-menu-item class="collapse" index="rate-plan">Rate Plan</el-menu-item>
    </el-sub-menu>

    <el-sub-menu index="administrator">
      <template #title>
        <el-icon class="opacity-50"><UserFilled /></el-icon>
        <span>Account Management</span>
      </template>
      <el-menu-item class="collapse" index="user">RFID User / App Member</el-menu-item>
      <el-menu-item class="collapse" v-if="company === 'MSI'" index="company"
        >Company / CPO</el-menu-item
      >
      <el-menu-item class="collapse" index="administrator">
        m-Cloud Administrator</el-menu-item
      >
    </el-sub-menu>

    <el-sub-menu index="evse-log">
      <template #title>
        <el-icon class="opacity-70"><Calendar /></el-icon>
        <span>Log Monitor</span>
      </template>
      <el-menu-item class="collapse" index="evse-log">EVSE Log</el-menu-item>
      <el-menu-item class="collapse" index="ocpp-error"> Error Log </el-menu-item>
    </el-sub-menu>

    <el-menu-item index="software-info">
      <el-icon class="opacity-50"><InfoFilled /></el-icon>
      <template #title>
        <span>Software Info</span>
      </template>
    </el-menu-item>

    <el-menu-item v-if="company === 'MSI'" index="parking">
      <el-icon class="opacity-70"><View /></el-icon>
      <template #title>
        <span>Parking</span>
      </template>
    </el-menu-item>

    <!-- <el-menu-item v-if="dev_member" index="test">
      <el-icon><Timer /></el-icon>
      <template #title>
        <span>Test</span>
      </template>
    </el-menu-item> -->

    <el-menu-item v-if="company === 'MSI'" index="program">
      <el-icon class="opacity-70"><EditPen /></el-icon>
      <template #title>
        <span>Program</span>
      </template>
    </el-menu-item>
  </el-menu>
</template>

<style lang="scss">
.el-menu-item,
.el-sub-menu {
  margin: 0;
  margin-bottom: 1.2rem;
  font-size: 1.5rem;
  span {
    font-size: 1.5rem;
  }
}
.el-menu,
.el-sub-menu {
  border: 0;
  background-color: var(--primary);
}
.el-menu-item:hover {
  background-color: var(--black-200) !important;
  border-left: 0.8rem solid var(--secondary);
}
.el-menu-item.is-active {
  font-weight: 700;
}
.el-sub-menu__title:hover {
  padding-right: 2.2rem;
  border-left: 0.8rem solid var(--secondary);
}
.el-menu-vertical-demo:not(.el-menu--collapse) {
  width: 29.5rem;
  min-height: 40rem;
}
.el-menu-item.is-active i {
  opacity: 1;
}
// �ĤG�h���padding
.el-menu--vertical:not(.el-menu--collapse):not(.el-menu--popup-container)
  .el-menu-item.collapse {
  padding-left: 5rem;
}
</style>
