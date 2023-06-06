<template>
  <div class="evse-detail">
    <div class="evse-detail-header">
      <p class="location-name">{{ locationData.name }}</p>
      <p class="location-addr">{{ locationData.country + ' ' + locationData.city + locationData.address }}</p>
      <el-button class="delete" @click="deleteEvse"> Delete </el-button>
      <el-button class="edit" @click="edit"> Edit </el-button>
      <el-button class="log" @click="log" disabled> Log </el-button>
      <div class="evse-detail-header-container">
        <p class="evse-id" > {{evseData.evse_id}}</p>
        <p class="status available" v-if="evseData.status === 'AVAILABLE'"> {{ "●" + evseData.status }}</p>
        <p class="status charging" v-else-if="evseData.status === 'CHARGING'"> {{ "●" + evseData.status }}</p>
        <p class="status offline" v-else-if="evseData.status === 'UNKNOWN'"> {{ "●" + evseData.status }}</p>
        <p class="status error" v-else-if="evseData.status === 'ERROR' || evseData.status === 'OUTOFORDER'"> {{ "●" + evseData.status }}</p>
      </div>
    </div>

    <div class="evse-detail-main">
      <div class="evse-connector-hmi-container">
        <div class="evse-connector-container">
          <div class="evse">
            <font-awesome-icon class="header-icon" icon="fa-regular fa-clock" />
            <span> EVSE Info</span>
            <br><br>
            <div class="evse-info-item">
              <p class="evse-info-title">Charger ID</p>
              <p class="evse-info-value">{{ evseData.uid }}</p>
            </div>
            <div class="evse-info-item">
              <p class="evse-info-title">EVSE ID</p>
              <p class="evse-info-value">{{evseData.evse_id}}</p>
            </div>
            <div class="evse-info-item">
              <p class="evse-info-title">Floor Level</p>
              <p class="evse-info-value">{{evseData.floor_level}}</p>
            </div>
            <!-- <div class="evse-info-item">
              <p class="evse-info-title">Charger Label</p>
              <p class="evse-info-value">{{evseData.physical_reference}}</p>
            </div> -->
            <div class="evse-info-item">
              <p class="evse-info-title">Note / Description</p>
              <p class="evse-info-value">{{evseData.description}} </p>
            </div>            
            <div class="evse-info-item">
              <p class="evse-info-title">Last Updated</p>
              <p class="evse-info-value">{{evseData.last_updated}}</p>
            </div>
          </div >
          <div class="v-line">
          </div>
          <div class="connector">
            <font-awesome-icon class="header-icon" icon="fa-regular fa-clock" />
            <span> Connector Info</span>
            <br>
            <br>
            <div class="connector-item">
              <p class="connector-title">Connector ID</p>
              <p class="connector-value">{{ connectorData.id }} </p>
            </div>   
            <div class="connector-item">
              <p class="connector-title">Type</p>
              <p class="connector-value">{{ connectorData.standard }} </p>
            </div>   
            <!-- <div class="connector-item">
              <p class="connector-title">Format</p>
              <p class="connector-value">{{ connectorData.format }}</p>
            </div>    -->
            <!-- <div class="connector-item">
              <p class="connector-title">Power Type</p>
              <p class="connector-value">{{connectorData.power_type}} </p>
            </div>    -->
            <div class="connector-item">
              <p class="connector-title">Max Voltage / Amperage</p>
              <p class="connector-value">{{connectorData.max_voltage + ' V '+ ' / ' + connectorData.max_amperage + ' A '}}</p>
            </div>   
            <div class="connector-item">
              <p class="connector-title">Max Electric Power</p>
              <p class="connector-value">{{connectorData.max_electric_power}} </p>
            </div>   
            <div class="connector-item">
              <p class="connector-title">Last Updated</p>
              <p class="connector-value">{{ connectorData.last_updated }} </p>
            </div>   
          </div>
        </div>

        <div class="hmi-container">
          <div class="hmi-container-data">
            <font-awesome-icon class="header-icon" icon="fa-regular fa-clock" />
            <span> HMI Info</span>
            <br><br>
            <div class="hmi-item">
              <p class="hmi-title">Control Board Model</p>
              <p class="hmi-value">{{ hmiInfoData.control_board_model_name }} </p>
            </div>   
            <div class="hmi-item">
              <p class="hmi-title">Control Board SN</p>
              <p class="hmi-value">{{ hmiInfoData.control_board_sn }} </p>
            </div>   
            <div class="hmi-item">
              <p class="hmi-title">Control Board FW Version</p>
              <p class="hmi-value">{{ hmiInfoData.control_board_fw_version }} </p>
            </div>   
            <div class="hmi-item">
              <p class="hmi-title">HMI Board Model</p>
              <p class="hmi-value">{{ hmiInfoData.hmi_board_model_name }} </p>
            </div>   
            <div class="hmi-item">
              <p class="hmi-title">HMI Board SN</p>
              <p class="hmi-value">{{ hmiInfoData.hmi_board_sn }} </p>
            </div>   
            <div class="hmi-item">
              <p class="hmi-title">HMI Board SW Version</p>
              <p class="hmi-value">{{ hmiInfoData.hmi_board_sw_version }} </p>
            </div>   
            <div class="hmi-item">
              <p class="hmi-title">Created Date</p>
              <p class="hmi-value">{{ hmiInfoData.created_date }} </p>
            </div>  
            <div class="hmi-item">
              <p class="hmi-title">Last Updated</p>
              <p class="hmi-value">{{ hmiInfoData.updated_date }} </p>
            </div>  
          </div> 
        </div>
      </div>
      <div class="tariff-container">
        <p class="tariff-title">Rate</p> 
        <div class="tariff-container-header">
          <div class="tariff-container-header-left">
            <div class="tariff-itme">
              <p class="tariff-title">Rate Profile</p>
              <p class="tariff-value">{{ tariffData.profile_name }}</p>
            </div>

            <!-- <div class="tariff-itme">
              <p class="tariff-title">Type</p>
              <p class="tariff-value">{{ tariffData.type }}</p>
            </div> -->

            <!-- <div class="tariff-itme">
              <p class="tariff-title">Rate alt url</p>
              <p class="tariff-value">{{ tariffData.tariff_alt_url }}</p>
            </div> -->
          </div>
          <div class="tariff-container-header-right">
            <div class="tariff-itme">
              <p class="tariff-title">Rate alt text</p>
              <p class="tariff-value1">{{ tariffData.tariff_alt_text_str}}</p>
            </div>
          </div>
        </div>

        <el-table :data="tariff_elements" style="width: 95%; height:400px" stripe ref="checkTable"
					:cell-style=msi.tb_cell :header-cell-style=msi.tb_header_cell size="large">
          <el-table-column prop="price_components[0].type" label="type" min-width="50"/>
          <el-table-column prop="price_components[0].price" label="price" min-width="50"/>
          <el-table-column prop="price_components[0].vat" label="vat" min-width="50"/>
          <el-table-column prop="price_components[0].step_size" label="step_size" min-width="50"/>
          <el-table-column prop="restrictions.start_time" label="start_time" min-width="50"/>
          <el-table-column prop="restrictions.end_time" label="end_time" min-width="50"/>
          <el-table-column prop="restrictions.day_of_week" label="day_of_week" min-width="50"/>
        </el-table>
      </div>
    </div>
  </div>
</template>
  
<script setup>
import { reactive, onMounted} from 'vue'
import { useRoute, useRouter} from 'vue-router'
import ApiFunc from '@/components/ApiFunc'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import {  ElMessageBox } from 'element-plus'
import msi from '@/assets/msi_style'
const log = () => {

}

const deleteEvse = () => {
  ElMessageBox.confirm('確定要刪除?','Warning', {confirmButtonText: 'OK', cancelButtonText: 'Cancel', type: 'warning'})
  .then(async () => {
    let sendData = { 'class' : 'EVSE', 'id' : evseId }
    console.log(await MsiApi.setCollectionData('delete', 'ocpi', sendData))

    sendData = { 'class' : 'Connector', 'id' : connectorData.id }
    console.log(await MsiApi.setCollectionData('delete', 'ocpi', sendData))

    if(chargePointInfoData.hmi !== '') { 
      sendData = { 'class' : 'HMIControlBoardInfo', '_id' : chargePointInfoData.hmi }
      console.log(await MsiApi.setCollectionData('delete', 'ocpi', sendData))
    }
    let evseArr = []
    console.log(locationData)
    for (let i = 0; i < locationData?.evses?.length; i++) {
      if (locationData.evses[i].uid === evseId) {
        continue
      }
      console.log(locationData.evses[i])
      evseArr.push(locationData.evses[i]._id)
    }
    let sendData1 = { 'class' : 'Location', 'id': locationData.id, 'evses' : evseArr}
    console.log(await MsiApi.setCollectionData('patch', 'ocpi', sendData1))


    router.push({ name: 'stationDetail', query: {id:locationData.id} })
  })
}

const edit = () => {
  console.log(locationData)
  router.push({ name: 'evseEdit', query: {station_id:locationData.id, evse_id:evseId} })
}


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

onMounted( async () => {
  
  let queryData = { "database":"OCPI", "collection":"EVSE", "query": { "uid": {"UUID":evseId}}}
  let response = await MsiApi.mongoQuery(queryData)
  Object.assign(evseData, response.data.all[0]) 
  console.log(response)
  
  queryData = { "database":"OCPI", "collection":"Connector", "query": { "_id": { "ObjectId" : evseData?.connectors?.[0]?._id}}}
  response = await MsiApi.mongoQuery(queryData)
  console.log(response)
  Object.assign(connectorData, response.data.all[0]) 
  console.log(evseData)
  queryData = { "database":"CPO", "collection":"ChargePointInfo", "query": { "evse": { "ObjectId" : evseData?._id}}}
  response = await MsiApi.mongoQuery(queryData)
  console.log(response)
  Object.assign(chargePointInfoData, response.data.all[0])
  console.log(chargePointInfoData?.hmi)
  if(chargePointInfoData.hmi !== '') {
    queryData = { "database":"CPO", "collection":"HMIControlBoardInfo", "query": { "_id": { "ObjectId" : chargePointInfoData?.hmi}}}
    
    response = await MsiApi.mongoQuery(queryData)
    console.log(response)
    Object.assign(hmiInfoData, response.data.all[0])
  }
  queryData = { "database":"OCPI", "collection":"Location", "query": {  "evses" : {"$in": [  {"ObjectId" : evseData?._id }]}  }}
  response = await MsiApi.mongoQuery(queryData)
  console.log(response)
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
  else
    Object.assign(locationData, response.data.all[0])
  console.log(response)
  console.log(connectorData)
  queryData = { "database":"OCPI", "collection":"Tariff", "query": { "id": { "UUID" : connectorData.tariff_ids[0]}}}
  response = await MsiApi.mongoQuery(queryData)
  console.log(response)

  Object.assign(tariffData, response.data.all[0])
  console.log(tariffData)
  tariffData.tariff_alt_text_str = tariffData.tariff_alt_text[0].text
  
  Object.assign(tariff_elements, tariffData.elements )
})

</script>
  
<style lang="scss" scoped>

.evse-detail {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
  .evse-detail-header {
    height: 150px;
    width: 100%;
    background-color: #ffffff;

.location-name {
    top: 60px;
    right : 40px;
    position: absolute;
    font-size: 20px;
}
.location-addr {
    top: 100px;
    right : 40px;
    position: absolute;
}

  .log {
    width: 220px;
    height: 40px;
    top: 150px;
    right : 40px;
    position: absolute;
    font-size: 18px;
    background-color: #000000DF;
    color:#FFFFFF;
    border-radius: 20px;
  }
  .edit {
    width: 220px;
    height: 40px;
    top: 150px;
    right : 40px + 220px + 30px;
    position: absolute;
    font-size: 18px;
    background-color: #000000DF;
    color:#FFFFFF;
    border-radius: 20px;
  }
  .delete {
    width: 220px;
    height: 40px;
    top: 150px;
    right : 40px + 220px + 30px + 220px + 30px;
    position: absolute;
    font-size: 18px;
    background-color: #000000DF;
    color:#FFFFFF;
    border-radius: 20px;
  }  
    .evse-detail-header-container{
      margin: 0px
    }

    .evse-id{
      padding: 20px 0 0 20px;
      margin: 0 0 0 0px;
      font-size: 40px;
    }
    .status {
      padding: 20px 0 0 20px;
      margin: 0;
      font-size: 25px;
    }
  }

  .evse-detail-main {
    height: calc(100% - 150px);
    width: 100%;
    background-color: #f3f7fa;
    
    .evse-connector-hmi-container{
      height: 260px;
      width: 100%;
      display: flex;
      flex-direction: row;
      
      .evse-connector-container{
        width: 65%;
        height: 100%;
        background-color: #ffffff;
        margin: 30px 20px 30px 30px;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        .evse {
          padding: 20px 0px 0px 20px;
          width: 45%;
          span{
           font-size: 20px; 
          }
          .evse-info-item{
            display: flex;
            flex-direction: row;
            margin-bottom: 7px;
            p{
              margin: 0;
              padding: 0;
            }
            .evse-info-title{
              width: 300px;
              color: #566575;
            }
            .evse-info-value{
              width: 200px;
            }
          }
        }
        .connector {
          padding: 20px 0px 0px 0px;
          width: 45%;
          .connector-item{
            display: flex;
            flex-direction: row;
            margin-bottom: 7px;
            p{
              margin: 0;
              padding: 0;
            }
            .connector-title{
              width: 300px;
              color: #566575;
            }
            .connector-value{
              width: 200px;
            }
          }
          span{
           font-size: 20px; 
          }
          // background-color: #005500;
        }
        .v-line{
          margin-top: 20px;
          border-left: thick solid rgb(226, 234, 242);
          height:90%;
        }
      }
      .hmi-container{
        width: 30%;
        height: 100%;
        background-color: #ffffff;
        margin: 30px 0px 30px 20px;
        .hmi-container-data {
          padding: 20px 0px 0px 20px;
          .hmi-item{
            display: flex;
            flex-direction: row;
            margin-bottom: 7px;
            p{
              margin: 0;
              padding: 0;
            }
            .hmi-title{
              width: 300px;
              color: #566575;
            }
            .hmi-value{
              width: 200px;
            }
          }
        }
        
      }
    }
    .tariff-container{
      height: 550px;
      width: calc(100% - 60px);
      margin: 50px 30px 30px 30px;
      background-color: #ffffff;

      .tariff-container-header{display: flex;
      flex-direction: row;}
      

      .tariff-itme{
        display: flex;
        flex-direction: row;
        margin-bottom: 7px;
        p{
          margin: 0;
          padding: 0;
        }
        .tariff-title{
          width: 300px;
          color: #566575;
        }
        .tariff-value{
          width: 200px;
        }
        .tariff-value1{
          width: 800px;
        }
      }
    }
  }
}
</style>



.hmi-item{
  display: flex;
  flex-direction: row;
  margin-bottom: 7px;
  p{
    margin: 0;
    padding: 0;
  }
  .hmi-title{
    width: 300px;
    color: #566575;
  }
  .hmi-value{
    width: 200px;
  }
}