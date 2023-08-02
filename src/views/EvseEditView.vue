<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ApiFunc from '@/composables/ApiFunc'
import { ElMessageBox, ElMessage } from 'element-plus'
import { v4 as uuidv4 } from 'uuid'
import CommpnFunc from '@/composables/CommonFunc'
import msi from '@/assets/msi_style'
const MsiFunc = CommpnFunc()
const route = useRoute()
const MsiApi = ApiFunc()
const tariff_profile = reactive([])
const select_profile = ref('')
const station_id = route.query.station_id
const evse_id = route.query.evse_id
const stationName = ref('')

let station_evses = []
const evse_edit_title = ref('Add EVSE')

const connector_obj = reactive({
  class: 'Connector',
  standard: '-',
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
const selectTariffObj = {}

const max_amperage = ref(0)

const selectTariff = (select_id) => {
  selectTariffObj.length = 0
  for (let i = 0; i < tariff_profile.length; i++) {
    if (select_id === tariff_profile[i].id)
      Object.assign(selectTariffObj, tariff_profile[i])
  }
}

const CancelEvseEdit = () => {
  router.back(-1)
}
const SaveEvseEdit = async () => {
  let check_format_success = true

  if (evse_id === undefined) {
    if (select_profile.value !== '') connector_obj.tariff_ids.push(select_profile.value)
    connector_obj.id = uuidv4()
    MsiFunc.deleteEmptyKeys(connector_obj)
    MsiFunc.deleteEmptyKeys(evse_obj)
    if (evse_obj.evse_id === undefined) {
      check_format_success = false
      ElMessage.error('Oops, EVSE ID required.')
    }
    if (connector_obj.tariff_ids[0] === undefined) {
      check_format_success = false
      ElMessage.error('Oops, Rate Profile required.')
    }
    if (evse_obj.floor_level.length > 4) {
      check_format_success = false
      ElMessage.error('Oops, Floor Level characters exceeds the maximum length of 4.')
    }

    if (check_format_success === true) {
      ElMessageBox.confirm('Do you want to create?', 'Warning', {
        confirmButtonText: 'OK',
        cancelButtonText: 'Cancel',
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

    if (evse_obj.evse_id === undefined) {
      check_format_success = false
      ElMessage.error('Oops, EVSE ID required.')
    }
    if (connector_obj.tariff_ids[0] === undefined) {
      check_format_success = false
      ElMessage.error('Oops, Rate Profile required.')
    }
    if (evse_obj.floor_level.length > 4) {
      check_format_success = false
      ElMessage.error('Oops, Floor Level characters exceeds the maximum length of 4.')
    }
    if (check_format_success === true) {
      ElMessageBox.confirm('Do you want to modify?', 'Warning', {
        confirmButtonText: 'OK',
        cancelButtonText: 'Cancel',
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
  for (let i = 0; i < tariff_profile.length; i++) {
    for (let j = 0; j < tariff_profile[i].elements.length; j++) {
      if (tariff_profile[i].elements[j].price_components[0].type !== 'ENERGY') {
        tariff_profile[i].elements[j].price_components[0].step_size_str =
          tariff_profile[i].elements[j].price_components[0].step_size / 60
      } else {
        tariff_profile[i].elements[j].price_components[0].step_size_str =
          tariff_profile[i].elements[j].price_components[0].step_size
      }
    }
    // tariff_profile[i].
  }
  if (evse_id !== undefined) {
    evse_edit_title.value = 'Edit EVSE'

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
    <div class="container lg flex-col">
      <div class="flex justify-between flex-wrap lg:flex-nowrap pt-40px pb-32px">
        <p class="text-30px">{{ evse_edit_title }}</p>
      </div>

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
                  <h4 class="m-0 ml-8px text-20px text-black-100">Station</h4>
                </div>
                <div class="context rounded-lg bg-gray-100 p-20px">
                  <label class="block mb-4px" for="EVSE-Name">Name</label>
                  <el-input
                    class="mb-16px"
                    id="EVSE-Name"
                    v-model="stationName"
                    disabled
                  ></el-input>

                  <label class="block mb-4px" for="EVSE-ID">EVSE ID</label>
                  <el-input
                    class="mb-16px"
                    id="EVSE-ID"
                    v-model="evse_obj.evse_id"
                  ></el-input>

                  <label class="block mb-4px" for="Floor-Level">Floor Level</label>
                  <el-input
                    class="mb-0px"
                    id="Floor-Level"
                    v-model="evse_obj.floor_level"
                  ></el-input>

                  <!-- <label class="block mb-4px" for="Charger-Label">Charger Label</label>
                  <el-input class="mb-16px" id="Charger-Label" v-model="evse_obj.physical_reference"></el-input>

                  <label class="block mb-4px" for="Note">Note</label>
                  <el-input id="Note" v-model="evse_obj.directions" disabled></el-input> -->
                </div>
              </div>
              <div class="evse-edit-left-down w-full">
                <div class="title flex items-center mb-20px">
                  <img
                    class="w-24px h-24px filter-black"
                    src="@/assets/img/charger_edit_connector.png"
                    alt=""
                  />
                  <h4 class="m-0 ml-8px text-20px text-black-100">Connector Info</h4>
                </div>
                <div class="context rounded-lg bg-gray-100 p-20px">
                  <div class="info-item">
                    <p class="info-title w-50%">Type</p>
                    <p class="info-value w-50% ml-24px">{{ connector_obj.standard }}</p>
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
                    <p class="info-title w-50%">Max Voltage</p>
                    <p class="info-value w-50% ml-24px">
                      {{ connector_obj.max_voltage + 'V' }}
                    </p>
                  </div>
                  <div class="info-item">
                    <p class="info-title w-50%">Max Amperage</p>
                    <p class="info-value w-50% ml-24px">{{ max_amperage + 'A' }}</p>
                  </div>
                  <div class="info-item items-center">
                    <p class="info-title w-50%">Output Current</p>
                    <!-- <p class="connector-value"> {{ connector_obj.max_amperage + 'A' }}</p> -->
                    <el-input
                      class="w-45% ml-24px"
                      v-model="connector_obj.max_amperage"
                    />
                    <span class="w-5% ml-5px">A</span>
                  </div>

                  <div class="info-item">
                    <p class="info-title w-50%">Max Electric Power</p>
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
                <h4 class="m-0 ml-8px text-20px text-black-100">Tariff</h4>
              </div>

              <div class="rounded-lg bg-gray-100 p-20px mb-24px">
                <div class="mb-20px">
                  <p class="block mb-4px">Rate Profile</p>
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
                      :label="item.profile_name"
                      :value="item.id"
                    />
                  </el-select>
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
                          <span class="font-700 text-blue-900">Currency : </span>
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
                          Rate Alt Text :
                        </p>
                        <p class="info-value">{{}}</p>
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
                      prop="price_components[0].type"
                      label="Type"
                      min-width="150"
                    />
                    <el-table-column
                      prop="price_components[0].price"
                      label="Price"
                      min-width="80"
                    />
                    <el-table-column
                      prop="price_components[0].vat"
                      label="Vat"
                      min-width="80"
                    />
                    <el-table-column
                      prop="price_components[0].step_size"
                      label="Step Size"
                      min-width="120"
                    />
                    <el-table-column
                      prop="restrictions.start_time"
                      label="Start Time"
                      min-width="120"
                    />
                    <el-table-column
                      prop="restrictions.end_time"
                      label="End Time"
                      min-width="120"
                    />
                    <el-table-column
                      prop="restrictions.day_of_week"
                      label="Day Of Week"
                      min-width="300"
                    />
                  </el-table>
                </div>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>

      <div class="flex justify-center pb-40px">
        <el-button class="btn-secondary bg-btn-100 md:mr-44px" @click="CancelEvseEdit">
          Cancel
        </el-button>
        <el-button class="btn-secondary" @click="SaveEvseEdit"> Save </el-button>
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
