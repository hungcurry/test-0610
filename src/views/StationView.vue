<script setup>
import ApiFunc from '@/composables/ApiFunc'
import msi from '../assets/msi_style'
import hotelPng from '@/assets/img/station_list_type_hotel.png'
import restaurantPng from '@/assets/img/station_list_type_restaurant.png'
import mallPng from '@/assets/img/station_list_type_mall.png'
import museumPng from '@/assets/img/station_list_type_museum.png'
import parkingPng from '@/assets/img/station_list_type_parking.png'
import trainPng from '@/assets/img/station_list_type_train.png'
import GoogleMap from '@/components/GoogleMap.vue'
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter, onBeforeRouteUpdate } from 'vue-router'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { storeToRefs } from 'pinia'
import { useGoogleStore } from '@/stores/googleMap'
import { useI18n } from 'vue-i18n'
import { useMStore } from '@/stores/m_cloud'
const MStore = useMStore()
const { t } = useI18n()
const MsiApi = ApiFunc()
const route = useRoute()
const router = useRouter()
const display_mode = ref('Map Mode')
const isLoading = ref(false)
const facilities_filter_item = [
  { text: t('hotel'), value: 'HOTEL' },
  { text: t('restaurant'), value: 'RESTAURANT' },
  { text: t('mall'), value: 'MALL' },
  { text: t('super_market'), value: 'SUPERMARKET' },
  { text: t('parking_lot'), value: 'PARKING_LOT' },
  { text: t('others'), value: 'WIFI' },
]
const publish_filter_item = [
  { text: t('true'), value: true },
  { text: t('false'), value: false },
]
const status_filter_item = [
  { text: t('available'), value: 'AVAILABLE' },
  { text: t('charging'), value: 'CHARGING' },
  { text: t('offline'), value: 'UNKNOWN' },
  { text: t('error'), value: 'ERROR' },
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
  if (
    (value === 'AVAILABLE' && rowData.evse_available_status > 0) ||
    (value === 'CHARGING' && rowData.evse_charging_status > 0) ||
    (value === 'UNKNOWN' && rowData.evse_unknown_status > 0) ||
    (value === 'OUTOFORDER' && rowData.evse_outoforder_status > 0)
  ) {
    return rowData
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
  if (display_mode.value === t('map_mode')) {
    await router.push('station?mode=list')
    history.replaceState(history.state, '', 'station?mode=list')
    display_mode.value = t('list_mode')
  } else {
    await router.push('station?mode=map')
    history.replaceState(history.state, '', 'station?mode=map')
    display_mode.value = t('map_mode')
  }
}
const displayLayout = () => {
  mode = route.query.mode
  if (route.path === '/station' && (mode === 'map' || mode === undefined)) {
    display_mode.value = t('map_mode')
  }
  if (mode === 'list') {
    display_mode.value = t('list_mode')
  } else {
    display_mode.value = t('map_mode')
  }
}
const renderData = async () => {
  isLoading.value = true
  let queryData1 = {
    database: 'OCPI',
    collection: 'Location',
    pipelines: [
      {
        $lookup: { from: 'EVSE', localField: 'evses', foreignField: '_id', as: 'EVSES' },
      },
      {
        $lookup: {
          from: 'Connector',
          localField: 'EVSES.connectors',
          foreignField: '_id',
          as: 'Connector',
        },
      },
      {
        $project: {
          country_code: 0,
          directions: 0,
          party_id: 0,
          last_updated: 0,
          time_zone: 0,
          evses: 0,
          'EVSES.evse_id': 0,
          'EVSES.floor_level': 0,
          'EVSES.last_updated': 0,
          'EVSES.uid': 0,
          'EVSES._id': 0,
          'Connector.id': 0,
          'Connector.format': 0,
          'Connector.last_updated': 0,
          'Connector.max_amperage': 0,
          'Connector.max_electric_power': 0,
          'Connector.max_voltage': 0,
          'Connector.power_type': 0,
          'Connector.tariff_ids': 0,
        },
      },
    ],
  }
  let res = await MsiApi.mongoAggregate(queryData1)
  LocationData.length = 0
  Object.assign(LocationData, res.data.result)
  LocationData.forEach((item) => {
    let result = {}
    item.evse_available_status = item.evse_unknown_status = item.evse_charging_status = item.evse_outoforder_status = 0
    item.type1_available_str = item.type1_charging_str = item.type1_offline_str = item.type1_error_str = item.type1_total = 0
    item.type2_available_str = item.type2_charging_str = item.type2_offline_str = item.type2_error_str = item.type2_total = 0
    item.others_available_str = item.others_charging_str = item.others_offline_str = item.others_error_str = item.others_total = 0
    item.EVSES.forEach((itemEntry) => {
      if (itemEntry.status === 'AVAILABLE') item.evse_available_status++
      if (itemEntry.status === 'UNKNOWN') item.evse_unknown_status++
      if (itemEntry.status === 'CHARGING') item.evse_charging_status++
      if (itemEntry.status === 'OUTOFORDER') item.evse_outoforder_status++
      itemEntry.connectors.forEach((EVSEconnectorsId) => {
        let itemType = item.Connector.find(
          (connectorId) => connectorId._id === EVSEconnectorsId
        )?.standard
        if (itemType) {
          result[itemType] = result[itemType] || {}
          result[itemType][itemEntry.status] =
            (result[itemType][itemEntry.status] || 0) + 1
        }
      })
    })
    const addr_parts = item.address.split('\n')
    const city_parts = item.city.split('\n')
    if (addr_parts.length === 2) {
      item.address = addr_parts[0]
      item.address1 = addr_parts[1]
    }
    if (city_parts.length === 2) {
      item.city = city_parts[0]
      item.city1 = city_parts[1]
    }

    item.connector_status = result
    if (item.publish === true) item.publish_str = t('true')
    else item.publish_str = t('false')

    Object.keys(result).forEach((key) => {
      switch (key) {
        case 'IEC_62196_T1':
          if (result[key].AVAILABLE) item.type1_available_str = result[key].AVAILABLE
          if (result[key].CHARGING) item.type1_charging_str = result[key].CHARGING
          if (result[key].UNKNOWN) item.type1_offline_str = result[key].UNKNOWN
          if (result[key].OUTOFORDER) item.type1_error_str = result[key].OUTOFORDER
          item.type1_total =
            item.type1_available_str +
            item.type1_charging_str +
            item.type1_offline_str +
            item.type1_error_str
          break
        case 'IEC_62196_T2':
          if (result[key].AVAILABLE) item.type2_available_str = result[key].AVAILABLE
          if (result[key].CHARGING) item.type2_charging_str = result[key].CHARGING
          if (result[key].UNKNOWN) item.type2_offline_str = result[key].UNKNOWN
          if (result[key].OUTOFORDER) item.type2_error_str = result[key].OUTOFORDER
          item.type2_total =
            item.type2_available_str +
            item.type2_charging_str +
            item.type2_offline_str +
            item.type2_error_str
          break
        default:
          if (result[key].AVAILABLE) item.others_available_str = result[key].AVAILABLE
          if (result[key].CHARGING) item.others_charging_str = result[key].CHARGING
          if (result[key].UNKNOWN) item.others_offline_str = result[key].UNKNOWN
          if (result[key].OUTOFORDER) item.others_error_str = result[key].OUTOFORDER
          item.others_total =
            item.others_available_str +
            item.others_charging_str +
            item.others_offline_str +
            item.others_error_str
      }
    })
    switch (item.facilities?.[0]) {
      case 'HOTEL':
        item.facilities_img = hotelPng
        item.facilities_str = t('hotel')
      break
      case 'RESTAURANT':
        item.facilities_img = restaurantPng
        item.facilities_str = t('restaurant')
      break
      case 'MALL':
        item.facilities_img = mallPng
        item.facilities_str = t('mall')
      break
      case 'SUPERMARKET':
        item.facilities_img = museumPng
        item.facilities_str = t('super_market')
      break
      case 'PARKING_LOT':
        item.facilities_img = parkingPng
        item.facilities_str = t('parking_lot')
      break
      default:  
        item.facilities_img = trainPng
        item.facilities_str = t('others')
    }
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
        v-if="MStore.rule_permission.Station.addStation === 'O' || MStore.permission.isCompany"  
        class="btn-secondary box-shadow"
        :class="addStationStated"
        @click="add_station"
        >{{t('add_station')}}</el-button
      >
    </div>
    <div class="list container lg" v-show="display_mode === t('list_mode')">
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
              :default-sort="{ prop: 'country', order: 'ascending' }"
            >
              <el-table-column
                prop="facilities"
                :label="t('type')"
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
                :label="t('name')"
                align="center"
                sortable
                :sort-method="(a, b) => sortFunc(a, b, 'name')"
                min-width="200"
              />
              <el-table-column
                prop="country"
                :label="t('country')"
                align="center"
                sortable
                :sort-method="(a, b) => sortFunc(a, b, 'country')"
                min-width="150"
              />
              <el-table-column
                prop="city"
                :label="t('city')"
                align="center"
                sortable
                :sort-method="(a, b) => sortFunc(a, b, 'city')"
                min-width="150"
              />
              <el-table-column
                prop="address"
                :label="t('address')"
                align="center"
                sortable
                :sort-method="(a, b) => sortFunc(a, b, 'address')"
                min-width="200"
              />
              <el-table-column
                prop="city1"
                :label="t('city_en')"
                align="center"
                sortable
                :sort-method="(a, b) => sortFunc(a, b, 'city1')"
                min-width="150"
              />
              <el-table-column
                prop="address1"
                :label="t('address_en')"
                align="center"
                sortable
                :sort-method="(a, b) => sortFunc(a, b, 'address1')"
                min-width="200"
              />
              <el-table-column
                prop=""
                :label="t('status')"
                align="center"
                :filters="status_filter_item"
                :filter-method="status_filter"
                min-width="200"
              >
                <template #default="scope">
                  <span
                    class="inline-block px-4 py-0.8 text-white text-12px bg-Available ml-10px rounded-lg"
                  >
                    {{ scope.row.evse_available_status }}
                  </span>
                  <span
                    class="inline-block px-4 py-0.8 text-white text-12px bg-Charging ml-10px rounded-lg"
                  >
                    {{ scope.row.evse_charging_status }}
                  </span>
                  <span
                    class="inline-block px-4 py-0.8 text-white text-12px bg-Offline ml-10px rounded-lg"
                  >
                    {{ scope.row.evse_unknown_status }}
                  </span>
                  <span
                    class="inline-block px-4 py-0.8 text-white text-12px bg-Error ml-10px rounded-lg"
                  >
                    {{ scope.row.evse_outoforder_status }}
                  </span>
                </template>
              </el-table-column>

              <el-table-column
                prop="publish_str"
                :label="t('publish')"
                align="center"
                :filters="publish_filter_item"
                :filter-method="publish_filter"
                min-width="100"
              />
              <el-table-column prop="detail" label="" align="center" min-width="100">
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
    <div class="map container full" v-show="display_mode === t('map_mode')">
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
