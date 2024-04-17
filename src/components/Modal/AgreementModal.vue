<script setup>
import ApiFunc from '@/composables/ApiFunc'
import { ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const modalVisible = ref(false)
const props = defineProps({
  modal: {
    type: Boolean,
    default: false,
  },
})
const emit = defineEmits(['closeModal'])
const language = navigator.language
const MsiApi = ApiFunc()
const router = useRouter()
const checkState = ref(false)

const closeModal = async (state) => {
  if (state === false)
    await MsiApi.clearCookies()
  emit('closeModal', state)
}
watchEffect(() => {
  modalVisible.value = props.modal
})
const aggre_eula = async () => {
  await MsiApi.member_modify({ config: { m_cloud: { logged: true } } })
  router.push({ name: 'dashboard' })
}

</script>

<template>
  <div @click.stop="closeModal(false)">
    <el-dialog
      v-model="modalVisible"

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
          <el-icon class="text-Offline el-dialog__close" @click.stop="closeModal(false)"><Close /></el-icon>
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
          class="w-full text-left pl-4px mb-10px lg:mb-0 md:w-auto md:absolute md:left-15% md:top-30%"
          v-model="checkState"
          true-value="yes"
          false-value="no"
          size="large"
          > {{ t('agree') }}
        </el-checkbox>
        <span class="dialog-footer flex flex-center">
          <el-button
            round
            class="w-48% bg-btn-100 text-white max-w-140px"
            @click.stop="closeModal(false)"
            >
            {{ t('cancel') }}
            </el-button
          >
          <el-button
            round
            class="w-48% bg-btn-200 text-white max-w-140px"
            @click="aggre_eula"
            :disabled="!checkState"
          >
            {{ t('agree') }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.scrollbar {
  &::-webkit-scrollbar {
    width: 0.6rem;
  }
  &::-webkit-scrollbar-track,
  &::-webkit-scrollbar-corner {
    background-color: var(--blue-100);
  }
  &::-webkit-scrollbar-thumb {
    background-color: var(--gray-300);
    border-radius: 2rem;
  }
}
:deep(.el-overlay-dialog .el-dialog__body) {
  flex-grow: 1;
}
</style>
