<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ApiFunc from '@/composables/ApiFunc'
import { ElMessageBox, ElMessage } from 'element-plus'
import { v4 as uuidv4 } from 'uuid'
import CommpnFunc from '@/composables/CommonFunc'
import { useI18n } from "vue-i18n"
import { useMStore } from '../stores/m_cloud'
const MStore = useMStore()
const { t } = useI18n()
const MsiFunc = CommpnFunc()
const MsiApi = ApiFunc()
const route = useRoute()
const router = useRouter()
const station_id = route.query.id
const edit_title = ref(t('edit_station'))
const ruleFormRef  = ref()

const getCoordinates = async () => {
  let address = StationData.country + StationData.city + StationData.address + StationData.city1 + StationData.address1
  let res = await MsiApi.getCoordinates(address)
  StationData.latitude_str = res.data.data.results[0].geometry.location.lat.toFixed(6)
  StationData.longitude_str = res.data.data.results[0].geometry.location.lng.toFixed(6)
}

const getTimeZone = async () => {
  let res = await MsiApi.getTimeZone(StationData.latitude_str, StationData.longitude_str)
  StationData.time_zone = res.data.data.timeZoneId
}

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

const station_always_open = ref(true)
const w1 = reactive( {val: ref([0, 24]), check : ref(), label: t('mon') })
const w2 = reactive( {val: ref([0, 24]), check : ref(), label: t('tue') })
const w3 = reactive( {val: ref([0, 24]), check : ref(), label: t('wed') })
const w4 = reactive( {val: ref([0, 24]), check : ref(), label: t('thu') })
const w5 = reactive( {val: ref([0, 24]), check : ref(), label: t('fri') })
const w6 = reactive( {val: ref([0, 24]), check : ref(), label: t('sat') })
const w7 = reactive( {val: ref([0, 24]), check : ref(), label: t('sun') })
const week = reactive ( [w1, w2, w3, w4, w5, w6, w7 ])

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
  for (let i = 0; i < 7; i++) {
    if (week[i]?.check)
      regular_hours.push({weekday: i+1 ,period_begin:formatNumberToTime(week[i].val[0]), period_end:formatNumberToTime(week[i].val[1])})
  }

  let opening_times = { twentyfourseven:station_always_open.value, regular_hours:regular_hours}
  console.log(opening_times)
  const coordinates = { latitude: parseFloat(StationData.latitude_str).toFixed(6), longitude: parseFloat(StationData.longitude_str).toFixed(6) }
  if (StationData.publish === undefined)
    StationData.publish = false
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
      if (response.status === 200) { 
        ElMessage.success(response.data.message)
        router.push({ name: 'station' }) 
      }
      else { ElMessage.error(response.data.message) }
    })
    .catch((e) => { console.log(e) })
  }
}

const convertTimeToHours = (timeString) => {
  const hourPart = timeString.split(':')[0]
  const hours = parseInt(hourPart)
  return hours;
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
    if (StationData?.opening_times?.regular_hours) {
      StationData.opening_times.regular_hours.forEach ( (item) => {
        let hours1 = convertTimeToHours(item.period_begin);
        let hours2 = convertTimeToHours(item.period_end);
        week[item.weekday-1].check = true
        week[item.weekday-1].val = [hours1, hours2]
      })
    }
    station_always_open.value = StationData?.opening_times?.twentyfourseven
    if (StationData?.opening_times?.twentyfourseven === undefined) {
      station_always_open.value = true
    }
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
    <div class="container lg h-full flex-col">
      <div class="page-title flex flex-wrap lg:flex-nowrap pt-40px pb-32px">
        <p>{{ edit_title }}</p>
      </div>

      <div class="lg:flex flex-grow mb-30px">
        <!-- fprm -->
        <div class="flex-col lg:w-50% lg:pr-40px">
          <el-form class="w-full" :rules="rules" :model="StationData" ref="ruleFormRef">
            <div class="title flex">
              <img class="mr-8px" src="@/assets/img/station_edit_stationdetail.png" alt="">
              <p class="text-secondary">{{ t('station_details') }}</p>
            </div>
            
            <div class="md:flex mt-14px md:ml-30px">
              <template v-if="true">
                <img class="w-full block mx-auto rounded-2xl object-cover mb-8px md:w-180px md:h-180px md:mr-30px md:mb-0" 
                v-if="StationData.img_str !== undefined" :src="StationData.img_str">
                <img class="w-full block mx-auto rounded-2xl object-cover mb-8px md:w-180px md:h-180px md:mr-30px md:mb-0" 
                v-else src="@/assets/img/null_pic.png">
              </template>
              <div class="formGroup w-full">
                <el-form-item class="mb-18px" :label="t('name')" prop="name">
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

                <el-checkbox v-model="StationData.publish" :label="t('publish')"/>
                <!-- <el-checkbox v-model="StationData.parking_type_enable" label="Parking Lot" size="large" /> -->
                <!-- <el-checkbox v-model="StationData.charging_when_closed" label="Charging when place is closed"></el-checkbox> -->
              </div>
            </div>
  
            <div class="v-line1 my-10px md:ml-30px"></div>
  
            <div class="title flex">
              <img class="mr-8px" src="@/assets/img/station_edit_location.png" alt="">
              <p class="text-secondary"> {{ t('location')}} </p>
            </div>
    
            <div class="flex mt-14px md:ml-30px">
              <div class="formGroup w-full">
                <div class="md:flex flex-items-end" id="Country">
                  <el-form-item :label= "t('country')" class="w-full" prop="country">
                    <el-select
                      class="el-select w-full" 
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
                  <!-- <el-button class="w-full bg-blue-200 px-0 h-30px mb-18px border-blue-300" 
                  @click="getAddress"> Get Address </el-button> -->
                </div>
  
                <div class="md:flex" id="Address+City">
                  <el-form-item :label="t('address')" class="w-full md:mr-20px ">
                    <el-input v-model="StationData.address" placeholder="EX: 中和區立德街69號"></el-input>
                  </el-form-item>
                  <el-form-item class="w-full" label="City">
                    <el-select v-if="StationData.country === 'Taiwan'"
                      class="el-select w-full" 
                      v-model="StationData.city" 
                      placeholder="Select" 
                      size="large"
                    >
                      <el-option v-for="item in taiwan_city" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                    <el-input v-else v-model.trim="StationData.city" />
                  </el-form-item>
                </div>
  
                <div class="md:flex" id="Address+City(En)">
                  <el-form-item :label="t('address_en')" class="w-full md:mr-20px" prop="address1">
                    <el-input v-model="StationData.address1"></el-input>
                  </el-form-item>
                  <el-form-item :label="t('city_en')" class="w-full" prop="city1">
                    <el-input v-model="StationData.city1" class=""></el-input>
                  </el-form-item>
                </div>
                
                <div class="md:flex flex-items-end border-s-b-1 text-blue-300 mb-8px" id="Latitude+Longitude">
                  <el-form-item :label="t('latitude')" class="w-full md:mr-20px" prop="latitude_str">
                    <el-input v-model="StationData.latitude_str" placeholder="EX: 25.007678"></el-input>
                  </el-form-item>
                  <el-form-item :label="t('longitude')" class="w-full md:mr-20px" prop="longitude_str">
                    <el-input v-model="StationData.longitude_str" placeholder="EX: 121.487396"></el-input>
                  </el-form-item>
                  <el-button class="w-full bg-blue-200 px-0 h-30px mb-18px border-blue-300"
                  @click="getCoordinates"> {{ t('get_coordinates') }}</el-button>
                </div>

                <div class="md:flex flex-items-end" id="TimeZone">
                  <el-form-item :label="t('time_zone')" class="w-full md:mr-20px" prop="time_zone">
                    <el-input v-model="StationData.time_zone"></el-input>
                  </el-form-item>
                  <el-button class="w-full bg-blue-200 px-0 h-30px mb-18px border-blue-300"
                  @click="getTimeZone"> {{ t('get_time_zone') }} </el-button>
                </div>

                <!-- <div class="md:flex flex-items-end" id="getAddress">
                  <p> {{ Coordinates2Addr }}</p>
                  <el-button class="location-button" @click="getAddress"> Get Address </el-button>
                </div> -->
              </div>
            </div>
          </el-form>
        </div>
        <!-- <hr> -->
        <div class="v-line"></div>
        <!-- timeline -->
        <div class="flex-col mt-24px lg:mt-0 lg:w-50% lg:px-40px">
          <div class="overflow-x-auto">
            <div class="md:flex justify-between items-center mb-24px">
              <div class="flex">
                <img class="mr-8px w-20px h-20px" src="@/assets/img/station_edit_building.png" alt="">
                <p class="text-secondary"> {{ t('opening_time') }} </p>
              </div>
              <div class="flex">
                <el-switch class="flex-shrink-0 mr-10px md:mr-20px" v-model="station_always_open" size="large" :inactive-text="t('always_open')" />
              </div>
            </div>
            <div class="week-container md:pr-40px flex-grow min-w-600px">

              <div class="week" v-for = "(item, index) in week"  :key="item" :disabled = "station_always_open">
                <el-checkbox v-model="item.check" size="large" :disabled = "station_always_open"/>
                <span class="text"> {{ item.label}} </span>
                <el-slider v-if="index !== 6" v-model="item.val" range :max="24" :disabled = "station_always_open"/>
                <el-slider v-else v-model="item.val" range :max="24" :marks="marks" :disabled = "station_always_open"/>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-justify-center pb-40px">
        <el-button class="btn-secondary bg-btn-100 md:mr-44px" v-if="station_id && (MStore.rule_permission.StationEdit.delete === 'O' || MStore.permission.isCompany)" @click="deleteStation"> {{t('delete') }} </el-button>
        <el-button class="btn-secondary bg-btn-100 md:mr-44px" @click="backStation"> {{ t('cancel') }}  </el-button>
        <el-button class="btn-secondary" v-if="MStore.rule_permission.StationEdit.edit === 'O' || MStore.permission.isCompany"   @click="saveStation(ruleFormRef)"> {{ t('save') }}  </el-button>
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
  .el-form-item {
    display: block;
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
    border-left:.3rem solid var(--blue-300);
  }
  .v-line1 {
    border-top: .1rem solid var(--blue-300);
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
      margin-left: 10px;
      width: 70px;
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
