<template>
  <div>
    <el-menu default-active="dashboard" class="el-menu-vertical-demo" background-color="#212120" text-color="#fff" active-text-color="#ffd04b" router >
      <el-menu-item index="dashboard">
        <span>Dashboard</span>
      </el-menu-item>
      <el-menu-item v-if="userPermission !== 'EngineerUser'" index="paymentHistory">
        <span>Payment</span>
      </el-menu-item>
      <el-sub-menu index="station">
        <template #title>
          <span>Charger Management</span>
        </template>
          <el-menu-item index="station" :route="{ path:'station' }">By Station</el-menu-item>
          <el-menu-item index="evse">By Charger</el-menu-item>
          <el-menu-item index="tariff" >Rate Plan</el-menu-item>
      </el-sub-menu>
      <el-sub-menu index="administrator" >
        <template #title>
          <span>Account Management</span>
        </template>
          <el-menu-item index="customers">User / Member</el-menu-item>
          <el-menu-item v-if="company === 'MSI'" index="company" >Company / CPO </el-menu-item>
          <el-menu-item index="administrator"> m-Cloud Administrator</el-menu-item>
      </el-sub-menu>
      <el-sub-menu index="ocpiSession" >
        <template #title>
          <span>Log Monitor</span>
        </template>
          <el-menu-item index="ocpiSession">Charger Log</el-menu-item>
          <el-menu-item index="ocppError"> OCPP Error </el-menu-item>
      </el-sub-menu>
      <el-menu-item v-if="dev_member" index="softwareInfo">
        <span>Software Info</span>
      </el-menu-item>
      <el-menu-item v-if="dev_member" index="parking">
        <span>Parking</span>
      </el-menu-item>
      <el-menu-item v-if="dev_member" index="test">
        <span>Test</span>
      </el-menu-item>
    </el-menu>
  </div>
</template>

<script setup>
import { onMounted,ref } from 'vue'
import { useMStore } from "../stores/m_cloud";
import ApiFunc from '@/components/ApiFunc'
const MStore = useMStore();
const company = MStore?.permission?.company?.name
const dev_member = ref(false)
const MsiApi = ApiFunc()

const userPermission = ref('')

onMounted( async () => {
  let res = await MsiApi.checkToken()
  console.log(res.data.permission)
  // console.log(res.data.permission.user.name)
  userPermission.value = res?.data?.permission?.user?.name
  if(res.data.first_name === 'Steven' || res.data.first_name === 'Leo' || res.data.first_name === 'Frank') {
    dev_member.value = true
  }
})

</script>

<style scoped lang="scss">
@media (max-width:768px)
{
  span{
    visibility:hidden
  }
}

.el-menu {
  width: 100%;
  border-right: 0;
  span{
    font-size: 16px;
  }
}



</style>