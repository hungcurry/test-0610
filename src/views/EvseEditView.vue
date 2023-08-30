<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ApiFunc from '@/composables/ApiFunc'
import { ElMessageBox, ElMessage } from 'element-plus'
import { v4 as uuidv4 } from 'uuid'
import CommpnFunc from '@/composables/CommonFunc'
import msi from '@/assets/msi_style'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const MsiFunc = CommpnFunc()
const route = useRoute()
const MsiApi = ApiFunc()
const tariff_profile = reactive([])
const select_profile = ref('')
const station_id = route.query.station_id
const evse_id = route.query.evse_id
const stationName = ref('')
const ruleFormRef  = ref()
let station_evses = []
const evse_edit_title = ref(t('add_evse'))

const connector_obj = reactive({
  class: 'Connector',
  standard: '-',
  standard_str: '-',
  format: '-',
  power_type: '-',
  max_voltage: '0',
  max_amperage: '0',
  max_electric_power: '0',
  tariff_ids: [],
})
const evse_obj = reactive({
  class: 'EVSE',
  evse_id: '',
  status: 'UNKNOWN',
  connectors: [],
})
const router = useRouter()
const selectTariffObj = reactive({})

const max_amperage = ref(0)

const rules = reactive({
  evse_id: [{ required: true, message: t('this_item_is_required'), trigger: 'blur' },],
  floor_level: [{ required: true, message: t('this_item_is_required'), trigger: 'blur' },
                 { min: 1, max: 4, message: t('length_should_be_1_to_4'), trigger: 'blur' },],
})

const selectTariff = (select_id) => {
  selectTariffObj.length = 0
  for (let i = 0; i < tariff_profile.length; i++) {
    if (select_id === tariff_profile[i].id) {
      Object.assign(selectTariffObj, tariff_profile[i])
    }
  }
}

const CancelEvseEdit = () => {
  router.back(-1)
}
const SaveEvseEdit = async (formEl) => {  
  if (!formEl) return
  let check_format_success = false
  await formEl.validate((valid) => {
    if (valid === true) 
      check_format_success = true
  })
  if (check_format_success === false) {
    return 
  }

  if (evse_id === undefined) {
    if (select_profile.value !== '') connector_obj.tariff_ids.push(select_profile.value)
    connector_obj.id = uuidv4()
    MsiFunc.deleteEmptyKeys(connector_obj)
    MsiFunc.deleteEmptyKeys(evse_obj)

    if (check_format_success === true) {
      ElMessageBox.confirm( t('do_you_want_to_create'), t('warning'), {
        confirmButtonText: t('ok'),
        cancelButtonText: t('cancel'),
        type: 'warning',
      })
        .then(async () => {
          let response = await MsiApi.setCollectionData('post', 'ocpi', connector_obj)
          if (response.status !== 201) {
            ElMessage.error(response.data.message)
            return
          }
          let queryData = {
            database: 'OCPI',
            collection: 'Connector',
            query: { id: { UUID: connector_obj.id } },
          }
          response = await MsiApi.mongoQuery(queryData)
          evse_obj.connectors.push(response.data.all[0]._id)
          evse_obj.uid = uuidv4()

          response = await MsiApi.setCollectionData('post', 'ocpi', evse_obj)
          if (response.status !== 201) {
            ElMessage.error(response.data.message)
            return
          }
          queryData = {
            database: 'OCPI',
            collection: 'EVSE',
            query: { uid: { UUID: evse_obj.uid } },
          }
          response = await MsiApi.mongoQuery(queryData)
          station_evses.push(response.data.all[0]._id)
          if (response.status === 200) {
            router.push({ name: 'evse', query: { page: 'unpaired' } })
          }
        })
        .catch((e) => {
          console.log(e)
        })
    }
  } else {
    connector_obj.tariff_ids[0] = select_profile.value
    evse_obj.id = evse_obj.uid
    if (check_format_success === true) {
      ElMessageBox.confirm( t('do_you_want_to_modify'), 'Warning', {
        confirmButtonText: t('ok'),
        cancelButtonText: t('cancel'),
        type: 'warning',
      })
        .then(async () => {
          await MsiApi.setCollectionData('patch', 'ocpi', connector_obj)
          let res = await MsiApi.setCollectionData('patch', 'ocpi', evse_obj)
          ElMessage(res.data.message)
          router.back(-1)
        })
        .catch((e) => {
          console.log(e)
        })
    }
  }
}

onMounted(async () => {
  let queryData,
    response = undefined
  let connectors = []
  let tariff_ids = []
  queryData = { database: 'OCPI', collection: 'Tariff', query: {} }
  response = await MsiApi.mongoQuery(queryData)
  Object.assign(tariff_profile, response.data.all)

  tariff_profile.forEach((item)=>{
    item.elements.forEach((emement)=>{
      let day_of_week_str = []
      for (const day of emement.restrictions.day_of_week) {
        switch (day) {
          case 'MONDAY':
            day_of_week_str.push(t('mon'))
          break
          case 'TUESDAY':
            day_of_week_str.push(t('tue'))
          break
          case 'WEDNESDAY':
            day_of_week_str.push(t('wed'))
          break
          case 'THURSDAY':
            day_of_week_str.push(t('thu'))
          break
          case 'FRIDAY':
            day_of_week_str.push(t('fri'))
          break
          case 'SATURDAY':
            day_of_week_str.push(t('sat'))
          break
          case 'SUNDAY':
            day_of_week_str.push(t('sun'))
          break
        }
      }
      emement.restrictions.day_of_week_str = day_of_week_str
      switch (emement.price_components[0].type) {
        case 'ENERGY' :
          emement.price_components[0].type_str = t('charging_by_energy')
          emement.price_components[0].step_size_str = emement.price_components[0].step_size
          break
        case 'TIME' :
          emement.price_components[0].type_str = t('charging_by_time')
          emement.price_components[0].step_size_str = emement.price_components[0].step_size / 60
          break
        case 'PARKING_TIME' :
          emement.price_components[0].type_str = t('parking_by_time')
          emement.price_components[0].step_size_str = emement.price_components[0].step_size / 60
          emement.restrictions_min_duration_str = emement.restrictions.min_duration / 60
          emement.restrictions_max_duration_str = emement.restrictions.max_duration / 60
          break
        default:
          emement.price_components[0].type_str = emement.price_components[0].type
      }
    })
    item.name = item?.custom?.name
    item.description = item?.custom?.description
  })
  if (evse_id !== undefined) {
    evse_edit_title.value = t('edit_evse')

    queryData = {
      database: 'OCPI',
      collection: 'EVSE',
      query: { uid: { UUID: evse_id } },
    }
    response = await MsiApi.mongoQuery(queryData)
    Object.assign(evse_obj, response.data.all[0])
    for (let i = 0; i < evse_obj?.connectors?.length; i++) {
      connectors.push(evse_obj?.connectors[i]._id)
    }
    evse_obj.connectors = connectors
    queryData = {
      database: 'OCPI',
      collection: 'Connector',
      query: { _id: { ObjectId: evse_obj.connectors[0] } },
    }
    response = await MsiApi.mongoQuery(queryData)
    Object.assign(connector_obj, response.data.all[0])

    switch (connector_obj.standard) {
      case 'IEC_62196_T1':
        connector_obj.standard_str = 'Type 1 (J1772)'
      break
      case 'IEC_62196_T2':
        connector_obj.standard_str = 'Type 2 (Mennekes)'
      break
      default:
        connector_obj.standard_str = t('others')
    }

    select_profile.value = connector_obj.tariff_ids[0]

    for (let i = 0; i < tariff_profile.length; i++) {
      if (select_profile.value === tariff_profile[i].id)
        Object.assign(selectTariffObj, tariff_profile[i])
    }

    for (let i = 0; i < connector_obj?.tariff_ids?.length; i++) {
      tariff_ids.push(connector_obj?.tariff_ids[i])
    }
    connector_obj.tariff_ids = tariff_ids
  }
  queryData = {
    database: 'OCPI',
    collection: 'Location',
    query: { id: { UUID: station_id } },
  }
  response = await MsiApi.mongoQuery(queryData)
  for (let i = 0; i < response.data.all[0]?.evses?.length; i++) {
    station_evses.push(response.data.all[0]?.evses[i]._id)
  }
  stationName.value = response.data.all[0]?.name

  queryData = {
    database: 'CPO',
    collection: 'ChargePointInfo',
    query: { evse: { ObjectId: evse_obj._id } },
  }
  response = await MsiApi.mongoQuery(queryData)
  if (response.data.all[0]?.hmi !== '') {
    queryData = {
      database: 'CPO',
      collection: 'HMIControlBoardInfo',
      query: { _id: { ObjectId: response.data.all[0].hmi } },
    }
    response = await MsiApi.mongoQuery(queryData)
    max_amperage.value = response.data.all[0].minmax_current
      .split(' ')
      .map((hex) => parseInt(hex, 16))[7]
  }
})
</script>

<template>
  <div class="evse-edit">
    <div class="container lg flex-col h-full">
      <div class="flex justify-between flex-wrap lg:flex-nowrap pt-40px pb-32px">
        <p class="text-30px">{{ evse_edit_title }}</p>
      </div>
      <el-form class="w-full min-w-190px flex-grow" :rules="rules" :model="evse_obj" ref="ruleFormRef">
      <div class="evse-edit-main flex-grow mb-44px">
        <el-row class="h-full" :gutter="30">
          <el-col class="mb-24px lg:mb-0" :xs="24" :md="6">
            <div class="evse-edit-left h-full">
              <div class="evse-edit-left-up w-full mb-24px">
                <div class="title flex items-center mb-20px">
                  <img
                    class="w-24px h-24px filter-black"
                    src="@/assets/img/charger_evse.png"
                    alt=""
                  />
                  <h4 class="m-0 ml-8px text-20px text-black-100">{{ t('station') }}</h4>
                </div>
                <div class="context rounded-lg bg-gray-100 p-20px">

                    <el-form-item class="block mb-4px" :label= "t('name')" prop="name">
                      <el-input v-model.trim="stationName" disabled />
                    </el-form-item>
                    <el-form-item class="block mb-4px" :label= "t('evse_id')" prop="evse_id">
                      <el-input v-model.trim="evse_obj.evse_id" />
                    </el-form-item>
                    <el-form-item class="block mb-4px" :label= "t('floor_level')" prop="floor_level">
                      <el-input v-model.trim="evse_obj.floor_level" />
                    </el-form-item>

                </div>
              </div>
              <div class="evse-edit-left-down w-full">
                <div class="title flex items-center mb-20px">
                  <img
                    class="w-24px h-24px filter-black"
                    src="@/assets/img/charger_edit_connector.png"
                    alt=""
                  />
                  <h4 class="m-0 ml-8px text-20px text-black-100">{{ t('connector_info') }}</h4>
                </div>
                <div class="context rounded-lg bg-gray-100 p-20px">
                  <div class="info-item">
                    <p class="info-title w-50%">{{ t('type') }}</p>
                    <p class="info-value w-50% ml-24px">{{ connector_obj.standard_str }}</p>
                  </div>
                  <!-- <div class="info-item">
                    <p class="info-title w-50%">Connector ID</p>
                    <p class="info-value w-50% ml-24px"> {{ connector_obj.id }}</p>
                  </div>  
                  <div class="info-item">
                    <p class="info-title w-50%">Format</p>
                    <p class="info-value w-50% ml-24px"> {{ connector_obj.format }}</p>
                  </div>  
                  <div class="info-item">
                    <p class="info-title w-50%">Power Type</p>
                    <p class="info-value w-50% ml-24px"> {{ connector_obj.power_type }}</p>
                  </div>   -->
                  <div class="info-item">
                    <p class="info-title w-50%">{{ t('max_voltage') }}</p>
                    <p class="info-value w-50% ml-24px">
                      {{ connector_obj.max_voltage + 'V' }}
                    </p>
                  </div>
                  <div class="info-item">
                    <p class="info-title w-50%">{{ t('max_current') }}</p>
                    <p class="info-value w-50% ml-24px">{{ max_amperage + 'A' }}</p>
                  </div>
                  <div class="info-item items-center">
                    <p class="info-title w-50%">{{ t('output_current') }}</p>
                    <el-input
                      class="w-45% ml-24px"
                      v-model="connector_obj.max_amperage"
                    />
                    <span class="w-5% ml-5px">A</span>
                  </div>

                  <div class="info-item">
                    <p class="info-title w-50%">{{ t('max_electric_power') }}</p>
                    <p class="info-value w-50% ml-24px">
                      {{ connector_obj.max_electric_power / 1000 + ' kW' }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </el-col>
          <el-col :xs="24" :md="18">
            <div class="evse-edit-right h-full">
              <div class="title flex items-center mb-20px">
                <img
                  class="w-24px h-24px filter-black"
                  src="@/assets/img/charger_tariff.png"
                  alt=""
                />
                <h4 class="m-0 ml-8px text-20px text-black-100">{{ t('rate_plan') }}</h4>
              </div>

              <div class="rounded-lg bg-gray-100 p-20px mb-24px">
                <div class="mb-20px">

                    <el-form-item class="block mb-4px" :label= "t('plan_name')">
                      <el-select
                        class="el-select w-full lg:w-40%"
                        v-model="select_profile"
                        placeholder="Select"
                        size="large"
                        @change="selectTariff"
                      >
                        <el-option
                            v-for="item in tariff_profile"
                            :key="item.value"
                            :label="item.name"
                            :value="item.id"
                          />
                      </el-select>
                    </el-form-item>
                  <!-- </el-form> -->
                </div>

                <div class="lg:flex mb-24px bg-white px-14px py-20px rounded-2xl">
                  <div class="tariff-left lg:w-30% mb-20px lg:mb-0">
                    <div class="container-data h-full md:px-32px">
                      <!-- <div class="info-item">
                        <p class="info-title">
                          <span class="font-700 text-blue-900">Type : </span>
                          <span class="ml-18px">AD_HOC_PAYMENT</span>
                        </p>
                      </div> -->
                      <div class="info-item">
                        <p class="info-title">
                          <span class="font-700 text-blue-900">{{ t('currency') + ':' }}  </span>
                          <span class="ml-18px">{{ selectTariffObj.currency }}</span>
                        </p>
                      </div>
                      <!-- <div class="info-item">
                        <p class="info-title">
                          <span class="font-700 text-blue-900">Rate Alt Url : </span>
                          <span class="ml-18px">NONE</span>
                        </p>
                      </div> -->
                    </div>
                  </div>
                  <div class="tariff-right lg:w-70%">
                    <div class="container-data h-full md:px-32px">
                      <div class="">
                        <p class="info-title font-700 text-blue-900 mb-7px">
                          {{ t('rate_description') + ':' }}
                        </p>
                        <p class="info-value">{{selectTariffObj.description}}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="px-14px bg-white">
                  <el-table
                    :data="selectTariffObj.elements"
                    style="width: 100%; height: 300px"
                    stripe
                    :cell-style="msi.tb_cell"
                    :header-cell-style="msi.tb_header_cell"
                    size="large"
                  >
                    <el-table-column
                      prop="price_components[0].type_str"
                      :label="t('type')"
                      min-width="120"
                      align="center"
                    />
                    <el-table-column
                      prop="price_components[0].price"
                      :label="t('price')"
                      min-width="60"
                      align="center"
                    />
                    <el-table-column
                      prop="price_components[0].vat"
                      :label="t('vat')"
                      min-width="40"
                      align="center"
                    />
                    <el-table-column
                      prop="price_components[0].step_size_str"
                      :label="t('unit')"
                      min-width="60"
                      align="center"
                    />
                    <el-table-column
                      prop="restrictions.start_time"
                      :label="t('start_time')"
                      min-width="70"
                      align="center"
                    />
                    <el-table-column
                      prop="restrictions.end_time"
                      :label="t('end_time')"
                      min-width="70"
                      align="center"
                    />
                <el-table-column prop="restrictions_min_duration_str" :label="t('active_minute')" sortable min-width="120" align="center"/>
                <el-table-column prop="restrictions_max_duration_str" :label="t('deactivate_minute')" sortable min-width="120" align="center"/>
                
                    <el-table-column
                      prop="restrictions.day_of_week_str"
                      :label="t('day_of_week')"
                      min-width="200"
                      align="center"
                    />
                  </el-table>
                </div>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
      </el-form>
      <div class="flex justify-center pb-40px">
        <el-button class="btn-secondary bg-btn-100 md:mr-44px" @click="CancelEvseEdit">
          {{ t('cancel') }}
        </el-button>
        <el-button class="btn-secondary" @click="SaveEvseEdit(ruleFormRef)"> 
          {{ t('save') }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.evse-edit {
  width: 100%;
  height: 100%;
  .info-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.8rem;
    .info-title {
      color: #566575;
    }
  }
}
</style>
