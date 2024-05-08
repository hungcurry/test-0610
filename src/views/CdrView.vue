<script setup>
import msi from '@/assets/msi_style'
import { ref, reactive, onMounted } from 'vue'
// import { Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useI18n } from "vue-i18n"
import ApiFunc from '@/composables/ApiFunc'
import moment from "moment"
import { useMStore } from "../stores/m_cloud"

const cdr_detail_visible = ref(false) 
const now = new Date()
const select_time = ref([ new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0), new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)])
const defaultTime = ref([new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)])
const select_date = async() => {
  await getCdrData()
  await renderCdrLayout()  
}
const formatNumber = (num, round) => {
  const formattedNum = num.toFixed(round)
  const withoutTrailingZeros = formattedNum.replace(/\.?0+$/, '')
  return parseFloat(withoutTrailingZeros)
}
const MStore = useMStore()

const MsiApi = ApiFunc()
const { t } = useI18n()
const renderCdrData = reactive([])
const render_charging_periods = reactive([])
const render_tariff = reactive([])
let cdrData = []
const tariff_name = ref('')
const tariff_currency = ref('')
const tariff_min_price = ref('')


const isLoading = ref(false)

const renderCdrLayout = async () => {
  try {
    renderCdrData.length = 0
    for (const cdrElement of cdrData) {
      let cdrDataObj = {}
      let temp = new Date( (new Date(cdrElement.start_date_time).getTime()) + ((MStore.timeZoneOffset ) * -60000))
      cdrDataObj.start_date_time = (moment(temp).format("YYYY-MM-DD HH:mm:ss"))
      let temp1 = new Date( (new Date(cdrElement.end_date_time).getTime()) + ((MStore.timeZoneOffset ) * -60000))
      cdrDataObj.end_date_time = (moment(temp1).format("YYYY-MM-DD HH:mm:ss"))
      cdrDataObj.total_energy = formatNumber(cdrElement.total_energy, 4)
      cdrDataObj.total_cost = cdrElement.total_cost.incl_vat
      cdrDataObj.total_time = cdrElement.total_time
      cdrDataObj.last_updated = cdrElement.last_updated
      cdrDataObj.evse_id =  cdrElement.cdr_location.evse_id
      cdrDataObj.charging_periods_length = cdrElement.charging_periods.length
      // cdrDataObj.tariff_name = cdrElement.tariffs[0].custom.name
      cdrDataObj.tariffs = cdrElement.tariffs
      
      cdrDataObj.charging_periods = cdrElement.charging_periods
      renderCdrData.push(cdrDataObj)
    }
  } catch (error) {
    ElMessage.error(t('error'))
  }
}

const getCdrData = async () => {
  if (select_time.value == null) {
      return
  }
  try {
    if (select_time.value?.[1] == undefined) {
      select_time.value[1] = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
    }
    let queryData = { database: 'OCPI', collection: 'CDR',
    pipelines: [
      {
        "$match": {
          "$expr": {
            "$and": [
              { "$gte": ["$start_date_time", { "$dateFromString": { "dateString": select_time.value?.[0] } }] },
              { "$lte": ["$start_date_time", { "$dateFromString": { "dateString": select_time.value?.[1] } }] }]
          }
        }
      },
      { $project: { _id: 0, "cdr_location.evse_id" : 1, charging_periods:1, total_cost:1, total_energy:1, total_time:1, total_parking_time:1,
        start_date_time:1, end_date_time:1, tariffs:1,
      } }],
  }
    let response = await MsiApi.mongoAggregate(queryData)    
    if (response.status === 200) {
      cdrData = response.data.result
    }
    else {
      ElMessage.error(t('error'))
    }
  } catch (error) {
    ElMessage.error(t('error'))
  }
}

const cdr_detail = (row) => {
  render_tariff.length = 0
  render_charging_periods.length = 0
  cdr_detail_visible.value = true
  tariff_name.value= row.tariffs[0].custom.name
  tariff_currency.value = row.tariffs[0]?.currency
  if (row.tariffs[0]?.min_price?.incl_vat)
    tariff_min_price.value = row.tariffs[0]?.min_price?.incl_vat

  for (const charging_periods_ele of row.charging_periods ) {
    const charging_periods_obj = {}
    let temp = new Date( (new Date(charging_periods_ele.start_date_time).getTime()) + ((MStore.timeZoneOffset ) * -60000))
    charging_periods_obj.start_date_time = (moment(temp).format("YYYY-MM-DD HH:mm:ss"))
    charging_periods_obj.dimensions = charging_periods_ele.dimensions
    render_charging_periods.push(charging_periods_obj)
  }


  for (const tariffs_ele of row.tariffs[0].elements) {
    const tariff_obj = { restrictions_start_time:'', restrictions_end_time:'', restrictions_max_duration:'', restrictions_min_duration:'', restrictions_min_current:'',
                         restrictions_max_current:'', restrictions_max_parking_duration:'',restrictions_min_parking_duration:''
    }
    if (Object.hasOwn(tariffs_ele, 'restrictions')) {
      tariff_obj.restrictions_start_time = tariffs_ele.restrictions?.start_time
      tariff_obj.restrictions_end_time = tariffs_ele.restrictions?.end_time
      tariff_obj.restrictions_min_current = tariffs_ele.restrictions?.min_current
      tariff_obj.restrictions_max_current = tariffs_ele.restrictions?.max_current
      // if ( typeof (tariffs_ele.restrictions?.max_duration) === 'number' ) 
      //   tariff_obj.restrictions_max_duration = tariffs_ele.restrictions?.max_duration / 60
      // if ( typeof (tariffs_ele.restrictions?.min_duration) === 'number'  )
      //   tariff_obj.restrictions_min_duration = tariffs_ele.restrictions?.min_duration / 60
      if ( typeof (tariffs_ele.restrictions?.max_parking_duration) === 'number')
        tariff_obj.restrictions_max_parking_duration = tariffs_ele.restrictions?.max_parking_duration / 60
      if ( typeof (tariffs_ele.restrictions?.min_parking_duration) === 'number')
        tariff_obj.restrictions_min_parking_duration = tariffs_ele.restrictions?.min_parking_duration / 60
    }


    for (const price_component_ele of tariffs_ele.price_components) {
      price_component_ele.price_excl_vat = formatNumber(price_component_ele.price, 4)
      if (price_component_ele.vat) {
        price_component_ele.price_incl_vat = formatNumber(price_component_ele.price * (1 + price_component_ele.vat / 100), 4)
      }
      else {
        price_component_ele.price_incl_vat = price_component_ele.price
      }
      tariff_obj.price_components = tariffs_ele.price_components
    }
    render_tariff.push(tariff_obj)
  }
}

onMounted( async() => {
  isLoading.value = true
  await getCdrData()
  await renderCdrLayout()  
  isLoading.value = false
})

</script>

<template>
  <div class="customer">
    <div class="container lg">
      <div class="overflow-x-auto ">
        <div class="pb-40px mt-40px">
          <div class="date-picker w-full blue-1100">
          <el-date-picker 
            v-model="select_time" 
            class="mr-16px rounded-full"
            type="datetimerange" 
            range-separator="-"
            :prefix-icon="Calendar"
            :start-placeholder="t('start_date')" 
            :end-placeholder="t('end_date')" 
            @change="select_date()"
            :default-time="defaultTime" 
            />
        </div>
          <el-table ref="tableRef" :data="renderCdrData" class="white-space-nowrap text-primary" v-loading.fullscreen.lock="isLoading"
            height="calc(100vh - 220px)" style="width: 100%" stripe size="large" :cell-style="msi.tb_cell" :header-cell-style="msi.tb_header_cell"
            :default-sort="{ prop: 'end_date_time', order: 'descending'}">
            <el-table-column prop="start_date_time" :label="t('start_date_time')" align="center" min-width="150"/>
            <el-table-column prop="end_date_time" :label="t('end_date_time')" align="center" min-width="150"/>
            <el-table-column prop="evse_id" :label="t('evse_id')" align="center" min-width="150"/>
            <el-table-column prop="charging_periods_length" :label="t('periods')" align="center" min-width="150"/>
            <el-table-column prop="total_cost" :label="t('total_cost')" align="center" min-width="150"/>
            <el-table-column prop="total_energy" :label="t('total_energy')" align="center" min-width="150"/>
            <el-table-column prop="total_time" :label="t('total_time')" align="center" min-width="150"/>
            <el-table-column prop="detail" label="Detail" align="center" min-width="150">
              <template #default="scope">
                <el-button class="btn-more" @click="cdr_detail(scope.row)"> <font-awesome-icon icon="fa-solid fa-ellipsis" /> </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>

    <el-dialog append-to-body v-model="cdr_detail_visible" width="90%">
      <template #header="{ titleId, titleClass }">
        <div class="py-2rem relative bg-blue-100">
          <h4 :id="titleId" :class="titleClass" class="m-0 text-center text-blue-1200 font-400 text-20px lg:text-24px line-height-26px"          >
            {{ 'CDR' }}
          </h4>
        </div>
      </template>
    
    <h2> {{ 'Tariff : ' + tariff_name + ' / ' + 'Current : ' + tariff_currency +' / ' + 'Min Price :' + tariff_min_price }} </h2>
      <el-table  ref="tableRef" :data="render_tariff" class="white-space-nowrap text-primary" height="calc(30vh )"
            style="width: 100%" stripe size="large" :cell-style="msi.tb_cell" :header-cell-style="msi.tb_header_cell"
            v-loading.fullscreen.lock="isLoading">


            <el-table-column :label="t('type')" prop="price_components" min-width="100">
                <template #default="scope">
                  <div v-for="(item, index) in scope.row.price_components" :key="index">
                    <div v-if="index !== 0" class="v-line2 mt-6px mb-6px"></div>
                    {{ item.type }}
                  </div>
                </template>
              </el-table-column>
              <el-table-column :label="t('price_excl_vat')" prop="price_components" min-width="100">
                <template #default="scope">
                  <div v-for="(item, index) in scope.row.price_components" :key="index">
                    <div v-if="index !== 0" class="v-line2 mt-6px mb-6px"></div>
                    {{ item.price_excl_vat }}
                  </div>
                </template>
              </el-table-column>
              <el-table-column :label="t('price_incl_vat')" prop="price_components" min-width="100">
                <template #default="scope">
                  <div v-for="(item, index) in scope.row.price_components" :key="index">
                    <div v-if="index !== 0" class="v-line2 mt-6px mb-6px"></div>
                    {{ item.price_incl_vat }}
                  </div>
                </template>
              </el-table-column>              
              <el-table-column :label="t('vat')" prop="price_components" min-width="50">
                <template #default="scope">
                  <div v-for="(item, index) in scope.row.price_components" :key="index">
                    <div v-if="index !== 0" class="v-line2 mt-6px mb-6px"></div>
                    {{ item.vat }}
                  </div>
                </template>
              </el-table-column>
              <el-table-column :label="t('unit')" prop="price_components" min-width="50" >
                <template #default="scope">
                  <div v-for="(item, index) in scope.row.price_components" :key="index">
                    <div v-if="index !== 0" class="v-line2 mt-6px mb-6px"></div>
                    <template v-if="item.type === 'ENERGY'">
                      {{ item.step_size }}
                    </template>
                    <template v-else>
                      {{ item.step_size / 60 }}
                    </template>
                  </div>
                </template>
              </el-table-column>     

            <el-table-column prop="restrictions_start_time" :label="t('start_time')" align="center" min-width="100"/>
            <el-table-column prop="restrictions_end_time" :label="t('end_time')" align="center" min-width="100"/>
            <!-- <el-table-column prop="restrictions_min_duration" :label="t('min_duration')" align="center" min-width="100"/>
            <el-table-column prop="restrictions_max_duration" :label="t('max_duration')" align="center" min-width="100"/> -->
            <el-table-column prop="restrictions_min_current" :label="t('min_current')" align="center" min-width="100"/>
            <el-table-column prop="restrictions_max_current" :label="t('max_current')" align="center" min-width="100"/>
            <el-table-column prop="restrictions_min_parking_duration" :label="t('min_parking_duration ')" align="center" min-width="100"/>
            <el-table-column prop="restrictions_max_parking_duration" :label="t('max_parking_duration ')" align="center" min-width="100"/>
          </el-table>

    <h2>periods</h2>

          <el-table  ref="tableRef" :data="render_charging_periods" class="white-space-nowrap text-primary" height="calc(30vh)"
            style="width: 100%" stripe size="large" :cell-style="msi.tb_cell" :header-cell-style="msi.tb_header_cell"
            v-loading.fullscreen.lock="isLoading">
            <el-table-column prop="start_date_time" :label="t('start_time')"  min-width="50"/>
            <el-table-column :label="t('type')" prop="dimensions" min-width="50" >
                <template #default="scope">
                  <div v-for="(item, index) in scope.row.dimensions" :key="index">
                    <div v-if="index !== 0" class="v-line2 mt-6px mb-6px"></div>
                    {{ item.type }}
                  </div>
                </template>
              </el-table-column>     

              <el-table-column :label="t('volume')" prop="dimensions" min-width="50" >
                <template #default="scope">
                  <div v-for="(item, index) in scope.row.dimensions" :key="index">
                    <div v-if="index !== 0" class="v-line2 mt-6px mb-6px"></div>
                    {{ item.volume }}
                  </div>
                </template>
              </el-table-column>   
          </el-table>

    </el-dialog>
    
  </div>
</template>




<style lang="scss" scoped>
.customer {
  .search-input {
    width: 400px;
    height: 40px;

    :deep(.el-input__wrapper) {
      background-color: var(--el-fill-color-blank);
      border-top-left-radius: 3rem;
      border-bottom-left-radius: 3rem;
      border: 0.2rem solid var(--blue-700);
      border-right: 0.1rem solid var(--blue-700);
      box-shadow: 0.7rem 1.1rem 1.2rem rgba(146, 169, 196, 0.25) !important;
    }
    :deep(.el-input-group__append) {
      background-color: var(--el-fill-color-blank);
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
      border-top-right-radius: 3rem;
      border-bottom-right-radius: 3rem;
      border: 0.2rem solid var(--blue-700);
      border-left: 0;
      box-shadow: 0.7rem 1.1rem 1.2rem rgba(146, 169, 196, 0.25) !important;
    }
    :deep(.el-input__inner) {
      color: black;
    }
    :deep(.el-icon) {
      color: black;
    }
  }
  .el-form-item {
    display: block;
  }
  :deep(.el-form-item__label) {
    display: block;
    font-size: 1.6rem;
  }
  :deep(.el-input) {
    height: 30px;
  }
}
  
</style>