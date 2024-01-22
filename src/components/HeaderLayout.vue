<script setup>
import i18n from '@/locales'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { ref, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useSideMenuStore } from '@/stores/sidemenu'
import { useI18n } from "vue-i18n"
import { useMStore } from '@/stores/m_cloud'
import ApiFunc from '@/composables/ApiFunc'

const MsiApi = ApiFunc()
const MStore = useMStore()
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
  window.location.reload()
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

// const companyArr = reactive([])

// const companyValue = ref()

// const selectCompany = async (companyId) => {
//   console.log('companyId' + companyId)
//   MStore.selCompany = companyId
//   console.log(router)
//   console.log(router.currentRoute.value.fullPath)
//   router.push({ path: router.currentRoute.value.fullPath})
// }

// const getCompany = async () => {
//   let queryData = { 
//       "database": 'CPO', 
//       "collection": 'CompanyInformation', 
//       "pipelines": [
//         {
//           $project: { _id: 1, name:1 } 
//         }
//       ]
//     }

//     let response = await MsiApi.mongoAggregate(queryData)
//     console.log(response)
//     Object.assign(companyArr, response.data.result)
// }

</script>

<template>
  <nav class="header-layout overflow-x-auto">
    <div class="left-header flex-grow">
      <ul class="station_map list-none hidden md:flex items-center ml-72px px-15px md:px-40px" v-if="route.path === '/station'">
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
    <div class="common-header shrink-0 ml-72px md:ml-0">

      <!-- <el-select v-model="companyValue" class="m-2" placeholder="Select" size="large" @click="getCompany">
        <el-option v-for="item in companyArr" :key="item" :label="item.name" :value="item._id" @click="selectCompany(item._id)"
      />
      </el-select> -->

      <el-dropdown trigger="click">
        <el-button class="user">        
          <span class="material-symbols-outlined">language</span>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="changeLanguage('EN')">English</el-dropdown-item>
            <el-dropdown-item @click="changeLanguage('ZH')">繁體中文</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <el-dropdown trigger="click">
        <el-button class="user"><font-awesome-icon icon="fa-solid fa-user" /></el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="logOut()"> {{ t('log_out') }}</el-dropdown-item>
            <el-dropdown-item @click="resetPW()"> {{ t('reset_password') }}</el-dropdown-item>
            <el-dropdown-item 
                v-if="MStore.rule_permission.AdminInfo.page === 'O'" 
                @click="Admin_Info()"> {{t('admin_info')}}
            </el-dropdown-item>
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
  .user {
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
