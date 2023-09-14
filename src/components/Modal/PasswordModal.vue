<script setup>
import ApiFunc from '@/composables/ApiFunc'
import { ElMessage } from 'element-plus'
import { Close } from '@element-plus/icons-vue'
import { ref, watchEffect, onMounted } from 'vue'
import { useI18n } from "vue-i18n"
import { useRouter } from 'vue-router'
const { t } = useI18n()
const router = useRouter()
const modalVisible = ref(false)
const props = defineProps({
  modal: {
    type: Boolean,
    default: false,
  },
})
const emit = defineEmits(['closeModal'])
const MsiApi = ApiFunc()
const reset_password1 = ref('')
const reset_password2 = ref('')

const resetValue = () => {
  reset_password1.value = ''
  reset_password2.value = ''
}
const checkPasswordRule = () => {
  const regex0 = /^(?!=.*[\\|/,.;:{}[]()])[A-Za-z0-9]+$/
  const regex1 = /^(?=.*[a-z])[A-Za-z0-9]+$/
  const regex2 = /^(?=.*[0-9])[A-Za-z0-9]+$/
  let res = true
  if (reset_password1.value !== reset_password2.value) {
    ElMessage({
      message: t('your_password_and_confirmation_password_must_match'),
      type: 'error',
    })
    res = false
  }
  else if (!regex0.test(reset_password1.value)) {
    ElMessage({
      message: t('password_cannot_include_symbols_and_space'),
      type: 'error',
    })
    res = false
  }
  else if (!regex1.test(reset_password1.value)) {
    ElMessage({
      message: t('password_should_include_1_lowercase_letter'),
      type: 'error',
    })
    res = false
  }
  else if (!regex2.test(reset_password1.value)) {
    ElMessage({
      message: t('password_should_include_1_number'),
      type: 'error',
    })
    res = false
  }
  else if (reset_password1.value.length < 8 || reset_password1.value.length > 20) {
    ElMessage({
      message: t('password_length_should_be_at_least_8_characters_but_cannot_over_20_characters'),
      type: 'error',
    })
    res = false
  }
  return res
}
const confirm_PW = (state) => {
  if (reset_password1.value === '' || reset_password2.value === '') {
    ElMessage({
      message: 'Password 不得為空.',
      type: 'warning',
    })
    return
  }
  if (checkPasswordRule()) {
    let sendData = { password: reset_password2.value }
    let res = MsiApi.resetPW(sendData)
    emit('closeModal', state, 'passwordModal')
    resetValue()
    res.then((result) => {
      console.log(result)
      // if (result.status === 200) {
      //   router.push({ name: 'login' })
      // }
    })
  }
}
const closeModal = (state) => {
  if (!state) {
    if (reset_password1.value !== '' || reset_password2.value !== '') resetValue()
  }
  emit('closeModal', state, 'passwordModal')
}
watchEffect(() => {
  modalVisible.value = props.modal
})
onMounted(() => {
  resetValue()
})
</script>

<template>
  <!-- <div @click.stop="closeModal(false)"> -->
  <div>
    <el-dialog
      v-model="modalVisible"
      @click.stop="closeModal(true)"
      class="max-w-600px"
      :show-close="false"
      width="90%"
      destroy-on-close
      :close-on-click-modal="false"
      center
    >
      <template #header="{ titleId, titleClass }">
        <div class="py-2rem relative bg-blue-100">
          <h4
            :id="titleId"
            :class="titleClass"
            class="m-0 text-center text-blue-1200 font-400 text-24px line-height-26px"
          >
            {{ t('reset_password') }}
          </h4>
          <el-icon class="text-Offline el-dialog__close" @click.stop="closeModal(false)">
            <Close />
          </el-icon>
        </div>
      </template>
      <div class="dialog-context">
        <el-form class="max-w-500px m-auto">
          <el-form-item class="mb-24px" :label="t('please_key_in_a_new_password')">
            <el-input v-model.trim="reset_password1" />
          </el-form-item>
          <el-form-item class="mb-24px" :label="t('please_key_in_the_new_password_again')">
            <el-input v-model.trim="reset_password2" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer flex flex-center">
          <el-button
            round
            class="w-48% bg-btn-100 text-white max-w-140px"
            @click.stop="closeModal(false)"
            >{{ t('cancel') }}</el-button
          >
          <el-button
            round
            class="w-48% bg-btn-200 text-white max-w-140px"
            @click.stop="confirm_PW(false)"
          >
            {{ t('confirm') }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.el-form-item {
  display: block;
}
:deep(.el-form-item__label) {
  display: block;
  font-size: 1.6rem;
}
</style>
