<script setup>
import msi from '@/assets/msi_style'
import { ref, computed , onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { GoogleMap, Marker, MarkerCluster, InfoWindow } from 'vue3-google-map'
import { storeToRefs } from 'pinia'
import { useGoogleStore } from '@/stores/googleMap'
import { useI18n } from "vue-i18n"

const { t } = useI18n()
const props = defineProps({
  LocationData: {
    type: Array,
    default: () => [],
  },
})
const router = useRouter()
const SideBarInfo = ref([])
const infoWindowRef = ref(null)
const center = ref({ lat: 23.5825, lng: 120.5855 })
const GoogleStore = useGoogleStore()
const { show_stataion_detail } = storeToRefs(GoogleStore)
const locationMsi = computed(() => {
  let image = null
  let data = []
  props.LocationData.forEach((mark) => {
    if (mark.evse_outoforder_status > 0) {
      image = 'https://storage.googleapis.com/msi-common/pic/station_error.png'
    } else if (mark.evse_unknown_status > 0) {
      image = 'https://storage.googleapis.com/msi-common/pic/station_offline.png'
    } else if (mark.evse_available_status === 0 && mark.evse_charging_status > 0) {
      image = 'https://storage.googleapis.com/msi-common/pic/station_charging.png'
    } else if (mark.evse_available_status > 0) {
      image = 'https://storage.googleapis.com/msi-common/pic/station_available.png'
    } else {
      image = 'https://storage.googleapis.com/msi-common/pic/station_offline.png'
    }
    data.push({
      lat: parseFloat(mark.coordinates.latitude),
      lng: parseFloat(mark.coordinates.longitude),
      icon: image,
      id: mark._id,
      name: mark.name,
    })
  })
  return data
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
const clickHandler = (id) => {
  show_stataion_detail.value = true
  closeAllInfoWindows()
  SideBarInfo.value = []
  SideBarInfo.value = props.LocationData.find((item) => {
    return item._id === id
  })
}
const closeAllInfoWindows = () => {
  infoWindowRef.value.forEach((item) => {
    if (item.infoWindow) item.infoWindow.close()
  })
}
onUnmounted(() => {
  show_stataion_detail.value = false
})
</script>

<template>
  <GoogleMap
    api-key="AIzaSyDD5YBm59uRv8ppJRDNWlWNgf1xcjhR2-g"
    style="width: 100%; height: 100%"
    :center="center"
    :zoom="8"
    :maxZoom="30"
    :minZoom="3"
    :streetViewControl="true"
    :mapTypeControl="false"
    :styles="msi.map_style"
  >
    <MarkerCluster>
      <Marker
        v-for="location in locationMsi"
        :key="location._id"
        :options="{ position: location, icon: location.icon }"
        @click="clickHandler(location.id)"
      >
        <InfoWindow ref="infoWindowRef">
          <div>
            <p class="text-20px font-700">{{ location.name }}</p>
          </div>
        </InfoWindow>
      </Marker>
    </MarkerCluster>
  </GoogleMap>
  <Transition name="slide-fade">
    <div class="station-detail" v-if="show_stataion_detail">
      <div class="header px-10px md:px-0">
        <div class="station-detail-button flex justify-between">
          <el-button @click="close_detail" class="arrow"
            ><font-awesome-icon icon="fa-solid fa-arrow-right"
          /></el-button>
          <el-button @click="edit_detail(SideBarInfo.id)" class="pen"
            ><font-awesome-icon icon="fa-regular fa-pen-to-square"
          /></el-button>
        </div>

        <p class="text-26px md:text-35px text-white mt-12px mb-16px">
          {{ SideBarInfo.name }}
        </p>

        <div class="flex flex-items-center mb-12px">
          <img
            @click="edit_detail(SideBarInfo.id)"
            class="w-20px h-20px mr-10px cursor-pointer"
            src="@/assets/img/station_mapmode_location.png"
            alt=""
          />
          <p class="text-16px text-white">{{ 'Country : ' + SideBarInfo.country}}</p>
        </div>
        
        <div class="flex flex-items-center mb-12px" v-if="SideBarInfo.city">
          
          <p class="text-16px text-white">{{ t('address') + ' : ' + SideBarInfo.city + SideBarInfo.address}}</p>
        </div>
        <div class="flex flex-items-center mb-12px" v-if="SideBarInfo.city1">

          <p class="text-16px text-white">{{ t('address_en') + ' : ' + SideBarInfo.city1 + SideBarInfo.address1}}</p>
        </div>
        <div class="flex">
          <img
            @click="edit_detail(SideBarInfo.id)"
            class="w-20px h-20px mr-10px cursor-pointer"
            src="@/assets/img/station_mapmode_latitude.png"
            alt=""
          />
          <p class="text-15px text-white line-height-20px">
            {{ t('coordinates') +' : ' + SideBarInfo.coordinates?.latitude + ' , ' +SideBarInfo.coordinates?.longitude}}
          </p>
        </div>
        <br>
        <div class="flex flex-items-center mb-12px">
          <p class="text-16px text-white">{{ t('publish') + ' : ' + SideBarInfo.publish_str}}</p>
        </div>

        <div class="flex flex-items-center mb-12px">
          <p class="text-16px text-white">{{ t('type') + ' : ' + SideBarInfo.facilities_str}}</p>
        </div>

        <div class="middle-line"></div>
      </div>
      <div class="scrollbar flex-grow overflow-x-auto mb-10px md:px-12px">
        <div class="flex-col mb-60px">
          <div class="mt-0px px-6px" v-if="SideBarInfo.type1_total > 0">
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
                <span class="mr-10px">●</span> {{ t('error') }} ({{ SideBarInfo.type1_error_str }})
              </p>
            </div>
          </div>
          <div class="mt-16px px-6px"  v-if="SideBarInfo.type2_total > 0">
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
                <span class="mr-10px">●</span> {{ t('error') }} ({{ SideBarInfo.type2_error_str }})
              </p>
            </div>
          </div>

          <div class="mt-16px px-6px" v-if="SideBarInfo.others_total > 0">
            <div class="flex items-center">
              <img
                class="w-30px h-30px mr-10px"
                src="@/assets/img/station_type_J1772.png"
                alt=""
              />
              <span class="text-white text-16px md:text-22px line-height-40px">{{
                'Others (' + SideBarInfo.others_total + ')'
              }}</span>
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
                <span class="mr-10px">●</span> {{ t('error') }} ({{ SideBarInfo.others_error_str }})
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
