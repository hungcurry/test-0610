<script setup>
import ApiFunc from '@/composables/ApiFunc'
import  msi  from '../assets/msi_style'
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter,onBeforeRouteUpdate } from 'vue-router'
import { useMStore } from "../stores/m_cloud"
import { storeToRefs } from "pinia"
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

import hotelPng from '@/assets/img/station_list_type_hotel.png'
import restaurantPng from '@/assets/img/station_list_type_restaurant.png'
import mallPng from '@/assets/img/station_list_type_mall.png'
import parkingPng from '@/assets/img/station_list_type_parking.png'
import trainPng from '@/assets/img/station_list_type_train.png'

const MStore = useMStore()
const MsiApi = ApiFunc()
const { header_left_component } = storeToRefs(MStore)
const route = useRoute()
const router = useRouter()
const stationMap = ref()
const display_mode = ref('Map Mode')
const show_stataion_detail = ref(false)
const facilities_filter_item = [
  { text:'Hotel', value: 'HOTEL'},
  { text:'Restaurant', value: 'RESTAURANT'},
  { text:'Mall', value: 'MALL'},
  { text:'Super Market', value: 'SUPERMARKET'}, 
  { text:'Parking lot', value: 'PARKING_LOT'},
  { text:'Others', value: 'WIFI'},
]
const publish_filter_item = [{ text:'True', value: true}, { text:'False', value: false}]
const status_filter_item = [{ text:'AVAILABLE', value: 'AVAILABLE'}, { text:'CHARGING', value: 'CHARGING'}, 
                            { text:'UNKNOWN', value: 'UNKNOWN'}, { text:'ERROR', value: 'ERROR'}]
let map1 = null
let mode = route.query.mode

const sortFunc = (obj1, obj2, column) => {
  let at = obj1[column]
  let bt = obj2[column]

  if (bt === undefined) {
    return -1
  }
  if (at > bt) {
    return -1
  }
}

const facilities_filter = (value, rowData) => {
  for (let i=0; i<rowData.facilities.length; i++) {
    if (value === rowData.facilities[i])
      return rowData.facilities_img
  }
}

const status_filter = (value, rowData) => {
  if (value === 'AVAILABLE') {
    if (rowData.state_available_str > 0)
    return rowData
  }
  if (value === 'CHARGING') {
    if (rowData.state_charging_str > 0)
    return rowData
  }
  if (value === 'UNKNOWN') {
    if (rowData.state_unknown_str > 0)
    return rowData
  }
  if (value === 'OUTOFORDER') {
    if (rowData.state_error_str > 0)
    return rowData
  }
}

const publish_filter = (value, rowData) => {
  return rowData.publish === value
}

const LocationData = reactive([])
const SideBarInfo = reactive([])

const detail_info = (row) => {
  router.push({ name: 'stationDetail', query: {id:row.id} })
}

const add_station = () => {
  router.push({ name: 'stationEdit', query: {} })
}

const close_detail = () => {
  show_stataion_detail.value = false
}

const edit_detail  = () => {
  router.push({ name: 'stationEdit', query: {id:SideBarInfo.id} })
}

const changeMode = async () => {
  show_stataion_detail.value = false
  if (display_mode.value === 'Map Mode') {
    await router.push('station?mode=list')
    history.replaceState(history.state, '', 'station?mode=list')
    display_mode.value = 'List Mode'
    header_left_component.value = ''
  }
  else {
    await router.push('station?mode=map')
    history.replaceState(history.state, '', 'station?mode=map')
    display_mode.value = 'Map Mode'
    header_left_component.value = 'station_map'
  }
}

const initMap = async () => {
  map1 = new google.maps.Map(stationMap.value, {
    center: { lat: 23.5825, lng: 120.5855 }, zoom: 8, maxZoom: 30, minZoom: 3, streetViewControl: true, mapTypeControl: false,
    styles: msi.map_style
  })
}

const setMarker = async () => {
  let image = null
  let currentInfoWindow = null;
  
  for (let i = 0; i < LocationData.length; i++) {
    if (LocationData[i].state_error_str > 0) {
      image = 'https://storage.googleapis.com/msi-common/pic/station_error.png'
    }
    else if (LocationData[i].state_unknown_str > 0) {
      image = 'https://storage.googleapis.com/msi-common/pic/station_offline.png'
    }
    else if (LocationData[i].state_available_str === 0 && LocationData[i].state_charging_str > 0) {
      image = 'https://storage.googleapis.com/msi-common/pic/station_charging.png'
    }
    else if (LocationData[i].state_available_str > 0 ) {
      image = 'https://storage.googleapis.com/msi-common/pic/station_available.png'
    }
    else {
      image = 'https://storage.googleapis.com/msi-common/pic/station_offline.png'
    }

    let marker = new google.maps.Marker({
      position: { lat: parseFloat(LocationData[i].coordinates.latitude), lng: parseFloat(LocationData[i].coordinates.longitude) },
      map: map1, icon: image
    })

    let infowindow = new google.maps.InfoWindow({ content: '<div class="custom-info-window">' + LocationData[i].name + '</div>', maxWidth: 300})
    marker.addListener("click", () => {
      if (currentInfoWindow) {
        currentInfoWindow.close()
      }
      currentInfoWindow = infowindow
      infowindow.open(map1, marker)
      show_stataion_detail.value = true
      SideBarInfo.length = 0
      Object.assign(SideBarInfo, LocationData[i])
    })
    if (LocationData[i].publish === true)
      LocationData[i].publish_str = 'True'
    else 
      LocationData[i].publish_str = 'Flash'
  }
}

onBeforeRouteUpdate( async () => {
  displayLayout()
})

const displayLayout = () => {
  mode = route.query.mode
  if (route.path === '/station' && (mode === 'map' || mode === undefined)) {
    header_left_component.value = 'station_map'
    display_mode.value = 'Map Mode'
  }

  if (mode === 'list') {
    display_mode.value = 'List Mode'
    header_left_component.value = ''
  }
  else {
    display_mode.value = 'Map Mode'
    header_left_component.value = 'station_map'
    show_stataion_detail.value = false
  }
}

onMounted( async () => {

  let queryData = { "database":"OCPI", "collection":"Location", "query": {}}
  const response = await MsiApi.mongoQuery(queryData)
  LocationData.length = 0
  Object.assign(LocationData, response.data.all)
  for (let i = 0; i < LocationData.length; i++) {
    LocationData[i].state_available_str = LocationData[i].state_charging_str = LocationData[i].state_unknown_str = LocationData[i].state_error_str = 0
    LocationData[i].state_total_str = LocationData[i].evses.length 
    for (let j = 0; j < LocationData[i].evses.length; j++) {
      if (LocationData[i].evses[j].status === "AVAILABLE")
        LocationData[i].state_available_str += 1
      else if (LocationData[i].evses[j].status === "CHARGING")
        LocationData[i].state_charging_str += 1
      else if (LocationData[i].evses[j].status === "UNKNOWN")
        LocationData[i].state_unknown_str += 1
      else if (LocationData[i].evses[j].status === "OUTOFORDER")
        LocationData[i].state_error_str += 1
    }
    LocationData[i].facilities_str = LocationData[i].facilities?.[0]

    // if (LocationData[i].parking_type === "PARKING_LOT")
    //   LocationData[i].parking_str = 'PARKING'

    if (LocationData[i].facilities_str === 'HOTEL') {
      LocationData[i].facilities_img = hotelPng
    }
    else if (LocationData[i].facilities_str === 'RESTAURANT') {
      LocationData[i].facilities_img = restaurantPng
    }
    else if (LocationData[i].facilities_str === 'MALL') {
      LocationData[i].facilities_img = mallPng
    } 
    else if (LocationData[i].facilities_str === 'SUPERMARKET') {
      LocationData[i].facilities_img = mallPng
    } 
    else if (LocationData[i].facilities_str === 'PARKING_LOT') {
      LocationData[i].facilities_img = parkingPng
    }    
    else {
      LocationData[i].facilities_img = trainPng
    }
  }
  if (route.path === '/station' && (route.query.mode === 'map' || route.query.mode ===  undefined)) {
    header_left_component.value = 'station_map'
  }
  if (mode === 'list') {
    display_mode.value = 'List Mode'
    header_left_component.value = ''
  }
  else {
    display_mode.value = 'Map Mode'
    header_left_component.value = 'station_map'
    show_stataion_detail.value = false
  }
  initMap()
  setMarker()
})

onUnmounted( () =>{
    header_left_component.value = ''
})

</script >

<template>
  <div class="station">
    <div class="station-list" v-show="display_mode === 'List Mode'">
      <div class="overflow-x-auto">
        <div class="pb-40px">
          <el-table 
            :data="LocationData" 
            class="white-space-nowrap text-primary"
            height="calc(100vh - 220px)"
            style="width: 100%"
            stripe 
            size="large"
            :cell-style=msi.tb_cell 
            :header-cell-style=msi.tb_header_cell 
          >
            <el-table-column
              prop="facilities"
              label="Type"
              align="center"
              :filters=facilities_filter_item
              :filter-method="facilities_filter"
              min-width="100"
            >
              <template #default="scope">
                <img :src="scope.row.facilities_img">
              </template>
            </el-table-column>
            <el-table-column
              prop="name"
              label="Name"
              align="center"
              sortable
              :sort-method="(a, b) => sortFunc(a, b, 'name')"
              min-width="200"
            />
            <el-table-column
              prop="country"
              label="Country"
              align="center"
              sortable
              :sort-method="(a, b) => sortFunc(a, b, 'country')"
              min-width="150"
            />
            <el-table-column
              prop="city"
              label="City"
              align="center"
              sortable
              :sort-method="(a, b) => sortFunc(a, b, 'city')"
              min-width="200"
            />
            <el-table-column
              prop="address"
              label="Address"
              align="center"
              sortable
              :sort-method="(a, b) => sortFunc(a, b, 'address')"
              min-width="400"
            />
            <el-table-column
              prop=""
              label="Status"
              align="center"
              :filters=status_filter_item
              :filter-method="status_filter"
              min-width="200"
            >
              <template #default="scope">
                <el-tag effect="dark"> {{scope.row.state_available_str}} </el-tag>
                <el-tag type="success" effect="dark"> {{scope.row.state_charging_str}} </el-tag>
                <el-tag type="info" effect="dark"> {{scope.row.state_unknown_str}} </el-tag>
                <el-tag type="danger" effect="dark"> {{scope.row.state_error_str}} </el-tag>
              </template>
            </el-table-column>

            <el-table-column
              prop="publish_str"
              label="Publish"
              align="center"
              :filters=publish_filter_item
              :filter-method="publish_filter"
              min-width="120"
            />
            <el-table-column
              prop="detail"
              label=""
              align="center"
              min-width="150"
            >
              <template #default="scope">
                <el-button class="btn-more" @click="detail_info(scope.row)"> <font-awesome-icon icon="fa-solid fa-ellipsis" /> </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>

    <div class="station-map" ref="stationMap" v-show="display_mode === 'Map Mode'">
    </div>

    <el-button class="mode-btn" @click="changeMode"> {{ display_mode }}</el-button>
    <el-button class="add-station" :class="[show_stataion_detail? 'add-station-open-detail' : 'add-station-close-detail']" @click="add_station">Add Station</el-button>

    <div class="station-detail" v-if="show_stataion_detail" >
      <div class="station-detail-button">
        <el-button @click="close_detail" class="arrow"><font-awesome-icon icon="fa-solid fa-arrow-right" /></el-button>
        <el-button  @click="edit_detail" class="pen"><font-awesome-icon icon="fa-regular fa-pen-to-square"/></el-button>
      </div>

      <p class="location-name">{{ SideBarInfo.name }}</p>
      <div class="location-addr mb-12px">
        <img @click="edit_detail" class="station-detail-up-icon" src="@/assets/img/station_mapmode_location.png" alt="">
        <p class="addr">{{SideBarInfo.address  }}</p>
      </div>

      <div class="station-detail-lat-lng">
        <img @click="edit_detail" class="station-detail-up-icon" src="@/assets/img/station_mapmode_latitude.png" alt="">
        <p class="lat">{{ SideBarInfo.coordinates.latitude }}</p>
        <p class="lng">{{ SideBarInfo.coordinates.longitude }}</p>
      </div>

      <div class="middle-line"></div>
      
      <div class="status">
        <img class="station-detail-buttom-icon" src="@/assets/img/station_type_J1772.png" alt="">
        <div class="status-container">
          <span class="type">{{ 'Type 1 (J1772) (' + SideBarInfo.state_total_str + ')'}}</span>
          <p class="available"> <span class="disc-icon">●</span> Available ({{SideBarInfo.state_available_str }}) </p>
          <p class="charging"> <span class="disc-icon">●</span> Charging ({{SideBarInfo.state_charging_str }})</p>
          <p class="offline"> <span class="disc-icon">●</span> Offline ({{SideBarInfo.state_unknown_str }})</p>
          <p class="error"> <span class="disc-icon">●</span> Error ({{SideBarInfo.state_error_str }})</p>
        </div>
      </div>

      <div class="footer-button">
        <el-button class="detail-btn" @click="detail_info(SideBarInfo)"> View Details </el-button>
        <!-- <el-button class="add-btn" @click="detail_info(SideBarInfo)"> Add Charger </el-button> -->
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>

.station {
  position: relative;
  width: 100%;
  height: 100%;
  .station-detail {
    width:450px;
    height: 100%;
    position: absolute;
    display: flex;
    flex-direction: column;
    right: 0;
    top: 0;
    background-color: #566575;
    padding: 16px 20px 60px;
    .station-detail-button {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      .arrow{
        background-color: transparent;
        border: 0;
        color:#FFFFFF;
        margin: 0 0 20px -15px;
      }
      .pen{
        background-color: transparent;
        border: 0;
        color:#FFFFFF;
        margin: 0 -15px 20px 0;
      }
      :deep(.svg-inline--fa) {
        height: 1.8em;
      }
    }

    .station-detail-up-icon {
      width: 20px;
      height: 20px;
      margin-right: 10px;
    }
    .station-detail-buttom-icon {
      width: 40px;
      height: 40px;
      margin-right: 10px;
    }


    .station-detail-lat-lng {
      display: flex;
      flex-direction: row;
      .lat {
        color: #92a9c4;
        font-size: 15px;
        line-height: 20px;
      }
      .lng {
        color: #92a9c4;
        font-size: 15px;
        margin-left: 20px;
        line-height: 20px;
      }
    }
    .location-name {
      font-size: 35px;
      margin: 12px 0 16px 0;
      color: #FFFFFF;
    }
    .location-addr {
      display: flex;
      flex-direction: row;
      p{
        margin: 0px;
        font-size: 16px;
        color:#FFFFFF;
      }
    }
    .middle-line {
      width: 410px;
      border: 1px solid var(--blue-900);
      margin: 24px 20px;
    }

    .status {
      display: flex;
      flex-grow: 1;
      .status-container {
        p {
          font-size: 18px;
          margin-top: 16px;
        }
        .type {
          font-size: 22px;
          line-height: 40px;
          color: var(--white);
        }
        .disc-icon {
          margin-right: 10px;
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
    }
    .footer-button {
      display: flex;
      justify-content:space-around;
      .detail-btn {
        width: 20rem;
        height: 4rem;
        padding: 0.8rem 2rem;
        font-size: 1.8rem;
        background-color: var(--secondary);
        color: var(--white);
        border-radius: 2rem;
      }
    }
  }
  .station-list {
    width: calc(100% - 40px);
    height: calc(100% - 120px);
    top: 120px;
    left : 40px;
    position: absolute;
  }
  .station-map {
    width: 100%;
    height: 100%;
  }
  .mode-btn {
    width: 20rem;
    height: 4rem;
    padding: 0.8rem 2rem;
    font-size: 1.8rem;
    background-color: var(--black);
    color: var(--white);
    border-radius: 2rem;
    box-shadow: 0.7rem 1.1rem 1.2rem rgba(146, 169, 196, 0.25) !important;
    top: 40px;
    left : 40px;
    position: absolute;
  }
  .add-station {
    width: 20rem;
    height: 4rem;
    padding: 0.8rem 2rem;
    font-size: 1.8rem;
    background-color: var(--secondary);
    color: var(--white);
    border-radius: 2rem;
    box-shadow: 0.7rem 1.1rem 1.2rem rgba(146, 169, 196, 0.25) !important;
  }
  .add-station-close-detail {
    position: absolute;
    top: 40px;
    right: 40px;
  }
  .add-station-open-detail {
    position: absolute;
    top: 100px;
    left: 40px;
    @media (min-width: 992px) {
      top: 40px;
      left: auto;
      right: 490px;
    }
  }
  .el-button + .el-button {
    margin: 0;
  }
}

:deep(.custom-info-window) {
  font-size: 25px;
  font-weight:bold;
}
.el-tag {
  margin-left: 10px;
}
</style>