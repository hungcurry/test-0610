<script setup>
import { useMStore } from '../stores/m_cloud'
import { storeToRefs } from 'pinia'
import { useSideMenuStore } from '@/stores/sidemenu'
import { useRoute } from 'vue-router'
import { useI18n } from "vue-i18n"
import { ref } from "vue"

const { t } = useI18n()
const MStore = useMStore()
const sideMenuStore = useSideMenuStore()
const route = useRoute()
const path = route.path.slice(1)
const { isCollapse } = storeToRefs(sideMenuStore)
const hovered = ref({ dashboardIcon: false, paymentIcon: false, rfidUserIcon: false, evseIcon: false, logIcon: false, advIcon: false})

// let dev_member = false
// if ( MStore.user_data.first_name === 'Steven') {
//   dev_member = true  
// }

</script>

<template>
  <el-menu :default-active="path" class="el-menu-vertical-demo" text-color="#fff" active-text-color="#61a8d8" router :collapse="isCollapse">
    <el-menu-item v-if="MStore.rule_permission.Dashboard.page === 'O'" index="dashboard" 
      @mouseover="hovered.dashboardIcon = true" @mouseleave="hovered.dashboardIcon = false">
      <img v-show="!hovered.dashboardIcon" class="w-45px h-45px -ml-8px" src="@/assets/img/all_ic_dashboard_nor.png" alt=""/>
      <img v-show="hovered.dashboardIcon" class="w-45px h-45px -ml-16px" src="@/assets/img/all_ic_dashboard_focus.png" alt=""/>
      <template #title>
        <span> {{t('dashboard')}}</span>
      </template>
    </el-menu-item>

    <el-menu-item v-if="MStore.rule_permission.Payment.page === 'O'" index="payment"
    @mouseover="hovered.paymentIcon = true" @mouseleave="hovered.paymentIcon = false">
      <img v-show="!hovered.paymentIcon" class="w-45px h-45px -ml-8px" src="@/assets/img/all_ic_payment_nor.png" alt=""/>
      <img v-show="hovered.paymentIcon" class="w-45px h-45px -ml-16px" src="@/assets/img/all_ic_payment_focus.png" alt=""/>
      <template #title>
        <span>{{t('payment')}}</span>
      </template>
    </el-menu-item>

    <el-menu-item v-if="MStore.permission.isMSI === false && (MStore.rule_permission.RfidUser.page === 'O')" index="rfid-user"
    @mouseover="hovered.rfidUserIcon = true" @mouseleave="hovered.rfidUserIcon = false">
      <img v-show="!hovered.rfidUserIcon" class="w-45px h-45px -ml-8px" src="@/assets/img/all_ic_account_nor.png" alt=""/>
      <img v-show="hovered.rfidUserIcon" class="w-45px h-45px -ml-16px" src="@/assets/img/all_ic_account_focus.png" alt=""/>
      <template #title>
        <span> {{t('rfid_user')}}</span>
      </template>
    </el-menu-item>

    <el-sub-menu v-if="MStore.rule_permission.Station === 'O' || MStore.rule_permission.EVSE.page === 'O' || MStore.rule_permission.RatePlan.page === 'O'" index="station"
    @mouseover="hovered.evseIcon = true" @mouseleave="hovered.evseIcon = false">
      <template #title>
        <img v-show="!hovered.evseIcon" class="w-45px h-45px -ml-8px" src="@/assets/img/all_ic_evse_nor.png" alt=""/>
        <img v-show="hovered.evseIcon" class="w-45px h-45px -ml-16px" src="@/assets/img/all_ic_evse_focus.png" alt=""/>
        <span>{{t('evse_management')}}</span>
      </template>
      <el-menu-item v-if="MStore.rule_permission.Station.page === 'O'" class="collapse" index="station">{{t('by_station')}}</el-menu-item>
      <el-menu-item v-if="MStore.rule_permission.EVSE.page === 'O'" class="collapse" index="evse">{{t('by_evse')}}</el-menu-item>
      <el-menu-item v-if="MStore.rule_permission.RatePlan.page === 'O'" class="collapse" index="rate-plan">{{t('rate_plan')}}</el-menu-item>
      <el-menu-item v-if="MStore.rule_permission.ChargingProfile.page === 'O'" class="collapse" index="charging-profile">{{t('charging_profile')}}</el-menu-item>
    </el-sub-menu>
  
    <el-sub-menu v-if="MStore.rule_permission.EVSELog.page === 'O' || MStore.rule_permission.ErrorLog.page === 'O'" index="evse-log" 
    @mouseover="hovered.logIcon = true" @mouseleave="hovered.logIcon = false">
      <template #title>
        <img v-show="!hovered.logIcon" class="w-45px h-45px -ml-8px" src="@/assets/img/all_ic_log_nor.png" alt=""/>
        <img v-show="hovered.logIcon" class="w-45px h-45px -ml-16px" src="@/assets/img/all_ic_log_focus.png" alt=""/>
        <span>{{t('log_monitor')}}</span>
      </template>
      <el-menu-item v-if="MStore.rule_permission.EVSELog.page === 'O'" class="collapse" index="evse-log">{{t('evse_log')}}</el-menu-item>
      <el-menu-item v-if="MStore.rule_permission.ErrorLog.page === 'O'" class="collapse" index="error-log">{{t('error_log')}}</el-menu-item>
      <el-menu-item v-if="MStore.rule_permission.Parking.page === 'O'" class="collapse" index="parking">{{t('parking')}}</el-menu-item>
      <el-menu-item v-if="MStore.rule_permission.Parking.page === 'O'" class="collapse" index="cdr">{{t('cdr')}}</el-menu-item>
    </el-sub-menu>

    <el-sub-menu index="advanced-setting" v-if="MStore.permission.isMSI"
    @mouseover="hovered.advIcon = true" @mouseleave="hovered.advIcon = false">
      <template #title>
        <img v-show="!hovered.advIcon" class="w-45px h-45px -ml-8px" src="@/assets/img/all_ic_setting_nor.png" alt=""/>
        <img v-show="hovered.advIcon" class="w-45px h-45px -ml-16px" src="@/assets/img/all_ic_setting_focus.png" alt=""/>
        <span>{{t('advanced_setting')}}</span>
      </template>
      <el-menu-item v-if="MStore.rule_permission.User.page === 'O'" class="collapse" index="user">{{t('app_member')}}</el-menu-item>
      <el-menu-item v-if="MStore.rule_permission.Company.page === 'O'" class="collapse" index="company">{{t('company_cpo')}}</el-menu-item>
      <el-menu-item v-if="MStore.rule_permission.Administrator.page === 'O'" class="collapse" index="administrator">{{t('m_cloud_administrator')}}</el-menu-item>
      <el-menu-item v-if="MStore.rule_permission.SoftwareInfo.page === 'O'" class="collapse" index="software-info">{{t('softwart_info')}}</el-menu-item>
      <el-menu-item v-if="MStore.rule_permission.Program.page === 'O'" class="collapse" index="program">{{t('program')}}</el-menu-item>
      <el-menu-item v-if="MStore.permission.isMSI && MStore.rule_permission.Permission.page === 'O'" class="collapse" index="permission">{{t('permission')}}</el-menu-item>
      <el-menu-item v-if="MStore.permission.isMSI && MStore.rule_permission.TokenManagement.page === 'O'" class="collapse" index="token-management">{{t('token_management')}}</el-menu-item>
      <!-- <el-menu-item v-if="MStore.permission.isMSI && MStore.rule_permission.Permission.page === 'O'" class="collapse" index="rfid-user">{{t('rfid_user')}}</el-menu-item> -->
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
