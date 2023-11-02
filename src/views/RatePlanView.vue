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
const TariffData = reactive([])
const isLoading = ref(false)

const sortFunc = (obj1, obj2, column) => {
  let at = obj1[column]
  let bt = obj2[column]

  if (bt === undefined) {
    return -1
  }
  if (at > bt) {
    return -1
  }
}

const deleteTariff = async (row) => {
  let queryData = { "database":"OCPI", "collection":"Connector", "pipelines": [
    { $match: { "tariff_ids": {"UUID" : row.id} }}, { "$project": {"_id": 1,}}
  ]}

  let response = await MsiApi.mongoAggregate(queryData)
  let used_connector = response.data.result
  queryData = { "database":"OCPI", "collection":"EVSE", "pipelines": [
    { "$project": {"_id": 0, "connectors": 1, "evse_id":1}}]
  }
  response = await MsiApi.mongoAggregate(queryData)
  let evse = response.data.result
  let used_evse = []
  for (let i = 0; i < used_connector.length; i++) {
    for (let j = 0; j < evse.length; j++) {
      if (used_connector[i]._id === evse[j].connectors[0]) {
        used_evse.push(evse[j].evse_id)
      }
    }
  }
  if(used_evse.length !== 0) {
    let used_evse_str =''
    for (let k = 0; k < used_evse.length; k++) {
      used_evse_str += used_evse[k] + ' / ' 
    }
    ElMessage.error(used_evse_str + t('in_using'))
  }
  else {
    let sendData = { class : 'Tariff', id : row.id }
    ElMessageBox.confirm(t('do_you_want_to_delete'), t('warning'), {confirmButtonText: t('ok'), cancelButtonText: t('cancel'), type: 'warning'})
    .then(async () => {
      isLoading.value = true
      await MsiApi.setCollectionData('delete', 'ocpi', sendData)
     
      TariffData.length = 0
      let queryData  = { database: "OCPI", collection: "Tariff", pipelines: [ { $project: { last_updated:0} }]}
      let res = await MsiApi.mongoAggregate(queryData)
      Object.assign(TariffData, res.data.result) 

      for (let i = 0; i < TariffData.length; i++) {
        TariffData[i].name = TariffData[i].custom?.name
        TariffData[i].description = TariffData[i].custom?.description
        TariffData[i].min_price_str = TariffData[i]?.min_price?.incl_vat
        TariffData[i].max_price_str = TariffData[i]?.max_price?.incl_vat
      }
      isLoading.value = false
    })
  }
}

const editTariff = (row) => {
  if (TariffData.length >= MStore.program.tariff && row._id === undefined && MStore.permission.isMSI === false) {
    ElMessage.error(t('please_confirm_your_subscription_plan'))
    return
  }
  router.push({ name: 'ratePlanDetail', query:{id:row._id} })
}

const copyTariff = (scope) => {
  if (TariffData.length >= MStore.program.tariff && MStore.permission.isMSI === false) {
    ElMessage.error(t('please_confirm_your_subscription_plan'))
    return
  }
  ElMessageBox.confirm(t('do_you_want_to_duplicate'), t('warning'), {confirmButtonText: t('ok'), cancelButtonText: t('cancel'), type: 'warning'})
  .then(async () => {
    delete scope._id
    delete scope.id
    delete scope.byCompany
    delete scope.last_updated
    delete scope.max_price_str
    delete scope.min_price_str
    scope.class = 'Tariff'
    scope.party_id = 'MSI'

    let res = await MsiApi.setCollectionData('post', 'ocpi', scope)
    isLoading.value = true
    let queryData  = { database: "OCPI", collection: "Tariff", pipelines: [ { $project: { last_updated:0} }]}
    res = await MsiApi.mongoAggregate(queryData)
    Object.assign(TariffData, res.data.result) 
    for (let i = 0; i < TariffData.length; i++) {
      TariffData[i].name = TariffData[i].custom?.name
      TariffData[i].description = TariffData[i].custom?.description
      TariffData[i].min_price_str = TariffData[i]?.min_price?.incl_vat
      TariffData[i].max_price_str = TariffData[i]?.max_price?.incl_vat
    }
    isLoading.value = false
    ElMessage.success(res.data.message)
  })
}

onMounted( async() => {
  isLoading.value = true
  let queryData  = { database: "OCPI", collection: "Tariff", pipelines: [ { $project: {   last_updated:0} }]}
  let res = await MsiApi.mongoAggregate(queryData)
  Object.assign(TariffData, res.data.result) 
  for (let i = 0; i < TariffData.length; i++) {
    TariffData[i].name = TariffData[i].custom?.name
    TariffData[i].description = TariffData[i].custom?.description
    TariffData[i].min_price_str = TariffData[i]?.min_price?.incl_vat
    TariffData[i].max_price_str = TariffData[i]?.max_price?.incl_vat
  }
  isLoading.value = false
})

</script>

<template>
  <div class="tariff">
    <div class="container lg">
      <div class="flex flex-justify-end flex-wrap lg:flex-nowrap pt-40px pb-32px">
        <el-button 
          v-if="MStore.rule_permission.RatePlan.addRatePlan === 'O' || MStore.permission.isCompany"  
          class="btn-secondary box-shadow" @click="editTariff"> {{t('add_rate_plan')}} </el-button>
      </div>

      <div class="overflow-x-auto">
        <div class="customer-list pb-40px">
          <el-table 
            :data="TariffData" 
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
              sortable
              :sort-method="(a, b) => sortFunc(a, b, 'description')"
              min-width="450"
            />

            <el-table-column
              prop="min_price_str"
              :label="t('min_price')"
              align="center"
              sortable
              :sort-method="(a, b) => sortFunc(a, b, 'min_price_str')"
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
                  v-if="MStore.rule_permission.RatePlan.delete === 'O' || MStore.permission.isCompany"  
                  link type="primary" size="large" @click="deleteTariff (scope.row)" >
                  <img src="@/assets/img/tariff_delete1.png" alt="">
                </el-button>
                <el-button 
                  v-if="MStore.rule_permission.RatePlan.copy === 'O' || MStore.permission.isCompany"  
                  link type="primary" size="large" @click="copyTariff(scope.row)">
                  <img src="@/assets/img/tariff_copy1.png" alt="">
                </el-button>
                <el-button 
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