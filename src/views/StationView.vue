<script setup>
import ApiFunc from '@/composables/ApiFunc'
import msi from '../assets/msi_style'
import hotelPng from '@/assets/img/station_list_type_hotel.png'
import restaurantPng from '@/assets/img/station_list_type_restaurant.png'
import mallPng from '@/assets/img/station_list_type_mall.png'
import parkingPng from '@/assets/img/station_list_type_parking.png'
import trainPng from '@/assets/img/station_list_type_train.png'
import { ref, reactive, watch , computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter, onBeforeRouteUpdate } from 'vue-router'
import { useMStore } from '../stores/m_cloud'
import { storeToRefs } from 'pinia'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const MStore = useMStore()
const MsiApi = ApiFunc()
const { header_left_component } = storeToRefs(MStore)
const route = useRoute()
const router = useRouter()
const stationMap = ref()
const display_mode = ref('Map Mode')
const show_stataion_detail = ref(false)
const LocationData = reactive([])
const SideBarInfo = reactive([])
const facilities_filter_item = [
  { text: 'Hotel', value: 'HOTEL' },
  { text: 'Restaurant', value: 'RESTAURANT' },
  { text: 'Mall', value: 'MALL' },
  { text: 'Super Market', value: 'SUPERMARKET' },
  { text: 'Parking Lot', value: 'PARKING_LOT' },
  { text: 'Others', value: 'WIFI' },
]
const publish_filter_item = [
  { text: 'True', value: true },
  { text: 'False', value: false },
]
const status_filter_item = [
  { text: 'AVAILABLE', value: 'AVAILABLE' },
  { text: 'CHARGING', value: 'CHARGING' },
  { text: 'UNKNOWN', value: 'UNKNOWN' },
  { text: 'ERROR', value: 'ERROR' },
]
const addStationStated = computed(() => {
  return show_stataion_detail.value
    ? 'add-station-open-detail'
    : 'add-station-close-detail'
})
let map1 = null
let mode = route.query.mode
const google = window.google

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
  for (let i = 0; i < rowData.facilities.length; i++) {
    if (value === rowData.facilities[i]) return rowData.facilities_img
  }
}
const status_filter = (value, rowData) => {
  if (value === 'AVAILABLE') {
    if (rowData.state_available_str > 0) return rowData
  }
  if (value === 'CHARGING') {
    if (rowData.state_charging_str > 0) return rowData
  }
  if (value === 'UNKNOWN') {
    if (rowData.state_unknown_str > 0) return rowData
  }
  if (value === 'OUTOFORDER') {
    if (rowData.state_error_str > 0) return rowData
  }
}
const publish_filter = (value, rowData) => {
  return rowData.publish === value
}
const detail_info = (row) => {
  router.push({ name: 'stationDetail', query: { id: row.id } })
}
const add_station = () => {
  router.push({ name: 'stationEdit', query: {} })
}
const close_detail = () => {
  show_stataion_detail.value = false
}
const edit_detail = () => {
  router.push({ name: 'stationEdit', query: { id: SideBarInfo.id } })
}
const changeMode = async () => {
  show_stataion_detail.value = false
  if (display_mode.value === 'Map Mode') {
    await router.push('station?mode=list')
    history.replaceState(history.state, '', 'station?mode=list')
    display_mode.value = 'List Mode'
    header_left_component.value = ''
  } else {
    await router.push('station?mode=map')
    history.replaceState(history.state, '', 'station?mode=map')
    display_mode.value = 'Map Mode'
    header_left_component.value = 'station_map'
  }
}
const initMap = async () => {
  map1 = new google.maps.Map(stationMap.value, {
    center: { lat: 23.5825, lng: 120.5855 },
    zoom: 8,
    maxZoom: 30,
    minZoom: 3,
    streetViewControl: true,
    mapTypeControl: false,
    styles: msi.map_style,
  })
}
const setMarker = async () => {
  let image = null
  let currentInfoWindow = null

  for (let i = 0; i < LocationData.length; i++) {
    if (LocationData[i].state_error_str > 0) {
      image = 'https://storage.googleapis.com/msi-common/pic/station_error.png'
    } else if (LocationData[i].state_unknown_str > 0) {
      image = 'https://storage.googleapis.com/msi-common/pic/station_offline.png'
    } else if (
      LocationData[i].state_available_str === 0 &&
      LocationData[i].state_charging_str > 0
    ) {
      image = 'https://storage.googleapis.com/msi-common/pic/station_charging.png'
    } else if (LocationData[i].state_available_str > 0) {
      image = 'https://storage.googleapis.com/msi-common/pic/station_available.png'
    } else {
      image = 'https://storage.googleapis.com/msi-common/pic/station_offline.png'
    }

    let marker = new google.maps.Marker({
      position: {
        lat: parseFloat(LocationData[i].coordinates.latitude),
        lng: parseFloat(LocationData[i].coordinates.longitude),
      },
      map: map1,
      icon: image,
    })

    let infowindow = new google.maps.InfoWindow({
      content: '<div class="custom-info-window">' + LocationData[i].name + '</div>',
      maxWidth: 300,
    })
    marker.addListener('click', () => {
      if (currentInfoWindow) {
        currentInfoWindow.close()
      }
      currentInfoWindow = infowindow
      infowindow.open(map1, marker)
      show_stataion_detail.value = true
      SideBarInfo.length = 0
      Object.assign(SideBarInfo, LocationData[i])
    })
    if (LocationData[i].publish === true) LocationData[i].publish_str = 'True'
    else LocationData[i].publish_str = 'False'
  }
}
const displayLayout = () => {
  mode = route.query.mode
  if (route.path === '/station' && (mode === 'map' || mode === undefined)) {
    header_left_component.value = 'station_map'
    display_mode.value = 'Map Mode'
  }

  if (mode === 'list') {
    display_mode.value = 'List Mode'
    header_left_component.value = ''
  } else {
    display_mode.value = 'Map Mode'
    header_left_component.value = 'station_map'
    show_stataion_detail.value = false
  }
}
onBeforeRouteUpdate(async () => {
  displayLayout()
})
onMounted(async () => {
  let queryData = { database: 'OCPI', collection: 'Location', query: {} }
  const response = await MsiApi.mongoQuery(queryData)
  LocationData.length = 0
  Object.assign(LocationData, response.data.all)
  for (let i = 0; i < LocationData.length; i++) {
    LocationData[i].state_available_str = LocationData[
      i
    ].state_charging_str = LocationData[i].state_unknown_str = LocationData[
      i
    ].state_error_str = 0
    LocationData[i].state_total_str = LocationData[i].evses.length
    for (let j = 0; j < LocationData[i].evses.length; j++) {
      if (LocationData[i].evses[j].status === 'AVAILABLE')
        LocationData[i].state_available_str += 1
      else if (LocationData[i].evses[j].status === 'CHARGING')
        LocationData[i].state_charging_str += 1
      else if (LocationData[i].evses[j].status === 'UNKNOWN')
        LocationData[i].state_unknown_str += 1
      else if (LocationData[i].evses[j].status === 'OUTOFORDER')
        LocationData[i].state_error_str += 1
    }
    LocationData[i].facilities_str = LocationData[i].facilities?.[0]

    // if (LocationData[i].parking_type === "PARKING_LOT")
    //   LocationData[i].parking_str = 'PARKING'

    if (LocationData[i].facilities_str === 'HOTEL') {
      LocationData[i].facilities_img = hotelPng
    } else if (LocationData[i].facilities_str === 'RESTAURANT') {
      LocationData[i].facilities_img = restaurantPng
    } else if (LocationData[i].facilities_str === 'MALL') {
      LocationData[i].facilities_img = mallPng
    } else if (LocationData[i].facilities_str === 'SUPERMARKET') {
      LocationData[i].facilities_img = mallPng
    } else if (LocationData[i].facilities_str === 'PARKING_LOT') {
      LocationData[i].facilities_img = parkingPng
    } else {
      LocationData[i].facilities_img = trainPng
    }
  }
  if (
    route.path === '/station' &&
    (route.query.mode === 'map' || route.query.mode === undefined)
  ) {
    header_left_component.value = 'station_map'
  }
  if (mode === 'list') {
    display_mode.value = 'List Mode'
    header_left_component.value = ''
  } else {
    display_mode.value = 'Map Mode'
    header_left_component.value = 'station_map'
    show_stataion_detail.value = false
  }
  initMap()
  setMarker()
})
onUnmounted(() => {
  header_left_component.value = ''
})
</script>

<template>
  <div class="station">
    <div
      class="btnGroup w-80% md:w-full px-5px md:px-40px absolute top-10px md:top-40px md:flex justify-between z-10"
    >
      <el-button class="mode-btn" @click="changeMode"> {{ display_mode }}</el-button>
      <el-button
        class="btn-secondary box-shadow"
        :class="addStationStated"
        @click="add_station"
        >Add Station</el-button
      >
    </div>
    <div class="list container lg" v-show="display_mode === 'List Mode'">
      <div class="station-list relative top-120px">
        <div class="overflow-x-auto">
          <div class="pb-40px">
            <el-table
              :data="LocationData"
              class="white-space-nowrap text-primary"
              height="calc(100vh - 220px)"
              style="width: 100%"
              stripe
              size="large"
              :cell-style="msi.tb_cell"
              :header-cell-style="msi.tb_header_cell"
            >
              <el-table-column
                prop="facilities"
                label="Type"
                align="center"
                :filters="facilities_filter_item"
                :filter-method="facilities_filter"
                min-width="100"
              >
                <template #default="scope">
                  <img :src="scope.row.facilities_img" />
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
                :filters="status_filter_item"
                :filter-method="status_filter"
                min-width="200"
              >
                <template #default="scope">
                  <el-tag class="bg-Available ml-10px" effect="dark">
                    {{ scope.row.state_available_str }}
                  </el-tag>
                  <el-tag class="bg-Charging ml-10px" type="success" effect="dark">
                    {{ scope.row.state_charging_str }}
                  </el-tag>
                  <el-tag class="bg-Offline ml-10px" type="info" effect="dark">
                    {{ scope.row.state_unknown_str }}
                  </el-tag>
                  <el-tag class="bg-Error ml-10px" type="danger" effect="dark">
                    {{ scope.row.state_error_str }}
                  </el-tag>
                </template>
              </el-table-column>

              <el-table-column
                prop="publish_str"
                label="Publish"
                align="center"
                :filters="publish_filter_item"
                :filter-method="publish_filter"
                min-width="120"
              />
              <el-table-column prop="detail" label="" align="center" min-width="150">
                <template #default="scope">
                  <el-button class="btn-more" @click="detail_info(scope.row)">
                    <font-awesome-icon icon="fa-solid fa-ellipsis" />
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </div>
    </div>
    <div class="map container full" v-show="display_mode === 'Map Mode'">
      <div class="station-map w-full h-full" ref="stationMap"></div>
    </div>
    <!-- --------------------------- -->
    <div class="station-detail" v-if="show_stataion_detail">
      <div class="header px-10px md:px-0">
        <div class="station-detail-button flex justify-between">
          <el-button @click="close_detail" class="arrow"
            ><font-awesome-icon icon="fa-solid fa-arrow-right"
          /></el-button>
          <el-button @click="edit_detail" class="pen"
            ><font-awesome-icon icon="fa-regular fa-pen-to-square"
          /></el-button>
        </div>

        <p class="text-26px md:text-35px text-white mt-12px mb-16px">
          {{ SideBarInfo.name }}
        </p>
        <div class="flex flex-items-center mb-12px">
          <img
            @click="edit_detail"
            class="w-20px h-20px mr-10px"
            src="@/assets/img/station_mapmode_location.png"
            alt=""
          />
          <p class="text-16px text-white">{{ SideBarInfo.address }}</p>
        </div>
        <div class="flex">
          <img
            @click="edit_detail"
            class="w-20px h-20px mr-10px cursor-pointer"
            src="@/assets/img/station_mapmode_latitude.png"
            alt=""
          />
          <p class="text-15px text-secondary line-height-20px">
            {{ SideBarInfo.coordinates.latitude }}
          </p>
          <p class="text-15px text-secondary line-height-20px ml-20px">
            {{ SideBarInfo.coordinates.longitude }}
          </p>
        </div>
        <div class="middle-line"></div>
      </div>

      <div class="scrollbar flex-grow overflow-x-auto mb-10px md:px-12px">
        <div class="flex-col mb-60px">
          <div class="mt-0px px-6px">
            <div class="flex items-center">
              <img
                class="w-30px h-30px mr-10px"
                src="@/assets/img/station_type_J1772.png"
                alt=""
              />
              <span class="text-white text-16px md:text-22px line-height-40px">{{
                'Type 1 (J1772) (' + SideBarInfo.state_total_str + ')'
              }}</span>
            </div>
            <div class="w-full pl-40px">
              <p class="available text-18px mt-16px">
                <span class="mr-10px">●</span> Available ({{
                  SideBarInfo.state_available_str
                }})
              </p>
              <p class="charging text-18px mt-16px">
                <span class="mr-10px">●</span> Charging ({{
                  SideBarInfo.state_charging_str
                }})
              </p>
              <p class="offline text-18px mt-16px">
                <span class="mr-10px">●</span> Offline ({{
                  SideBarInfo.state_unknown_str
                }})
              </p>
              <p class="error text-18px mt-16px">
                <span class="mr-10px">●</span> Error ({{ SideBarInfo.state_error_str }})
              </p>
            </div>
          </div>

          <!-- <div class="mt-16px px-6px">
            <div class="flex items-center">
              <img
                class="w-30px h-30px mr-10px"
                src="@/assets/img/station_type_J1772.png"
                alt=""
              />
              <span class="text-white text-16px md:text-22px line-height-40px">{{
                'Type 2 (Mennekes) (' + SideBarInfo.state_total_str + ')'
              }}</span>
            </div>
            <div class="w-full pl-40px">
              <p class="available text-18px mt-16px">
                <span class="mr-10px">●</span> Available ({{
                  SideBarInfo.state_available_str
                }})
              </p>
              <p class="charging text-18px mt-16px">
                <span class="mr-10px">●</span> Charging ({{
                  SideBarInfo.state_charging_str
                }})
              </p>
              <p class="offline text-18px mt-16px">
                <span class="mr-10px">●</span> Offline ({{
                  SideBarInfo.state_unknown_str
                }})
              </p>
              <p class="error text-18px mt-16px">
                <span class="mr-10px">●</span> Error ({{ SideBarInfo.state_error_str }})
              </p>
            </div>
          </div> -->
        </div>
      </div>

      <div class="footer-button mb-5px md:mb-60px">
        <el-button class="btn-secondary border-0" @click="detail_info(SideBarInfo)">
          View Details
        </el-button>
        <!-- <el-button class="btn-secondary border-0" @click="detail_info(SideBarInfo)"> Add Charger </el-button> -->
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
    width: 75%;
    max-width: 45rem;
    height: 100%;
    position: fixed;
    display: flex;
    flex-direction: column;
    right: 0;
    top: 0;
    background-color: #566575;
    padding: 12px;
    z-index: 98;
    @media (min-width: 768px) {
      padding: 16px 20px 60px;
      top: 6rem;
    }
    .station-detail-button {
      .arrow {
        background-color: transparent;
        border: 0;
        color: #ffffff;
        margin: 0 0 20px -15px;
      }
      .pen {
        background-color: transparent;
        border: 0;
        color: #ffffff;
        margin: 0 -15px 20px 0;
      }
      :deep(.svg-inline--fa) {
        height: 1.8em;
      }
    }
    .middle-line {
      width: 80%;
      border: 1px solid var(--blue-900);
      margin: 24px auto;
    }
    .footer-button {
      display: flex;
      justify-content: space-around;
    }
  }
  .mode-btn {
    width: 20rem;
    height: 4rem;
    padding: 0.8rem 2rem;
    font-size: 1.8rem;
    background-color: var(--blue-1200);
    color: var(--white);
    border-radius: 2rem;
    box-shadow: 0.7rem 1.1rem 1.2rem rgba(146, 169, 196, 0.25) !important;
  }
  .add-station-open-detail {
    @media (min-width: 768px) {
      position: absolute;
      top: 6rem;
    }
    @media (min-width: 1024px) {
      position: relative;
      top: 0;
      right: 45rem;
    }
  }
  .el-button + .el-button {
    margin-left: 0px;
    margin-top: 10px;
    @media (min-width: 768px) {
      margin-top: 0px;
    }
  }
}
:deep(.custom-info-window) {
  font-size: 25px;
  font-weight: bold;
}
.scrollbar {
  &::-webkit-scrollbar {
    width: 0.8rem;
    height: 0.8rem;
  }
  &::-webkit-scrollbar-track,
  &::-webkit-scrollbar-corner {
    background-color: var(--blue-100);
  }
  &::-webkit-scrollbar-thumb {
    background-color: var(--secondary);
    border-radius: 2rem;
  }
}
</style>
