<script setup>
import msi from '@/assets/msi_style'
import { ref, reactive, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useI18n } from "vue-i18n"
const { t } = useI18n()
const renderCdrData = reactive([])
let cdrData = []

const isLoading = ref(false)

const renderCdrLayout = async () => {
  try {
    renderCdrData.length = 0
    for (let i = 0 ; i < cdrData.length; i++) {
        let cdrDataObj = {}
        cdrDataObj.start_date_time = cdrData[i].start_date_time
        renderCdrData.push(cdrDataObj)
    }
  } catch (error) {
    ElMessage.error(t('error'))
  }
}

const getCdrData = async () => {

}

const cdr_detail = () => {

}

onMounted( async() => {
  isLoading.value = true
  await getCdrData()
  await renderCdrLayout()  
  isLoading.value = false
})

</script>

<template>
  <div class="customer">
    <div class="container lg">
      <div class="flex justify-between flex-wrap lg:flex-nowrap pt-40px pb-32px">
        <el-input class="search-input" v-model="search_input" :placeholder="t('search')" @keyup.enter="search">
          <template #append>
            <el-button :icon="Search" @click="search" />
          </template>
        </el-input>
      </div>

      <div class="overflow-x-auto ">
        <div class="pb-40px mt-80px">
          <el-table ref="tableRef" :data="renderCdrData" class="white-space-nowrap text-primary" v-loading.fullscreen.lock="isLoading"
            height="calc(100vh - 220px)" style="width: 100%" stripe size="large" :cell-style="msi.tb_cell" :header-cell-style="msi.tb_header_cell">
            <el-table-column prop="start_date_time" :label="t('start_date_time')" align="center" min-width="150"/>
            <el-table-column prop="end_date_time" :label="t('end_date_time')" align="center" min-width="150"/>
            <el-table-column prop="charging_periods" :label="t('charging_periods')" align="center" min-width="150"/>
            <el-table-column prop="total_cost" :label="t('total_cost')" align="center" min-width="150"/>
            <el-table-column prop="total_energy" :label="t('total_energy')" align="center" min-width="150"/>
            <el-table-column prop="total_time" :label="t('total_time')" align="center" min-width="150"/>
            <el-table-column prop="last_updated" :label="t('last_updated')" align="center" min-width="150"/>
            <el-table-column prop="detail" label="Detail" align="center" min-width="150">
              <template #default="scope">
                <el-button class="btn-more" @click="cdr_detail(scope.row)"> <font-awesome-icon icon="fa-solid fa-ellipsis" /> </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>
  </div>
</template>




<style lang="scss" scoped>
.customer {
  .search-input {
    width: 400px;
    height: 40px;

    :deep(.el-input__wrapper) {
      background-color: var(--el-fill-color-blank);
      border-top-left-radius: 3rem;
      border-bottom-left-radius: 3rem;
      border: 0.2rem solid var(--blue-700);
      border-right: 0.1rem solid var(--blue-700);
      box-shadow: 0.7rem 1.1rem 1.2rem rgba(146, 169, 196, 0.25) !important;
    }
    :deep(.el-input-group__append) {
      background-color: var(--el-fill-color-blank);
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
      border-top-right-radius: 3rem;
      border-bottom-right-radius: 3rem;
      border: 0.2rem solid var(--blue-700);
      border-left: 0;
      box-shadow: 0.7rem 1.1rem 1.2rem rgba(146, 169, 196, 0.25) !important;
    }
    :deep(.el-input__inner) {
      color: black;
    }
    :deep(.el-icon) {
      color: black;
    }
  }
  .el-form-item {
    display: block;
  }
  :deep(.el-form-item__label) {
    display: block;
    font-size: 1.6rem;
  }
  :deep(.el-input) {
    height: 30px;
  }
}
  
</style>