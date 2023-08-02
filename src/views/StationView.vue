<script setup>
import ApiFunc from '@/composables/ApiFunc'
import msi from '../assets/msi_style'
import hotelPng from '@/assets/img/station_list_type_hotel.png'
import restaurantPng from '@/assets/img/station_list_type_restaurant.png'
import mallPng from '@/assets/img/station_list_type_mall.png'
import parkingPng from '@/assets/img/station_list_type_parking.png'
import trainPng from '@/assets/img/station_list_type_train.png'
import GoogleMap from '@/components/GoogleMap.vue'
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter, onBeforeRouteUpdate } from 'vue-router'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { storeToRefs } from 'pinia'
import { useGoogleStore } from '@/stores/googleMap'

const MsiApi = ApiFunc()
const route = useRoute()
const router = useRouter()
const display_mode = ref('Map Mode')
const isLoading = ref(false)
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
const LocationData = reactive([])
const GoogleStore = useGoogleStore()
const { show_stataion_detail } = storeToRefs(GoogleStore)
const addStationStated = computed(() => {
  return show_stataion_detail.value
    ? 'add-station-open-detail'
    : 'add-station-close-detail'
})
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
const detail_info = (row) => {
  router.push({ name: 'stationDetail', query: { id: row.id } })
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
const add_station = () => {
  router.push({ name: 'stationEdit', query: {} })
}
const changeMode = async () => {
  show_stataion_detail.value = false
  if (display_mode.value === 'Map Mode') {
    await router.push('station?mode=list')
    history.replaceState(history.state, '', 'station?mode=list')
    display_mode.value = 'List Mode'
  } else {
    await router.push('station?mode=map')
    history.replaceState(history.state, '', 'station?mode=map')
    display_mode.value = 'Map Mode'
  }
}
const displayLayout = () => {
  mode = route.query.mode
  if (route.path === '/station' && (mode === 'map' || mode === undefined)) {
    display_mode.value = 'Map Mode'
  }
  if (mode === 'list') {
    display_mode.value = 'List Mode'
  } else {
    display_mode.value = 'Map Mode'
  }
}
const renderData = async () => {
  isLoading.value = true
  let queryData = { database: 'OCPI', collection: 'Location', query: {} }
  const response = await MsiApi.mongoQuery(queryData)
  LocationData.length = 0
  Object.assign(LocationData, response.data.all)

  LocationData.forEach((item) => {
    item.state_available_str = item.state_charging_str = item.state_unknown_str = item.state_error_str = 0
    item.state_total_str = item.evses.length

    item.evses.forEach((evse) => {
      if (evse.status === 'AVAILABLE') item.state_available_str += 1
      else if (evse.status === 'CHARGING') item.state_charging_str += 1
      else if (evse.status === 'UNKNOWN') item.state_unknown_str += 1
      else if (evse.status === 'OUTOFORDER') item.state_error_str += 1
    })

    let str = item.facilities?.[0]
    if (str === 'HOTEL') {
      item.facilities_img = hotelPng
    } else if (str === 'RESTAURANT') {
      item.facilities_img = restaurantPng
    } else if (str === 'MALL') {
      item.facilities_img = mallPng
    } else if (str === 'SUPERMARKET') {
      item.facilities_img = mallPng
    } else if (str === 'PARKING_LOT') {
      item.facilities_img = parkingPng
    } else {
      item.facilities_img = trainPng
    }
    if (item.publish === true) item.publish_str = 'True'
    else item.publish_str = 'Flash'
  })
  isLoading.value = false
}
onBeforeRouteUpdate(async () => {
  displayLayout()
})
onMounted(async () => {
  await renderData()
  displayLayout()
})
</script>

<template>
  <div class="station">
    <div
      class="btnGroup w-80% md:w-full px-5px md:px-40px absolute top-10px md:top-40px md:flex justify-between z-10"
    >
      <el-button class="mode-btn" @click="changeMode" :isOpen="show_stataion_detail">
        {{ display_mode }}</el-button
      >
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
              v-loading.fullscreen.lock="isLoading"
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
                  <span
                    class="inline-block px-4 py-0.8 text-white text-12px bg-Available ml-10px rounded-lg"
                  >
                    {{ scope.row.state_available_str }}
                  </span>
                  <span
                    class="inline-block px-4 py-0.8 text-white text-12px bg-Charging ml-10px rounded-lg"
                  >
                    {{ scope.row.state_charging_str }}
                  </span>
                  <span
                    class="inline-block px-4 py-0.8 text-white text-12px bg-Offline ml-10px rounded-lg"
                  >
                    {{ scope.row.state_unknown_str }}
                  </span>
                  <span
                    class="inline-block px-4 py-0.8 text-white text-12px bg-Error ml-10px rounded-lg"
                  >
                    {{ scope.row.state_error_str }}
                  </span>
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
      <div class="station-map w-full h-full">
        <GoogleMap :LocationData="LocationData"></GoogleMap>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.station {
  position: relative;
  width: 100%;
  height: 100%;
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
  .el-button:first-child {
    margin-bottom: 1rem;
  }
  .el-button + .el-button {
    margin-left: 0;
  }
}
</style>
