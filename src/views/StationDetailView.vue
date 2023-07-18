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

  let queryData1 = { "database": "OCPI", "collection": "Location", "pipelines": [
  { "$match": {"id": {"UUID" : station_id }}},
  { "$project": { "_id": 0} }]}
  let response1 = await MsiApi.mongoAggregate(queryData1)
  let evse_obj_arr = []
  for (let i = 0; i < response1.data.result[0]?.evses?.length; i++) {
    evse_obj_arr.push({"ObjectId":response1.data.result[0]?.evses?.[i]})
  }

  let queryData3 = { "database": "CPO", "collection": "ChargePointInfo", "pipelines": [
    { "$match": {'evse': {"$in": evse_obj_arr}}},
    { "$project": { "_id": 0} }
  ]}
  let response3 = await MsiApi.mongoAggregate(queryData3)

  let hmi_obj_arr = []
  for (let i = 0; i < response3.data.result.length; i++) {
    if (response3.data.result[i].hmi != 0)
    hmi_obj_arr.push({"ObjectId":response3.data.result[i].hmi})
  }
  queryData3 = { "database": "CPO", "collection": "HMIControlBoardInfo", "pipelines": [
    { "$match": {'_id': {"$in": hmi_obj_arr}   }},
    { "$project": { "_id": 0} }
  ]}
  response3 = await MsiApi.mongoAggregate(queryData3)
  console.log(response3)
  console.log(response3.data.result[0].hmi_board_sw_version)

  let queryData2 = { "database": "OCPI", "collection": "Location", "pipelines": [
  { "$match": {'id': {"UUID":station_id}}},
  { "$project": { "_id": 0, "country_code":0, "directions":0, "id":0, "last_updated":0} }]}

  let response2 = await MsiApi.mongoAggregate(queryData2)
  console.log(response2)

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
    <div class="container lg pb-40px">
      <div class="pt-40px pb-20px overflow-x-auto flex">
        <img class="w-110px h-110px ml-10px mr-20px" v-if="StationData.img_str!==undefined" :src="StationData.img_str" >
        <img class="w-110px h-110px ml-10px mr-20px" v-else src="@/assets/img/null_pic.png">
        <div class="flex-col white-space-nowrap">
          <div class="flex">
            <span class="station-name mr-20px">{{ StationData.name }}</span>
            <font-awesome-icon class="station-edit-btn w-32px h-32px" icon="fa-regular fa-pen-to-square" @click="go_to_station_edit_page() "/>
          </div>
          <div class="flex mt-16px">
            <img class="w-20px h-20px mr-10px" src="@/assets/img/station_detail_latitude.png">
            <span class="line-height-20px"> {{ StationData.latitude_str }} {{ "," }} {{ StationData.longitude_str }}</span>
          </div>
          <div class="flex mt-12px">
            <img class="w-20px h-20px mr-10px" src="@/assets/img/station_list_type_office1.png">
            <span class="line-height-20px">{{ StationData.country }} {{ StationData.city }}{{ StationData.address }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="pl-50px pr-50px pb-40px bg-blue-100 flex-col">
      <div class="flex md:justify-end pt-24px pb-24px overflow-x-auto">
        <el-button v-if="editMode === true" class="btn update-button px-30px box-shadow" @click="updateSW"> Update SW </el-button>
        <!-- <el-button v-if="editMode === true" class="btn update-button px-30px box-shadow" @click="updateFW " disabled> Update FW </el-button> -->
        <el-button v-if="editMode === true" class="btn soft-reset-button px-30px box-shadow" @click="evseReset('soft')"> Soft Reset </el-button>
        <el-button v-if="editMode === true" class="btn hard-reset-button px-30px box-shadow" @click="evseReset('hard')"> Hard Reset </el-button>
        <el-button class="btn px-30px box-shadow" @click="edit_charger" > {{ edit_button_str }}</el-button>
      </div>

      <el-table 
        :data="StationDetailEvseData" 
        class="white-space-nowrap text-primary rounded-10px"
        height="calc(100vh - 400px)"
        style="width: 100%" 
        stripe 
        size="large" 
        empty=""
        :cell-style=msi_style.tb_cell 
        :header-cell-style=msi_style.tb_header_cell 
        @selection-change="handleSelectionChange"
      >
        <el-table-column
          prop="evse_id"
          label="EVSE ID"
          sortable
          min-width="250"
        />
        <el-table-column
          prop="floor_level"
          label="Floor Level"
          sortable
          min-width="150"
        />
        <el-table-column
          prop="status"
          label="Status"
          sortable
          min-width="200"
        >
          <template #default="scope">
            <p class="available" v-if="scope.row.status === 'AVAILABLE'"> {{ "● " + scope.row.status }}</p>
            <p class="charging" v-else-if="scope.row.status === 'CHARGING'"> {{ "● " + scope.row.status }}</p>
            <p class="offline" v-else-if="scope.row.status === 'UNKNOWN' "> {{ "● " + scope.row.status }}</p>
            <p class="error" v-else-if="scope.row.status === 'OUTOFORDER'"> {{ "● " + scope.row.status }}</p>
          </template>
        </el-table-column>
        <el-table-column
          prop="type_str"
          label="Type"
          sortable
          min-width="150"
        />
        <el-table-column
          prop="hmi_version"
          label="SW Ver."
          sortable
          min-width="200"
        />
        <el-table-column
          prop=""
          label="Latest SW"
          sortable
          min-width="200"
        >
          <template #default="scope">
            <p v-if="scope.row.hmi_version === `b'0.1.2.3'`"> {{ "V" }}</p>
          </template>
        </el-table-column>
        <el-table-column
          prop="last_updated_str"
          label="Updated Time"
          sortable
          min-width="200"
        />
        <el-table-column
          v-if="editMode === false"
          prop=""
          label=""
          align="center"
          min-width="200"
        >
          <template #default="scope">
                <el-button class="btn-more" @click="charger_detail(scope.row)"> <font-awesome-icon icon="fa-solid fa-ellipsis" /> </el-button>
          </template>
        </el-table-column>
        <el-table-column
          v-else
          type="selection"
          align="center"
          min-width="200"
        />
      </el-table>

      <el-dialog
        v-model="sw_version_visable" 
        class="max-w-600px"
        :show-close="true"
        width="90%"
        destroy-on-close
        center
      >
        <template #header="{ titleId, titleClass }">
          <div class="py-2rem relative bg-blue-100">
            <h4
              :id="titleId"
              :class="titleClass"
              class="m-0 text-center text-blue-1200 font-400 text-24px line-height-26px"
            >
              Update SW
            </h4>
          </div>
        </template>
        <div class="dialog-context">
          <p>Now Version {{ fwVersion }}</p>
        </div>
        <template #footer>
          <span class="dialog-footer flex flex-center">
            <el-button round class="w-48% bg-btn-100 text-white max-w-140px" @click="sw_version_visable = false">Cancel</el-button>
            <el-button round class="w-48% bg-btn-200 text-white max-w-140px" @click="updateConfirm()">Confirm</el-button>
          </span>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.station-detail {
  .station-name {
    font-size: 36px;
    font-weight: bold;
  }
  .station-edit-btn {
    color: var(--secondary);
  }



  .btn{
    width: 20rem;
    height: 4rem;
    font-size: 18px;
    background-color: var(--secondary);
    color:var(--white);
    border-radius: 2rem;
  }
  .update-button {
    background-color: var(--blue-900);
  }
  .soft-reset-button {
    background-color: var(--blue-900);
  }
  .hard-reset-button {
    background-color: var(--blue-900);
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