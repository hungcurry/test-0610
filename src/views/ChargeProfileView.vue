<script setup>
import ApiFunc from '@/composables/ApiFunc'
import moment from "moment"
import { ref, reactive, onMounted } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useI18n } from "vue-i18n"
import { useMStore } from "../stores/m_cloud"
import { useRouter } from 'vue-router'

const { t } = useI18n()
const MsiApi = ApiFunc()
const MStore = useMStore()
const router = useRouter()

const purpose_filter_item = [
  { text: t('charge_point_max_profile'), value: 'ChargePointMaxProfile' },
  { text: t('tx_default_profile'), value: 'TxDefaultProfile' },
  { text: t('tx_profile'), value: 'TxProfile' },
]
const kind_filter_item = [
  { text: t('absolute'), value: 'Absolute' },
  { text: t('recurring'), value: 'Recurring' },
  { text: t('relative'), value: 'Relative' },
]
const ChargingProfileData = reactive([])

const purpose_filter = (value, rowData) => {
  return rowData.charging_profile_purpose === value
}
const kind_filter = (value, rowData) => {
  return rowData.charging_profile_kind === value
}
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

const AddChargingProfile = () => {
  router.push({ name: 'chargingProfileDetail' })
}
const EditChargingProfile = (row) => {
  router.push({ name: 'chargingProfileDetail', query:{id:row._id} })
}
const DelChargingProfile = async (row) => {
  let sendData = { class : 'ChargingProfile', pk : row._id }
  ElMessageBox.confirm(t('do_you_want_to_delete'),t('warning'), {confirmButtonText: t('ok'), cancelButtonText: t('cancel'), type: 'warning'})
    .then(async () => {
      let res = await MsiApi.setCollectionData('delete', 'cpo', sendData)
      if (res.status === 200) {
        await getChargingProfile()
      }
    })
    .catch((e)=>{
      console.log(e)
    }) 
}

const getChargingProfile = async() => {
  let queryData = {
    database: 'CPO',
    collection: 'ChargingProfile',
    pipelines: [{ $project: { aaa: 0} }],
  }
  let response = await MsiApi.mongoAggregate(queryData)
  ChargingProfileData.length = 0
  Object.assign(ChargingProfileData, response.data.result)
  ChargingProfileData.forEach((item) => {
    let localEndTime = null
    if (item.valid_from) {
      localEndTime =  new Date( (new Date(item.valid_from).getTime()) + ((MStore.timeZoneOffset ) * -60000))
      item.valid_from_str = (moment(localEndTime).format("YYYY-MM-DD HH:mm:ss"))
    }
    if (item.valid_to) {
      localEndTime =  new Date( (new Date(item.valid_to).getTime()) + ((MStore.timeZoneOffset ) * -60000))
      item.valid_to_str = (moment(localEndTime).format("YYYY-MM-DD HH:mm:ss"))
    }
    switch (item.charging_profile_purpose) {
      case 'ChargePointMaxProfile':
        item.charging_profile_purpose_str = t('charge_point_max_profile')
        break;
      case 'TxDefaultProfile':
        item.charging_profile_purpose_str = t('tx_default_profile')
        break;
      case 'TxProfile':
        item.charging_profile_purpose_str = t('tx_profile')
        break;
      default:
        item.charging_profile_purpose_str = item.charging_profile_purpose
        break;
    }
    switch (item.charging_profile_kind) {
      case 'Absolute':
        item.charging_profile_kind_str = t('absolute')
        break;
      case 'Recurring':
        item.charging_profile_kind_str = t('recurring')
        break;
      case 'Relative':
        item.charging_profile_kind_str = t('relative')
        break;
      default:
        item.charging_profile_kind_str = item.charging_profile_kind
        break;
    }
    switch (item.recurrency_kind) {
      case 'Daily':
        item.recurrency_kind_str = t('daily')
        break;
      case 'Weekly':
        item.recurrency_kind_str = t('weekly')
        break;
      default:
        item.recurrency_kind_str = item.recurrency_kind
        break;
    }
  })
}

onMounted(async () => {
  await getChargingProfile()
})

</script>

<template>
  <div class="container lg pb-40px">
    <div class="flex flex-justify-end flex-wrap lg:flex-nowrap pt-40px pb-32px">
      <el-button 
        v-if="MStore.rule_permission.ChargingProfile.addProfile === 'O' || MStore.permission.isCompany"
        class="btn-secondary box-shadow" @click="AddChargingProfile">
        {{ t('add_charging_profile') }}
      </el-button>
    </div>

    <el-table :data="ChargingProfileData" class="white-space-nowrap text-primary" height="calc(100vh - 220px)" style="width: 100%" stripe size="large">
      <el-table-column prop="custom.name" :label="t('name')" align="center" min-width="150" sortable :sort-method="(a, b) => sortFunc(a, b, 'name')" />
      <el-table-column prop="stack_level" :label="t('stack_level')" align="center" min-width="150" sortable :sort-method="(a, b) => sortFunc(a, b, 'stack_level')" />
      <el-table-column prop="charging_profile_purpose_str" :label="t('purpose')" align="center" min-width="220" :filters="purpose_filter_item" :filter-method="purpose_filter" />
      <el-table-column prop="charging_profile_kind_str" :label="t('kind')" align="center" min-width="150" :filters="kind_filter_item" :filter-method="kind_filter" />
      <el-table-column prop="recurrency_kind_str" :label="t('recurrency')" align="center" min-width="150" sortable :sort-method="(a, b) => sortFunc(a, b, 'recurrency_kind')" />
      <el-table-column prop="valid_from_str" :label="t('valid_from')" align="center" min-width="200" sortable :sort-method="(a, b) => sortFunc(a, b, 'valid_from_str')" />
      <el-table-column prop="valid_to_str" :label="t('valid_to')" align="center" min-width="200" sortable :sort-method="(a, b) => sortFunc(a, b, 'valid_to_str')" />
      <el-table-column prop="" label="" align="center" min-width="120" >
        <template #default="scope">
          <el-button 
            v-if="MStore.rule_permission.ChargingProfile.addProfile === 'O' || MStore.permission.isCompany"
            link type="primary" size="large" @click="DelChargingProfile(scope.row)" >
            <img src="@/assets/img/tariff_delete1.png" alt="">
          </el-button>
          <el-button 
            v-if="MStore.rule_permission.ChargingProfile.detail === 'O' || MStore.permission.isCompany"
            link type="primary" size="large" @click="EditChargingProfile(scope.row)" class="edit-btn" >
            <font-awesome-icon icon="fa-regular fa-pen-to-square" />
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style lang="scss" scoped>
.edit-btn {
  :deep(.svg-inline--fa) {
    height: 1.8em;
    filter: brightness(65%) saturate(100%);
  }
}

</style>

