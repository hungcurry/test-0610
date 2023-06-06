<template>
  <div class="header-layout">
    <div class="left-header">
      <div class="station_map" v-if="route.path==='/station' ">
      <!-- <div class="station_map" > -->
        <img src="@/assets/img/station_available.png">
        <!-- <p>{{$t('account')}}</p> -->
        <p>Available</p>
        <img src="@/assets/img/station_charging.png">
        <p>Charging / Full Charged</p>
        <img src="@/assets/img/station_offline.png">
        <p>Offline</p>
        <img src="@/assets/img/station_error.png">
        <p>Error</p>
      </div>
    </div>

    <div class="common-header" >
      <!-- <el-dropdown>
        <el-button class="user"><font-awesome-icon icon="fa-solid fa-user" /></el-button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item @click="English()">English</el-dropdown-item>
          <el-dropdown-item @click="Chinese()">�c��</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown> -->

      <el-button class="gear"><font-awesome-icon icon="fa-solid fa-gear" /></el-button>
      <el-button class="bell"><font-awesome-icon icon="fa-solid fa-bell" /></el-button>

      <el-dropdown>
        <el-button class="user"><font-awesome-icon icon="fa-solid fa-user" /></el-button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item @click="logOut()">Log Out</el-dropdown-item>
          <el-dropdown-item @click="resetPW()">Reset Password</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <el-dialog v-model="reset_password_visible" title="Reset Password" draggable>
      <el-form>
        <el-form-item label="New password" >
          <el-input v-model="reset_password1" autocomplete="off" />
        </el-form-item>
        <el-form-item label="New password again" >
          <el-input v-model="reset_password2" autocomplete="off" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancel_resetPW('cancel', false)">Cancel</el-button>
          <el-button type="primary" @click="confirm_PW('confirm', false)">Confirm</el-button>
        </span>
      </template>
    </el-dialog>
    </div>
  </div>

</template>

<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { ref, onMounted} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ApiFunc from '@/components/ApiFunc'
import i18n from '@/locales'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const MsiApi = ApiFunc()
// const props = defineProps(['left_component'])

const reset_password_visible = ref(false)
const reset_password1 = ref('')
const reset_password2 = ref('')

const English = () => {i18n.global.locale.value = 'en_us'}
const Chinese = () => {i18n.global.locale.value = 'zh_tw'}

    
const logOut = () => {
  router.push({ name: 'login' })
}

const resetPW = () => {
  reset_password_visible.value = true
}

const cancel_resetPW = () => {
  reset_password_visible.value = false
}

const confirm_PW = () => {
  if (reset_password1.value === reset_password2.value) {
    let sendData = { password:reset_password2.value}
    MsiApi.resetPW(sendData)
    reset_password_visible.value = false
  }
  else {
    ElMessage('PW error')
  }
}

onMounted(() => {

})

</script>

<style scoped lang="scss">
.header-layout {
  display: flex;
  justify-content: space-between;
  .station_map {
    display: flex;
    flex-direction: row;
    align-items:center;
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
    width:60px;
    height:60px;
    background-color: transparent;
    border-style: none;
  }
  .bell {
    width:60px;
    height:60px;
    background-color: transparent;
    border-style: none;
  }
  .user {
    width:60px;
    height:60px;
    background-color: transparent;
    border-style: none;
  }
}

</style>
