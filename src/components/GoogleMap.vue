<script setup>
import msi from '@/assets/msi_style'
import { ref, onMounted, watchEffect, onUnmounted } from 'vue'
import { useRouter, onBeforeRouteUpdate } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useGoogleStore } from '@/stores/googleMap'
import { MarkerClusterer, SuperClusterAlgorithm } from '@googlemaps/markerclusterer'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  LocationData: {
    type: Array,
    default: () => [],
  },
})
const router = useRouter()
const SideBarInfo = ref([])
const GoogleStore = useGoogleStore()
const { show_stataion_detail } = storeToRefs(GoogleStore)
const { t } = useI18n()
//-------- googleMap --------
const locationMsi = ref(props.LocationData)
const stationMap = ref()
let map = null
const infoWindow = new google.maps.InfoWindow({
  content: '',
  maxWidth: 300,
  disableAutoPan: true,
})
const algorithm = new SuperClusterAlgorithm({
  radius: 80,
  maxZoom: 14,
  log: false,
  generateId: false,
  minPoints: 2,
})
const MarkerColor = {
  primarySvg: window.btoa(`
<svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="100" cy="100" opacity=".8" r="50" fill="#2E343A"/>
  <circle cx="100" cy="100" opacity=".8" r="60" stroke="#2E343A" stroke-width="8"/>
</svg>`),
  secondarySvg: window.btoa(`
<svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="100" cy="100" opacity=".8" r="50" fill="#92a9c4"/>
  <circle cx="100" cy="100" opacity=".8" r="60" stroke="#92a9c4" stroke-width="8"/>
</svg>`),
  AvailableSvg: window.btoa(`
<svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="100" cy="100" opacity=".8" r="50" fill="#76bbf4"/>
  <circle cx="100" cy="100" opacity=".8" r="60" stroke="#76bbf4" stroke-width="8"/>
</svg>`),
  ChargingSvg: window.btoa(`
<svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="100" cy="100" opacity=".8" r="50" fill="#94eadb"/>
  <circle cx="100" cy="100" opacity=".8" r="60" stroke="#94eadb" stroke-width="8"/>
</svg>`),
  ErrorSvg: window.btoa(`
<svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="100" cy="100" opacity=".8" r="50" fill="#ef8879"/>
  <circle cx="100" cy="100" opacity=".8" r="60" stroke="#ef8879" stroke-width="8"/>
</svg>`),
  OfflineSvg: window.btoa(`
<svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="100" cy="100" opacity=".8" r="50" fill="#bcbcbc"/>
  <circle cx="100" cy="100" opacity=".8" r="60" stroke="#bcbcbc" stroke-width="8"/>
</svg>`),
}
const initMap = () => {
  map = new google.maps.Map(stationMap.value, {
    center: { lat: 23.5825, lng: 120.5855 },
    zoom: 8,
    maxZoom: 30,
    minZoom: 3,
    streetViewControl: true,
    mapTypeControl: false,
    styles: msi.map_style,
  })
}
const initData = () => {
  locationMsi.value.forEach((mark) => {
    let image = null
    if (mark.evse_outoforder_status > 0) {
      image = 'https://storage.googleapis.com/msi-common/pic/station_error.png'
      mark.state = 'error'
    } else if (mark.evse_unknown_status > 0) {
      image = 'https://storage.googleapis.com/msi-common/pic/station_offline.png'
      mark.state = 'offline'
    } else if (mark.evse_available_status === 0 && mark.evse_charging_status > 0) {
      image = 'https://storage.googleapis.com/msi-common/pic/station_charging.png'
      mark.state = 'charging'
    } else if (mark.evse_available_status > 0) {
      image = 'https://storage.googleapis.com/msi-common/pic/station_available.png'
      mark.state = 'available'
    } else {
      image = 'https://storage.googleapis.com/msi-common/pic/station_offline.png'
      mark.state = 'offline'
    }
    mark.icon = image
    mark.position = {
      lat: parseFloat(mark.coordinates.latitude),
      lng: parseFloat(mark.coordinates.longitude),
    }
  })
}
const setMarker = () => {
  const markers = locationMsi.value.map((location) => {
    const { position, icon, name, state } = location
    const label = '<div class="text-22px font-700">' + name + '</div>'
    const marker = new google.maps.Marker({
      position,
      state,
      icon: {
        url: icon,
        scaledSize: new google.maps.Size(50, 50),
      },
      gridSize: 10,
      animation: google.maps.Animation.DROP,
      draggable: false,
    })
    marker.addListener('click', () => {
      if (infoWindow) infoWindow.close()
      infoWindow.setContent(label)
      infoWindow.open(map, marker)
      show_stataion_detail.value = true
      SideBarInfo.value = []
      SideBarInfo.value = location
    })
    return marker
  })
  setMarkerClusterer(markers)
}
const setMarkerClusterer = (markers) => {
  new MarkerClusterer({
    map: map,
    markers: markers,
    renderer: {
      render: ({ count, position, markers }) => {
        let stateObj = {}
        markers.forEach(function (item) {
          if (stateObj[item.state] === undefined) {
            stateObj[item.state] = 1
          } else {
            stateObj[item.state] += 1
          }
        })
        let img = null
        if (stateObj['error']) {
          img = `data:image/svg+xml;base64,${MarkerColor.ErrorSvg}`
        } else if (stateObj['offline']) {
          img = `data:image/svg+xml;base64,${MarkerColor.OfflineSvg}`
        } else if (stateObj['charging']) {
          img = `data:image/svg+xml;base64,${MarkerColor.ChargingSvg}`
        } else {
          img = `data:image/svg+xml;base64,${MarkerColor.AvailableSvg}`
        }

        let marker = new google.maps.Marker({
          label: {
            text: `${String(count)}`,
            color: 'white',
            fontSize: '16px',
          },
          position,
          icon: {
            url: img,
            scaledSize: new google.maps.Size(75, 75),
          },
          zIndex: Number(google.maps.Marker.MAX_ZINDEX) + count,
          gridSize: 10,
        })
        return marker
      },
    },
    algorithm: algorithm,
  })
}
const closeAllInfoWindows = () => {
  if (infoWindow) infoWindow.close()
}
watchEffect(() => {
  initData()
  setMarker()
})
const detail_info = (row) => {
  router.push({ name: 'stationDetail', query: { id: row.id } })
}
const edit_detail = (inforId) => {
  router.push({ name: 'stationEdit', query: { id: inforId } })
}
const close_detail = () => {
  closeAllInfoWindows()
  show_stataion_detail.value = false
}
onBeforeRouteUpdate(() => {
  closeAllInfoWindows()
})
onMounted(() => {
  initMap()
  setMarker()
})
onUnmounted(() => {
  show_stataion_detail.value = false
})
</script>

<template>
  <div class="station-map w-full h-full" ref="stationMap"></div>
  <Transition name="slide-fade">
    <div class="station-detail" v-if="show_stataion_detail">
      <div class="header px-10px md:px-0">
        <div class="station-detail-button flex justify-between">
          <el-button @click="close_detail" class="btn-icon arrow"
            ><font-awesome-icon icon="fa-solid fa-arrow-right"
          /></el-button>
          <el-button @click="edit_detail(SideBarInfo.id)" class="btn-icon pen"
            ><font-awesome-icon icon="fa-regular fa-pen-to-square"
          /></el-button>
        </div>
        <h3 class="text-26px md:text-35px text-blue-600 font-700 mt-12px mb-16px">
          {{ SideBarInfo.name }}
        </h3>
        <ul class="SideBarInfo">
          <li
            @click="edit_detail(SideBarInfo.id)"
            class="flex items-center mb-12px cursor-pointer"
          >
            <i class="w-20px h-20px mr-10px text-white i-octicon:location-16" />
            <p class="text-16px text-white border-s-b-1">{{ SideBarInfo.country }}</p>
          </li>
          <li
            @click="edit_detail(SideBarInfo.id)"
            class="flex items-center mb-12px cursor-pointer"
          >
            <i class="w-20px h-20px mr-10px text-white i-bi:globe2" />
            <p class="text-15px text-white border-s-b-1">
              {{
                SideBarInfo.coordinates?.latitude +
                ' , ' +
                SideBarInfo.coordinates?.longitude
              }}
            </p>
          </li>
          <li class="flex items-center mb-12px" v-if="SideBarInfo.city">
            <i class="w-20px h-20px mr-10px text-white i-gis:location-man-alt" />
            <p class="text-16px text-white">
              {{ SideBarInfo.city + SideBarInfo.address }}
            </p>
          </li>
          <li class="flex items-center mb-12px" v-if="SideBarInfo.city1">
            <i
              class="w-20px h-20px mr-10px text-white i-gis:location-man-alt"
              v-if="!SideBarInfo.city"
            />
            <p
              class="text-15px text-white text-left"
              :class="{ 'pl-30px': SideBarInfo.city }"
            >
              {{ SideBarInfo.city1 + SideBarInfo.address1 }}
            </p>
          </li>
          <li class="flex items-center mb-12px">
            <i class="w-20px h-20px mr-10px text-white i-ph:eye-bold" />
            <p class="text-16px text-white">
              {{ t('publish') + ' : ' + SideBarInfo.publish_str }}
            </p>
          </li>
          <li class="flex items-center mb-12px">
            <i class="w-20px h-20px mr-10px text-white i-fluent:scan-type-24-filled" />
            <p class="text-16px text-white">
              {{ t('type') + ' : ' + SideBarInfo.facilities_str }}
            </p>
          </li>
        </ul>
        <div class="middle-line"></div>
      </div>
      <div class="scrollbar flex-grow overflow-x-auto mb-10px md:px-12px">
        <div class="flex-col mb-60px">
          <div class="type1 px-6px" v-if="SideBarInfo.type1_total > 0">
            <div class="flex items-center">
              <img
                class="w-30px h-30px mr-10px"
                src="@/assets/img/station_type_J1772.png"
                alt=""
              />
              <span class="text-white text-16px md:text-22px line-height-40px">{{
                'Type 1 (J1772) (' + SideBarInfo.type1_total + ')'
              }}</span>
            </div>

            <div class="w-full pl-40px">
              <p class="available text-18px mt-16px">
                <span class="mr-10px">●</span> {{ t('available') }} ({{
                  SideBarInfo.type1_available_str
                }})
              </p>
              <p class="charging text-18px mt-16px">
                <span class="mr-10px">●</span> {{ t('charging') }} ({{
                  SideBarInfo.type1_charging_str
                }})
              </p>
              <p class="offline text-18px mt-16px">
                <span class="mr-10px">●</span> {{ t('offline') }} ({{
                  SideBarInfo.type1_offline_str
                }})
              </p>
              <p class="error text-18px mt-16px">
                <span class="mr-10px">●</span> {{ t('error') }} ({{
                  SideBarInfo.type1_error_str
                }})
              </p>
            </div>
          </div>
          <div class="type2 px-6px" v-if="SideBarInfo.type2_total > 0">
            <div class="flex items-center">
              <img
                class="w-30px h-30px mr-10px"
                src="@/assets/img/station_type_J1772.png"
                alt=""
              />
              <span class="text-white text-16px md:text-22px line-height-40px">{{
                'Type 2 (Mennekes) (' + SideBarInfo.type2_total + ')'
              }}</span>
            </div>
            <div class="w-full pl-40px">
              <p class="available text-18px mt-16px">
                <span class="mr-10px">●</span> {{ t('available') }} ({{
                  SideBarInfo.type2_available_str
                }})
              </p>
              <p class="charging text-18px mt-16px">
                <span class="mr-10px">●</span> {{ t('charging') }} ({{
                  SideBarInfo.type2_charging_str
                }})
              </p>
              <p class="offline text-18px mt-16px">
                <span class="mr-10px">●</span> {{ t('offline') }} ({{
                  SideBarInfo.type2_offline_str
                }})
              </p>
              <p class="error text-18px mt-16px">
                <span class="mr-10px">●</span> {{ t('error') }} ({{
                  SideBarInfo.type2_error_str
                }})
              </p>
            </div>
          </div>
          <div class="others px-6px" v-if="SideBarInfo.others_total > 0">
            <div class="flex items-center">
              <img
                class="w-30px h-30px mr-10px"
                src="@/assets/img/station_type_J1772.png"
                alt=""
              />
              <span class="text-white text-16px md:text-22px line-height-40px">
                {{ t('others') + '(' + SideBarInfo.others_total + ')'}}</span>
            </div>
            <div class="w-full pl-40px">
              <p class="available text-18px mt-16px">
                <span class="mr-10px">●</span> {{ t('available') }} ({{
                  SideBarInfo.others_available_str
                }})
              </p>
              <p class="charging text-18px mt-16px">
                <span class="mr-10px">●</span> {{ t('charging') }} ({{
                  SideBarInfo.others_charging_str
                }})
              </p>
              <p class="offline text-18px mt-16px">
                <span class="mr-10px">●</span> {{ t('offline') }} ({{
                  SideBarInfo.others_offline_str
                }})
              </p>
              <p class="error text-18px mt-16px">
                <span class="mr-10px">●</span> {{ t('error') }} ({{
                  SideBarInfo.others_error_str
                }})
              </p>
            </div>
          </div>
        </div>
      </div>
      <div class="footer-button mb-5px md:mb-60px">
        <el-button class="btn-secondary border-0" @click="detail_info(SideBarInfo)">
          {{ t('view_details') }}
        </el-button>
      </div>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.station-detail {
  width: 75%;
  max-width: 45rem;
  height: 100%;
  position: fixed;
  display: flex;
  flex-direction: column;
  right: 0;
  top: 0;
  background-color: var(--blue-1100);
  padding: 1.2rem;
  z-index: 98;
  @media (min-width: 768px) {
    padding: 1.6rem 2rem 6rem;
    top: 6rem;
  }
  .station-detail-button {
    .btn-icon {
      background-color: transparent;
      border: 0;
      color: var(--white);
    }
    .arrow {
      margin: 0 0 1rem -1.5rem;
    }
    .pen {
      margin: 0 -1.5rem 1rem 0;
    }
    :deep(.svg-inline--fa) {
      height: 1.8em;
    }
  }
  .middle-line {
    width: 90%;
    border: 1px solid var(--blue-900);
    margin: 24px auto;
  }
  .footer-button {
    display: flex;
    justify-content: space-around;
  }
}
.scrollbar {
  &::-webkit-scrollbar {
    width: 0.8rem;
    height: 0.8rem;
  }
  &::-webkit-scrollbar-track,
  &::-webkit-scrollbar-corner {
    background-color: var(--blue-100);
    border-radius: 2rem;
  }
  &::-webkit-scrollbar-thumb {
    background-color: var(--secondary);
    border-radius: 2rem;
  }
}
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}
.slide-fade-leave-active {
  transition: all 0.6s ease-out;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
