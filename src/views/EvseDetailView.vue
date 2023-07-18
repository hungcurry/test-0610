<script setup>
import { reactive, onMounted} from 'vue'
import { useRoute, useRouter} from 'vue-router'
import ApiFunc from '@/composables/ApiFunc'
import {  ElMessageBox } from 'element-plus'
import msi from '@/assets/msi_style'
import { useMStore } from "../stores/m_cloud"
import moment from "moment"
const MStore = useMStore()
const route = useRoute()
const evseId = route.query.evse_id
const router = useRouter()
const MsiApi = ApiFunc()
const evseData = reactive([])
const connectorData = reactive([])
const chargePointInfoData = reactive([])
const hmiInfoData = reactive([])
const locationData = reactive([])
const tariffData = reactive([])
const tariff_elements = reactive([])

const deleteEvse = () => {
  ElMessageBox.confirm('Do you want to delete?','Warning', {confirmButtonText: 'OK', cancelButtonText: 'Cancel', type: 'warning'})
  .then(async () => {
    let sendData = { 'class' : 'EVSE', 'id' : evseId }
    console.log(await MsiApi.setCollectionData('delete', 'ocpi', sendData))

    sendData = { 'class' : 'Connector', 'id' : connectorData.id }
    console.log(await MsiApi.setCollectionData('delete', 'ocpi', sendData))

    if(chargePointInfoData.hmi !== '') { 
      sendData = { 'class' : 'HMIControlBoardInfo', 'pk' : chargePointInfoData.hmi }
      console.log(await MsiApi.setCollectionData('delete', 'cpo', sendData))
    }
    let evseArr = []
    for (let i = 0; i < locationData?.evses?.length; i++) {
      if (locationData.evses[i].uid === evseId) {
        continue
      }
      evseArr.push(locationData.evses[i]._id)
    }
    let sendData1 = { 'class' : 'Location', 'id': locationData.id, 'evses' : evseArr}
    console.log(await MsiApi.setCollectionData('patch', 'ocpi', sendData1))

    router.back(-1)
    // router.push({ name: 'stationDetail', query: {id:locationData.id} })
  })
}
const edit = () => {
  router.push({ name: 'evseEdit', query: {station_id:locationData.id, evse_id:evseId} })
}
onMounted( async () => {
  
  let queryData = { "database":"OCPI", "collection":"EVSE", "query": { "uid": {"UUID":evseId}}}
  let response = await MsiApi.mongoQuery(queryData)
  Object.assign(evseData, response.data.all[0]) 

  let localEndTime =  new Date( (new Date(evseData.last_updated).getTime()) + ((MStore.timeZoneOffset ) * -60000))
  evseData.last_updated_str = (moment(localEndTime).format("YYYY-MM-DD HH:mm:ss"))
  
  
  queryData = { "database":"OCPI", "collection":"Connector", "query": { "_id": { "ObjectId" : evseData?.connectors?.[0]?._id}}}
  response = await MsiApi.mongoQuery(queryData)
  Object.assign(connectorData, response.data.all[0]) 

  localEndTime =  new Date( (new Date(connectorData.last_updated).getTime()) + ((MStore.timeZoneOffset ) * -60000))
  connectorData.last_updated_str = (moment(localEndTime).format("YYYY-MM-DD HH:mm:ss"))

  queryData = { "database":"CPO", "collection":"ChargePointInfo", "query": { "evse": { "ObjectId" : evseData?._id}}}
  response = await MsiApi.mongoQuery(queryData)
  Object.assign(chargePointInfoData, response.data.all[0])
  if(chargePointInfoData.hmi !== '') {
    queryData = { "database":"CPO", "collection":"HMIControlBoardInfo", "query": { "_id": { "ObjectId" : chargePointInfoData?.hmi}}}    
    response = await MsiApi.mongoQuery(queryData)
    Object.assign(hmiInfoData, response.data.all[0])
  }
  queryData = { "database":"OCPI", "collection":"Location", "query": {  "evses" : {"$in": [  {"ObjectId" : evseData?._id }]}  }}
  response = await MsiApi.mongoQuery(queryData)
  if (response.data.all.length === 0) {
    if(locationData.name === undefined)
      locationData.name = ''
    if(locationData.country === undefined)
    locationData.country = ''      
    if(locationData.city === undefined)
      locationData.city = ''
    if(locationData.address === undefined)
      locationData.address = ''
  }
  else {
    Object.assign(locationData, response.data.all[0])
  }
  queryData = { "database":"OCPI", "collection":"Tariff", "query": { "id": { "UUID" : connectorData.tariff_ids[0]}}}
  response = await MsiApi.mongoQuery(queryData)
  Object.assign(tariffData, response.data.all[0])
  tariffData.tariff_alt_text_str = tariffData.tariff_alt_text[0].text
  
  Object.assign(tariff_elements, tariffData.elements )
})
</script>

<template>
  <div class="evse-detail">
    <div class="evse-detail-header pt-40px pb-40px bg-white">
      <div class="container lg">
        <el-row :gutter="0">
          <el-col class="el-col" :xs="24" :md="14">
            <div class="h-full">
              <p class="evse-id pb-20px" > {{evseData.evse_id}}</p>
              <p class="status pb-20px available" v-if="evseData.status === 'AVAILABLE'"> {{ "●" + evseData.status }}</p>
              <p class="status pb-20px charging" v-else-if="evseData.status === 'CHARGING'"> {{ "●" + evseData.status }}</p>
              <p class="status pb-20px offline" v-else-if="evseData.status === 'UNKNOWN'"> {{ "●" + evseData.status }}</p>
              <p class="status pb-20px error" v-else-if="evseData.status === 'ERROR' || evseData.status === 'OUTOFORDER'"> {{ "●" + evseData.status }}</p>
            </div>
          </el-col>
          <el-col class="el-col" :xs="24" :md="10">
            <div class="text-right">
              <p class="location-name text-right mb-20px">{{ locationData.name }}</p>
              <p class="location-addr text-right mb-20px">{{ locationData.country + ' ' + locationData.city + locationData.address }}</p>
              <el-button type="primary" class="delete bg-secondary px-30px min" @click="deleteEvse"> Delete </el-button>
              <el-button type="primary" class="edit bg-secondary px-30px min" @click="edit"> Edit </el-button>
            </div>
          </el-col>
        </el-row>
      </div>
    </div>
    <div class="evse-detail-main pt-30px pb-40px">
      <div class="container lg">
        <el-row class="evse-connector-hmi-container pb-20px" :gutter="30">
          <el-col class="el-col evse-col" :xs="24" :md="8">
            <div class="evse flex-col w-full h-full rounded-2xl p-16px bg-white lg:rounded-none lg:rounded-l-2xl">
              <div class="title flex items-center mb-20px">
                <img class="w-24px h-24px filter-black" src="@/assets/img/charger_evse.png" alt="">
                <h4 class="m-0 ml-8px text-20px text-black-100"> EVSE Info</h4>
              </div>
              <div class="container-data h-full md:px-32px">
                <!-- <div class="info-item">
                  <p class="info-title w-50%">Charger ID</p>
                  <p class="info-value w-50% ml-24px">{{ evseData.uid }}</p>
                </div> -->
                <div class="info-item">
                  <p class="info-title w-50%">EVSE ID</p>
                  <p class="info-value w-50% ml-24px">{{evseData.evse_id}}</p>
                </div>
                <div class="info-item">
                  <p class="info-title w-50%">Floor Level</p>
                  <p class="info-value w-50% ml-24px">{{evseData.floor_level}}</p>
                </div>
                <!-- <div class="info-item">
                  <p class="info-title w-50%">Charger Label</p>
                  <p class="info-value w-50% ml-24px">{{evseData.physical_reference}}</p>
                </div> -->
                <!-- <div class="info-item">
                  <p class="info-title w-50%">Note / Description</p>
                  <p class="info-value w-50% ml-24px">{{evseData.description}} </p>
                </div>             -->
                <div class="info-item">
                  <p class="info-title w-50%">Last Updated</p>
                  <p class="info-value w-50% ml-24px">{{evseData.last_updated_str}}</p>
                </div>
              </div>
            </div >
          </el-col>
          <el-col class="el-col connector-col" :xs="24" :md="8">
            <div class="connector flex-col w-full h-full rounded-2xl p-16px bg-white lg:rounded-none lg:rounded-r-2xl">
              <div class="title flex items-center mb-20px">
                <img class="w-24px h-24px filter-black" src="@/assets/img/charger_edit_connector.png" alt="">
                <h4 class="m-0 ml-8px text-20px text-black-100"> Connector Info</h4>
              </div>
              <div class="container-data h-full md:px-32px">
                <!-- <div class="info-item">
                  <p class="info-title w-50%">Connector ID</p>
                  <p class="info-value w-50% ml-24px">{{ connectorData.id }} </p>
                </div>    -->
                <div class="info-item">
                  <p class="info-title w-50%">Type</p>
                  <p class="info-value w-50% ml-24px">{{ connectorData.standard }} </p>
                </div>   
                <!-- <div class="info-item">
                  <p class="info-title w-50%">Format</p>
                  <p class="info-value w-50% ml-24px">{{ connectorData.format }}</p>
                </div>    -->
                <!-- <div class="info-item">
                  <p class="info-title w-50%">Power Type</p>
                  <p class="info-value w-50% ml-24px">{{connectorData.power_type}} </p>
                </div>    -->
                <div class="info-item">
                  <p class="info-title w-50%">Max Voltage</p>
                  <p class="info-value w-50% ml-24px">{{connectorData.max_voltage + ' V '}}</p>
                </div>   
                <div class="info-item">
                  <p class="info-title w-50%">Max Current</p>
                  <p class="info-value w-50% ml-24px">{{connectorData.max_amperage + ' A '}}</p>
                </div>   
                <div class="info-item">
                  <p class="info-title w-50%">Max Electric Power</p>
                  <p class="info-value w-50% ml-24px">{{ connectorData.max_electric_power / 1000 + ' kW'}} </p>
                </div>   
                <div class="info-item">
                  <p class="info-title w-50%">Last Updated</p>
                  <p class="info-value w-50% ml-24px">{{ connectorData.last_updated_str }} </p>
                </div>  
              </div> 
            </div>
          </el-col>
          <el-col class="el-col" :xs="24" :md="8">
            <div class="hmi-container flex-col h-full rounded-2xl p-16px bg-white">
              <div class="title flex items-center mb-20px">
                <img class="w-24px h-24px filter-black" src="@/assets/img/charger_hmi.png" alt="">
                <h4 class="m-0 ml-8px text-20px text-black-100"> HMI Info</h4>
              </div>
              <div class="container-data h-full md:px-32px">
                <!-- <div class="info-item">
                  <p class="info-title w-50%">Control Board Model</p>
                  <p class="info-value w-50% ml-24px">{{ hmiInfoData.control_board_model_name }} </p>
                </div>    -->
                <div class="info-item">
                  <p class="info-title w-50%">Control Board SN</p>
                  <p class="info-value w-50% ml-24px">{{ hmiInfoData.control_board_sn }} </p>
                </div>   
                <div class="info-item">
                  <p class="info-title w-50%">Control Board FW Version</p>
                  <p class="info-value w-50% ml-24px">{{ hmiInfoData.control_board_fw_version }} </p>
                </div>   
                <!-- <div class="info-item">
                  <p class="info-title w-50%">HMI Board Model</p>
                  <p class="info-value w-50% ml-24px">{{ hmiInfoData.hmi_board_model_name }} </p>
                </div>    -->
                <div class="info-item">
                  <p class="info-title w-50%">HMI Board SN</p>
                  <p class="info-value w-50% ml-24px">{{ hmiInfoData.hmi_board_sn }} </p>
                </div>   
                <div class="info-item">
                  <p class="info-title w-50%">HMI Board SW Version</p>
                  <p class="info-value w-50% ml-24px">{{ hmiInfoData.hmi_board_sw_version }} </p>
                </div>   
                <div class="info-item">
                  <p class="info-title w-50%">Created Date</p>
                  <p class="info-value w-50% ml-24px">{{ hmiInfoData.created_date }} </p>
                </div>  
                <div class="info-item">
                  <p class="info-title w-50%">Last Updated</p>
                  <p class="info-value w-50% ml-24px">{{ hmiInfoData.updated_date }} </p>
                </div>  
              </div> 
          </div>
          </el-col>
        </el-row>
        <!-- ------------- -->
        <el-row class="tariff-container rounded-2xl"  :gutter="30">
          <el-col class="el-col" :xs="24" :md="24">
            <div class=" h-full rounded-2xl p-16px bg-white">
              <div class="title w-full flex items-center mb-20px">
                <img class="w-24px h-24px filter-black" src="@/assets/img/charger_tariff.png" alt="">
                <h4 class="m-0 ml-8px text-20px text-black-100">Rate</h4>
              </div>
              <div class="lg:flex mb-20px bg-blue-100 py-20px rounded-2xl">
                <div class="tariff-left lg:w-30% mb-20px lg:mb-0">
                  <div class="container-data h-full md:px-32px">
                    <div class="info-item">
                      <p class="info-title">
                        <span class="font-700 text-blue-900">Rate Profile : </span>
                        <span class="ml-18px">{{ tariffData.profile_name }}</span>
                      </p>
                    </div>
                    <div class="info-item">
                      <p class="info-title">
                        <span class="font-700 text-blue-900">Rate Alt Url : </span>
                        <span class="ml-18px">{{ tariffData.tariff_alt_url }}</span>
                      </p>
                    </div>
                  </div>
                </div>
                <div class="tariff-right lg:w-70%">
                  <div class="container-data h-full md:px-32px">
                    <div class="">
                      <p class="info-title font-700 text-blue-900 mb-7px">Rate Alt Text : </p>
                      <p class="info-value">{{ tariffData.tariff_alt_text_str}}</p>
                    </div>
                  </div>
                </div>
              </div>
              <el-table :data="tariff_elements" style="width: 100%; height:300px" stripe 
                :cell-style=msi.tb_cell :header-cell-style=msi.tb_header_cell size="large">
                <el-table-column prop="price_components[0].type" label="Type" min-width="130"/>
                <el-table-column prop="price_components[0].price" label="Price" min-width="80"/>
                <el-table-column prop="price_components[0].vat" label="Vat" min-width="80"/>
                <el-table-column prop="price_components[0].step_size" label="Unit" min-width="120"/>
                <el-table-column prop="restrictions.start_time" label="Start Time" min-width="120"/>
                <el-table-column prop="restrictions.end_time" label="End Time" min-width="120"/>
                <el-table-column prop="restrictions.day_of_week" label="Day Of Week" min-width="300"/>
              </el-table>
            </div>
          </el-col>
        </el-row >
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.evse-detail {
  height: 100%;
  width: 100%;
  .evse-detail-header {
    .location-name {
      font-size: 20px;
    }
    .log {
      width: 220px;
      height: 40px;
      font-size: 18px;
      color:var(--white);
      border-radius: 20px;
    }
    .edit {
      width: 220px;
      height: 40px;
      font-size: 18px;
      color:var(--white);
      border-radius: 20px;
    }
    .delete {
      width: 220px;
      height: 40px;
      font-size: 18px;
      color:var(--white);
      border-radius: 20px;
    }  
    .evse-id{
      font-size: 36px;
    }
    .status {
      font-size: 25px;
    }
  }
  .evse-detail-main {
    width: 100%;
    background-color: #f3f7fa;
    .evse-col{
      @media (min-width: 992px) {
        padding-right: 0 !important;
      }
    }
    .info-title,.info-value{
      text-align: left;
      word-break: break-all;
    }
    .connector-col{
      position: relative;
      @media (min-width: 992px) {
        padding-left: 0 !important;
      }
      &:before {
        @media (min-width: 992px) {
          content: "";
          width: .3rem;
          height: 70%;
          position: absolute;
          top: 15%;
          left: -1.5rem;
          background-color: var(--gray-200);
        }
      }
    }
    .info-item{
      display: flex;
      justify-content: space-between;
      margin-bottom: .8rem;
    }
  }
}
</style>
