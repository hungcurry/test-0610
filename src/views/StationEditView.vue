<template>
  <div class="station-edit">
    <div class="header">
      <p>{{ edit_title }}</p>
    </div>
    <div class="main">
      <div class="left">
        <div class="left-up">
          <div class="left-title">
            <p>Station Details</p>
          </div>
          <div class="left-up-main">
            <div class="left-up-left">
              <img class="station-img" v-if="StationData.img_str !== undefined" :src="StationData.img_str">
              <img class="station-img" v-else src="@/assets/img/null_pic.png">
            </div>
            <div class="left-up-right">

              <!-- <el-form :model="StationData"> -->
              <p>Station Name</p>
              <!-- <el-form-item label=" " prop="name"> -->
              <el-input v-model="StationData.name" />
              <!-- </el-form-item> -->

              <p>Station Type</p>
              <!-- <el-form-item label=" " prop="facilities"> -->
              <el-select class="el-select" v-model="StationData.facilities_str" placeholder="Select" size="large">
                <el-option v-for="item in facilities_type" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
              <!-- </el-form-item> -->

              <!-- </el-form> -->

              <!-- <p>Station Name</p>
              <el-input v-model=" StationData.name " ></el-input> -->
              <!-- <p>Station Type</p>
              <el-select class="el-select" v-model="StationData.facilities_str" placeholder="Select" size="large" >
                <el-option v-for="item in facilities_type" :key="item.value" :label="item.label" :value="item.value" />
              </el-select> -->
              <!-- <p>Owner</p>
              <el-input v-model="StationData.owner_name_string"></el-input> -->
              <!-- <p>Operator</p>
              <el-input v-model="StationData.operator_name_string"></el-input> -->
              <!-- <p>Operator ID</p>
              <el-input v-model="StationData.party_id"></el-input> -->
              <!-- <p>Note / Description</p>
              <el-input v-model="StationData.directions_str"></el-input> -->
              <br>
              <el-checkbox v-model="StationData.publish" label="Publish" size="large" />
              <el-checkbox v-model="StationData.parking_type_enable" label="Parking Lot" size="large" />
              <el-checkbox v-model="StationData.charging_when_closed" label="Charging when place is closed"
                size="large" />
            </div>
          </div>

        </div>
        <div class="v-line1"></div>
        <div class="left-down">
          <div class="left-down-title">
            <p> Station </p>
          </div>
          <div class="left-down-line1">
            <div>
              <p>Country</p>
              <el-select v-model="StationData.country" placeholder="Select" size="large"
                @change="change_country_code(StationData)">
                <el-option v-for="item in country_list" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </div>
            <div v-if="StationData.country === 'Taiwan'">
              <p>City</p>
              <el-select class="el-select" v-model="StationData.city" placeholder="Select" size="large">
                <el-option v-for="item in taiwan_city" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </div>
            <div v-else>
              <p>City</p>
              <el-input v-model="StationData.city"></el-input>
            </div>
            <div>
              <p>Address </p>
              <el-input v-model="StationData.address"></el-input>
            </div>
            <!-- <div class="button-div">
              <el-button class="button" @click="getCoordinates"> Get Coordinates </el-button>
            </div> -->
          </div>
          <div class="left-down-line2">
            <div>
              <p>City (En)</p>
              <el-input v-model="StationData.city1"></el-input>
            </div>
            <div>
              <p>Address (En)</p>
              <el-input v-model="StationData.address1"></el-input>
            </div>
          </div>
          <div class="left-down-line2">
            <div>
              <p>Latitude</p>
              <el-input v-model="StationData.latitude_str"></el-input>
            </div>
            <div>
              <p>Longitude</p>
              <el-input v-model="StationData.longitude_str"></el-input>
            </div>

            <div>
              <p>Time Zone</p>
              <el-input v-model="StationData.time_zone"></el-input>
            </div>

            <!-- <div class="button-div">
              <el-button class="button" @click="getAddress"> Get Address </el-button>
              <el-button class="button" @click="getTimeZone"> Get Time Zone </el-button>
            </div> -->

            <!-- <div>
              <p>Postal Code</p>
              <el-input v-model="StationData.postal_code"></el-input>
            </div> -->
          </div>
          <!-- <p> {{ Coordinates2Addr }}</p> -->
        </div>
      </div>
      <div class="v-line">
      </div>
      <!-- <div class="right">
        <p>Open Time</p>
        <el-switch v-model="select_all" size="large" inactive-text="Select All"/>
        <div class="week-container">
          <div class="week">
            <el-checkbox v-model="w0check" label="" size="large" :disabled = "!select_all" @change="change_all_week"/>
            <span class="text">All</span>
            <el-slider v-model="w0val" range :max="24" :disabled = "!select_all" @change="change_all_time"/>
          </div>
          <div class="week">
            <el-checkbox v-model="w1check" label="" size="large" :disabled = "select_all"/>
            <span class="text">Mon.</span>
            <el-slider v-model="w1val" range :max="24" :disabled = "select_all"/>
          </div>
          <div class="week">
            <el-checkbox v-model="w2check" label="" size="large" :disabled = "select_all"/>
            <span class="text">Tue.</span>
            <el-slider v-model="w2val" range :max="24" :disabled = "select_all"/>
          </div>
          <div class="week">
            <el-checkbox v-model="w3check" label="" size="large" :disabled = "select_all"/>
            <span class="text">Wed.</span>
            <el-slider v-model="w3val" range :max="24" :disabled = "select_all"/>
          </div>
          <div class="week">
            <el-checkbox v-model="w4check" label="" size="large" :disabled = "select_all"/>
            <span class="text">Thu.</span>
            <el-slider v-model="w4val" range :max="24" :disabled = "select_all"/>
          </div>
          <div class="week">
            <el-checkbox v-model="w5check" label="" size="large" :disabled = "select_all"/>
            <span class="text">Fri.</span>
            <el-slider v-model="w5val" range :max="24" :disabled = "select_all"/>
          </div>
          <div class="week">
            <el-checkbox v-model="w6check" label="" size="large" :disabled = "select_all"/>
            <span class="text">Sat.</span>
            <el-slider v-model="w6val" range :max="24" :disabled = "select_all"/>
          </div>
          <div class="week">
            <el-checkbox v-model="w7check" label="" size="large" :disabled = "select_all"/>
            <span class="text">Sun.</span>
            <el-slider v-model="w7val" range :max="24" :disabled = "select_all"/>
          </div>
        </div>
      </div> -->
    </div>
    <div class="down">
      <el-button class="button" @click="deleteStation"> Delete </el-button>
      <el-button class="button" @click="saveStation"> Save </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ApiFunc from '@/components/ApiFunc'
import { ElMessageBox, ElMessage } from 'element-plus'
import { v4 as uuidv4 } from 'uuid'
import CommpnFunc from '@/components/CommonFunc'
const MsiFunc = CommpnFunc()
const MsiApi = ApiFunc()
const route = useRoute()
const router = useRouter()
const station_id = route.query.id
const Coordinates2Addr = ref('')
const edit_title = ref('Edit Station')

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

const getAddress = async () => {
  let res = await MsiApi.getAddress(StationData.latitude_str, StationData.longitude_str)
  Coordinates2Addr.value = res.data.data.results[0].formatted_address
}

const change_country_code = (item) => {
  if (item.country === 'Germany') {
    StationData.country_code = 'DE'
  }
  else if (item.country === 'Japan') {
    StationData.country_code = 'JP'
  }
  else if (item.country === 'Taiwan') {
    StationData.country_code = 'TW'
    StationData.time_zone = 'Asia/Taipei'
  }
  else if (item.country === 'United States') {
    StationData.country_code = 'US'
  }
}

const facilities_type = [{ value: 'HOTEL', label: 'Hotel' }, { value: 'RESTAURANT', label: 'Restaurant' },
{ value: 'MALL', label: 'Mall' }, { value: 'SUPERMARKET', label: 'Super Market' },
// { value: 'TAXI_STAND', label: 'Public transportation' }, 
// { value: 'FUEL_STATION', label: 'Fuel station' },
{ value: 'PARKING_LOT', label: 'Parking lot' }, { value: 'WIFI', label: 'Others' },
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

const country_list = [{ value: 'Germany', label: 'Germany', country_code: 'DE' }, { value: 'Japan', label: 'Japan', country_code: 'JP' },
{ value: 'Taiwan', label: 'Taiwan', country_code: 'TW' }, { value: 'United States', label: 'United States', country_code: 'US' },
]

const select_all = ref(true)
const w0val = ref([0, 24]), w1val = ref([0, 24]), w2val = ref([0, 24]), w3val = ref([0, 24]), w4val = ref([0, 24]), w5val = ref([0, 24]), w6val = ref([0, 24]), w7val = ref([0, 24])
const w0check = ref(), w1check = ref(), w2check = ref(), w3check = ref(), w4check = ref(), w5check = ref(), w6check = ref(), w7check = ref()

const StationData = reactive([])

const change_all_time = () => {
  w1val.value = w2val.value = w3val.value = w4val.value = w5val.value = w6val.value = w7val.value = w0val.value
}

const change_all_week = () => {
  w1check.value = w2check.value = w3check.value = w4check.value = w5check.value = w6check.value = w7check.value = w0check.value
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
    ElMessageBox.confirm('Do you want to delete?', 'Warning', { confirmButtonText: 'OK', cancelButtonText: 'Cancel', type: 'warning' })
      .then(async () => {
        const sendData = { class: 'Location', id: station_id }
        let response = await MsiApi.setCollectionData('delete', 'ocpi', sendData)
        if (response.status === 200) { router.push({ name: 'station' }) }
      })
      .catch((e) => { console.log(e) })
  }
}

const saveStation = async () => {
  let check_format_sucess = true
  const coordinates = { latitude: parseFloat(StationData.latitude_str).toFixed(6), longitude: parseFloat(StationData.longitude_str).toFixed(6) }
  let sendData = {
    'class': 'Location', 'id': station_id,
    'name': StationData.name, 'facilities': [StationData.facilities_str],
    // 'owner': {name:StationData.owner_name_string}, 'operator': {name:StationData.operator_name_string},
    'party_id': StationData.party_id, 'directions': [{ text: StationData.directions_str }],
    'publish': StationData.publish, 'charging_when_closed': StationData.charging_when_closed,
    'address': StationData.address, 'coordinates': coordinates,
    'city': StationData.city, 'country': StationData.country,
    'country_code': StationData.country_code, 'time_zone': StationData.time_zone
  }
  sendData.party_id = 'MSI'
  sendData.parking_type = ''
  if (StationData.parking_type_enable)
    sendData.parking_type = 'PARKING_LOT'
  MsiFunc.deleteEmptyKeys(sendData)
  if (sendData.directions[0].text === undefined)
    delete sendData.directions


  if (StationData.address1 === undefined) {
    ElMessage.error('Oops, address en required.')
    check_format_sucess = false
  }
  else {
    sendData.address += '\n' + StationData.address1
  }

  if (StationData.city1 === undefined) {
    ElMessage.error('Oops, city en required.')
    check_format_sucess = false
  }
  else {
    sendData.city += '\n' + StationData.city1
  }



  if (sendData.country_code === undefined) {
    ElMessage.error('Oops, Country code required.')
    check_format_sucess = false
  }
  if (sendData.name === undefined) {
    ElMessage.error('Oops, Name required.')
    check_format_sucess = false
  }
  if (sendData.party_id === undefined) {
    ElMessage.error('Oops, Party ID required.')
    check_format_sucess = false
  }
  if (sendData.publish === undefined) {
    sendData.publish = false
  }
  if (sendData.address === undefined) {
    ElMessage.error('Oops, Address required.')
    check_format_sucess = false
  }
  if (sendData.city === undefined) {
    ElMessage.error('Oops, City required.')
    check_format_sucess = false
  }
  if (sendData.country === undefined) {
    ElMessage.error('Oops, Country required.')
    check_format_sucess = false
  }
  if (sendData.coordinates === undefined) {
    ElMessage.error('Oops, Coordinates required.')
    check_format_sucess = false
  }
  if (sendData.facilities[0] === undefined) {
    ElMessage.error('Oops, facilities required.')
    check_format_sucess = false
  }
  if (sendData.time_zone === undefined) {
    ElMessage.error('Oops, time zone required.')
    check_format_sucess = false
  }
  if (check_format_sucess === true) {
    if (station_id === undefined) {
      sendData.station_id = uuidv4()
      ElMessageBox.confirm('Do you want to create?', 'Warning', { confirmButtonText: 'OK', cancelButtonText: 'Cancel', type: 'warning' })
        .then(async () => {
          let response = await MsiApi.setCollectionData('post', 'ocpi', sendData)
          if (response.status === 201) { router.push({ name: 'station' }) }
          else { ElMessage.error(response.data.message) }
        })
        .catch((e) => { console.log(e) })
    }
    else {
      ElMessageBox.confirm('Do you want to modify?', 'Warning', { confirmButtonText: 'OK', cancelButtonText: 'Cancel', type: 'warning' })
        .then(async () => {
          let response = await MsiApi.setCollectionData('patch', 'ocpi', sendData)
          if (response.status === 200) { router.push({ name: 'station' }) }
          else { ElMessage.error(response.data.message) }
        })
        .catch((e) => { console.log(e) })
    }
  }
}

onMounted(async () => {
  let jsonData = { "database": "OCPI", "collection": "Location", "query": { "id": { "UUID": station_id } } }
  if (station_id === undefined) {
    edit_title.value = 'Add Station'
  }
  else {
    let response = await MsiApi.mongoQuery(jsonData)
    StationData.length = 0
    Object.assign(StationData, response.data.all[0])
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

<style lang="scss">
.station-edit {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;

  .header {
    display: flex;
    justify-content: center;

    p {
      font-size: 30px;
      margin: 10px;
    }
  }

  .main {
    width: 100%;
    height: 80%;
    display: flex;
    flex-direction: row;
    gap: 4%;

    .left {
      margin-left: 80px;
      width: 45%;
      height: 100%;
    }

    .left-up {
      display: flex;
      flex-direction: column;
      height: 65%;

      .left-up-main {
        display: flex;
        flex-direction: row;

        .left-up-left {
          margin-right: 20px;

          img {
            width: 200px;
            height: 200px;
          }
        }

        .left-up-right {
          p {
            margin: 0;
          }

          .el-select {
            width: 200px;

            .el-input--large {
              height: 30px;
            }
          }
        }
      }
    }

    .left-down {
      .left-down-line1 {
        display: flex;
        flex-direction: row;

        .button-div {
          display: flex;
          align-items: end;
        }
      }

      .left-down-line2 {
        display: flex;
        flex-direction: row;

        .button-div {
          display: flex;
          align-items: end;
        }
      }

      .el-select {
        width: 200px;

        .el-input--large {
          height: 32px;
        }
      }
    }

    .right {
      width: 45%;
      margin-right: 80px;

      .week-container {
        display: flex;
        flex-direction: column;
        gap: 40px;

        .week {
          display: flex;
          flex-direction: row;
          align-items: center;

          .text {
            margin-left: 20px;
            width: 50px;
          }
        }
      }
    }
  }


  .el-input {
    --el-input-bg-color: rgb(86, 101, 117);
    --el-input-text-color: rgb(255, 255, 255);
  }

  .down {
    display: flex;
    flex-direction: row;
    justify-content: center;

    .button {
      width: 220px;
      height: 40px;
      font-size: 18px;
      background-color: #000000DF;
      color: #FFFFFF;
      border-radius: 20px;
    }
  }



  .v-line {
    margin-top: 20px;
    border-left: thick solid rgb(226, 234, 242);
    height: 90%;
  }

  .v-line1 {
    border-top: thick solid rgb(226, 234, 242);
    height: 10px;
  }


}
</style>