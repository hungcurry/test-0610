<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ApiFunc from '@/composables/ApiFunc'
import {  ElMessageBox, ElMessage } from 'element-plus'
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
const evse_edit_title = ref('Add Charger')

const connector_obj = reactive({  class:'Connector',standard:'-', format:'-', power_type:'-', 
                                  max_voltage:'0', max_amperage:'0', max_electric_power:'0', tariff_ids:[]})
const evse_obj = reactive({  class:'EVSE', evse_id:'', status:'UNKNOWN', connectors:[]})
const router = useRouter()
const selectTariffObj = {}

const selectTariff = (select_id) =>{
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
    if(select_profile.value !== '')
    connector_obj.tariff_ids.push(select_profile.value)
    connector_obj.id = uuidv4()
    MsiFunc.deleteEmptyKeys(connector_obj)
    MsiFunc.deleteEmptyKeys(evse_obj)
    if (evse_obj.evse_id === undefined ) {
      check_format_success = false
      ElMessage.error('Oops, EVSE ID required.')
    }
    if (connector_obj.tariff_ids[0] === undefined) {
      check_format_success = false
      ElMessage.error('Oops, Rate Profile required.')
    }

    if (check_format_success === true) {
      ElMessageBox.confirm('Do you want to create?','Warning', {confirmButtonText: 'OK', cancelButtonText: 'Cancel', type: 'warning'})
      .then(async () => {
        let response = await MsiApi.setCollectionData('post', 'ocpi', connector_obj)
        if ( response.status !== 201) {
          ElMessage.error(response.data.message)
          return
        }
        let queryData = { "database":"OCPI", "collection":"Connector", "query": { "id":{ "UUID":connector_obj.id} }}
        response = await MsiApi.mongoQuery(queryData)
        evse_obj.connectors.push(response.data.all[0]._id)
        evse_obj.uid = uuidv4()
        
        response = await MsiApi.setCollectionData('post', 'ocpi', evse_obj)
        if ( response.status !== 201) {
          ElMessage.error(response.data.message)
          return
        }
        queryData = { "database":"OCPI", "collection":"EVSE", "query": { "uid":{ "UUID": evse_obj.uid} }}
        response = await MsiApi.mongoQuery(queryData)
        station_evses.push(response.data.all[0]._id)
        if (response.status === 200) {
          router.push({ name: 'evse', query:{page:'unpaired'}})
        }
      })
      .catch((e)=>{
        console.log(e)
      })
    }
  }
  else {
    connector_obj.tariff_ids[0] = (select_profile.value)
    evse_obj.id = evse_obj.uid

    ElMessageBox.confirm('Do you want to modify?','Warning', {confirmButtonText: 'OK', cancelButtonText: 'Cancel', type: 'warning'})
      .then(async () => {
        await MsiApi.setCollectionData('patch', 'ocpi', connector_obj)
        let res = await MsiApi.setCollectionData('patch', 'ocpi', evse_obj)
        ElMessage(res.data.message)
        router.back(-1)
      })
      .catch((e)=>{
        console.log(e)
      })
  }
}

onMounted( async()=>{
  let queryData, response = undefined
  let connectors = []
  let tariff_ids = []
  queryData = { "database":"OCPI", "collection":"Tariff", "query": {}}
  response = await MsiApi.mongoQuery(queryData)
  Object.assign(tariff_profile, response.data.all)
  if (evse_id !== undefined) {
    evse_edit_title.value = 'Edit Charger'

    queryData = { "database":"OCPI", "collection":"EVSE", "query": { "uid": {"UUID":evse_id} }}
    response = await MsiApi.mongoQuery(queryData)
    Object.assign(evse_obj, response.data.all[0])
    for(let i = 0; i < evse_obj?.connectors?.length; i++) {
      connectors.push(evse_obj?.connectors[i]._id)
    }
    evse_obj.connectors = connectors
    queryData = { "database":"OCPI", "collection":"Connector", "query": { "_id": {"ObjectId": evse_obj.connectors[0]} }}
    response = await MsiApi.mongoQuery(queryData)
    Object.assign(connector_obj, response.data.all[0])
    select_profile.value = connector_obj.tariff_ids[0]

    for (let i = 0; i < tariff_profile.length; i++) {
      if (select_profile.value === tariff_profile[i].id)
      Object.assign(selectTariffObj, tariff_profile[i])
    }

    for(let i = 0; i < connector_obj?.tariff_ids?.length; i++) {
      tariff_ids.push(connector_obj?.tariff_ids[i])
    }
    connector_obj.tariff_ids = tariff_ids
  }
  queryData = { "database":"OCPI", "collection":"Location", "query": { "id": {"UUID":station_id} }}
  response = await MsiApi.mongoQuery(queryData)
  for(let i = 0; i < response.data.all[0]?.evses?.length; i++) {
    station_evses.push(response.data.all[0]?.evses[i]._id)
  }
  stationName.value = response.data.all[0]?.name
})
</script>

<template>
  <div class="evse-edit">
    <p>{{evse_edit_title}}</p>
    <div class="evse-edit-main">
      <div class="evse-edit-left">

        <div class="evse-edit-left-up">
          <p class="title">Station</p>
          <p>Name</p>
          <el-input class="station-input" v-model="stationName" disabled></el-input>
          <p>EVSE ID</p>
          <el-input v-model="evse_obj.evse_id"></el-input>

          <p>Floor Level</p>
          <el-input v-model="evse_obj.floor_level"></el-input>
          <!-- <p>Charger Label</p>
          <el-input v-model="evse_obj.physical_reference"></el-input> -->
          <!-- <p>Note</p>
          <el-input v-model="evse_obj.directions" disabled></el-input> -->
          
        </div>
        <div class="evse-edit-left-down">
          <p class="title">Connector Info</p> 
          <div class="connector-item">
            <p class="connector-title">Type</p>
            <p class="connector-value"> {{ connector_obj.standard }}</p>
          </div>  
          <!-- <div class="connector-item">
            <p class="connector-title">Connector ID</p>
            <p class="connector-value"> {{ connector_obj.id }}</p>
          </div>   -->
          <!-- <div class="connector-item">
            <p class="connector-title">Format</p>
            <p class="connector-value"> {{ connector_obj.format }}</p>
          </div>   -->
          <!-- <div class="connector-item">
            <p class="connector-title">Power Type</p>
            <p class="connector-value"> {{ connector_obj.power_type }}</p>
          </div>   -->
          <div class="connector-item">
            <p class="connector-title">Max Voltage</p>
            <p class="connector-value"> {{ connector_obj.max_voltage + 'V'}} </p>
          </div>  
          <div class="connector-item">
            <p class="connector-title">Max Amperage</p>
            
            <p class="connector-value"> {{ connector_obj.max_amperage + 'A' }}</p>

            <!-- <el-input v-model="connector_obj.max_amperage"></el-input>  -->
            <!-- <span> A </span> -->
            
          </div>  
          <div class="connector-item">
            <p class="connector-title">Max Electric Power</p>
            <p class="connector-value"> {{ connector_obj.max_electric_power + 'W' }}</p>
          </div>  

        </div>  
      </div>
      <div class="evse-edit-right">
        <div class="tariff-item">
          <p class="tariff-title">Rate Profile</p>
          <el-select class="el-select" v-model="select_profile" placeholder="Select" size="large" @change="selectTariff">
            <el-option v-for="item in tariff_profile" :key="item.value" :label="item.profile_name" :value="item.id" />
          </el-select>
        </div>

        <!-- <div class="tariff-item">
          <p class="tariff-title">Type</p>
          <p class="tariff-value">AD_HOC_PAYMENT</p>
        </div> -->
        <div class="tariff-item">
          <p class="tariff-title">Currency</p>
          <p class="tariff-value">{{selectTariffObj.currency}}</p>
        </div>        
        <!-- <div class="tariff-item">
          <p class="tariff-title">Rate alt url</p>
          <p class="tariff-value">NONE</p>
        </div> -->
        <div class="tariff-item">
          <p class="tariff-title">Rate alt text</p>
          <p class="tariff-value"></p>
        </div>


        <el-table :data="selectTariffObj.elements" style="width: 95%; height:500px" stripe 
        :cell-style=msi.tb_cell :header-cell-style=msi.tb_header_cell size="large">
          <el-table-column prop="price_components[0].type" label="Type" min-width="50"/>
          <el-table-column prop="price_components[0].price" label="Price" min-width="50"/>
          <el-table-column prop="price_components[0].vat" label="Vat" min-width="50"/>
          <el-table-column prop="price_components[0].step_size" label="Step Size" min-width="50"/>
          <el-table-column prop="restrictions.start_time" label="Start Time" min-width="50"/>
          <el-table-column prop="restrictions.end_time" label="End Time" min-width="50"/>
          <el-table-column prop="restrictions.day_of_week" label="Day Of Week" min-width="50"/>
        </el-table>

      </div>
    </div>

    <div class="down">
      <el-button class="button" @click="CancelEvseEdit"> Cancel </el-button>
      <el-button class="button" @click="SaveEvseEdit"> Save </el-button>
    </div>

  </div>

</template>

<style lang="scss" scoped>
.evse-edit{
  width:100%;
  height: 100%;
  p{
    padding: 0px;
    margin: 0px;
    font-size: 36px;
  }
  .evse-edit-main{
    display: flex;
    flex-direction: row;
    gap: 30px;
    width: 95%;
    height: 80%;
    margin: 20px ;
    .evse-edit-left{
      display: flex;
      flex-direction: column;
      gap: 30px;
      width: 30%;
      height: 80%;
      
      .evse-edit-left-up{
        width: 80%;
        height: 50%;
        background-color: #f3f7fa;
        .title {
          font-size: 30px;
          margin: 10px 10px 10px 10px;
        }
        p {
          font-size: 20px;
        }
      }
      .evse-edit-left-down{
        width: 80%;
        height: 50%;
        background-color: #f3f7fa;
        .title{
          font-size: 30px;
          margin: 10px 10px 10px 10px;
        }
        .connector-item{
          display: flex;
          flex-direction: row;
          margin-bottom: 10px;
          p{
            margin: 0;
            padding: 0;
            font-size: 18px;
          }
          .connector-title{
            width: 350px;
            color: #566575;
          }
          .connector-value{
            width: 400px;
          }
        }
      }
    }
    .evse-edit-right{
      width:65%;
      height: 90%;
      background-color: #f3f7fa;
      padding: 10px 10px 10px 10px;
      .tariff-item{
        display: flex;
        flex-direction: row;
        margin-bottom: 10px;
        p{
          margin: 0;
          padding: 0;
          font-size: 18px;
        }
        .tariff-title{
          width: 200px;
          color: #566575;
        }
        .tariff-value{
          width: 400px;
        }
      }
    }
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
      color:#FFFFFF;
      border-radius: 20px;
    }
  }
}
</style>