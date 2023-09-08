<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { useMStore } from '../stores/m_cloud'
import { storeToRefs } from 'pinia'
import { useSideMenuStore } from '@/stores/sidemenu'
import { useRoute } from 'vue-router'
import { m_cloud_permission } from '@/composables/permission'
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
  Timer,
} from '@element-plus/icons-vue'
import { useI18n } from "vue-i18n"
const { t } = useI18n()
const MStore = useMStore()
const company = MStore?.permission?.company?.name
const user_permission_name = MStore?.permission?.user?.name
const dev_member = ref(false)
const sideMenuStore = useSideMenuStore()
const route = useRoute()
const path = ref('')
const { isCollapse } = storeToRefs(sideMenuStore)

let  user_permission = reactive({})

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
  let value = m_cloud_permission[user_permission_name]
  console.log(value)
  if (value !== undefined)
    user_permission = value
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
    <el-menu-item v-if="(user_permission.Dashboard ==='O') || user_permission_name === undefined" index="dashboard">
      <el-icon class="opacity-70"><icon-menu /></el-icon>
      <template #title>
        <span> {{t('dashboard')}}</span>
      </template>
    </el-menu-item>
    <el-menu-item v-if="(user_permission.Payment ==='O') || user_permission_name === undefined" index="payment">
      <el-icon class="opacity-50"><Postcard /></el-icon>
      <template #title>
        <span>{{t('payment')}}</span>
      </template>
    </el-menu-item>

    <el-sub-menu v-if="(user_permission.Station ==='O') || (user_permission.EVSE ==='O') || (user_permission.RatePlan ==='O') || user_permission_name === undefined" index="station">
      <template #title>
        <el-icon class="opacity-70"><Location /></el-icon>
        <span>{{t('evse_management')}}</span>
      </template>
      <el-menu-item v-if="(user_permission.Station ==='O') || user_permission_name === undefined" class="collapse" index="station" :route="{ path: 'station' }"
        >{{t('by_station')}}</el-menu-item
      >
      <el-menu-item v-if="(user_permission.EVSE ==='O') || user_permission_name === undefined" class="collapse" index="evse">{{t('by_evse')}}</el-menu-item>
      <el-menu-item v-if="(user_permission.RatePlan ==='O') || user_permission_name === undefined" class="collapse" index="rate-plan">{{t('rate_plan')}}</el-menu-item>
    </el-sub-menu>

    <el-sub-menu index="administrator" v-if="(user_permission.User ==='O') || (user_permission.Company ==='O') || (user_permission.Administrator ==='O') || user_permission_name === undefined">
      <template #title>
        <el-icon class="opacity-50"><UserFilled /></el-icon>
        <span>{{t('account_management')}}</span>
      </template>
      <el-menu-item v-if="(user_permission.User ==='O') || user_permission_name === undefined" class="collapse" index="user">{{t('rfid_user_app_member')}}</el-menu-item>
      <el-menu-item class="collapse" v-if="company === 'MSI' && ((user_permission.Company ==='O') || user_permission_name === undefined)" index="company"
        >{{t('company_cpo')}}</el-menu-item
      >
      <el-menu-item v-if="(user_permission.Administrator ==='O') || user_permission_name === undefined" class="collapse" index="administrator">
        {{t('m_cloud_administrator')}}</el-menu-item
      >
    </el-sub-menu>
    
    <el-sub-menu index="evse-log" v-if="(user_permission.EVSELog ==='O') || (user_permission.ErrorLog ==='O') || user_permission_name === undefined">
      <template #title>
        <el-icon class="opacity-70"><Calendar /></el-icon>
        <span>{{t('log_monitor')}}</span>
      </template>
      <el-menu-item v-if="(user_permission.EVSELog ==='O') || user_permission_name === undefined" class="collapse" index="evse-log">{{t('evse_log')}}</el-menu-item>
      <el-menu-item v-if="(user_permission.ErrorLog ==='O') || user_permission_name === undefined" class="collapse" index="error-log">{{t('error_log')}}</el-menu-item>
    </el-sub-menu>

    <el-menu-item v-if="(user_permission.SoftwareInfo ==='O') || user_permission_name === undefined" index="software-info">
      <el-icon class="opacity-50"><InfoFilled /></el-icon>
      <template #title>
        <span>{{t('softwart_info')}}</span>
      </template>
    </el-menu-item>

    <el-menu-item v-if="company === 'MSI' && ((user_permission.Parking ==='O') || user_permission_name === undefined)" index="parking">
      <el-icon class="opacity-70"><View /></el-icon>
      <template #title>
        <span>{{t('parking')}}</span>
      </template>
    </el-menu-item>

    <el-menu-item v-if="company === 'MSI' && ((user_permission.Program ==='O') || user_permission_name === undefined)" index="program">
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

    <el-menu-item  v-if="dev_member" index="permission">
      <el-icon class="opacity-70"><Edit /></el-icon>
      <template #title>
        <span>{{t('permission')}}</span>
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
