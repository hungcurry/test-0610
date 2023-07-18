<script setup>
import ApiFunc from '@/composables/ApiFunc'
import { ElMessage } from 'element-plus'
import { Close } from '@element-plus/icons-vue'
import { ref, watchEffect, onMounted } from 'vue'
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
const confirm_PW = (state) => {
  if (reset_password1.value === '' || reset_password2.value === '') {
    ElMessage({
      message: 'Password 不得為空.',
      type: 'warning',
    })
    return
  }
  if (reset_password1.value === reset_password2.value) {
    let sendData = { password: reset_password2.value }
    MsiApi.resetPW(sendData)
    emit('closeModal', state, 'passwordModal')
    resetValue()
  } else {
    ElMessage({
      message: 'PW error',
      type: 'error',
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
  <div @click.stop="closeModal(false)">
    <el-dialog
      v-model="modalVisible"
      @click.stop="closeModal(true)"
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
            Reset Password
          </h4>
          <el-icon class="text-gray-4" @click.stop="closeModal(false)">
            <Close />
          </el-icon>
        </div>
      </template>
      <div class="dialog-context">
        <el-form class="max-w-500px m-auto">
          <el-form-item class="mb-24px" label="New password">
            <el-input v-model.trim="reset_password1" />
          </el-form-item>
          <el-form-item class="mb-24px" label="New password again">
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
            >Cancel</el-button
          >
          <el-button
            round
            class="w-48% bg-btn-200 text-white max-w-140px"
            @click.stop="confirm_PW(false)"
          >
            Confirm
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
