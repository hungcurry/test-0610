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
  Edit,
  View,
} from '@element-plus/icons-vue'
import { useI18n } from "vue-i18n"
const { t } = useI18n()
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
        <span> {{t('dashboard')}}</span>
      </template>
    </el-menu-item>
    <el-menu-item v-if="user === 'AdminUser' || user === undefined" index="payment">
      <el-icon class="opacity-50"><Postcard /></el-icon>
      <template #title>
        <span>{{t('payment')}}</span>
      </template>
    </el-menu-item>

    <el-sub-menu index="station">
      <template #title>
        <el-icon class="opacity-70"><Location /></el-icon>
        <span>{{t('evse_management')}}</span>
      </template>
      <el-menu-item class="collapse" index="station" :route="{ path: 'station' }"
        >{{t('by_station')}}</el-menu-item
      >
      <el-menu-item class="collapse" index="evse">{{t('by_evse')}}</el-menu-item>
      <el-menu-item class="collapse" index="rate-plan">{{t('rate_plan')}}</el-menu-item>
    </el-sub-menu>

    <el-sub-menu index="administrator">
      <template #title>
        <el-icon class="opacity-50"><UserFilled /></el-icon>
        <span>{{t('account_management')}}</span>
      </template>
      <el-menu-item class="collapse" index="user">{{t('rfid_user_app_member')}}</el-menu-item>
      <el-menu-item class="collapse" v-if="company === 'MSI'" index="company"
        >{{t('company_cpo')}}</el-menu-item
      >
      <el-menu-item class="collapse" index="administrator">
        {{t('m_cloud_administrator')}}</el-menu-item
      >
    </el-sub-menu>

    <el-sub-menu index="evse-log">
      <template #title>
        <el-icon class="opacity-70"><Calendar /></el-icon>
        <span>{{t('log_monitor')}}</span>
      </template>
      <el-menu-item class="collapse" index="evse-log">{{t('evse_log')}}</el-menu-item>
      <el-menu-item class="collapse" index="ocpp-error">{{t('error_log')}}</el-menu-item>
    </el-sub-menu>

    <el-menu-item index="software-info">
      <el-icon class="opacity-50"><InfoFilled /></el-icon>
      <template #title>
        <span>{{t('softwart_info')}}</span>
      </template>
    </el-menu-item>

    <el-menu-item v-if="company === 'MSI'" index="parking">
      <el-icon class="opacity-70"><View /></el-icon>
      <template #title>
        <span>{{t('parking')}}</span>
      </template>
    </el-menu-item>


    <el-menu-item v-if="company === 'MSI'" index="program">
      <el-icon class="opacity-70"><EditPen /></el-icon>
      <template #title>
        <span>{{t('program')}}</span>
      </template>
    </el-menu-item>

    <el-menu-item v-if="dev_member" index="charging-profile">
      <el-icon class="opacity-70"><Edit /></el-icon>
      <template #title>
        <span>{{t('charging_profile')}}</span>
      </template>
    </el-menu-item>

    <el-menu-item v-if="dev_member" index="test">
      <el-icon><Timer /></el-icon>
      <template #title>
        <span>Test</span>
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
// 第二層選單padding
.el-menu--vertical:not(.el-menu--collapse):not(.el-menu--popup-container)
  .el-menu-item.collapse {
  padding-left: 5rem;
}
</style>
