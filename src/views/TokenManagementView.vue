<script setup>
import ApiFunc from '@/composables/ApiFunc'
import { Search } from '@element-plus/icons-vue'
import msi from '@/assets/msi_style'
import moment from 'moment'
import { ref, reactive, onMounted } from 'vue'
import { useMStore } from '../stores/m_cloud'
import { useI18n } from "vue-i18n"
import CommpnFunc from '@/composables/CommonFunc'
const MsiFunc = CommpnFunc()
const { t } = useI18n()
const MStore = useMStore()
const MsiApi = ApiFunc()
const isLoading = ref(false)
const tokenData = reactive([])
const companyTokenData = reactive({})
const token_ref = ref()
const tokenFormVisible = ref(false)
const create_mode = ref(false)
const token_title= ref('')
const input = ref('')
const companyList = reactive([])

const token_rules = reactive({
  name: [
    { required: true, message: t('the_item_is_required'), trigger: 'blur' },
  ],
  expired_date_time: [
    { required: true, message: t('the_item_is_required'), trigger: 'blur' },
  ],
})


const search = () => {

}
const detail_info = (detail) => {
  
  if (detail === 'create') {
    create_mode.value = true
    companyTokenData.count = 0
    companyTokenData.enable = false
    companyTokenData.expired_date_time = ''
    companyTokenData.name = ''
    companyTokenData.token = ''
    companyTokenData.type = 'AISKU'
    token_title.value = t('create_token')
  }
  else {
    create_mode.value = false
    companyTokenData.count = detail.count
    companyTokenData.enable = detail.enable
    companyTokenData.expired_date_time = detail.expired_date_time
    companyTokenData.name = detail.name
    companyTokenData.token = detail.token
    companyTokenData.type = detail.type
    companyTokenData.expired_date_time_str = new Date(companyTokenData.expired_date_time).getTime() + MStore.timeZoneOffset * -60000
    companyTokenData.expired_date_time_str = moment(companyTokenData.expired_date_time_str).format('YYYY-MM-DD HH:mm:ss')
    token_title.value = t('edit_token')
  }
  tokenFormVisible.value = true
}

const editToken = async (action) => {
  MsiFunc.deleteEmptyKeys(companyTokenData)
  console.log(companyTokenData)
  companyTokenData.expired_date_time = companyTokenData.expired_date_time_str 
  delete companyTokenData.expired_date_time_str 
  if (create_mode.value) {
    await MsiApi.setToken('post', companyTokenData)    
  }
  else {
    if (action === 'delete') {
      await MsiApi.setToken('delete', companyTokenData)    
    }
    else if (action === 'confirm') {
      await MsiApi.setToken('patch', companyTokenData)    
    }
  }
  tokenFormVisible.value = false
  mountedFlow()
}

const mountedFlow = async() => {
  let queryData = { 
    "database": 'CPO', "collection": 'CompanyInformation', "pipelines": [
      {
        $match: {
          credentials: { $exists: true }
        }
      },
      {
        $project: { _id: 0, name: 1, credentials: 1} 
      }
    ]
  }
  let response = await MsiApi.mongoAggregate(queryData)
  const transformedData = response.data.result.flatMap(item =>
    item.credentials.map(credential => ({
      type: credential.type,
      token: credential.token,
      enable: credential.enable,
      count: credential.count,
      expired_date_time: credential.expired_date_time,
      name: item.name
    }))
  )
  for (let i = 0; i < transformedData.length; i++) {
    transformedData[i].expired_date_time_str = new Date(transformedData[i].expired_date_time).getTime() + MStore.timeZoneOffset * -60000
    transformedData[i].expired_date_time_str = moment(transformedData[i].expired_date_time_str).format('YYYY-MM-DD HH:mm:ss')
  }
  tokenData.length = 0
  Object.assign(tokenData, transformedData)
  
  queryData = { 
    "database": 'CPO', 
    "collection": 'CompanyInformation', 
    "pipelines": [
      {
        $project: { _id: 0, name: 1, } 
      }
    ]
  }
  response = await MsiApi.mongoAggregate(queryData)
  companyList.length = 0
  Object.assign(companyList,response.data.result)
}

onMounted(() => {
  mountedFlow()
})
</script>

<template>
  <div class="customer">
    <div class="container lg">

      <div class="flex justify-between flex-wrap lg:flex-nowrap pt-40px pb-32px">
        <el-input class="search-input" v-model="input" :placeholder="t('search')" @keyup.enter="search">
          <template #append>
            <el-button :icon="Search" @click="search" />
          </template>
        </el-input>
        <el-button class="btn-secondary box-shadow" @click="detail_info('create')"> {{ t('add_token') }} </el-button>
      </div>
      
      <div class="overflow-x-auto ">
        <div class="pb-40px mt-80px">
          <el-table
            ref="tableRef"
            :data="tokenData"
            class="white-space-nowrap text-primary"
            height="calc(100vh - 220px)"
            style="width: 100%"
            stripe
            size="large"
            :cell-style="msi.tb_cell"
            :header-cell-style="msi.tb_header_cell"
            v-loading.fullscreen.lock="isLoading"
            
          >
            <el-table-column prop="name" :label="t('company')" align="center" min-width="150"/>
            <el-table-column prop="type" :label="t('type')" align="center" min-width="150"/>
            <el-table-column prop="token" :label="t('token')" align="center" min-width="150"/>
            <el-table-column prop="enable" :label="t('enable')" align="center" min-width="150"/>
            <el-table-column prop="count" :label="t('count')" align="center" min-width="150"/>
            <el-table-column prop="expired_date_time_str" :label="t('expired_date_time')" align="center" min-width="150"/>
            <el-table-column prop="detail" label="" align="center" min-width="150">
              <template #default="scope">
                <el-button class="btn-more" @click="detail_info(scope.row)"> <font-awesome-icon icon="fa-solid fa-ellipsis" /> </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
        


        <el-dialog v-model="tokenFormVisible"  class="max-w-600px" :show-close="true" width="90%" destroy-on-close center>
          <template #header="{ titleId, titleClass }">
            <div class="py-2rem relative bg-blue-100">
              <h4
                :id="titleId"
                :class="titleClass"
                class="m-0 text-center text-blue-1200 font-400 text-24px line-height-26px"
              >
                {{ token_title }}
              </h4>
            </div>
          </template>
          <div class="dialog-context">
            <el-form class="max-w-500px m-auto" :rules="token_rules" ref="token_ref" :model="companyTokenData">
              <el-form-item class="mb-24px" :label="t('name')" prop="name">
                <el-select v-model="companyTokenData.name" class="m-2" placeholder="Select" size="large">
                  <el-option v-for="item in companyList" :key="item.name" :label="item.name" :value="item.name"/>
                </el-select>  
              </el-form-item>
              <el-form-item class="mb-24px" :label="t('type')" prop="type">
                <el-input v-model="companyTokenData.type" disabled/>
              </el-form-item>
              <el-form-item v-if=" !create_mode" class="mb-24px" :label="t('token')" prop="token" >
                <el-input v-model="companyTokenData.token" disabled/>
              </el-form-item>
              <el-form-item v-if=" !create_mode" class="mb-24px" :label="t('enable')" prop="enable">
                <el-switch v-model="companyTokenData.enable" />
              </el-form-item>
              <el-form-item v-if=" !create_mode" class="mb-24px" :label="t('count')" prop="count">
                <el-input v-model="companyTokenData.count" disabled/>
              </el-form-item>
              <el-form-item class="mb-24px" :label="t('expired_date_time')" prop="expired_date_time">
                <div class="block">
                  <el-date-picker v-model="companyTokenData.expired_date_time_str" type="datetime" placeholder="Select date and time"/>
                </div>
              </el-form-item>
            </el-form>
          </div>
          <template #footer>
            <span class="dialog-footer flex flex-center">
              <el-button
                v-if=" !create_mode"
                round
                class="w-48% bg-btn-100 text-white max-w-140px"
                @click.stop="editToken('delete')"
              >
                {{ t('delete') }}
              </el-button>
              <el-button round class="w-48% bg-btn-100 text-white max-w-140px"
                @click.stop="editToken('cancel')"
              >
                {{ t('cancel') }}
              </el-button>
              <el-button
                round
                class="w-48% bg-btn-200 text-white max-w-140px"
                @click.stop="editToken('confirm')"
              >
                {{ t('confirm') }}
              </el-button>
            </span>
          </template>
        </el-dialog>


        
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