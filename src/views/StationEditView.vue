<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ApiFunc from '@/composables/ApiFunc'
import { ElMessageBox, ElMessage } from 'element-plus'
import { v4 as uuidv4 } from 'uuid'
import CommpnFunc from '@/composables/CommonFunc'
import { useI18n } from "vue-i18n"
const { t } = useI18n()
const MsiFunc = CommpnFunc()
const MsiApi = ApiFunc()
const route = useRoute()
const router = useRouter()
const station_id = route.query.id
// const Coordinates2Addr = ref('')
// const edit_title = ref('Edit Station')
const edit_title = ref(t('edit_station'))
const ruleFormRef  = ref()

const getCoordinates = async () => {
  let address = StationData.country + StationData.city + StationData.address
  let res = await MsiApi.getCoordinates(address)
  StationData.latitude_str = res.data.data.results[0].geometry.location.lat.toFixed(6)
  StationData.longitude_str = res.data.data.results[0].geometry.location.lng.toFixed(6)
}

const getTimeZone = async () => {
  let res = await MsiApi.getTimeZone(StationData.latitude_str, StationData.longitude_str)
  StationData.time_zone = res.data.data.timeZoneId
}

// const getAddress = async () => {
//   let res = await MsiApi.getAddress(StationData.latitude_str, StationData.longitude_str)
//   Coordinates2Addr.value = res.data.data.results[0].formatted_address
// }

const change_country_code = (country) => {
  const findObj = country_list.find(item => item.value === country)
  StationData.country_code = findObj.country_code
}

const facilities_type = [{ value: 'HOTEL', label: t('hotel') }, { value: 'RESTAURANT', label: t('restaurant') },
{ value: 'MALL', label: t('mall') }, { value: 'SUPERMARKET', label: t('super_market')},
{ value: 'PARKING_LOT', label: t('parking_lot') }, { value: 'WIFI', label: t('others') },
]

const taiwan_city = [
  { value: '臺北市', label: '臺北市' }, { value: '新北市', label: '新北市' }, { value: '桃園市', label: '桃園市' },
  { value: '臺中市', label: '臺中市' }, { value: '臺南市', label: '臺南市' }, { value: '高雄市', label: '高雄市' },
  { value: '基隆市', label: '基隆市' }, { value: '新竹市', label: '新竹市' }, { value: '嘉義市', label: '嘉義市' },
  { value: '新竹縣', label: '新竹縣' }, { value: '苗栗縣', label: '苗栗縣' }, { value: '彰化縣', label: '彰化縣' },
  { value: '南投縣', label: '南投縣' }, { value: '雲林縣', label: '雲林縣' }, { value: '嘉義縣', label: '嘉義縣' },
  { value: '屏東縣', label: '屏東縣' }, { value: '宜蘭縣', label: '宜蘭縣' }, { value: '花蓮縣', label: '花蓮縣' },
  { value: '臺東縣', label: '臺東縣' }, { value: '澎湖縣', label: '澎湖縣' }, { value: '金門縣', label: '金門縣' },
  { value: '連江縣', label: '連江縣' },
]

const country_list = [
{ value: 'Canada', label: 'Canada', country_code: 'CA' },
{ value: 'China', label: 'China', country_code: 'CN' },
{ value: 'France', label: 'France', country_code: 'FR' },
{ value: 'Germany', label: 'Germany', country_code: 'DE' }, 
{ value: 'Italy', label: 'Italy', country_code: 'IT' },
{ value: 'Japan', label: 'Japan', country_code: 'JP' },
{ value: 'Portugal	', label: 'Portugal	', country_code: 'PT' },
{ value: 'South Korea', label: 'South Korea', country_code: 'KR' },
{ value: 'Spain', label: 'Spain', country_code: 'ES' },
{ value: 'Taiwan', label: 'Taiwan', country_code: 'TW' }, 
{ value: 'United States', label: 'United States', country_code: 'US' },
{ value: 'United Kingdom', label: 'United Kingdom', country_code: 'UK' },
]

const select_all = ref(true)
const station_always_open = ref(true)
const w0val = ref([0, 24]), w1val = ref([0, 24]), w2val = ref([0, 24]), w3val = ref([0, 24]), w4val = ref([0, 24]), w5val = ref([0, 24]), w6val = ref([0, 24]), w7val = ref([0, 24])
const w0check = ref(), w1check = ref(), w2check = ref(), w3check = ref(), w4check = ref(), w5check = ref(), w6check = ref(), w7check = ref()
const marks = ref({
  0: "0",
  2: "2",
  4: "4",
  6: "6",
  8: "8",
  10: "10",
  12: "12",
  14: "14",
  16: "16",
  18: "18",
  20: "20",
  22: "22",
  24: "24",
})

const StationData = reactive({})

const rules = reactive({
  name: [{ required: true, message: t('this_item_is_required'), trigger: 'blur' },],
  facilities_str: [{ required: true, message: t('this_item_is_required'), trigger: 'blur' },],
  country:[{ required: true, message: t('this_item_is_required'), trigger: 'blur' },],
  address:[{ required: true, message: t('this_item_is_required'), trigger: 'blur' },],
  city:[{ required: true, message: t('this_item_is_required'), trigger: 'blur' },],
  address1:[{ required: true, message: t('this_item_is_required'), trigger: 'blur' },],
  city1:[{ required: true, message: t('this_item_is_required'), trigger: 'blur' },],
  latitude_str:[{ required: true, message: t('this_item_is_required'), trigger: 'blur' },],
  longitude_str:[{ required: true, message: t('this_item_is_required'), trigger: 'blur' },],
  time_zone:[{ required: true, message: t('this_item_is_required'), trigger: 'blur' },],
})

const change_all_time = () => {
  w1val.value = w2val.value = w3val.value = w4val.value = w5val.value = w6val.value = w7val.value = w0val.value
}

const change_all_week = () => {
  w1check.value = w2check.value = w3check.value = w4check.value = w5check.value = w6check.value = w7check.value = w0check.value
}

const backStation = () => {
  router.back(-1)
}


const formatNumberToTime = (number) => {
  if (number >= 0 && number <= 24) {
    const hours = number.toString().padStart(2, '0');
    return `${hours}:00`;
  } else {
    return 'Invalid input';
  }
}

const deleteStation = () => {
  let evse_id = ''
  if (StationData.evses.length !== 0) {
    for (let i = 0; i < StationData.evses.length; i++) {
      evse_id += StationData.evses[i].evse_id + ' / '
    }
    ElMessage.error(evse_id)
  }
  else {
    ElMessageBox.confirm(t('do_you_want_to_delete'), 'Warning', { confirmButtonText: 'OK', cancelButtonText: 'Cancel', type: 'warning' })
      .then(async () => {
        const sendData = { class: 'Location', id: station_id }
        let response = await MsiApi.setCollectionData('delete', 'ocpi', sendData)
        if (response.status === 200) { router.push({ name: 'station' }) }
      })
      .catch((e) => { console.log(e) })
  }
}

const saveStation = async (formEl) => {
  if (!formEl) return
  let check_format_success = false
  await formEl.validate((valid) => {
    if (valid === true) 
      check_format_success = true
  })
  if (check_format_success === false) 
    return 

  let regular_hours = []
  if (w1check.value) {
    regular_hours.push({weekday:1,period_begin:formatNumberToTime(w1val.value[0]), period_end:formatNumberToTime(w1val.value[1])})
  }
  if (w2check.value) {
    regular_hours.push({weekday:2,period_begin:formatNumberToTime(w2val.value[0]), period_end:formatNumberToTime(w2val.value[1])})
  }
  if (w3check.value) {
    regular_hours.push({weekday:3,period_begin:formatNumberToTime(w3val.value[0]), period_end:formatNumberToTime(w3val.value[1])})
  }
  if (w4check.value) {
    regular_hours.push({weekday:4,period_begin:formatNumberToTime(w4val.value[0]), period_end:formatNumberToTime(w4val.value[1])})
  }
  if (w5check.value) {
    regular_hours.push({weekday:5,period_begin:formatNumberToTime(w5val.value[0]), period_end:formatNumberToTime(w5val.value[1])})
  }
  if (w6check.value) {
    regular_hours.push({weekday:6,period_begin:formatNumberToTime(w6val.value[0]), period_end:formatNumberToTime(w6val.value[1])})
  }
  if (w7check.value) {
    regular_hours.push({weekday:7,period_begin:formatNumberToTime(w7val.value[0]), period_end:formatNumberToTime(w7val.value[1])})
  }

  let opening_times = { twentyfourseven:station_always_open.value, regular_hours:regular_hours, exceptional_openings:[], exceptional_closings:[]}


  const coordinates = { latitude: parseFloat(StationData.latitude_str).toFixed(6), longitude: parseFloat(StationData.longitude_str).toFixed(6) }
  let sendData = {
    'class': 'Location', 'id': station_id,
    'name': StationData.name, 'facilities': [StationData.facilities_str],
    // 'owner': {name:StationData.owner_name_string}, 'operator': {name:StationData.operator_name_string},
    'party_id': StationData.party_id, 'directions': [{ text: StationData.directions_str }],
    'publish': StationData.publish, 'charging_when_closed': StationData.charging_when_closed,
    'address': StationData.address, 'coordinates': coordinates,
    'city': StationData.city, 'country': StationData.country,
    'country_code': StationData.country_code, 'time_zone': StationData.time_zone,
    opening_times : opening_times
  }
  if (StationData.publish === undefined)
    StationData.publish = false
  sendData.party_id = 'MSI'
  sendData.parking_type = ''
  if (StationData.parking_type_enable)
    sendData.parking_type = 'PARKING_LOT'
  MsiFunc.deleteEmptyKeys(sendData)
  if (sendData.directions[0].text === undefined)
    delete sendData.directions

  if (sendData.address === undefined)
    sendData.address = ''
  sendData.address += '\n' + StationData.address1

  if(sendData.city === undefined)
    sendData.city = ''
  sendData.city += '\n' + StationData.city1

  if (station_id === undefined) {
    sendData.station_id = uuidv4()
    ElMessageBox.confirm(t('do_you_want_to_create'), 'Warning', { confirmButtonText: 'OK', cancelButtonText: 'Cancel', type: 'warning' })
      .then(async () => {
        sendData.evses = []
        let response = await MsiApi.setCollectionData('post', 'ocpi', sendData)
        if (response.status === 201) { router.push({ name: 'station' }) }
        else { ElMessage.error(response.data.message) }
      })
      .catch((e) => { console.log(e) })
  }
  else {
    ElMessageBox.confirm(t('do_you_want_to_modify'), 'Warning', { confirmButtonText: 'OK', cancelButtonText: 'Cancel', type: 'warning' })
      .then(async () => {
        let response = await MsiApi.setCollectionData('patch', 'ocpi', sendData)
        if (response.status === 200) { router.push({ name: 'station' }) }
        else { ElMessage.error(response.data.message) }
      })
      .catch((e) => { console.log(e) })
  }
}

onMounted(async () => {
  let jsonData = { "database": "OCPI", "collection": "Location", "query": { "id": { "UUID": station_id } } }
  if (station_id === undefined) {
    edit_title.value = t('add_station')
  }
  else {
    let response = await MsiApi.mongoQuery(jsonData)
    StationData.length = 0
    Object.assign(StationData, response.data.all[0])
    console.log(StationData)
    StationData.owner_name_string = StationData?.owner?.name
    StationData.operator_name_string = StationData?.operator?.name
    StationData.facilities_str = StationData?.facilities?.[0]
    StationData.directions_str = StationData?.directions?.[0]?.text + ' '
    StationData.latitude_str = StationData?.coordinates?.latitude
    StationData.longitude_str = StationData?.coordinates?.longitude
    const addr_parts = StationData.address.split('\n')
    const city_parts = StationData.city.split('\n')
    if (addr_parts.length === 2) {
      StationData.address = addr_parts[0]
      StationData.address1 = addr_parts[1]
    }
    if (city_parts.length === 2) {
      StationData.city = city_parts[0]
      StationData.city1 = city_parts[1]
    }

    StationData.img_str = StationData?.images?.[0]?.url
    if (StationData.parking_type === "PARKING_LOT")
      StationData.parking_type_enable = true
  }
})

</script>

<template>
  <div class="station-edit">
    <div class="container lg flex-col">
      <div class="page-title flex flex-wrap lg:flex-nowrap pt-40px pb-32px">
        <p>{{ edit_title }}</p>
      </div>
      <div class="flex-grow mb-44px">
        <div class="overflow-x-auto h-full flex">
          <div class="lg:w-50% flex-col pr-40px">
            <el-form class="w-full min-w-190px" :rules="rules" :model="StationData" ref="ruleFormRef">
            <div class="flex">
              <img class="mr-8px" src="@/assets/img/station_edit_stationdetail.png" alt="">
              <p class="text-secondary">{{ t('station_details') }}</p>
            </div>
            
            <div class="flex mt-24px ml-30px">
              <img class="w-180px h-180px mr-30px" v-if="StationData.img_str !== undefined" :src="StationData.img_str">
              <img class="w-180px h-180px mr-30px" v-else src="@/assets/img/null_pic.png">
  
                <div>
                  <!-- <el-form class="w-full min-w-190px"> -->
                    <el-form-item :label="t('name')" prop="name">
                      <el-input v-model.trim="StationData.name" />
                    </el-form-item>
    
                    <el-form-item :label="t('type')" prop="facilities_str">
                    <el-select
                      class="el-select w-full" 
                      v-model="StationData.facilities_str" 
                      placeholder="Select" 
                      size="large"
                    >
                    <el-option v-for="item in facilities_type" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                  </el-form-item>
  
                  <!-- <el-form-item label="Owner">
                    <el-input v-model.trim="StationData.owner_name_string" />
                  </el-form-item> -->
                  <!-- <el-form-item label="Operator">
                    <el-input v-model.trim="StationData.operator_name_string" />
                  </el-form-item> -->
                  <!-- <el-form-item label="Operator ID">
                    <el-input v-model.trim="StationData.party_id" />
                  </el-form-item> -->
                  <!-- <el-form-item label="Note / Description">
                    <el-input v-model.trim="StationData.directions_str" />
                  </el-form-item> -->
  
                  <el-checkbox v-model="StationData.publish" :label= "t('publish')" size="large" />
                  <!-- <el-checkbox v-model="StationData.parking_type_enable" label="Parking Lot" size="large" /> -->
                  <!-- <el-checkbox v-model="StationData.charging_when_closed" label="Charging when place is closed"></el-checkbox> -->
                <!-- </el-form> -->
                </div>
            </div>
  
            <div class="v-line1"></div>
  
            <div class="flex mt-24px">
              <img class="mr-8px" src="@/assets/img/station_edit_location.png" alt="">
              <p class="text-secondary"> {{ t('location')}} </p>
            </div>
    
              <div class="flex mt-24px ml-30px">
                <div class="w-full min-w-190px">
                <!-- <el-form class="w-full min-w-190px" :rules="rules" :model="StationData" ref="ruleFormRef"> -->
                  <div class="flex flex-items-end" id="Country">
                    <el-form-item :label= "t('country')" class="mr-20px w-190px" prop="country">
                      <el-select
                        class="el-select w-190px" 
                        v-model="StationData.country" 
                        placeholder="Select" 
                        size="large"
                        @change="change_country_code(StationData.country)"
                    >
                    <el-option v-for="item in country_list" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                  </el-form-item>
                  <!-- <el-form-item label="Postal Code" class="mr-20px w-190px">
                    <el-input v-model="StationData.postal_code"></el-input>
                  </el-form-item> -->
                  <!-- <el-button class="location-button" @click="getAddress"> Get Address </el-button> -->
                </div>
  
                <div class="flex" id="Address+City">
                  <el-form-item :label="t('address')" class="mr-20px w-full">
                    <el-input v-model="StationData.address" placeholder="EX: 中和區立德街69號"></el-input>
                  </el-form-item>
                  <el-form-item label="City">
                    <el-select v-if="StationData.country === 'Taiwan'"
                      class="el-select w-190px" 
                      v-model="StationData.city" 
                      placeholder="Select" 
                      size="large"
                    >
                      <el-option v-for="item in taiwan_city" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                    <el-input v-else v-model.trim="StationData.city" class="w-190px" />
                  </el-form-item>
                </div>
  
                <div class="flex" id="Address+City(En)">
                  <el-form-item :label="t('address_en')" class="mr-20px w-full" prop="address1">
                    <el-input v-model="StationData.address1"></el-input>
                  </el-form-item>
                  <el-form-item :label="t('city_en')" prop="city1">
                    <el-input v-model="StationData.city1" class="w-190px"></el-input>
                  </el-form-item>
                </div>
  
                <div class="flex flex-items-end" id="Latitude+Longitude">
                  <el-form-item :label="t('latitude')" class="mr-20px w-150px" prop="latitude_str">
                    <el-input v-model="StationData.latitude_str" placeholder="EX: 25.007678"></el-input>
                  </el-form-item>
                  <el-form-item :label="t('Longitude')" class="mr-20px w-150px" prop="longitude_str">
                    <el-input v-model="StationData.longitude_str" placeholder="EX: 121.487396"></el-input>
                  </el-form-item>
                  <el-button class="location-button" @click="getCoordinates"> {{ t('get_coordinates') }}</el-button>
                </div>
                
                <div class="flex flex-items-end" id="TimeZone">
                  <el-form-item :label="t('time_zone')" class="mr-20px w-150px" prop="time_zone">
                    <el-input v-model="StationData.time_zone"></el-input>
                  </el-form-item>
                  <el-button class="location-button" @click="getTimeZone"> {{ t('get_time_zone') }}  </el-button>
                </div>

                <!-- <div class="flex flex-items-end" id="getAddress">
                  <p> {{ Coordinates2Addr }}</p>
                  <el-button class="location-button" @click="getAddress"> Get Address </el-button>
                </div> -->
              </div>
              <!-- </el-form> -->
            </div>
            </el-form>
          </div>
          <div class="v-line"></div>
          <div class="lg:w-50% disable-block flex-col pl-40px pr-40px ">
            <div class="flex justify-between mb-44px">
              <div class="flex">
                <img class="mr-8px w-20px h-20px" src="@/assets/img/station_edit_building.png" alt="">
                <p class="text-secondary"> {{ t('businese_details') }} </p>
              </div>
              <el-switch v-model="station_always_open" size="large" :inactive-text="t('always_open')" />
              <el-switch v-model="select_all" size="large" :inactive-text= "t('select_all')" />
            </div>
            <div class="week-container pr-40px flex-grow min-w-300px">
              <div class="week">
                <el-checkbox v-model="w0check" label="" size="large" :disabled = "!select_all" @change="change_all_week"/>
                <!-- <el-checkbox v-model="w0check" label="" size="large" disabled @change="change_all_week"/> -->
                <span class="text"> {{t('all')}} </span>
                <el-slider v-model="w0val" range :max="24" :disabled = "!select_all" @change="change_all_time"/>
                <!-- <el-slider v-model="w0val" range :max="24" disabled @change="change_all_time"/> -->
              </div>
              <div class="week">
                <el-checkbox v-model="w1check" label="" size="large" :disabled = "select_all"/>
                <span class="text"> {{t('mon')}} </span>
                <el-slider v-model="w1val" range :max="24" :disabled = "select_all"/>
              </div>
              <div class="week">
                <el-checkbox v-model="w2check" label="" size="large" :disabled = "select_all"/>
                <span class="text"> {{t('tue')}} </span>
                <el-slider v-model="w2val" range :max="24" :disabled = "select_all"/>
              </div>
              <div class="week">
                <el-checkbox v-model="w3check" label="" size="large" :disabled = "select_all"/>
                <span class="text"> {{t('wed')}} </span>
                <el-slider v-model="w3val" range :max="24" :disabled = "select_all"/>
              </div>
              <div class="week">
                <el-checkbox v-model="w4check" label="" size="large" :disabled = "select_all"/>
                <span class="text"> {{t('thu')}} </span>
                <el-slider v-model="w4val" range :max="24" :disabled = "select_all"/>
              </div>
              <div class="week">
                <el-checkbox v-model="w5check" label="" size="large" :disabled = "select_all"/>
                <span class="text"> {{t('fri')}} </span>
                <el-slider v-model="w5val" range :max="24" :disabled = "select_all"/>
              </div>
              <div class="week">
                <el-checkbox v-model="w6check" label="" size="large" :disabled = "select_all"/>
                <span class="text"> {{t('sat')}} </span>
                <el-slider v-model="w6val" range :max="24" :disabled = "select_all"/>
              </div>
              <div class="week">
                <el-checkbox v-model="w7check" label="" size="large" :disabled = "select_all"/>
                <span class="text"> {{t('sun')}} </span>
                <el-slider v-model="w7val" range :max="24" :marks="marks" :disabled = "select_all"/>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-justify-center pb-40px">
        <el-button class="btn-secondary bg-btn-100 md:mr-44px" v-if="station_id" @click="deleteStation"> {{t('delete') }} </el-button>
        <el-button class="btn-secondary bg-btn-100 md:mr-44px" @click="backStation"> {{ t('cancel') }}  </el-button>
        <el-button class="btn-secondary" @click="saveStation(ruleFormRef)"> {{ t('save') }}  </el-button>
      </div>

    </div>
  </div>
</template>

<style lang="scss" scoped>
.station-edit {
  height: 100%;
  .page-title {
    font-size: 30px;
  }
  .main-container {
    height: calc(100% - 100px);
  }
  .el-form {
    width: 250px;
    @media (min-width: 768px) {
      width: 100%;
      min-width: 40rem ;
    }
    @media (min-width: 992px) {
      min-width: initial ;
    }
  }
  .el-form-item {
    display: block;
    margin-bottom: 0;
  }
  :deep(.el-form-item__label) {
    display: block;
    font-size: 1.6rem;
  }
  :deep(.el-input__wrapper) {
    width: 250px;
    height: 30px;
    @media (min-width: 768px) {
      width: 100%;
    }
  }
  .v-line {
    border-left: thick solid rgb(226, 234, 242);
  }
  .v-line1 {
    margin-top: 24px;
    border-top: thick solid rgb(226, 234, 242);
    height: 10px;
  }
  .button:hover {
    color: var(--el-color-info);
  }
  .week {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-bottom: 32px;
    .text {
      margin-left: 20px;
      width: 100px;
    }
  }
  ::-webkit-scrollbar {
    width: 0.8rem;
    height: 0.8rem;
  }
  ::-webkit-scrollbar-track,
  ::-webkit-scrollbar-corner {
    background-color: var(--blue-100);
  }
  ::-webkit-scrollbar-thumb {
    background-color: var(--blue-1000);
    border-radius: 2rem;
  }
}
</style>
