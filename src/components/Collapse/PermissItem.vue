<script setup>
import { ref, reactive, onMounted } from 'vue'
import { SemiSelect } from '@element-plus/icons-vue'
import { usePermissionsStore } from '@/stores/permissions'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

const props = defineProps({
  string: {
    type: String,
    userType: String,
    default: 'no name',
  },
})

const result = ref([])
const objArr = reactive({})

const string = ref(props.string)

const PermissionsStore = usePermissionsStore()

const { checkAll, isIndeterminate, checked } = storeToRefs(PermissionsStore)
const handleCheckAll = (str, val) => {
  console.log(str, val)
  checked.value[str] = val ? objArr[str] : []
  isIndeterminate.value[str] = false
}
const handleCheckeditems = (str, ary) => {
  const checkedCount = ary.length
  checkAll.value[str] = checkedCount === objArr[str].length
  const isHasChecked = checkedCount > 0
  const isNotAllChecked = checkedCount < objArr[str].length
  isIndeterminate.value[str] = isHasChecked && isNotAllChecked

}

Object.assign(result.value, Object.keys(checked.value[string.value]).filter(key => checked.value[string.value][key] === 'O'))
console.log(result.value)
onMounted(() => {

console.log(string)

})

for (let key in checked.value) {
    // eslint-disable-next-line no-prototype-builtins
    if (checked.value.hasOwnProperty(key)) {
        let subObj = checked.value[key]
        objArr[key] = Object.keys(subObj)
    }
}

</script>

<template>
  <el-collapse-item>
    <template #title>
      <p class="text-20px font-700 text-secondary whitespace-nowrap">
        {{ t( string ) }}
      </p>
      <el-icon class="text-secondary header-icon ml-4px">
        <SemiSelect />
      </el-icon>
      <!-- <el-checkbox
        class="title my-0px ml-10px"
        v-model="checkAll[string]"
        :indeterminate="isIndeterminate[string]"
        @change="handleCheckAll(string, $event)"
        @click.stop
        >{{ t('check_all') }}
      </el-checkbox> -->
    </template>
    <el-checkbox-group
      class="flex flex-wrap"
      v-model="result"
      @change="handleCheckeditems(string, $event)"
      >
      <el-checkbox
        class="w-full min-w-170px m-0 mt-4px mb-18px md:w-auto md:mr-12px"
        v-for="item in objArr[string]"
        :key="item"
        :label="item"
        border
        >{{ t( item ) }}
      </el-checkbox>
    </el-checkbox-group>
  </el-collapse-item>
</template>

<style lang="scss" scoped>
.el-checkbox.is-bordered.is-checked {
  background-color: var(--btn-300);
  :deep(.el-checkbox__label) {
    color: var(--primary);
  }
}
// state
:deep(.el-checkbox__input) + .el-checkbox__label {
  color: var(--gray-300);
}
:deep(.el-checkbox__input.is-indeterminate) + .el-checkbox__label {
  color: var(--gray-300);
}
:deep(.el-checkbox__input.is-checked) + .el-checkbox__label {
  color: var(--secondary);
}
</style>
