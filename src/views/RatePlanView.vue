<script setup>
import {  reactive, onMounted, ref} from 'vue'
import {useRouter } from 'vue-router'
import ApiFunc from '@/composables/ApiFunc'
import msi from '@/assets/msi_style'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { ElMessageBox,ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { useMStore } from "../stores/m_cloud"

const { t } = useI18n()
const MStore = useMStore()
const router = useRouter()
const MsiApi = ApiFunc()
const isLoading = ref(false)
const renderTariffData = reactive([])
let tariffData = []

const sortFunc = (obj1, obj2, column) => {
  let at = obj1[column]
  let bt = obj2[column]
  if (bt === undefined) 
    return -1
  if (at > bt) 
    return -1
}

const deleteTariff = async (row) => {
  let queryData = { database: "OCPI", collection: "Connector", pipelines: [
    { $match: { tariff_ids: {UUID: row.id} }}, { $project: {_id: 1,}}
  ]}
  let res = await MsiApi.mongoAggregate(queryData)
  let used_connector, evse
  if (res.status === 200) {
    used_connector= res.data.result
  }
  else {
    console.log(res)
    return
  }
  queryData = { database: "OCPI", collection: "EVSE", pipelines: [
    { $project: {_id: 0, connectors: 1, evse_id:1}}]
  }
  res = await MsiApi.mongoAggregate(queryData)
  if (res.status === 200) {
    evse = res.data.result
  }
  else {
    console.log(res)
    return
  }

  let used_evse = []
  for (let i = 0; i < used_connector.length; i++) {
    for (let j = 0; j < evse.length; j++) {
      if (used_connector[i]._id === evse[j].connectors[0]) {
        used_evse.push(evse[j].evse_id)
      }
    }
  }
  if(used_evse.length !== 0) {
    let used_evse_str = ''
    for (let i = 0; i < used_evse.length; i++) {
      used_evse_str += used_evse[i] + ' / ' 
    }
    ElMessage.error(used_evse_str + t('in_using'))
  }
  else {
    let sendData = { class : 'Tariff', id : row.id }
    ElMessageBox.confirm(t('do_you_want_to_delete'), t('warning'), {confirmButtonText: t('ok'), cancelButtonText: t('cancel'), type: 'warning'})
    .then(async () => {
      isLoading.value = true
      await MsiApi.setCollectionData('delete', 'ocpi', sendData)
      await getTariff()
      await renderTariffDataLayout()
      isLoading.value = false
    })
  }
}

const editTariff = (row) => {
  console.log(row)
  router.push({ name: 'ratePlanDetail', query: {id: row.id} })
}

const copyTariff = (scope) => {
  if (renderTariffData.length >= MStore.program.tariff && MStore.permission.isMSI === false) 
    ElMessage.error(t('please_confirm_your_subscription_plan'))
  else {
    ElMessageBox.confirm(t('do_you_want_to_duplicate'), t('warning'), {confirmButtonText: t('ok'), cancelButtonText: t('cancel'), type: 'warning'})
    .then(async () => {
      let queryData  = { database: "OCPI", collection: "Tariff", 
      pipelines: [
        { $match: { id: {$eq: { "UUID" : scope.id} }}},
        { $project: { _id: 0, } }
      ]}
      isLoading.value = true
      let res = await MsiApi.mongoAggregate(queryData)
      let oriTariff = res.data.result[0]
      oriTariff.class = 'Tariff'
      delete oriTariff.id
      res = await MsiApi.setCollectionData('post', 'ocpi', oriTariff)
      if (res.status === 201) {
        ElMessage.success(t('create_success'))
        await getTariff()
        await renderTariffDataLayout()
      }
      else {
        ElMessage.error(res.data.message)
      }
      isLoading.value = false
    })
  }
}

const add_rate_plan = async()=> {
  if (renderTariffData.length >= MStore.program.tariff && MStore.permission.isMSI === false) 
    ElMessage.error(t('please_confirm_your_subscription_plan'))
  else 
    router.push({ name: 'ratePlanDetail' })
}

const getTariff = async () => {
  try {
    let queryData  = { database: "OCPI", collection: "Tariff", pipelines: [ { $project: { _id:0, currency:1, custom:1, min_price:1, id:1, last_updated:1} }]}
    let res = await MsiApi.mongoAggregate(queryData)
    if (res.status === 200) {
      tariffData = res.data.result
    }
    else {
      ElMessage.error(t('error'))
    }  
  } catch (error) {
    console.log(error)
    ElMessage.error(t('error'))
  } 
}

const renderTariffDataLayout = async () => {
  try {
    renderTariffData.length = 0
    for (let i = 0; i < tariffData.length; i++) {
      let renderTariffDataObj = {}
      renderTariffDataObj.id = tariffData[i].id
      renderTariffDataObj.name = tariffData[i]?.custom?.name
      renderTariffDataObj.description = tariffData[i]?.custom?.description
      renderTariffDataObj.min_price = tariffData[i]?.min_price?.incl_vat
      renderTariffDataObj.max_price = tariffData[i]?.max_price?.incl_vat
      renderTariffDataObj.currency = tariffData[i].currency
      renderTariffData.push(renderTariffDataObj)
    }  
  } catch (error) {
    console.log(error)
    ElMessage.error(t('error'))
  }
}

onMounted( async() => {
  isLoading.value = true
  await getTariff()
  await renderTariffDataLayout()
  isLoading.value = false
})

</script>

<template>
  <div class="tariff">
    <div class="container lg">
      <div class="flex flex-justify-end flex-wrap lg:flex-nowrap pt-40px pb-32px">
        <el-button 
          v-if="MStore.rule_permission.RatePlan.addRatePlan === 'O'"  
          class="btn-secondary box-shadow" @click="add_rate_plan()"> {{t('add_rate_plan')}} </el-button>
      </div>

      <div class="overflow-x-auto">
        <div class="customer-list pb-40px">
          <el-table 
            :data="renderTariffData" 
            class="white-space-nowrap text-primary"
            height="calc(100vh - 220px)"
            style="width: 100%"
            stripe 
            size="large"
            :cell-style=msi.tb_cell 
            :header-cell-style="msi.tb_header_cell"
            v-loading.fullscreen.lock="isLoading"
          >
            <el-table-column
              prop="name"
              :label="t('plan_name')"
              align="center"
              sortable
              :sort-method="(a, b) => sortFunc(a, b, 'name')"
              min-width="150"
            />

            <el-table-column
              prop="description"
              :label="t('description')"
              align="center"
              min-width="450"
            />

            <el-table-column
              prop="min_price"
              :label="t('min_price')"
              align="center"
              sortable
              :sort-method="(a, b) => sortFunc(a, b, 'min_price')"
              min-width="150"
            />

            <el-table-column
              prop="currency"
              :label="t('currency')"
              align="center"
              sortable
              :sort-method="(a, b) => sortFunc(a, b, 'currency')"
              min-width="130"
            />

            <el-table-column
              prop=""
              :label="t('operations')"
              align="center"
              min-width="200"
            >
              <template #default="scope">
                <el-button 
                  v-if="MStore.rule_permission.RatePlan.delete === 'O'"  
                  link type="primary" size="large" @click="deleteTariff (scope.row)" >
                  <img src="@/assets/img/tariff_delete1.png" alt="">
                </el-button>
                <el-button 
                  v-if="MStore.rule_permission.RatePlan.copy === 'O'"  
                  link type="primary" size="large" @click="copyTariff(scope.row)">
                  <img src="@/assets/img/tariff_copy1.png" alt="">
                </el-button>
                <el-button 
                  v-if="MStore.rule_permission.RatePlan.edit === 'O'"
                  link type="primary" size="large" @click="editTariff(scope.row)">
                  <font-awesome-icon icon="fa-regular fa-pen-to-square" />
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>
  </div>
</template>
  
<style lang="scss" scoped>
.tariff {
  :deep(.svg-inline--fa) {
    height: 1.8em;
    filter: brightness(65%) saturate(100%);
  }
}
</style>