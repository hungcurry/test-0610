<script setup>
import ApiFunc from '@/composables/ApiFunc'
import { Search } from '@element-plus/icons-vue'
import msi from '@/assets/msi_style'
import moment from 'moment'
import { ref, reactive, onMounted } from 'vue'
import { useMStore } from '../stores/m_cloud'
import { useI18n } from "vue-i18n"
import { ElMessage, ElMessageBox } from 'element-plus'

let companyInfoData = []
let companyList = []
const { t } = useI18n()
const MStore = useMStore()
const MsiApi = ApiFunc()
const isLoading = ref(false)
const token_ref = ref()
const tokenFormVisible = ref(false)
const create_mode = ref(false)
const token_title= ref('')
const search_input = ref('')
const rendercompanyList = reactive([])
const renderTokenData = reactive([])
const renderTokenDetailData = reactive({count: 0, enable: false, expired_date_time: '', name: '', token: '', type: 'AISKU'})
const token_rules = reactive({
  name: [ { required: true, message: t('the_item_is_required'), trigger: 'blur' }],
  expired_date_time: [ { required: true, message: t('the_item_is_required'), trigger: 'blur' }],
})

const search = () => {
  try {
    renderTokenDataLayout()
    if (search_input.value !== '') {  
      let tempBuf = []
      for (let i = 0 ; i < renderTokenData.length; i++) {
        if ( renderTokenData[i]?.name?.toLowerCase()?.includes(search_input.value.toLowerCase()) || 
             renderTokenData[i]?.type?.toLowerCase()?.includes(search_input.value.toLowerCase()) || 
             renderTokenData[i]?.token?.toLowerCase()?.includes(search_input.value.toLowerCase()) || 
             renderTokenData[i]?.enable?.toLowerCase()?.includes(search_input.value.toLowerCase()) ||
             renderTokenData[i]?.count?.toLowerCase()?.includes(search_input.value.toLowerCase()) || 
             renderTokenData[i]?.expired_date_time?.toLowerCase()?.includes(search_input.value.toLowerCase())
          ) 
        {
          let renderTokenDataObj = {}
          renderTokenDataObj.name = renderTokenData[i].name
          renderTokenDataObj.type = renderTokenData[i].type
          renderTokenDataObj.token = renderTokenData[i].token
          renderTokenDataObj.enable = renderTokenData[i].enable
          renderTokenDataObj.count = renderTokenData[i].count
          renderTokenDataObj.expired_date_time = renderTokenData[i].expired_date_time
          tempBuf.push(renderTokenDataObj)
        }
      }
      renderTokenData.length = 0
      Object.assign(renderTokenData, tempBuf)
    }
  } catch (error) {
    console.log(error)
    ElMessage.error(t('error'))
  }
}

const getCompanyInformation = async () => {
  try {
    let queryData = { database: 'CPO', collection: 'CompanyInformation', 
      pipelines: [
        { $match: { credentials: { $exists: true, $not: { $size: 0 } } } },
        { $project: { _id: 0, name: 1, credentials: 1}}
      ]}
    let response = await MsiApi.mongoAggregate(queryData)    
    if (response.status === 200) {
      companyInfoData = response.data.result
    }
    else {
      ElMessage.error(t('error'))
    }
  } catch (error) {
    ElMessage.error(t('error'))
  }
}

const getCompanyList = async () => {
  try {
    let queryData = { database: 'CPO', collection: 'CompanyInformation', 
                      pipelines: [{ $project: { _id: 0, name: 1, }}]}
    let response = await MsiApi.mongoAggregate(queryData)
    if (response.status === 200) {
      companyList = response.data.result
    }
    else {
      ElMessage.error(t('error'))
    }
  }
  catch (error) {
    ElMessage.error(t('error'))
  }
}

const renderTokenDataLayout = async () => {
  try {
    renderTokenData.length = 0
    for (let i = 0 ; i < companyInfoData.length; i++) {
      for (let j = 0; j < companyInfoData[i].credentials?.length; j++) {
        let renderTokenDataObj = {}
        renderTokenDataObj.name = companyInfoData[i].name
        renderTokenDataObj.type = companyInfoData[i].credentials[j].type
        renderTokenDataObj.token = companyInfoData[i].credentials[j].token
        if (companyInfoData[i]?.credentials?.[j]?.enable)
          renderTokenDataObj.enable = companyInfoData[i].credentials[j].enable.toString()
        if( typeof companyInfoData[i]?.credentials?.[j]?.count === 'number')
          renderTokenDataObj.count = companyInfoData[i].credentials[j].count.toString()
        let temp = new Date(companyInfoData[i].credentials[j].expired_date_time).getTime() + MStore.timeZoneOffset * -60000
        renderTokenDataObj.expired_date_time = moment(temp).format('YYYY-MM-DD HH:mm:ss')
        renderTokenData.push(renderTokenDataObj)
      }
    }
  } catch (error) {
    ElMessage.error(t('error'))
  }
}

const renderCompanyList = async () =>{
  try {
    for (let i = 0; i < companyList.length; i++) {
      rendercompanyList.push(companyList[i].name)
    }  
  } catch (error) {
    ElMessage.error(t('error'))
  }
}

const add_token = () => {
  token_title.value = t('add_token')
  create_mode.value = true
  renderTokenDetailData.enable = false
  renderTokenDetailData.expired_date_time = ''
  renderTokenDetailData.name = ''
  renderTokenDetailData.token = ''
  renderTokenDetailData.type = 'AISKU'
  tokenFormVisible.value = true
}

const tokenDialogConfirm = async () => {
  try {
    token_ref.value.validate(async valid => {
    if (valid) {
      if (create_mode.value === true) {
        ElMessageBox.confirm(t('do_you_want_to_create'), t('warning'), {confirmButtonText: t('ok'), cancelButtonText: t('cancel'), type: 'warning'})
        .then(async () => {
          if (create_mode.value === true) {
            let sendData = { expired_date_time: renderTokenDetailData.expired_date_time, type: renderTokenDetailData.type }
            let companyName = renderTokenDetailData.name
            isLoading.value = true
            let response = await MsiApi.createToken(companyName, sendData)
            if (response.status === 200) {
              ElMessage.success('Success')
            }
            else {
              ElMessage.error(t('error'))
            }
            tokenFormVisible.value = false
            await getCompanyInformation()
            await renderTokenDataLayout()
            isLoading.value = false
          }
        })
      }
      else {
        ElMessageBox.confirm(t('do_you_want_to_modify'), t('warning'), {confirmButtonText: t('ok'), cancelButtonText: t('cancel'), type: 'warning'})
        .then(async () => {
          let sendData = { enable:renderTokenDetailData.enable, expired_date_time: renderTokenDetailData.expired_date_time, token: renderTokenDetailData.token}
          let companyName = renderTokenDetailData.name
          isLoading.value = true
          let response = await MsiApi.patchToken(companyName, sendData)
          if (response.status === 200) {
            ElMessage.success('Success')
          }
          else {
            ElMessage.error(t('error'))
          }
          tokenFormVisible.value = false
          await getCompanyInformation()
          await renderTokenDataLayout()
          isLoading.value = false
        })
      }
    }
    else {
      return false
    }
  })
  } catch (error) {
    console.log(error)
    ElMessage.error(t('error'))
  }
}

const tokenDialogDelete = async () => {
  try {
    ElMessageBox.confirm(t('do_you_want_to_delete'), t('warning'), {confirmButtonText: t('ok'), cancelButtonText: t('cancel'), type: 'warning'})
    .then(async () => {
    let sendData = { token: renderTokenDetailData.token }
    let companyName = renderTokenDetailData.name
    isLoading.value = true
    let response = await MsiApi.deleteToken(companyName, sendData)
    if (response.status === 200) 
      ElMessage.success('Success')
    else 
      ElMessage.error(t('error'))
    tokenFormVisible.value = false
    await getCompanyInformation()
    await renderTokenDataLayout()
    isLoading.value = false
  })
  } catch (error) {
    console.log(error)
    ElMessage.error(t('error'))
    isLoading.value = false
  }
}

const token_detail = (detail) => {
  try {
    create_mode.value = false
    token_title.value = t('edit_token')
    renderTokenDetailData.count = detail.count
    renderTokenDetailData.enable = detail.enable
    renderTokenDetailData.expired_date_time = detail.expired_date_time
    renderTokenDetailData.name = detail.name
    renderTokenDetailData.token = detail.token
    renderTokenDetailData.type = detail.type
    tokenFormVisible.value = true
  } catch (error) {
    console.log(error)
    ElMessage.error(t('error'))
  }
}

onMounted( async() => {
  isLoading.value = true
  await getCompanyInformation()
  await getCompanyList()
  await renderTokenDataLayout()  
  await renderCompanyList()  
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
        <el-button 
          v-if="MStore.rule_permission.TokenManagement.addToken === 'O'"
          class="btn-secondary box-shadow" @click="add_token()"> {{ t('add_token') }} 
        </el-button>
      </div>
      
      <div class="overflow-x-auto ">
        <div class="pb-40px mt-80px">
          <el-table
            ref="tableRef"
            :data="renderTokenData"
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
            <el-table-column prop="expired_date_time" :label="t('expired_date_time')" align="center" min-width="150"/>
            <el-table-column prop="detail" label="" align="center" min-width="150">
              <template #default="scope">
                <el-button class="btn-more"
                v-if="MStore.rule_permission.TokenManagement.detail === 'O'"
                @click="token_detail(scope.row)">
                  <font-awesome-icon icon="fa-solid fa-ellipsis" />
                </el-button>
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
            <el-form class="max-w-500px m-auto" :rules="token_rules" ref="token_ref" :model="renderTokenDetailData">
              <el-form-item class="mb-24px" :label="t('company')" prop="name">
                <el-select v-if=" create_mode" v-model="renderTokenDetailData.name" class="m-2" placeholder="Select" size="large">
                  <el-option v-for="item in companyList" :key="item.name" :label="item.name" :value="item.name" />
                </el-select>  
                <el-select v-else v-model="renderTokenDetailData.name" class="m-2" placeholder="Select" size="large" disabled>
                  <el-option v-for="item in companyList" :key="item.name" :label="item.name" :value="item.name" />
                </el-select>  
              </el-form-item>
              <el-form-item class="mb-24px" :label="t('type')" prop="type">
                <el-input v-model="renderTokenDetailData.type" disabled/>
              </el-form-item>
              <el-form-item v-if=" !create_mode" class="mb-24px" :label="t('token')" prop="token" >
                <el-input v-model="renderTokenDetailData.token" disabled/>
              </el-form-item>
              <el-form-item v-if=" !create_mode" class="mb-24px" :label="t('enable')" prop="enable">
                <el-switch v-model="renderTokenDetailData.enable" />
              </el-form-item>
              <el-form-item v-if=" !create_mode" class="mb-24px" :label="t('count')" prop="count">
                <el-input v-model="renderTokenDetailData.count" disabled/>
              </el-form-item>
              <el-form-item class="mb-24px" :label="t('expired_date_time')" prop="expired_date_time">
                <div class="block">
                  <el-date-picker v-model="renderTokenDetailData.expired_date_time" type="datetime" placeholder="Select date and time"/>
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
                @click.stop="tokenDialogDelete()"
              >
                {{ t('delete') }}
              </el-button>
              <el-button round class="w-48% bg-btn-100 text-white max-w-140px"
                @click.stop="tokenFormVisible = false"
              >
                {{ t('cancel') }}
              </el-button>
              <el-button
                round
                class="w-48% bg-btn-200 text-white max-w-140px"
                @click.stop="tokenDialogConfirm()"
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
