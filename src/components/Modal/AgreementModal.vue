<script setup>
import { Close } from '@element-plus/icons-vue'
import { ref, watchEffect } from 'vue'
const modalVisible = ref(false)
const language = navigator.language
const props = defineProps({
  modal: {
    type: Boolean,
    default: false,
  },
})
const emit = defineEmits(['closeModal'])
const closeModal = (state) => {
  emit('closeModal', state, 'agreementModal')
}

watchEffect(() => {
  modalVisible.value = props.modal
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
            User Agreement
          </h4>
          <el-icon class="text-gray-4" @click.stop="closeModal(false)"><Close /></el-icon>
        </div>
      </template>
      <div class="dialog-context scrollbar">
        <div v-if="language === 'zh-TW'">
          <iframe src="https://storage.googleapis.com/msi-common/file/m_cloud_eula_zh.htm" frameborder="0"></iframe>
        </div> 
        <div v-else>
          <iframe src="https://storage.googleapis.com/msi-common/file/m_cloud_eula_en.htm" frameborder="0"></iframe>
        </div>
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
            @click.stop="closeModal(false)"
          >
            Agree
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
</style>
