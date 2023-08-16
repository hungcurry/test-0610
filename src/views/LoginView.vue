<script setup>

import ApiFunc from '@/composables/ApiFunc'
import VueCookies from 'vue-cookies'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useMStore } from '@/stores/m_cloud'
import { useI18n } from "vue-i18n"
import AgreementModal from '../components/Modal/AgreementModal.vue'

const { t } = useI18n()
const first_login = ref(false)
const MStore = useMStore()
const MsiApi = ApiFunc()
const router = useRouter()
const pw_type = ref('password')
const account = ref('')
const password = ref('')
const m_cloud_version = ref('0.1.11')
const pwVisible = () => {
  if (pw_type.value === 'password') pw_type.value = 'text'
  else pw_type.value = 'password'
}
const login = async () => {
  if (checked.value === 'no') {
    ElMessage({
      message: 'Warning, 請閱讀 用戶協議隱私政策.',
      type: 'warning',
    })
    return
  }
  const response = await MsiApi.getToken({
    email: account.value,
    password: password.value,
    expMethod: '6M',
    dashboard: true,
  })
  if (response.status === 200) {
    let res = await MsiApi.checkToken()
    if(res?.data?.config?.m_cloud?.logged) {
      router.push({ name: 'dashboard' })
    }
    else {
      first_login.value = true
    }
  } else if (response.status === 400 || response.status === 404) {
    ElMessage.error(t('oops_account_or_password_error'))
  } else {
    ElMessage.error('Error.')
  }
}
//--------Modal--------
const modalobj = ref({
  passwordModal: false,
  agreementModal: false,
  privacyModal: false,
})
const checked = ref('yes')
const checkboxInput = ref(null)
const openModalHandle = (str) => {
  modalobj.value[str] = true
}
const emitCallBack = (res, str) => {
  modalobj.value[str] = res
  checkboxInput.value.removeAttribute('disabled')
  checked.value = 'yes'
}

const aggre_eula = async() => {
  await MsiApi.member_modify({config:{m_cloud: {logged : true}}}) 
  router.push({ name: 'dashboard' })
}

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

        <!-- <template v-if="first_login"> -->
          <el-dialog
          v-model="first_login"
          class="max-w-600px"
          :show-close="false"
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
                User Agreement
              </h4>
            </div>
          </template>
          <div class="dialog-context scrollbar">
            <div v-if="language === 'zh-TW'">
              <iframe style="width: 1600px;" src="https://storage.googleapis.com/msi-common/file/m_cloud_eula_zh.htm" frameborder="0"></iframe>
            </div> 
            <div v-else>
              <iframe style="width: 1600px;" src="https://storage.googleapis.com/msi-common/file/m_cloud_eula_en.htm" frameborder="0"></iframe>
            </div>
          </div>
          <template #footer>
            <span class="dialog-footer flex flex-center">
              <el-button
                round
                class="w-48% bg-btn-100 text-white max-w-140px"
                @click="first_login=false"
                >Cancel</el-button
              >
              <el-button
                round
                class="w-48% bg-btn-200 text-white max-w-140px"
                @click="aggre_eula"
              >
                Agree
              </el-button>
            </span>
          </template>
        </el-dialog>

        <template v-if="false">
          <div class="w-full text-right text-[2.2rem] mb-4">
            <a
              href="javascript:;"
              class="block secondary-hover leading-normal underline underline-offset-1"
              @click.stop="openModalHandle('passwordModal')"
              >Forgot Password</a
            >
          </div>
          <label class="form-label form-label-checkbox mb-20 lg:mb-25" for="checkbox">
            <p class="inline-block m-0 mr-2">
              I confirm that I have agree to
              <span
                class="underline decoration-1 secondary-hover z-99"
                @click.stop="openModalHandle('agreementModal')"
                >User Agreement</span
              >
              and
              <span
                class="underline decoration-1 secondary-hover z-99"
                @click.stop="openModalHandle('privacyModal')"
                >Privacy Policy</span
              >
            </p>
            <input
              type="checkbox"
              ref="checkboxInput"
              v-model="checked"
              true-value="yes"
              false-value="no"
              disabled
            />
            <div class="indicator"></div>
          </label>
        </template>
        <button type="button" class="log-in" @click="login()">
          {{ t('log_in') }}
        </button>
      </form>
      <div>
        <p class="text-30px text-white text-center">{{ t('version')  + ':' +  m_cloud_version }}</p>
        <img class="logo block mx-auto" src="@/assets/img/login_msilogo.png" />
      </div>
    </div>
  </div>
  <PasswordModal :modal="modalobj.passwordModal" @closeModal="emitCallBack" />
  <AgreementModal :modal="modalobj.agreementModal" @closeModal="emitCallBack" />
  <PrivacyModal :modal="modalobj.privacyModal" @closeModal="emitCallBack" />
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
.form-label {
  display: block;
  position: relative;
  padding-left: 3rem;
  cursor: pointer;
  font-size: 1.8rem;
  user-select: none;
  color: var(--white);
  z-index: 1;
  user-select: none;
  > input {
    position: absolute;
    z-index: -1;
    opacity: 0;
  }
  .indicator {
    width: 2rem;
    height: 2rem;
    background: lighten(#92a9c4, 15%);
    border-radius: 50%;
    position: absolute;
    top: 0;
    left: 0;
    &:after {
      content: '';
      position: absolute;
      left: 0.8rem;
      top: 0.4rem;
      width: 0.3rem;
      height: 0.8rem;
      border: solid var(--black);
      border-width: 0 0.2rem 0.2rem 0;
      transform: rotate(45deg);
      display: none;
    }
  }
}
.form-label:hover input ~ .indicator,
.form-label input:focus ~ .indicator {
  background: #ccc;
}
.form-label input:checked ~ .indicator {
  background: var(--secondary);
}
.form-label:hover input:not([disabled]):checked ~ .indicator,
.form-label input:checked:focus ~ .indicator {
  background: var(--secondary);
}
.form-label input:disabled ~ .indicator {
  background: #e6e6e6;
  opacity: 0.6;
  pointer-events: none;
}
.form-label input:checked ~ .indicator:after {
  display: block;
}
</style>
