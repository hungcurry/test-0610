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
const swVersion = ref('')

const updateConfirm = async () => {
  let sendData = { "evse_ids": updataEvseId, "location": update_file.value, "retrieveDate": "2022-10-27 12:12:12"}
  if (update_file.value === '')
    ElMessage.error('File not found')
  const response = await MsiApi.updateFw(sendData)
  if (response.status === 200) {
    sw_version_visable.value = false
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
  StationData.last_updated_str = (moment(StationData.last_updated).format("YYYY-MM-DD HH:mm:ss"))
  StationDetailEvseData.length = 0 
  Object.assign(StationDetailEvseData, StationData.evses)
  let evse_obj_arr = []
  let hmi_obj_arr = []
  for(let i = 0; i < StationDetailEvseData.length; i++) {
    evse_obj_arr.push(  {"ObjectId":StationDetailEvseData[i]._id}  )
  }
  jsonData = { "database": "CPO", "collection": "ChargePointInfo", "pipelines": [
    { "$match": {'evse': {"$in": evse_obj_arr}}},
    { "$project": { "_id": 0} }
  ]}
  response = await MsiApi.mongoAggregate(jsonData)
 
  for (let i = 0; i < response.data?.result?.length; i++) {
    for (let j = 0; j < StationDetailEvseData.length; j++) {
      if (response.data.result[i].evse === StationDetailEvseData[j]._id) {
        StationDetailEvseData[j].hmi_Info = response.data.result[i].hmi
      }
    }
  }
  for(let i = 0; i < StationDetailEvseData.length; i++) {
    if (StationDetailEvseData[i].hmi_Info != 0)
      hmi_obj_arr.push(  {"ObjectId":StationDetailEvseData[i].hmi_Info}  )
  }
  jsonData = { "database": "CPO", "collection": "HMIControlBoardInfo", "pipelines": [
    { "$match": {'_id': {"$in": hmi_obj_arr}}},
    { "$project": { "aaa": 0} }
  ]}
  response = await MsiApi.mongoAggregate(jsonData)
  for (let i = 0; i < StationDetailEvseData.length; i++) {
    for (let j = 0; j < response.data?.result?.length; j++)
      if (StationDetailEvseData[i]?.hmi_Info === response.data.result?.[j]?._id) {
        StationDetailEvseData[i].sw_version = response.data.result?.[j]?.hmi_board_sw_version
      }
  }

  jsonData = { "database":"CPO", "collection":"VersionControl", "query": { "type": 'XP012'}}
  response = await MsiApi.mongoQuery(jsonData)
  swVersion.value = response.data.all[0].version


  for (let i = 0; i < StationData.evses.length; i++) {
    if (StationData.evses[i].connectors[0].standard === 'IEC_62196_T1') 
      StationDetailEvseData[i].type_str = 'Type 1 (J1772)'
    else if (StationData.evses[i].connectors[0].standard === 'IEC_62196_T2')
      StationDetailEvseData[i].type_str = 'Tyep 2 (Mennekes)' 
    else if (StationData.evses[i].connectors[0].standard === 'IEC_62196_T1_COMBO')
      StationDetailEvseData[i].type_str = 'CCS1 Combo' 
    else
      StationDetailEvseData[i].type_str = StationData.evses[i].connectors[0].standard
    let localEndTime =  new Date( (new Date(StationData.evses[i].last_updated).getTime()) + ((MStore.timeZoneOffset ) * -60000))
    StationDetailEvseData[i].last_updated_str = (moment(localEndTime).format("YYYY-MM-DD HH:mm:ss"))
  }
  StationData.img_str = StationData?.images?.[0]?.url
})

</script>

<template>
  <div class="station-detail wh-full flex-col">
    <div class="container lg">
      <div class="pt-40px pb-20px overflow-x-auto flex">
        <img class="w-110px h-110px mr-20px" v-if="StationData.img_str!==undefined" :src="StationData.img_str" >
        <img class="w-110px h-110px mr-20px" v-else src="@/assets/img/null_pic.png">
        <div class="flex-col white-space-nowrap w-full text-blue-1200 text-20px">
          <div class="flex justify-between">
            <div class="flex">
              <span class="station-name text-36px font-bold mr-20px">{{ StationData.name }}</span>
              <font-awesome-icon class="text-secondary w-32px h-32px" icon="fa-regular fa-pen-to-square" @click="go_to_station_edit_page() "/>
            </div>
            <p class="text-20px text-blue-900 ml-24px">Last Updated : {{ StationData.last_updated_str }} </p>
          </div>

          <div class="flex mt-16px">
            <img class="w-20px h-20px mr-10px" src="@/assets/img/station_listmode_location.png">
            <span class="line-height-20px">{{ StationData.country }} {{ StationData.city }}{{ StationData.address }}</span>
          </div>
          
          <div class="flex flex-row mt-12px text20px">
            <div class="flex mr-40px">
              <img class="w-20px h-20px mr-10px" src="@/assets/img/station_detail_latitude.png">
              <span class="line-height-20px"> {{ StationData.latitude_str }} {{ "," }} {{ StationData.longitude_str }}</span>
            </div>
            <!-- <div class="flex mr-40px">
              <img class="w-20px h-20px mr-10px" src="@/assets/img/station_list_type_office1.png">
              <span class="line-height-20px">Station Type : 
                <span v-for="(item, index) in StationData.facilities" class="line-height-20px">
                  <span v-if="index !== 0">, </span>
                  {{ item }}
                </span>
              </span>
            </div> -->

            <div v-if="StationData.publish" class="flex">
              <img class="w-20px h-20px mr-10px filter-blue-1200" src="@/assets/img/login_visible_pre.png">
              <span class="line-height-20px">Published</span>
            </div>
            <div v-else class="flex">
              <img class="w-20px h-20px mr-10px filter-blue-1200" src="@/assets/img/login_unvisible_pre.png">
              <span class="line-height-20px">Unpublished</span>
            </div>
          </div>

        </div>
      </div>
    </div>
<!-- 
    <el-collapse accordion class="collapse">
      <el-collapse-item name="1">
        <div class="flex flex-wrap pt-20px pb-20px text-blue-1200 text-20px white-space-nowrap overflow-x-auto">
          <div class="collapse-left mr-20px pl-10%">
            <div class="flex mb-12px">
              <img class="w-20px h-20px mr-16px" src="@/assets/img/station_detail_id.png">
              <span class="line-height-20px"> Station ID : {{ StationData.id }} </span>
            </div>
            <div class="flex mb-12px">
              <img class="w-20px h-20px mr-16px" src="@/assets/img/station_detail_admin.png">
              <span class="line-height-20px"> Operator : {{ StationData.party_id }} </span>
            </div>
          </div>

          <div class="collapse-right pl-10%">
            <div class="flex mb-12px">
              <img class="w-20px h-20px mr-16px" src="@/assets/img/station_detail_owner.png">
              <span class="line-height-20px"> Owner : {{  }} </span>
            </div>
            <div class="flex mb-12px">
              <img class="w-20px h-20px mr-16px" src="@/assets/img/station_detail_car.png">
              <span class="line-height-20px"> Parking Lot : {{  }} </span>
            </div>
            <div class="flex mb-12px">
              <img class="w-20px h-20px mr-16px" src="@/assets/img/station_detail_note.png">
              <span class="line-height-20px"> Note : {{  }} </span>
            </div>
          </div>
        </div>
      </el-collapse-item>
    </el-collapse> -->

    <div class="pb-40px bg-blue-100 flex-grow">
      <div class="container lg">
        <div class="flex md:justify-end pt-24px pb-24px overflow-x-auto">
          <el-button v-if="editMode === true" class="btn-secondary shrink-0 update-button px-30px box-shadow" @click="updateSW"> Update SW </el-button>
          <!-- <el-button v-if="editMode === true" class="btn-secondary shrink-0 update-button px-30px box-shadow" @click="updateFW " disabled> Update FW </el-button> -->
          <el-button v-if="editMode === true" class="btn-secondary shrink-0 soft-reset-button px-30px box-shadow" @click="evseReset('soft')"> Soft Reset </el-button>
          <el-button v-if="editMode === true" class="btn-secondary shrink-0 hard-reset-button px-30px box-shadow" @click="evseReset('hard')"> Hard Reset </el-button>
          <el-button class="btn-secondary shrink-0  px-30px box-shadow" @click="edit_charger" > {{ edit_button_str }}</el-button>
        </div>

        <div class="px-14px bg-white rounded-2xl">
          <el-table 
            :data="StationDetailEvseData" 
            class="white-space-nowrap text-primary rounded-10px"
            height="calc(100vh - 520px)"
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
              prop="sw_version"
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
                <p v-if="scope.row.sw_version === swVersion"> {{ "V" }}</p>
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
        </div>
      </div>





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
          <p class="text-center">Now Version {{ fwVersion }}</p>
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
  .container {
    height: auto;
  }
  .collapse {
    :deep(.el-collapse-item__header) {
      height: 20px;
      background-color: var(--gray-200);
    }
    :deep(.el-collapse-item__arrow) {
      margin: auto;
      transform: rotate(90deg);
    }
    :deep(.el-collapse-item__arrow.is-active) {
      transform: rotate(-90deg);
    }
    :deep(.el-collapse-item__content) {
      background-color: var(--gray-100);
      padding-bottom: 0;
      // height: 120px;
    }
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
  .filter-blue-1200 {
    filter: brightness(65%) saturate(100%);
  }
  :deep(.el-table tr) {
    height: 6.5rem;
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
