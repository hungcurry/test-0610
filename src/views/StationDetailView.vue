<script setup>
import { ref, reactive, onMounted} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ApiFunc from '@/composables/ApiFunc'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import  msi_style  from '../assets/msi_style'
import { ElMessage } from 'element-plus'
import moment from "moment"
import { useMStore } from "../stores/m_cloud"
import { useI18n } from "vue-i18n"

const { t } = useI18n()
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
    ElMessage.error(t('file_not_found'))
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
const edit_button_str = ref('update_or_restart')

const evseReset = (type) => {
  updataEvseId.length = 0
  for (let i = 0; i < multipleSelection.value.length; i++) {
    updataEvseId.push(multipleSelection.value[i].evse_id)
  }
  if (updataEvseId.length === 0) {
    return
  }
  let reset_message = t('do_you_want_to_soft_reset')
  if (type === 'hard')  
    reset_message = t('do_you_want_to_hard_reset')

  if (confirm(reset_message) === true) {
    const json = JSON.stringify({ evse_id: updataEvseId, reset_type: type })
    MsiApi.reset_evse(json)
      .then(() => {
        alert(t('reset_success'))
      })
      .catch((error) => {
        alert(t('reset_fail'))
        console.log(error)
      })
  }
}
const edit_charger = () => {
  if (editMode.value === true) {
    editMode.value = false
    edit_button_str.value = 'update_or_restart'
  }
  else {
    editMode.value = true
    edit_button_str.value = 'cancel'
  }
}
const charger_detail = (row) => {
  router.push({ name: 'evseDetail', query: {station_id:station_id, evse_id:row.uid} })
}
const StationDetailEvseData = reactive([])
const StationData = reactive([])

onMounted( async () => {
  let queryData1 = { "database":"OCPI", "collection":"Location", "pipelines": [ 
  { $match:  { "id": { "UUID" : station_id} } },
    { "$lookup": {"from":'EVSE', "localField": "evses", "foreignField": "_id", "as":"EVSES"}},
    { "$lookup": {"from":'Connector', "localField": "EVSES.connectors", "foreignField": "_id", "as":"Connector"}},
    { "$project": { 
                    "country_code": 0, "directions": 0, "party_id": 0, "last_updated": 0, "evses": 0,
                    "Connector.id": 0, "Connector.format": 0, "Connector.last_updated": 0, "Connector.max_amperage": 0,
                    "Connector.max_electric_power":0, "Connector.max_voltage":0, "Connector.power_type":0, "Connector.tariff_ids":0,
                  }
    }
  ]}
  let res = await MsiApi.mongoAggregate(queryData1)
  StationData.length = 0
  Object.assign(StationData, res.data.result[0])
  StationData.latitude_str = StationData.coordinates.latitude
  if (StationData.publish) 
    StationData.publish_str = t('true')
  else 
    StationData.publish_str = t('false')
  StationData.longitude_str = StationData.coordinates.longitude
  StationData.last_updated_str = (moment(StationData.last_updated).format("YYYY-MM-DD HH:mm:ss"))
  StationData.img_str = StationData?.images?.[0]?.url

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

  // StationData.addr_en
  // StationData.city_en

  switch (StationData?.facilities[0]) {
    case 'HOTEL':
      StationData.facilities_str = t('hotel')
    break
    case 'RESTAURANT':
      StationData.facilities_str = t('restaurant')
    break
    case 'MALL':
      StationData.facilities_str = t('mall')
    break
    case 'SUPERMARKET':
      StationData.facilities_str = t('super_market')
    break
    case 'PARKING_LOT':
      StationData.facilities_str = t('parking_lot')
    break
    default:
      StationData.facilities_str = t('others')
  }
  StationData.EVSES.forEach((evse) => {
    StationData.Connector.forEach((connector) => {
      if (evse.connectors[0] === connector._id) {
        evse.connector_type = connector.standard
      }
    })
  })
  Object.assign(StationDetailEvseData, StationData.EVSES)
  StationDetailEvseData.forEach((item)=>{
    switch (item.status) {
      case 'AVAILABLE':
        item.status_str = t('available')
      break
      case 'CHARGING':
        item.status_str = t('charging')
      break
      case 'UNKNOWN':
        item.status_str = t('offline')
      break
      case 'OUTOFORDER':
        item.status_str = t('error')
      break
      default:
        item.status_str = t('others')
    }
    switch (item.connector_type) {
      case 'IEC_62196_T1':
        item.connector_type = 'Type 1 (J1772)'
      break
      case 'IEC_62196_T2':
        item.connector_type = 'Type 2 (Mennekes)'
      break
      default:
        item.connector_type = t('others')
    }
    let localEndTime =  new Date( (new Date(item.last_updated).getTime()) + ((MStore.timeZoneOffset ) * -60000))
    item.last_updated_str = (moment(localEndTime).format("YYYY-MM-DD HH:mm:ss"))
  })

  let evse_obj_arr = []
  for(let i = 0; i < StationDetailEvseData.length; i++) {
    evse_obj_arr.push(  {"ObjectId":StationDetailEvseData[i]._id}  )
  }
  let jsonData = { "database": "CPO", "collection": "ChargePointInfo", "pipelines": [
    { "$match": {'evse': {"$in": evse_obj_arr}}},
    { "$lookup": {"from":'HMIControlBoardInfo', "localField": "hmi", "foreignField": "_id", "as":"HMI_INFO"}},
    { "$project": { _id: 0, location:0, connectors:0, country_id:0, created_date:0, evse_id:0, party_id:0, update_date:0 } }
  ]}
  let response = await MsiApi.mongoAggregate(jsonData)
  let chargePointInfo = response.data.result
  StationDetailEvseData.forEach((item) => {
    chargePointInfo?.forEach((chargePointItem) => {
      if (item._id === chargePointItem.evse) {
        item.chargePointInfo = chargePointItem
        item.sw_version = chargePointItem.HMI_INFO[0]?.hmi_board_sw_version
      }
    })
  })
  jsonData = { "database": "CPO", "collection": "VersionControl", "pipelines": [
    { "$match": {'type': 'XP012'}},
    { "$project": { _id: 0, release_date:0, release_note:0, type:0} }
  ]}
  response = await MsiApi.mongoAggregate(jsonData)
  swVersion.value = response.data.result[0].version
})

</script>

<template>
  <div class="station-detail flex-col h-full">
    <div class="container lg">
      <div class="whiteBar pt-40px pb-20px overflow-x-auto flex">
        <img class="w-110px h-110px rounded-2xl mr-20px" v-if="StationData.img_str!==undefined" :src="StationData.img_str" >
        <img class="w-110px h-110px rounded-2xl mr-20px" v-else src="@/assets/img/null_pic.png">
        <div class="flex-col white-space-nowrap text-blue-1200 text-20px lg:w-full">
          <div class="flex justify-between mb-14px">
            <div class="flex">
              <span class="station-name text-36px font-bold mr-20px">{{ StationData.name }}</span>
              <font-awesome-icon class="text-secondary w-32px h-32px mt-3px" icon="fa-regular fa-pen-to-square" @click="go_to_station_edit_page() " style="cursor:pointer"/>
            </div>
            <p class="text-20px text-blue-900 ml-24px"> {{ t('last_updated') }} : {{ StationData.last_updated_str }} </p>
          </div>
          <div class="flex mb-14px">
            <div class="flex">
              <i class="w-20px h-20px mr-10px flex-shrink-0 text-blue-1100 i-octicon:location-16" />
              <span class="line-height-20px">{{ StationData.country }}</span>
            </div>
            <span class="line-height-20px mx-8px">{{ "" }} </span>
            <i class="w-20px h-20px mr-10px flex-shrink-0 text-blue-1100 i-gis:location-man-alt" />
            <span class="line-height-20px">{{ StationData.city }}{{ StationData.address }}</span>
            <span class="line-height-20px mx-8px">{{ "  /  " }} </span>
            <span class="line-height-20px">{{ StationData.address1  }} {{ "  ,  " }} {{ StationData.city1}}</span>
          </div>
          <div class="flex flex-row text-20px">
            <div class="flex mr-40px">
              <i class="w-20px h-20px mr-10px text-blue-1100 i-bi:globe2" />
              <span class="line-height-20px"> {{ StationData.latitude_str }} {{ "," }} {{ StationData.longitude_str }} </span>
            </div>

            <div class="flex mr-40px">
              <img class="w-20px h-20px mr-10px" src="@/assets/img/dashboard_title_time.png">
              <span class="line-height-20px"> {{ t('time_zone') }} : {{ StationData.time_zone }}</span>
            </div>

            <div class="flex mr-40px">
              <i class="w-20px h-20px mr-10px text-blue-1100 i-ph:eye-bold" />
              <span class="line-height-20px"> {{ t('publish') }} : {{ StationData.publish_str }} </span>
            </div>

            <div class="flex">
              <i class="w-20px h-20px mr-10px text-blue-1100 i-fluent:scan-type-24-filled" />
              <span class="line-height-20px"> {{ t('type') }} : {{ StationData.facilities_str }} </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- <el-collapse accordion class="collapse">
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

    <div class="container lg pb-40px bg-blue-100 flex-grow">
      <div class="flex lg:justify-end pt-24px pb-24px overflow-x-auto">
        <el-button v-if="editMode === true && (MStore.rule_permission.StationDetail.update === 'O' || MStore.permission.isCompany)" 
        class="btn-secondary shrink-0 update-button px-30px box-shadow" @click="updateSW"> {{ t('update_sw') }} </el-button>
        <el-button v-if="editMode === true && (MStore.rule_permission.StationDetail.reset === 'O' || MStore.permission.isCompany)" 
        class="btn-secondary shrink-0 soft-reset-button px-30px box-shadow" @click="evseReset('soft')"> {{ t('soft_reset') }} </el-button>
        <el-button v-if="editMode === true && (MStore.rule_permission.StationDetail.reset === 'O' || MStore.permission.isCompany)"
        class="btn-secondary shrink-0 hard-reset-button px-30px box-shadow" @click="evseReset('hard')"> {{ t('hard_reset') }} </el-button>
        <div v-if="MStore.rule_permission.StationDetail.update === 'O' || MStore.rule_permission.StationDetail.reset === 'O' || MStore.permission.isCompany"  > 
          <el-button class="btn-secondary shrink-0  px-30px box-shadow" @click="edit_charger" > {{ t(edit_button_str) }}</el-button>
        </div>
      </div>
      
      <el-table 
        :data="StationDetailEvseData" 
        class="white-space-nowrap text-primary rounded-10px px-14px mt-8px"
        style="width: 100%; height: calc(100vh - 370px)"
        stripe 
        size="large" 
        empty=""
        :cell-style=msi_style.tb_cell 
        :header-cell-style=msi_style.tb_header_cell 
        @selection-change="handleSelectionChange"
            :default-sort="{ prop: 'evse_id', order: 'ascending' }"
      >
        <el-table-column
          prop="evse_id"
          :label="t('evse_id')"
          align="center"
          sortable
          min-width="250"
        />
        <el-table-column
          prop="floor_level"
          :label= "t('floor_level')"
          align="center"
          sortable
          min-width="150"
        />
        <el-table-column
          prop="status"
          :label= "t('status')"
          align="center"
          sortable
          min-width="150"
        >
          <template #default="scope">
            <p class="available text-center" v-if="scope.row.status === 'AVAILABLE'"> {{ "● " + scope.row.status_str }}</p>
            <p class="charging text-center" v-else-if="scope.row.status === 'CHARGING'"> {{ "● " + scope.row.status_str }}</p>
            <p class="offline text-center" v-else-if="scope.row.status === 'UNKNOWN' "> {{ "● " + scope.row.status_str }}</p>
            <p class="error text-center" v-else-if="scope.row.status === 'OUTOFORDER'"> {{ "● " + scope.row.status_str }}</p>
          </template>
        </el-table-column>
        <el-table-column
          prop="connector_type"
          :label= "t('type')"
          sortable
          align="center"
          min-width="200"
        />
        <el-table-column
          prop="sw_version"
          :label="t('sw_ver')"
          sortable
          align="center"
          min-width="200"
        />
        <el-table-column
          prop=""
          :label= "t('latest_sw')"
          sortable
          align="center"
          min-width="200"
        >
          <template #default="scope">
            <p class="text-center" v-if="scope.row.sw_version === swVersion"> {{ "V" }}</p>
          </template>
        </el-table-column>
        <el-table-column
          prop="last_updated_str"
          :label="t('updated_time')"
          sortable
          align="center"
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
            {{ t('update_sw') }}
            </h4>
          </div>
        </template>
        <div class="dialog-context">
          <p class="text-center"> {{ t('now_version')  +  ' : ' }}  {{ fwVersion }}</p>
        </div>
        <template #footer>
          <span class="dialog-footer flex flex-center">
            <el-button round class="w-48% bg-btn-100 text-white max-w-140px" @click="sw_version_visable = false"> {{ t('cancel') }}</el-button>
            <el-button round class="w-48% bg-btn-200 text-white max-w-140px" @click="updateConfirm()">{{ t('confirm') }}</el-button>
          </span>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.station-detail {
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
.whiteBar::-webkit-scrollbar-track,
::-webkit-scrollbar-corner {
  background-color: var(--white);
}
</style>
