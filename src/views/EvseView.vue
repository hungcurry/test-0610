<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { ref, reactive, onMounted} from 'vue'
import { useRouter, useRoute } from 'vue-router'
import ApiFunc from '@/composables/ApiFunc'
import msi from '@/assets/msi_style'
import { ElMessage } from 'element-plus'
import moment from "moment"
import { useMStore } from "../stores/m_cloud"
const MStore = useMStore()

const router = useRouter()
const multipleSelection = ref([])
const swVersion = ref('')
const sw_version_visable = ref (false)
const updataEvseId = []
const activeName = ref('1')
const route = useRoute()
const update_file = ref('')

const updateSW = async() => {
  sw_version_visable.value = true
  let queryData = { "database":"CPO", "collection":"VersionControl", "query": { "type": 'XP012'}}
  let response = await MsiApi.mongoQuery(queryData)
  swVersion.value = response.data.all[0].version
  let release_note = response.data.all[0].release_note.find(obj => obj.version === swVersion.value)
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

const handleSelectionChange = (val) => {
  multipleSelection.value = val
}

const status_filter_item = [
                            { text:'AVAILABLE', value: 'AVAILABLE'}, 
                            { text:'CHARGING', value: 'CHARGING'}, 
                            { text:'UNKNOWN', value: 'UNKNOWN'}, 
                            { text:'ERROR', value: 'ERROR'}, 
                          ]

const evseReset = (type) => {
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

const status_filter = (value, rowData) => {
  return rowData.status === value
}

const detail_info = async(detail) => {
  let queryData = { "database":"OCPI", "collection":"Location", "query": {  "evses" : {"$in": [  {"ObjectId" : detail._id }]}  }}
  let response = await MsiApi.mongoQuery(queryData)
  router.push({ name: 'evseDetail', query: {station_id:response?.data?.all?.[0]?.id, evse_id:detail.uid} })
}


const MsiApi = ApiFunc()
const edit_button_str = ref('Update or Restart')
const editMode = ref(false)
const add_charger = () => {
    router.push({ name: 'evseEdit' })
}

const edit = () => {
  if (editMode.value === false) {
    editMode.value = true
    edit_button_str.value = 'Cancel'
  }
  else {
    editMode.value = false
    edit_button_str.value = 'Update or Restart'
  }
}

const EvseData = reactive([])
const EvseConnectData = reactive([])
const EvseUnConnectData = reactive([])

onMounted( async() => {

  if (route.query.page === 'unpaired') {
    activeName.value = '2'
  }


  let queryData = { "database":"CPO", "collection":"VersionControl", "query": { "type": 'XP012'}}
  let response = await MsiApi.mongoQuery(queryData)
  swVersion.value = response.data.all[0].version
  console.log( swVersion.value)


  queryData = { "database":"OCPI", "collection":"Location", "pipelines": [
  { "$project": {"_id": 0, "evses": 1, "name": 1 }}]}
  response = await MsiApi.mongoAggregate(queryData)
  let  locationData = response.data.result


  queryData = { "database":"OCPI", "collection":"EVSE", "pipelines": [
    { "$project": {"_id": 1, "connectors": 0 }}]
  }
  response = await MsiApi.mongoAggregate(queryData)
  EvseData.length = 0
  Object.assign(EvseData, response.data.result) 
  for (let i = 0 ; i < EvseData.length; i++ ) {
  let localEndTime =  new Date( (new Date(EvseData[i].last_updated).getTime()) + ((MStore.timeZoneOffset ) * -60000))
    EvseData[i].last_updated_str = (moment(localEndTime).format("YYYY-MM-DD HH:mm:ss"))
  }

  for (let i = 0; i < EvseData.length; i++) {
    for (let j = 0; j < locationData.length; j++) {
      for (let k = 0 ; k < locationData[j]?.evses?.length; k++) {
        if (EvseData[i]._id === locationData[j].evses[k]) {
          EvseData[i].locationName = locationData[j].name
          break
        }
      }
      if (EvseData[i].locationName)
        break
    }
  }

  for(let i = 0; i < EvseData.length; i++) {
    if (EvseData[i].locationName === undefined) {
      EvseUnConnectData.push(EvseData[i])
    }
    else {
      EvseConnectData.push(EvseData[i])
    }
  }
  queryData = { "database":"CPO", "collection":"ChargePointInfo", "query": { }}
  response = await MsiApi.mongoQuery(queryData)
  let chargePointInfoData = response.data.all

  queryData = { "database":"CPO", "collection":"HMIControlBoardInfo", "query": { }}
  response = await MsiApi.mongoQuery(queryData)
  let hmiInfoData = response.data.all

  for (let i = 0; i < EvseData.length; i++) {
    for (let j = 0; j < chargePointInfoData.length; j++)
      if (EvseData[i].evse_id === chargePointInfoData[j].evse_id) {
        EvseData[i].hmi = chargePointInfoData[j].hmi
        break
    }
  }
  for (let i = 0 ; i < EvseData.length; i++) {
    if (EvseData[i].hmi !== undefined) {
      for (let j = 0 ; j < hmiInfoData.length; j++)
        if (EvseData[i].hmi === hmiInfoData[j]._id) {
          EvseData[i].hmi_version = hmiInfoData[j].hmi_board_sw_version
          EvseData[i].control_version = hmiInfoData[j].control_board_fw_version
      }
    }
  }
})

</script>

<template>
  <div class="evse">
    <el-button v-if="editMode === false" class="add-charger" @click="add_charger" > Add Charger</el-button>
    <el-button class="edit" @click="edit" > {{edit_button_str}}</el-button>
    <div class="tabs">
    <el-tabs v-model="activeName" >
      <el-tab-pane label="Paired" name="1" >
        <div class="table w-full">
          
        <el-table class="evse-table" :data="EvseConnectData" style="width: 95%; height:800px" stripe
        :cell-style=msi.tb_cell :header-cell-style=msi.tb_header_cell size="large" @selection-change="handleSelectionChange">
          <el-table-column prop="locationName" label="Station" min-width="60"/>
          <el-table-column prop="floor_level" label="Floor Level" min-width="30"/>
          <!-- <el-table-column prop="physical_reference" label="Charger Label" min-width="30"/> -->
          <el-table-column prop="evse_id" label="EVSE ID" min-width="80"/>
          <el-table-column prop="status" label="Status" min-width="50" :filters="status_filter_item" :filter-method="status_filter">
            <template #default="scope">
                <p class="available" v-if="scope.row.status === 'AVAILABLE'"> {{ "●" + scope.row.status }}</p>
                <p class="charging" v-else-if="scope.row.status === 'CHARGING'"> {{ "●" + scope.row.status }}</p>
                <p class="offline" v-else-if="scope.row.status === 'UNKNOWN' "> {{ "●" + scope.row.status }}</p>
                <p class="error" v-else-if="scope.row.status === 'OUTOFORDER'"> {{ "●" + scope.row.status }}</p>
              </template>
          </el-table-column>
          <el-table-column prop="hmi_version" label="SW Ver." min-width="50"/>
          <el-table-column prop="" label="Latest SW" min-width="30">
          <template #default="scope">
            <p v-if="scope.row.hmi_version === swVersion"> {{ "V" }}</p>
          </template>
          </el-table-column>

          <el-table-column prop="last_updated_str" label="Updated Time" min-width="50"/>
          <el-table-column v-if="editMode === false" prop="" label="" min-width="30">
          <template #default="scope">
                <el-button @click="detail_info(scope.row)"> <font-awesome-icon icon="fa-solid fa-ellipsis" /> </el-button>
          </template>
          </el-table-column>
          <el-table-column v-else type="selection" min-width="10">
          </el-table-column>
        </el-table>
      </div>
      </el-tab-pane>
      <el-tab-pane label="Unpaired" name="2">
        <div class="table w-full">
          <el-table class="evse-table" :data="EvseUnConnectData" style="width: 95%; height:800px" stripe 
          :cell-style=msi.tb_cell :header-cell-style=msi.tb_header_cell size="large" @selection-change="handleSelectionChange">
            <el-table-column prop="locationName" label="Station" min-width="80"/>
            <el-table-column prop="floor_level" label="Floor Level" min-width="30"/>
            <!-- <el-table-column prop="physical_reference" label="Charger Label" min-width="30"/> -->
            <el-table-column prop="evse_id" label="EVSE ID" min-width="80"/>
            <el-table-column prop="status" label="Status" min-width="60" :filters="status_filter_item" :filter-method="status_filter">
              <template #default="scope">
                  <p class="available" v-if="scope.row.status === 'AVAILABLE'"> {{ "●" + scope.row.status }}</p>
                  <p class="charging" v-else-if="scope.row.status === 'CHARGING'"> {{ "●" + scope.row.status }}</p>
                  <p class="offline" v-else-if="scope.row.status === 'UNKNOWN' "> {{ "●" + scope.row.status }}</p>
                  <p class="error" v-else-if="scope.row.status === 'OUTOFORDER'"> {{ "●" + scope.row.status }}</p>
                </template>
            </el-table-column>
            <el-table-column prop="hmi_version" label="SW Ver." min-width="50"/>
            <el-table-column prop="" label="Latest SW" min-width="30">
              <template #default="scope">
                <p v-if="scope.row.hmi_version === swVersion"> {{ "V" }}</p>
              </template>
            </el-table-column>
  
            <el-table-column prop="last_updated_str" label="Updated Time" min-width="50"/>
            <el-table-column v-if="editMode === false" prop="" label="" min-width="30">
              <template #default="scope">
                <el-button @click="detail_info(scope.row)"> <font-awesome-icon icon="fa-solid fa-ellipsis" /> </el-button>
              </template>
            </el-table-column>
            <el-table-column v-else type="selection" min-width="10"/>
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>

    <el-button v-if="editMode === true" class="update-button" @click="updateSW"> Update SW </el-button>
    <el-button v-if="editMode === true" class="soft-reset-button" @click="evseReset('soft') "> Soft Reset </el-button>
    <el-button v-if="editMode === true" class="hard-reset-button" @click="evseReset('hard') "> Hard Reset </el-button>
    
    <el-dialog v-model="sw_version_visable" title="Update SW">
      <p>Now Version {{ swVersion }}</p>
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

.evse {
  width: 100%;
  height: 100%;
  position: relative;
  .tabs {
    top: 100px;
    margin-left: 40px;    
    // height: 100%;
    position: relative;
    // .el-tabs{
    //   height: 100%;
    // }
    // .table {
    //   width:100%;
    //   height: 100%;
    //   .el-table {
    //     width:100%;
    //     height: 100%;
    //     .el-tab-pane {
    //       width:100%;
    //       height: 100%;
    //     }
    //   }
    // }
    
  }
  // .el-tabs {
  //   width: calc(100% - 40px - 40px);
  //   height: calc(100% - 120px);
  //   position: relative;
  //   .el-tab-pane{
  //     width: calc(100% - 40px);
  //     height: calc(100% - 120px);
  //   }
  // }


  .add-charger {
    width: 220px;
    height: 40px;
    top: 40px;
    right :30px + 220px + 40px;
    position: absolute;
    font-size: 18px;
    background-color: #000000DF;
    color:#FFFFFF;
    border-radius: 20px;
  }

  .edit {
    width: 220px;
    height: 40px;
    top: 40px;
    right : 40px;
    position: absolute;
    font-size: 18px;
    background-color: #000000DF;
    color:#FFFFFF;
    border-radius: 20px;
  }
  .update-button {
    width: 220px;
    height: 40px;
    top: 40px;
    left : 40px;
    position: absolute;
    font-size: 18px;
    background-color: #000000DF;
    color:#FFFFFF;
    border-radius: 20px;
  }

  .update-fw-button{
    width: 220px;
    height: 40px;
    top: 40px;
    left : 40px + 220px + 30px ;
    position: absolute;
    font-size: 18px;
    background-color: #000000DF;
    color:#FFFFFF;
    border-radius: 20px;
  }

  .soft-reset-button {
    width: 220px;
    height: 40px;
    top: 40px;
    left : 40px + 220px + 220px + 30px + 30px;
    position: absolute;
    font-size: 18px;
    background-color: #000000DF;
    color:#FFFFFF;
    border-radius: 20px;
  }
  .hard-reset-button {
    width: 220px;
    height: 40px;
    top: 40px;
    left : 40px + 220px + 220px + 220px + 30px + 30px + 30px ;
    position: absolute;
    font-size: 18px;
    background-color: #000000DF;
    color:#FFFFFF;
    border-radius: 20px;
  }
  .log {
    width: 220px;
    height: 40px;
    top: 40px;
    left : 40px + 220px + 220px + 220px  + 220px + 30px + 30px + 30px + 30px ;
    position: absolute;
    font-size: 18px;
    background-color: #000000DF;
    color:#FFFFFF;
    border-radius: 20px;
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
}
:deep(.el-tabs__item){
  font-size: 30px !important;
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