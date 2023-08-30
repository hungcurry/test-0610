<script setup>
import ApiFunc from '@/composables/ApiFunc'
import VueCookies from 'vue-cookies'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useMStore } from '@/stores/m_cloud'
import { useI18n } from 'vue-i18n'

const first_login = ref(false)
const MStore = useMStore()
const MsiApi = ApiFunc()
const router = useRouter()
const pw_type = ref('password')
const account = ref('')
const password = ref('')
const checkState = ref(false)
const m_cloud_version = ref('0.1.13')

const { t } = useI18n()
let language = localStorage.getItem("lang")

const cancel_eula = () => {
  first_login.value = false
  VueCookies.remove('AuthToken')
}
const pwVisible = () => {
  if (pw_type.value === 'password') pw_type.value = 'text'
  else pw_type.value = 'password'
}
const login = async () => {
  const response = await MsiApi.getToken({
    email: account.value,
    password: password.value,
    expMethod: '6M',
    dashboard: true,
  })
  if (response.status === 200) {
    let res = await MsiApi.checkToken()
    if (res?.data?.config?.m_cloud?.logged) {
      router.push({ name: 'dashboard' })
    } else {
      first_login.value = true
    }
  } else if (response.status === 400 || response.status === 404) {
    ElMessage.error(t('oops_account_or_password_error'))
  } else {
    ElMessage.error('Error.')
  }
}
const aggre_eula = async () => {
  await MsiApi.member_modify({ config: { m_cloud: { logged: true } } })
  router.push({ name: 'dashboard' })
}
onMounted(() => {
  if (!language) { 
    if (navigator.language === 'zh-TW') 
      language = 'zh_tw'
    else 
      language = 'en_us'
  }
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
        <div class="pw-container mb-20 lg:mb-25">
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
            @click="pwVisible()"
          />
          <img v-else src="@/assets/img/login_unvisible_nor.png" @click="pwVisible()" />
        </div>

        <el-dialog
          v-model="first_login"
          class="max-w-992px h-90% flex-col"
          width="90%"
          destroy-on-close
          center
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
              >{{ t('i_fully_understand_the_contents_of_the_terms_and_conditions_and_arree_to_them') }}
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

        <button type="button" class="log-in" @click="login()">
          {{ t('log_in') }}
        </button>
      </form>
      <div>
        <p class="text-30px text-white text-center">
          {{ t('version') + ':' + m_cloud_version }}
        </p>
        <img class="logo block mx-auto" src="@/assets/img/login_msilogo.png" />
      </div>
    </div>
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
    margin: 6px 0 136px 0;
    background-color: transparent;
    border-style: none;
    color: var(--secondary);
    border-bottom-style: solid;
    border-color: #92a9c4;
    font-size: 22px;
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
}
:deep(.el-overlay-dialog .el-dialog__body) {
  flex-grow: 1;
}
</style>
