<script setup>
import { useMStore } from '../stores/m_cloud'
import { storeToRefs } from 'pinia'
import { useSideMenuStore } from '@/stores/sidemenu'
import { useRoute } from 'vue-router'
import { useI18n } from "vue-i18n"

const { t } = useI18n()
const MStore = useMStore()
const sideMenuStore = useSideMenuStore()
const route = useRoute()
const path = route.path.slice(1)
const { isCollapse } = storeToRefs(sideMenuStore)

let dev_member = false

if ( MStore.user_data.first_name === 'Steven') {
  dev_member = true  
}

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
    <el-menu-item v-if="MStore.rule_permission.Dashboard.page === 'O' || MStore.permission.isCompany" index="dashboard">
      <el-icon class="opacity-70"><Menu /></el-icon>
      <template #title>
        <span> {{t('dashboard')}}</span>
      </template>
    </el-menu-item>
    <el-menu-item v-if="MStore.rule_permission.Payment.page === 'O' || MStore.permission.isCompany" index="payment">
      <el-icon class="opacity-50"><Postcard /></el-icon>
      <template #title>
        <span>{{t('payment')}}</span>
      </template>
    </el-menu-item>

    <el-menu-item v-if="MStore.permission.isMSI === false && (MStore.rule_permission.RfidUser.page === 'O' || MStore.permission.isCompany)" index="rfid-user">
      <el-icon class="opacity-50"><UserFilled /></el-icon>
      <template #title>
        <span> {{t('rfid_user')}}</span>
      </template>
    </el-menu-item>

    <el-sub-menu v-if="MStore.rule_permission.Station === 'O' || MStore.rule_permission.EVSE.page === 'O' || MStore.rule_permission.RatePlan.page === 'O' || MStore.permission.isCompany" index="station">
      <template #title>
        <el-icon class="opacity-70"><Location /></el-icon>
        <span>{{t('evse_management')}}</span>
      </template>
      <el-menu-item v-if="MStore.rule_permission.Station.page === 'O' || MStore.permission.isCompany" class="collapse" index="station">{{t('by_station')}}</el-menu-item>
      <el-menu-item v-if="MStore.rule_permission.EVSE.page === 'O' || MStore.permission.isCompany" class="collapse" index="evse">{{t('by_evse')}}</el-menu-item>
      <el-menu-item v-if="MStore.rule_permission.RatePlan.page === 'O' || MStore.permission.isCompany" class="collapse" index="rate-plan">{{t('rate_plan')}}</el-menu-item>
      <el-menu-item v-if="MStore.rule_permission.ChargingProfile.page === 'O'" class="collapse" index="charging-profile">{{t('charging_profile')}}</el-menu-item>
    </el-sub-menu>
   
    <el-sub-menu index="evse-log" v-if="MStore.rule_permission.EVSELog.page === 'O' || MStore.rule_permission.ErrorLog.page === 'O' || MStore.permission.isCompany">
      <template #title>
        <el-icon class="opacity-70"><Calendar /></el-icon>
        <span>{{t('log_monitor')}}</span>
      </template>
      <el-menu-item v-if="MStore.rule_permission.EVSELog.page === 'O' || MStore.permission.isCompany" class="collapse" index="evse-log">{{t('evse_log')}}</el-menu-item>
      <el-menu-item v-if="MStore.rule_permission.ErrorLog.page === 'O' || MStore.permission.isCompany" class="collapse" index="error-log">{{t('error_log')}}</el-menu-item>
      <el-menu-item v-if="MStore.rule_permission.Parking.page === 'O' || MStore.permission.isCompany" class="collapse" index="parking">{{t('parking')}}</el-menu-item>
    </el-sub-menu>

    <el-sub-menu index="advanced-setting" v-if="MStore.permission.isMSI">
      <template #title>
        <el-icon class="opacity-50"><InfoFilled /></el-icon>
        <span>{{t('advanced_setting')}}</span>
      </template>
      <el-menu-item v-if="MStore.rule_permission.User.page === 'O' || MStore.permission.isCompany" class="collapse" index="user">{{t('app_member')}}</el-menu-item>
      <el-menu-item v-if="MStore.rule_permission.Company.page === 'O' || MStore.permission.isCompany" class="collapse" index="company">{{t('company_cpo')}}</el-menu-item>
      <el-menu-item v-if="MStore.rule_permission.Administrator.page === 'O' || MStore.permission.isCompany" class="collapse" index="administrator">{{t('m_cloud_administrator')}}</el-menu-item>
      <el-menu-item v-if="MStore.rule_permission.SoftwareInfo.page === 'O' || MStore.permission.isCompany" class="collapse" index="software-info">{{t('softwart_info')}}</el-menu-item>
      <el-menu-item v-if="MStore.rule_permission.Program.page === 'O' || MStore.permission.isCompany" class="collapse" index="program">{{t('program')}}</el-menu-item>
      <el-menu-item v-if="MStore.permission.isMSI && MStore.rule_permission.Permission.page === 'O'" class="collapse" index="permission">{{t('permission')}}</el-menu-item>
      <!-- <el-menu-item v-if="dev_member" class="collapse" index="test">test</el-menu-item> -->
    </el-sub-menu>
    
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
