<script setup>
import { ref, reactive, onMounted} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ApiFunc from '@/composables/ApiFunc'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import  msi_style  from '../assets/msi_style'
import { ElMessage } from 'element-plus'
import moment from "moment"
import { useMStore } from "../stores/m_cloud"
const MStore = useMStore()

const route = useRoute()
const router = useRouter()
const MsiApi = ApiFunc()
const editMode = ref(false)
const station_id = route.query.id
const updataEvseId = []
const sw_version_visable = ref (false)
const multipleSelection = ref([])
const fwVersion = ref('')
const update_file = ref('')

const updateConfirm = async () => {
  let sendData = { "evse_ids": updataEvseId, "location": update_file.value, "retrieveDate": "2022-10-27 12:12:12"}
  if (update_file.value === '')
    ElMessage.error('File not found')
  const response = await MsiApi.updateFw(sendData)
  if (response.status === 200) {
    sw_version_visable.value = false
    console.log(response)
  }
  else {
    console.log(response)
  }
}

const updateSW = async() => {
  sw_version_visable.value = true
  let queryData = { "database":"CPO", "collection":"VersionControl", "query": { "type": 'XP012'}}
  let response = await MsiApi.mongoQuery(queryData)
  fwVersion.value = response.data.all[0].version
  let release_note = response.data.all[0].release_note.find(obj => obj.version === fwVersion.value)
  if (release_note) {
    update_file.value = release_note.file
  }
  updataEvseId.length = 0
  for (let i = 0; i < multipleSelection.value.length; i++) {
    updataEvseId.push(multipleSelection.value[i].evse_id)
  }
  if (updataEvseId.length === 0) {
    return
  }
}

const go_to_station_edit_page = () => {
  router.push({ name: 'stationEdit', query: {id:station_id} })
}

const handleSelectionChange = (val) => {
  multipleSelection.value = val
}

const edit_button_str = ref('Update or Restart')
// const addCharger = (row) => {
//   router.push({ name: 'evseEdit', query: {station_id:station_id, evse_id:row.uid} })
// }

const evseReset = (type) => {
  console.log(updataEvseId)
  updataEvseId.length = 0
  for (let i = 0; i < multipleSelection.value.length; i++) {
    updataEvseId.push(multipleSelection.value[i].evse_id)
  }
  if (updataEvseId.length === 0) {
    return
  }

  if (confirm(' 我要 ' + type + ' Reset 了 ') === true) {
    const json = JSON.stringify({ evse_id: updataEvseId, reset_type: type })
    MsiApi.reset_evse(json)
      .then(() => {
        alert(type + ' Reset success ')
      })
      .catch((error) => {
        alert(type + ' Reset fail ')
        console.log(error)
      })
  }
}


const edit_charger = () => {
  if (editMode.value === true) {
    editMode.value = false
    edit_button_str.value = 'Update or Restart'    
  }
  else {
    editMode.value = true
    edit_button_str.value = 'Cancel'
  }
}

const charger_detail = (row) => {
  router.push({ name: 'evseDetail', query: {station_id:station_id, evse_id:row.uid} })
}

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
    let localEndTime =  new Date( (new Date(StationData.evses[i].last_updated).getTime()) + ((MStore.timeZoneOffset ) * -60000))
    StationDetailEvseData[i].last_updated_str = (moment(localEndTime).format("YYYY-MM-DD HH:mm:ss"))
  }
  StationData.img_str = StationData?.images?.[0]?.url
})

</script>

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
        <el-button v-if="editMode === true" class="edit" @click="evseReset('soft') " > Soft Reset </el-button>
        <el-button v-if="editMode === true" class="edit" @click="evseReset('hard') " > Hard Reset </el-button>

        <el-button class="edit" @click="edit_charger"> {{ edit_button_str }} </el-button>
      </div>
      <div class="list-container">
        <el-table :data="StationDetailEvseData" style="width: 95%; height:95%" stripe :cell-style=msi_style.tb_cell :header-cell-style=msi_style.tb_header_cell size="large"
        @selection-change="handleSelectionChange">
          <el-table-column prop="evse_id" label="EVSE ID" min-width="50"/>
          <el-table-column prop="floor_level" label="Floor Level" min-width="30"/>
          <el-table-column prop="status" label="Status" min-width="60" >
            <template #default="scope">
                <p class="available" v-if="scope.row.status === 'AVAILABLE'"> {{ "●" + scope.row.status }}</p>
                <p class="charging" v-else-if="scope.row.status === 'CHARGING'"> {{ "●" + scope.row.status }}</p>
                <p class="offline" v-else-if="scope.row.status === 'UNKNOWN' "> {{ "●" + scope.row.status }}</p>
                <p class="error" v-else-if="scope.row.status === 'OUTOFORDER'"> {{ "●" + scope.row.status }}</p>
              </template>
          </el-table-column>
          <el-table-column prop="type_str" label="Type" min-width="30"/>
          <el-table-column prop="hmi_version" label="SW Ver." min-width="50"/>
          <el-table-column prop="" label="Latest SW" min-width="40">
          <template #default="scope">
            <p v-if="scope.row.hmi_version === `b'0.1.2.3'`"> {{ "V" }}</p>
          </template>
          </el-table-column>

          <el-table-column prop="last_updated_str" label="Updated Time" min-width="70" sortable/>
          <el-table-column v-if="editMode === false" prop="" label="" min-width="30">
          <template #default="scope">
                <el-button @click="charger_detail(scope.row)"> <font-awesome-icon icon="fa-solid fa-ellipsis" /> </el-button>
          </template>
          </el-table-column>
          <el-table-column v-else type="selection" min-width="30">
          </el-table-column>

        </el-table>
      </div>
    </div>
    <el-dialog v-model="sw_version_visable" title="Update SW">
      <p>Now Version {{ fwVersion }}</p>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="sw_version_visable = false">Cancel</el-button>
          <el-button type="primary" @click="updateConfirm()">Confirm</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
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
        width: 220px;
        height: 40px;
        font-size: 18px;
        border-radius: 20px;
        background-color: #000000DF;
        color:#FFFFFF;
      }
    }
  }
}
.el-checkbox {
    // width: 20px;
    // height: 20px;
    .el-checkbox__input.is-checked{
      .el-checkbox__inner{
      background-color:#000000;
    }
    }
    .el-checkbox__input {
      // width: 20px;
      // height: 20px;
    .el-checkbox__inner{
      width: 20px;
      height: 20px;
      border-color: #000000;
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