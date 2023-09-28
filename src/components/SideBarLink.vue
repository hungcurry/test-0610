<script setup>
import { reactive, ref, onBeforeMount } from 'vue'
import { useMStore } from '../stores/m_cloud'
import { storeToRefs } from 'pinia'
import { useSideMenuStore } from '@/stores/sidemenu'
import { useRoute } from 'vue-router'
import { m_cloud_permission } from '@/composables/permission'
import { useI18n } from "vue-i18n"

const { t } = useI18n()
const MStore = useMStore()
const user_permission_name = MStore?.permission?.user?.name
const dev_member = ref(false)
const sideMenuStore = useSideMenuStore()
const route = useRoute()
const path = route.path.slice(1)
const { isCollapse } = storeToRefs(sideMenuStore)
let rule_permission = reactive({})

onBeforeMount ( async () => {
  if (m_cloud_permission[user_permission_name])
    rule_permission = m_cloud_permission[user_permission_name]
  if ( MStore.user_data.first_name === 'Steven' ) {
    dev_member.value = true  
  }
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
    <el-menu-item v-if="rule_permission.Dashboard === 'O' || MStore.permission.isCompany" index="dashboard">
      <el-icon class="opacity-70"><Menu /></el-icon>
      <template #title>
        <span> {{t('dashboard')}}</span>
      </template>
    </el-menu-item>
    <el-menu-item v-if="rule_permission.Payment === 'O' || MStore.permission.isCompany" index="payment">
      <el-icon class="opacity-50"><Postcard /></el-icon>
      <template #title>
        <span>{{t('payment')}}</span>
      </template>
    </el-menu-item>

    <el-sub-menu v-if="rule_permission.Station === 'O' || rule_permission.EVSE === 'O' || rule_permission.RatePlan === 'O' || MStore.permission.isCompany" index="station">
      <template #title>
        <el-icon class="opacity-70"><Location /></el-icon>
        <span>{{t('evse_management')}}</span>
      </template>
      <el-menu-item v-if="rule_permission.Station === 'O' || MStore.permission.isCompany" class="collapse" index="station">
        {{t('by_station')}}
      </el-menu-item>
      <el-menu-item v-if="rule_permission.EVSE === 'O' || MStore.permission.isCompany" class="collapse" index="evse">{{t('by_evse')}}</el-menu-item>
      <el-menu-item v-if="rule_permission.RatePlan === 'O' || MStore.permission.isCompany" class="collapse" index="rate-plan">{{t('rate_plan')}}</el-menu-item>
    </el-sub-menu>

    <el-sub-menu index="administrator" v-if="(rule_permission.User === 'O' || rule_permission.RfidUser === 'O') || rule_permission.Company === 'O' || rule_permission.Administrator === 'O' || MStore.permission.isCompany">
      <template #title>
        <el-icon class="opacity-50"><UserFilled /></el-icon>
        <span>{{t('account_management')}}</span>
      </template>
      <el-menu-item v-if="MStore.permission.isMSI && (rule_permission.User === 'O' || MStore.permission.isCompany)" class="collapse" index="user">{{t('app_member')}}</el-menu-item>
      <el-menu-item v-else-if="MStore.permission.isMSI === false && (rule_permission.RfidUser === 'O' || MStore.permission.isCompany)" class="collapse" index="rfid-user">{{t('rfid_user')}}</el-menu-item>
      <el-menu-item v-if="MStore.permission.isMSI && (rule_permission.Company === 'O' || MStore.permission.isCompany)" class="collapse" index="company">{{t('company_cpo')}}</el-menu-item>
      <el-menu-item v-if="rule_permission.Administrator === 'O' || MStore.permission.isCompany" class="collapse" index="administrator">{{t('m_cloud_administrator')}}</el-menu-item>
    </el-sub-menu>
    
    <el-sub-menu index="evse-log" v-if="rule_permission.EVSELog === 'O' || rule_permission.ErrorLog === 'O' || MStore.permission.isCompany">
      <template #title>
        <el-icon class="opacity-70"><Calendar /></el-icon>
        <span>{{t('log_monitor')}}</span>
      </template>
      <el-menu-item v-if="rule_permission.EVSELog === 'O' || MStore.permission.isCompany" class="collapse" index="evse-log">{{t('evse_log')}}</el-menu-item>
      <el-menu-item v-if="rule_permission.ErrorLog === 'O' || MStore.permission.isCompany" class="collapse" index="error-log">{{t('error_log')}}</el-menu-item>
    </el-sub-menu>

    <el-menu-item v-if="rule_permission.SoftwareInfo === 'O' || MStore.permission.isCompany" index="software-info">
      <el-icon class="opacity-50"><InfoFilled /></el-icon>
      <template #title>
        <span>{{t('softwart_info')}}</span>
      </template>
    </el-menu-item>

    <el-menu-item v-if="MStore.permission.isMSI && (rule_permission.Parking === 'O' || MStore.permission.isCompany)" index="parking">
      <el-icon class="opacity-70"><View /></el-icon>
      <template #title>
        <span>{{t('parking')}}</span>
      </template>
    </el-menu-item>

    <el-menu-item v-if="MStore.permission.isMSI && (rule_permission.Program === 'O' || MStore.permission.isCompany)" index="program">
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
