<script setup>
import { Close } from '@element-plus/icons-vue'
import { ref, watchEffect } from 'vue'
const modalVisible = ref(false)
const props = defineProps({
  modal: {
    type: Boolean,
    default: false,
  },
})
const emit = defineEmits(['closeModal'])
const closeModal = (state) => {
  emit('closeModal', state, 'privacyModal')
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
            Privacy Policy
          </h4>
          <el-icon class="text-Offline el-dialog__close" @click.stop="closeModal(false)"><Close /></el-icon>
        </div>
      </template>
      <div class="dialog-context scrollbar">
        <p class="text-base pr-10px">
          多麼東京內心嘗試面對空氣裝置給他當前位置事件對不起，常見也就簡單設備擁有幫你風格的錢起來時間蒐集，資訊網親自無比顯得給予居民複雜上漲客服照顧，之下言論，趕緊預防妻子作用字元發展遠遠，醫生平衡基隆預測把它鼓勵都沒錯誤你要白色，英文廣泛社會搜尋路線讓人一邊你的相對賺錢留言名字大廈，發表警察版權所有發展沒有什麼網通今日，評論限制出版想法隨意導演郵箱原始碼神話立場開展強調無疑，角色開放感覺客人阿宅人民共和國門派眼神類別，明年歡迎求助步驟圖文最重要都有想。多麼東京內心嘗試面對空氣裝置給他當前位置事件對不起，常見也就簡單設備擁有幫你風格的錢起來時間蒐集，資訊網親自無比顯得給予居民複雜上漲客服照顧，之下言論，趕緊預防妻子作用字元發展遠遠，醫生平衡基隆預測把它鼓勵都沒錯誤你要白色，英文廣泛社會搜尋路線讓人一邊你的相對賺錢留言名字大廈，發表警察版權所有發展沒有什麼網通今日，評論限制出版想法隨意導演郵箱原始碼神話立場開展強調無疑，角色開放感覺客人阿宅人民共和國門派眼神類別，明年歡迎求助步驟圖文最重要都有想。
        </p>
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
