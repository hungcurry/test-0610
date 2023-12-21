<script setup>
import { onMounted, onBeforeMount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { useMStore } from '@/stores/m_cloud'
import VueCookies from 'vue-cookies'
import ApiFunc from '@/composables/ApiFunc'

const { t } = useI18n()
const MStore = useMStore()
const MsiApi = ApiFunc()
const router = useRouter()
const account = ref('')
const password = ref('')
const email = ref('')
const pw_type = ref('password')
const language = ref ('en_us')
const first_login = ref(false)
const forgotPWVisable = ref(false)
const sendEmailCompleted = ref(false)
const isLoading = ref(false)
const checkState = ref(false)

const cancel_eula = () => {
  first_login.value = false
  VueCookies.remove('AuthToken')
}

const pwVisible = () => {
  if (pw_type.value === 'password') 
    pw_type.value = 'text'
  else 
    pw_type.value = 'password'
}

const login = async () => {
  try {
    let response = await MsiApi.getToken({ email: account.value, password: password.value, expMethod: '6M', dashboard: true})
    if (response.status === 200) {
      VueCookies.set('AuthToken', { headers: { Authorization: response.data.token, "X-Client-From":'m-Cloud' } }, '6M')
    } else if (response.status === 400 || response.status === 404) {
      ElMessage.error(t('oops_account_or_password_error'))
      return
    } else {
      ElMessage.error('Error.')
      return
    }
    response = await MsiApi.checkToken()
    if (response.status === 200) {
      if ( response.data?.permission?.user?.name === 'AdminUser' || response.data?.permission?.user?.name === 'DeveloperUser' ||
           response.data?.permission?.user?.name === 'ViewerUser' || response.data?.permission?.user?.name === 'FAEUser' ||
           response.data?.permission?.user?.name === 'CustomerServiceUser' || response.data?.permission?.user?.name === 'MemberUser' || 
           response.data?.permission?.user === undefined) {
        if (response.data?.permission?.user === undefined || response.data?.config?.m_cloud?.logged) 
          router.push({ name: 'dashboard' })
        else 
          first_login.value = true
      }
      else 
        ElMessage.error(t('oops_account_or_password_error'))
    }
    else {
      ElMessage.error('Error.')
      return
    }
  }
  catch {
    ElMessage.error('An unexpected error occurred.')
  }  
}

const aggre_eula = async () => {
  try {
    const response = await MsiApi.member_modify({ config: { m_cloud: { logged: true } } })
    if (response.status === 200) {
      router.push({ name: 'dashboard' })
    }
    else {
      ElMessage.error('Error.')
    }
  }
  catch {
    ElMessage.error('An unexpected error occurred.')
  }
}

const showForgotPWDialog = () => {
  sendEmailCompleted.value = false
  email.value = ''
}

const sendEmail = async() => {
  try {
    isLoading.value = true
    let sendData = { email: email.value, dashboard: true }
    const response = await MsiApi.forgotPW(sendData)
    isLoading.value = false
    if (response.status === 200) {
      sendEmailCompleted.value = true
    }
    else if (response.status === 404) {
      ElMessage.error(t('error_please_check_the_email_you_entered'))
    }
    else {
      ElMessage.error('Error.')
    }
  }
  catch {
    ElMessage.error('An unexpected error occurred.')
  }
}

onBeforeMount(() => {
  if (localStorage.getItem("lang")) {
    language.value = localStorage.getItem("lang")
  }
  else {
    if (navigator.language === 'zh-TW') 
      language.value = 'zh_tw'
  }
})

onMounted(() => {
  let targetTimezoneOffset = new Date().getTimezoneOffset()
  MStore.timeZoneOffset = targetTimezoneOffset
  MStore.permission = undefined
  VueCookies.remove('AuthToken')
})
</script>

<template>
  <div class="login">
    <div class="outer">
      <form class="form w-full text-center">
        <p class="title text-center m-0 my-10 lg:mb-32px">{{ t('m_cloud') }}</p>
        <label class="account" for="input-accoun">{{ t('account') }}</label>
        <input
          class="input-account"
          id="input-accoun"
          maxlength="30"
          autocomplete
          v-model.trim="account"
        />
        <label class="password" for="input-password">{{ t('password') }}</label>
        <div class="pw-container ">
          <input
            class="input-password"
            id="input-password"
            maxlength="30"
            autocomplete
            :type="pw_type"
            v-model.trim="password"
            @keyup.enter="login"
          />
          <img
            v-if="pw_type === 'text'"
            src="@/assets/img/login_visible_nor.png"
            @click="pwVisible"
          />
          <img v-else src="@/assets/img/login_unvisible_nor.png" @click="pwVisible" />
        </div>

        <div class="forgot-container mb-20 lg:mb-25">
          <button type="button" class="forgot-password" @click="forgotPWVisable = true">{{ t('forgot_password') }}</button>
        </div>

        <el-dialog
          v-model="first_login"
          class="max-w-992px h-90% flex-col"
          width="90%"
          destroy-on-close
          center
          append-to-body 
        >
          <template #header="{ titleId, titleClass }">
            <div class="py-2rem relative bg-blue-100">
              <h4
                :id="titleId"
                :class="titleClass"
                class="m-0 text-center text-blue-1200 font-400 text-24px line-height-26px"
              >
                {{t('user_agreement')}}
              </h4>
            </div>
          </template>
          <div class="h-full scrollbar">
            <div class="h-full" v-if="language === 'zh_tw'">
              <iframe
                class="w-full h-full"
                src="https://storage.googleapis.com/msi-common/file/EULA/MSI_m-Cloud_EULA_zh.htm"
                frameborder="0"
              ></iframe>
            </div>
            <div class="h-full" v-else>
              <iframe
                class="w-full h-full"
                src="https://storage.googleapis.com/msi-common/file/EULA/MSI_m-Cloud_EULA_en.htm"
                frameborder="0"
              ></iframe>
            </div>
          </div>
          <template #footer>
            <el-checkbox
              class="whitespace-normal w-full text-left pl-4px mb-10px lg:mb-0 "
              v-model="checkState"
              true-value="yes"
              false-value="no"
              >{{ t('i_fully_understand_the_contents_of_the_terms_and_conditions_and_agree_to_them') }}
            </el-checkbox>
            <span class="dialog-footer flex flex-center">
              <el-button
                round
                class="w-48% bg-btn-100 text-white max-w-140px"
                @click="cancel_eula"
                > {{ t('cancel') }} </el-button
              >
              <el-button
                ref="agreeButton"
                round
                class="agreeBtn w-48% bg-btn-200 text-white max-w-140px"
                @click="aggre_eula"
                :disabled="!checkState"
              >
              {{ t('agree') }}
              </el-button>
            </span>
          </template>
        </el-dialog>

        <button type="button" class="log-in" @click="login">
          {{ t('log_in') }}
        </button>
      </form>
      <div>
        <p class="text-30px text-white text-center">
          {{ t('version') + ':' + APP_VERSION }}
        </p>
        <img class="logo block mx-auto" src="@/assets/img/login_msilogo.png"/>
      </div>
    </div>
    <el-dialog
      v-model="forgotPWVisable"
      class="flex-col max-w-600px"
      width="90%"
      destroy-on-close
      center
      @open="showForgotPWDialog"
    >
      <template #header="{ titleId, titleClass }">
        <div class="py-2rem relative bg-blue-100">
          <h4
            :id="titleId"
            :class="titleClass"
            class="m-0 text-center text-blue-1200 font-400 text-24px line-height-26px"
          >
            {{t('forgot_password')}}
          </h4>
        </div>
      </template>
      <div class="forgot-dialog" v-loading.fullscreen.lock="isLoading">
        <el-form v-if="sendEmailCompleted === false" class="max-w-500px m-auto" @submit.prevent>
          <p class="text-18px text-center">{{ t('we_will_send_an_email_to_you') }}</p>
          <p class="text-18px text-center">{{ t('the_link_in_the_email_will_expire_in_30_minutes') }}</p>
          <el-form-item class="mt-30px mb-24px text-16px" :label="t('please_enter_your_email')">
            <el-input v-model="email" @keyup.enter="sendEmail" />
          </el-form-item>
        </el-form>
        
        <div v-else>
          <p class="text-20px text-center h-30px">{{ t('success') }} !</p>
          <p class="text-16px text-center h-25px">{{ t('mail_is_sent_please_check_your_mailbox_to_change_your_password') }}</p>
        </div>
      </div>
      <template #footer>
        <el-button v-if="sendEmailCompleted === false" class="btn-secondary" @click="sendEmail">{{ t('send') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.login {
  width: 100%;
  height: 100%;
  min-height: 600px;
  background-position: center;
  background-size: cover;
  background-image: url('@/assets/img/login_bg.png');
  display: flex;
  justify-content: center;
  align-items: center;
  .outer {
    width: 100%;
    max-width: 460px;
    padding: 0 15px;
    display: flex;
    flex-direction: column;
    height: 100%;
    justify-content: space-around;
    justify-content: space-evenly;
  }
  .title {
    font-size: 78px;
    line-height: 90px;
    color: var(--white);
  }
  .account {
    display: flex;
    align-items: center;
    margin: 0 0 6px 0;
    width: 100%;
    height: 32px;
    font-size: 22px;
    color: var(--secondary);
  }
  .input-account {
    margin: 0 0 22px 0;
    border: 0px;
    width: 100%;
    height: 46px;
    background-color: #000000c0;
    color: var(--white);
    font-size: 22px;
    padding-left: 24px;
    box-sizing: border-box;
  }
  .password {
    display: flex;
    align-items: center;
    margin: 0 0 6px 0;
    width: 100%;
    height: 32px;
    font-size: 22px;
    color: var(--secondary);
  }
  .pw-container {
    position: relative;
    width: 100%;
    .input-password {
      margin: 0 0 6px 0;
      border: 0px;
      padding-left: 24px;
      width: 100%;
      height: 46px;
      background-color: #000000c0;
      color: #ffffff;
      font-size: 22px;
      box-sizing: border-box;
    }
    img {
      width: 32px;
      height: 32px;
      position: absolute;
      top: 7px;
      right: 7px;
    }
    .password-visible:checked {
      width: 32px;
      height: 32px;
      position: absolute;
      top: 7px;
      right: 7px;
    }
  }
  .forgot-container {
    display: flex;
    flex-direction: row;
    justify-content: right;
    width: 100%;
  }
  .forgot-password {
    margin: 6px 0 22px 0;
    background-color: transparent;
    border-style: none;
    color: var(--secondary);
    border-bottom-style: solid;
    border-color: #92a9c4;
    font-size: 22px;
    cursor: pointer;
  }
  .log-in {
    width: 200px;
    height: 40px;
    border-radius: 20px;
    background-color: var(--secondary);
    color: var(--white);
    font-size: 22px;
    caret-color: transparent;
    border: 0;
    cursor: pointer;
  }
  .forgot-dialog {
    .el-form-item {
      display: block;
    }
    :deep(.el-form-item__label) {
      display: block;
      font-size: 1.6rem;
    }
  }
  .input-email {
    width: 300px;
  }
}
:deep(.el-overlay-dialog .el-dialog__body) {
  flex-grow: 1;
}
</style>
