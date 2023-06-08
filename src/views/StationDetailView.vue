<template>
  <div class="station-detail">
    <div class="station-info">
      <img class="station-img" v-if="StationData.img_str!==undefined" :src="StationData.img_str" >
      <img class="station-img" v-else src="@/assets/img/null_pic.png">
      <div class="station-message">
        <span class="station-name">{{ StationData.name }}</span>
        <font-awesome-icon class="station-edit-btn" icon="fa-regular fa-pen-to-square" @click="go_to_station_edit_page() "/>
        <br>
        
        <img src="@/assets/img/station_detail_latitude.png" >
        <!-- <font-awesome-icon icon="fa-solid fa-arrow-right"/> -->
        <span> {{ StationData.latitude_str }} {{ "," }} {{ StationData.longitude_str }}</span>
        <br>
        
        <!-- <img src="@/assets/img/station_detail_admin.png" >
        <span>Operator:</span><span>{{ StationData.party_id }}</span>
        <br> -->
        <img src="@/assets/img/station_list_type_office1.png" >
        <span>{{ StationData.country }} {{ StationData.city }}{{ StationData.address }}</span>
        <br>
        <!-- <font-awesome-icon icon="fa-solid fa-arrow-right"/>
        <span>{{ StationData.city }}{{ StationData.address }}</span> -->
      </div>
    </div>
    <div class="evse-list">
      <div class="btn-container">
        <!-- <el-button class="add-charger" @click="addCharger"> Add Charger </el-button> -->

        <el-button v-if="editMode === true" class="edit" @click="updateSW"> Update SW </el-button>
        <!-- <el-button v-if="editMode === true" class="edit" @click="updateFW " disabled> Update FW </el-button> -->
        <el-button v-if="editMode === true" class="edit" @click="evseReset('soft') " disabled> Soft Reset </el-button>
        <el-button v-if="editMode === true" class="edit" @click="evseReset('hard') " disabled> Hard Reset </el-button>

        <el-button class="edit" @click="edit_charger"> {{ edit_button_str }} </el-button>
      </div>
      <div class="list-container">
        <!-- <img src="@/assets/img/station_type_evlist_J1772.png" >
        <span class="type">J1772</span> -->

        <el-table :data="StationDetailEvseData" style="width: 95%; height:95%" stripe :cell-style=msi_style.tb_cell :header-cell-style=msi_style.tb_header_cell size="large">
          <el-table-column v-for = "item in StationDetailEvseTable" :key="item" :prop=item.value :label=item.label  :min-width=item.width :sortable="item.sortable">
            
            <template #default="scope" v-if = "item.type === 'button'">
              <el-button @click="charger_detail(scope.row)"> <font-awesome-icon icon="fa-regular fa-pen-to-square" /> </el-button>
            </template>

            <template #default="scope" v-else-if = "item.label === 'Status'">
              <p class="available" v-if="scope.row.status === 'AVAILABLE'"> {{ "●" + scope.row.status }}</p>
              <p class="charging" v-else-if="scope.row.status === 'CHARGING'"> {{ "●" + scope.row.status }}</p>
              <p class="offline" v-else-if="scope.row.status === 'UNKNOWN' "> {{ "●" + scope.row.status }}</p>
              <p class="error" v-else-if="scope.row.status === 'OUTOFORDER'"> {{ "●" + scope.row.status }}</p>
            </template>
            
          </el-table-column>
      </el-table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ApiFunc from '@/components/ApiFunc'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import  msi_style  from '../assets/msi_style'

const route = useRoute()
const router = useRouter()
const MsiApi = ApiFunc()
const editMode = ref(false)
const station_id = route.query.id

const go_to_station_edit_page = () => {
  router.push({ name: 'stationEdit', query: {id:station_id} })
}

const edit_button_str = ref('Edit')
// const addCharger = (row) => {
//   router.push({ name: 'evseEdit', query: {station_id:station_id, evse_id:row.uid} })
// }

const edit_charger = () => {
  if (editMode.value === true) {
    editMode.value = false
    edit_button_str.value = 'Edit'    
  }
  else {
    editMode.value = true
    edit_button_str.value = 'Cancel'
  }
}

const charger_detail = (row) => {
  router.push({ name: 'evseDetail', query: {station_id:station_id, evse_id:row.uid} })
}

const StationDetailEvseTable = [
  {label:'EVSE ID', value:'evse_id', width:'80'}, 
  {label:'Status', value:'status', width:'80'}, 
  {label:'Floor Level', value:'floor_level', width:'80'}, 
  {label:'Type', value:'type_str', width:'80'}, 
  {label:'Last Used Time', value:'last_updated', width:'80'}, 
  // {label:'Charger Label', value:'physical_reference', width:'80'}, 
  {label:'', value:'detail', width:'20', type:'button'}
]
const StationDetailEvseData = reactive([])
const StationData = reactive([])

onMounted( async () => {
  let jsonData = { "database":"OCPI", "collection":"Location", "query": { "id": { "UUID" : station_id} }}
  let response = await MsiApi.mongoQuery(jsonData)
  StationData.length = 0
  Object.assign(StationData, response.data.all[0])
  StationData.latitude_str = StationData.coordinates.latitude
  StationData.longitude_str = StationData.coordinates.longitude
  StationDetailEvseData.length = 0 
  Object.assign(StationDetailEvseData, StationData.evses)
  for (let i = 0; i < StationData.evses.length; i++) {
    if (StationData.evses[i].connectors[0].standard === 'IEC_62196_T1') 
      StationDetailEvseData[i].type_str = 'Type 1'
    else if (StationData.evses[i].connectors[0].standard === 'IEC_62196_T2')
      StationDetailEvseData[i].type_str = 'Tyep 2'
    else 
    StationDetailEvseData[i].type_str = StationData.evses[i].connectors[0].standard
  }
  StationData.img_str = StationData?.images?.[0]?.url
})

</script>

<style lang="scss">
.station-detail {
  height: 100%;
  .station-info{
    display: flex;
    background-color: #ffffff;
    height: 15%;
    
    .station-img{
      margin: 10px 0 0px 10px;
      width: 110px;
      height: 110px;
    }
    .station-message {
      margin: 10px 0 0px 10px;
      .station-name {
        font-size: 25px;
      }
      .station-edit-btn{
        font-size: 25px;
      }

      img {
        width: 18px;
        height: 18px;
      }
    }
  }
  .evse-list{
    background-color:#f3f7fa;
    height: 85%;
    display: flex;
    flex-direction: column;
    .list-container{
      margin-left: 40px;
      height: 90%;
      .type {
        font-size: 40px;
      }
    }
    .btn-container{
      display: flex;
      justify-content: flex-end;
      margin-right: 40px;
      margin-top: 20px;
      margin-bottom: 20px;
      .add-charger {
        width: 160px;
        height: 30px;
        font-size: 22px;
        border-radius: 20px;
      }
      .edit {
        width: 160px;
        height: 30px;
        font-size: 22px;
        border-radius: 20px;
      }
    }
  }
}


.available{
        color: #76bbf4;
}
.charging{
  color: #94eadb;
}
.offline{
  color: #bcbcbc;
}
.error{
  color: #ef8879;
}
</style>