<template>
  <div class="login">
    <div class="container0">
      <div class="container">
        <p class="title"> {{ $t('m_cloud') }} </p>
        <p class="account"> {{ $t('account') }} </p>
        <input class="input-account" v-model="account">
        <p class="password"> {{ $t('password') }} </p>
        <div class="pw-container">
          <input class="input-password" :type=pw_type v-model="password" @keyup.enter="login">
          <img v-if="pw_type === 'text'" src="@/assets/img/login_visible_nor.png" @click="pwVisible()" />
          <img v-else src="@/assets/img/login_unvisible_nor.png" @click="pwVisible()" />
        </div>
        <br><br>
        <button class="log-in" @click="login()"> {{ $t('log_in') }} </button>
      </div>
      <p class="version">Version: 0.1.3</p>
      <img class="logo" src="@/assets/img/login_msilogo.png">
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from "vue-router"
import { ElMessage } from 'element-plus'
import i18n from '@/locales'
import ApiFunc from '@/components/ApiFunc'
import VueCookies from 'vue-cookies'
import { useMStore } from "../stores/m_cloud"

const MStore = useMStore()
const MsiApi = ApiFunc()
const router = useRouter()
const pw_type = ref('password')
const account = ref('')
const password = ref('')

const pwVisible = () => {
  if (pw_type.value === "password")
    pw_type.value = "text"
  else
    pw_type.value = "password"
}

const login = async () => {
  const response = await MsiApi.getToken({ email: account.value, password: password.value, expMethod: '6M', dashboard: true })

  if (response.status === 200) {
    router.push({ name: 'dashboard' })
  }
  else if (response.status === 400 || response.status === 404) {
    ElMessage.error('Oops, Account or Password Error.')
  }
  else {
    ElMessage.error('Error.')
  }
}

onMounted(() => {

  let targetTimezoneOffset = new Date().getTimezoneOffset()
  MStore.timeZoneOffset = targetTimezoneOffset
  MStore.permission = undefined
  VueCookies.remove('AuthToken')
  if (navigator.language === 'zh-TW')
    i18n.global.locale.value = 'zh_tw'
  else
    i18n.global.locale.value = 'en_us'
})

</script>

<style scoped lang="scss">
.login {
  width: 100%;
  height: 100%;
  background-position: center;
  background-size: cover;
  background-image: url("@/assets/img/login_bg.png");
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  .container0 {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    .container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 460px;
      height: 100%;

      .title {
        margin: 0 0 82px 0;
        // width: 340px;
        height: 90px;
        font-size: 78px;
        color: #ffffff;
      }

      .account {
        display: flex;
        flex-direction: row;
        align-items: center;
        margin: 0 0 6px 0;
        width: 460px;
        height: 32px;
        font-size: 22px;
        color: #92a9c4;
      }

      .input-account {
        margin: 0 0 22px 0;
        border: 0px;
        width: 460px;
        height: 46px;
        background-color: #000000C0;
        color: #ffffff;
        font-size: 22px;
        padding-left: 24px;
        box-sizing: border-box;
      }

      .password {
        display: flex;
        flex-direction: row;
        align-items: center;
        margin: 0 0 6px 0;
        width: 460px;
        height: 32px;
        font-size: 22px;
        color: #92a9c4;
      }

      .pw-container {
        position: relative;
        width: 460px;
        height: 46px;

        .input-password {
          margin: 0 0 6px 0;
          border: 0px;
          padding-left: 24px;
          width: 460px;
          height: 46px;
          background-color: #000000C0;
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
        color: #92a9c4;
        border-bottom-style: solid;
        border-color: #92a9c4;
        font-size: 22px;
      }

      .log-in {
        width: 200px;
        height: 40px;
        border-radius: 20px;
        background-color: #92a9c4;
        color: #FFFFFF;
        font-size: 22px;
      }
    }

    .logo {
      width: 200px;
      height: 40px;
      margin-bottom: 20px;
    }
  }

  .version {
    font-size: 30px;
    color: #FFFFFF;
  }
}</style>