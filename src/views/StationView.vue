<template>
  <div class="station">
    <div class="station-list" v-show="display_mode === 'List Mode'">
      <el-table :data="LocationData" style="width: 95%; height:95%" stripe :cell-style=msi_style.tb_cell :header-cell-style=msi_style.tb_header_cell size="large">
        <el-table-column v-for="item in LocationTable" :key="item" :prop=item.value :label=item.label  :min-width=item.width :sortable="item.sortable"
        :filters="item.filter" :filter-method="item.filter_method" >
          <template #default="scope" v-if ="item.label === 'Status'">
            <el-tag effect="dark"> {{scope.row.state_available_str}} </el-tag>
            <el-tag type="success" effect="dark"> {{scope.row.state_charging_str}} </el-tag>
            <el-tag type="info" effect="dark"> {{scope.row.state_unknown_str}} </el-tag>
            <el-tag type="danger" effect="dark"> {{scope.row.state_error_str}} </el-tag>
          </template>

          <template #default="scope" v-else-if="item.type === 'button' && item.value === 'detail'">
            <el-button @click="detail_info(scope.row)"> <font-awesome-icon icon="fa-solid fa-ellipsis" /> </el-button>
          </template>

          <template #default="scope" v-else-if ="item.label === 'Type'">
            <img :src="scope.row.facilities_img">
          </template>

        </el-table-column>
      </el-table>
    </div>

    <div class="station-map" ref="stationMap" v-show="display_mode === 'Map Mode'">
    </div>

    <el-button class="mode" @click="changeMode"> {{ display_mode }}</el-button>
    <el-button class="add-station" @click="add_station">Add Station</el-button>

    <div class="station-detail" v-if="show_stataion_detail" >
      <div class="station-detail-button">
        <el-button @click="close_detail" class="arrow"><font-awesome-icon icon="fa-solid fa-arrow-right" /></el-button>
        <el-button  @click="edit_detail" class="pen"><font-awesome-icon icon="fa-regular fa-pen-to-square"/></el-button>
      </div>
      <div class="station-detail-lat-lng">
        <p class="lat">{{ SideBarInfo.coordinates.latitude }}</p>
        <p class="lng">{{ SideBarInfo.coordinates.longitude }}</p>
      </div>
      <p class="location-name">{{ SideBarInfo.name }}</p>
      <div class="location-addr">
        <font-awesome-icon @click="edit_detail" class="addr-img" icon="fa-solid fa-location-dot" />
        <p class="addr">{{SideBarInfo.address  }}</p>
      </div>

      <div class="status">
        <img src="@/assets/img/station_type_J1772.png" alt="">
        <span class="type">{{ 'Type 1 (J1772) (' + SideBarInfo.state_total_str + ')'}}</span>
        <p class="available status">Available ({{SideBarInfo.state_available_str }}) </p>
        <p class="charging status">Charging ({{SideBarInfo.state_charging_str }})</p>
        <p class="offline status">Offline ({{SideBarInfo.state_unknown_str }})</p>
        <p class="error status">Error ({{SideBarInfo.state_error_str }})</p>
      </div>

      <div class="footer-button">
        <button class="detail-btn" @click="detail_info(SideBarInfo)">
          View Details
        </button>

        <!-- <button disabled class="add-btn">
          Add Charger
        </button> -->
      </div>
    </div>
  </div>

</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted} from 'vue'
import { useRoute, useRouter,onBeforeRouteUpdate } from 'vue-router'
import { useMStore } from "../stores/m_cloud"
import { storeToRefs } from "pinia"
import  msi_style  from '../assets/msi_style'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import MsiCommonApi from '@/components/ApiFunc'

import hotelPng from '@/assets/img/station_list_type_hotel.png'
import restaurantPng from '@/assets/img/station_list_type_restaurant.png'
import mallPng from '@/assets/img/station_list_type_mall.png'
import parkingPng from '@/assets/img/station_list_type_parking.png'
import trainPng from '@/assets/img/station_list_type_train.png'


const MStore = useMStore()
const MsiApi = MsiCommonApi()
const { header_left_component } = storeToRefs(MStore)
const route = useRoute()
const router = useRouter()
const stationMap = ref()
const display_mode = ref('Map Mode')
const show_stataion_detail = ref(false)
const publish_filter_item = [{ text:'true', value: true}, { text:'false', value: false}]
const status_filter_item = [{ text:'AVAILABLE', value: 'AVAILABLE'}, { text:'CHARGING', value: 'CHARGING'}, 
                            { text:'UNKNOWN', value: 'UNKNOWN'}, { text:'ERROR', value: 'ERROR'}]
let map1 = null
let mode = route.query.mode

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
const LocationTable = [ 
                        {label:'Type', value:'facilities', width:'25'}, 
                        {label:'Name', value:'name', width:'100', sortable:'sortable'},
                        {label:'Country', value:'country', width:'40', sortable:'sortable'}, 
                        {label:'City', value:'city', width:'60', sortable:'sortable'},
                        {label:'Address', value:'address', width:'80', sortable:'sortable'}, 
                        // {label:'Operator ID', value:'party_id', width:'40', sortable:'sortable'},
                        {label:'Status', value:'', width:'60', filter:status_filter_item, filter_method:status_filter}, 
                        {label:'Publish', value:'publish', width:'30', filter:publish_filter_item, filter_method:publish_filter},
                        // {label:'Parking', value:'parking_str', width:'50'}, 
                        {label:'', value:'detail', width:'40', type:'button'}
                      ]

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
    styles: msi_style.map_style
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
  console.log(LocationData)
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

<style lang="scss">

.station {
  position: relative;
  width: 100%;
  height: 100%;
  .station-detail {
    width:450px;
    position: absolute;
    display: flex;
    flex-direction: column;
    right: 0;
    top: 0;
    height: 100%;
    background-color: #566575;
    .station-detail-button {
      display: flex;
      flex-direction: row;
      .arrow{
        width: 35px;
        height: 35px;
        margin: 14px 0px 0px 18px;
        background-color: transparent;
        border: 0;
        color:#FFFFFF
      }
      .pen{
        width: 35px;
        height: 35px;
        margin: 14px 0px 0px 344px;
        background-color: transparent;
        border: 0;
        color:#FFFFFF
      }
    }
    .station-detail-lat-lng {
      display: flex;
      flex-direction: row;
      .lat {
        color: #92a9c4;
        font-size: 15px;
        margin-left: 34px;
      }
      .lng {
        color: #92a9c4;
        font-size: 15px;
        margin-left: 20px;
      }
    }
    .location-name {
      font-size: 35px;
      margin: 12px 0px 0px 12px;
      color: #FFFFFF;
    }
    .location-addr {
      display: flex;
      flex-direction: row;
      .addr-img {
        width: 20px;
        height: 20px;
        background-color: transparent;
        border: 0;
        color:#FFFFFF;
        margin-left: 34px;
        margin-left: 10px;
      }
      p{
        margin: 0px;
        font-size: 16px;
        color:#FFFFFF;
      }
    }
    .status {
      margin-left: 40px;
      .status{
        font-size: 18px;
      }
      img{
        width: 40px;
        height: 40px;
      }
      .type {
        font-size: 22px;
        color: #FFFFFF;
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
      button {
        width: 160px;
        height: 30px;
        font-size: 22px;
        border-radius: 20px;
      }
    }
  }
  .station-list {
    width: calc(100% - 40px);
    height: calc(100% - 120px);
    // margin-left: 40px;
    top: 120px;
    left : 40px;
    position: absolute;
  }
  .station-map {
    width: 100%;
    height: 100%;
  }
  .mode {
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
  .add-station {
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
}

.custom-info-window {
    font-size: 25px;
    font-weight:bold;
  }
  .el-tag {
    margin-left: 10px;
  }
</style>