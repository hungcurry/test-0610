<script setup>
import {  reactive, onMounted, ref} from 'vue'
import {useRouter } from 'vue-router'
import ApiFunc from '@/composables/ApiFunc'
import msi from '@/assets/msi_style'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { ElMessageBox,ElMessage } from 'element-plus'

const router = useRouter()
const MsiApi = ApiFunc()
const TariffData = reactive([])
const isLoading = ref(false)
// const day = ['Mon.', 'Tue.', 'Wed.', 'Thu', 'Fri.', 'Sat.', 'Sun.']
// const tariff_select = ref ('Charging')
// const charging_select = ref ('Time')
// const addTariffFormVisible = ref(false)
// const TariffOptions = [ { value: 'Charging', label: 'Charging',}, {value: 'Parking',label: 'Parking',}  ]
// const ChargingOptions = [{ value: 'Time', label:'by Time'}, { value: 'Energy', label:'by Energy'}]

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

const deleteTariff = async (row) => {
  let queryData = { "database":"OCPI", "collection":"Connector", "pipelines": [
    { $match: { "tariff_ids": {"UUID" : row.id} }}, { "$project": {"_id": 1,}}
  ]}

  let response = await MsiApi.mongoAggregate(queryData)
  let used_connector = response.data.result
  queryData = { "database":"OCPI", "collection":"EVSE", "pipelines": [
    { "$project": {"_id": 0, "connectors": 1, "evse_id":1}}]
  }
  response = await MsiApi.mongoAggregate(queryData)
  let evse = response.data.result
  let used_evse = []
  for (let i = 0; i < used_connector.length; i++) {
    for (let j = 0; j < evse.length; j++) {
      if (used_connector[i]._id === evse[j].connectors[0]) {
        used_evse.push(evse[j].evse_id)
      }
    }
  }

  if(used_evse.length !== 0) {
    let used_evse_str =''
    for (let k = 0; k < used_evse.length; k++) {
      used_evse_str += used_evse[k] + ' / ' 
    }
    ElMessage.error(used_evse_str + 'in using')
  }
  else {
    let sendData = { class : 'Tariff', id : row.id }
    ElMessageBox.confirm('Are you sure you want to delete?','Warning', {confirmButtonText: 'OK', cancelButtonText: 'Cancel', type: 'warning'})
    .then(async () => {
      console.log(await MsiApi.setCollectionData('delete', 'ocpi', sendData))
      let queryData = { "database":"OCPI", "collection":"Tariff", "query": {}}
      let response = await MsiApi.mongoQuery(queryData)
      TariffData.length = 0
      Object.assign(TariffData, response.data.all) 
      for (let i = 0; i < TariffData.length; i++) {
        TariffData[i].tariff_text = TariffData[i].tariff_alt_text[0].text
        TariffData[i].tariff_name = TariffData[i].energy_mix?.supplier_name
      }
    })
    .catch((e)=>{
      console.log(e)
    })
  }
}

const editTariff = (row) => {
  router.push({ name: 'ratePlanDetail', query:{id:row._id} })
}

const copyTariff = (row) => {
  let senddata = Object.assign(TariffData[row.$index])
  delete senddata._id
  delete senddata.id
  senddata.class = 'Tariff'
  senddata.party_id = 'MSI'
  ElMessageBox.confirm('Are you sure you want to create?','Warning', {confirmButtonText: 'OK', cancelButtonText: 'Cancel', type: 'warning'})
  .then(async () => {
  if (senddata.profile_name === undefined ) {ElMessage.error('Oops, Profile Name required.')}
  else if (senddata.country_code === undefined ) {ElMessage.error('Oops, Country Code required.')}
  else if (senddata.currency === undefined) {ElMessage.error('Oops, Currency required.')}
  else {
    let res = await MsiApi.setCollectionData('post', 'ocpi', senddata)
  
    let queryData = { "database":"OCPI", "collection":"Tariff", "query": {}}
    let response = await MsiApi.mongoQuery(queryData)
    TariffData.length = 0
    Object.assign(TariffData, response.data.all) 
    for (let i = 0; i < TariffData.length; i++) {
      TariffData[i].tariff_text = TariffData[i].tariff_alt_text[0].text
      TariffData[i].tariff_name = TariffData[i].energy_mix?.supplier_name
    }

    ElMessage.error(res.data.message)
  }
  })
  .catch((e)=>{
    console.log(e)
  })
}

onMounted( async() => {
  isLoading.value = true
  let queryData = { "database":"OCPI", "collection":"Tariff", "query": {}}
  let response = await MsiApi.mongoQuery(queryData)
  Object.assign(TariffData, response.data.all) 
  for (let i = 0; i < TariffData.length; i++) {
    TariffData[i].tariff_text = TariffData[i].tariff_alt_text[0].text
    TariffData[i].tariff_name = TariffData[i].energy_mix?.supplier_name
    TariffData[i].min_price_str = TariffData[i]?.min_price?.incl_vat
    TariffData[i].max_price_str = TariffData[i]?.max_price?.incl_vat
  }
  isLoading.value = false
})

</script>

<template>
  <div class="tariff">
    <div class="container lg">
      <div class="flex flex-justify-end flex-wrap lg:flex-nowrap pt-40px pb-32px">
        <el-button class="btn-secondary box-shadow" @click="editTariff"> Add Rate Plan </el-button>
      </div>

      <div class="overflow-x-auto">
        <div class="customer-list pb-40px">
          <el-table 
            :data="TariffData" 
            class="white-space-nowrap text-primary"
            height="calc(100vh - 220px)"
            style="width: 100%"
            stripe 
            size="large"
            :cell-style=msi.tb_cell 
            :header-cell-style="msi.tb_header_cell"
            v-loading.fullscreen.lock="isLoading"
          >
            <el-table-column
              prop="profile_name"
              label="Profile Name"
              align="center"
              sortable
              :sort-method="(a, b) => sortFunc(a, b, 'profile_name')"
              min-width="150"
            />

            <el-table-column
              prop="tariff_text"
              label="Description"
              align="center"
              sortable
              :sort-method="(a, b) => sortFunc(a, b, 'tariff_text')"
              min-width="450"
            />

            <el-table-column
              prop="min_price_str"
              label="Min Price"
              align="center"
              sortable
              :sort-method="(a, b) => sortFunc(a, b, 'min_price_str')"
              min-width="150"
            />

            <el-table-column
              prop="currency"
              label="Currency"
              align="center"
              sortable
              :sort-method="(a, b) => sortFunc(a, b, 'currency')"
              min-width="130"
            />

            <el-table-column
              prop=""
              label="Operations"
              align="center"
              min-width="200"
            >
              <template #default="scope">
                <el-button link type="primary" size="large" @click="deleteTariff (scope.row)" >
                  <img src="@/assets/img/tariff_delete1.png" alt="">
                </el-button>
                <el-button link type="primary" size="large" @click="copyTariff(scope)">
                  <img src="@/assets/img/tariff_copy1.png" alt="">
                </el-button>
                <el-button link type="primary" size="large" @click="editTariff(scope.row)">
                  <font-awesome-icon icon="fa-regular fa-pen-to-square" />
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>
  </div>

    <!-- 
    <el-dialog v-model="addTariffFormVisible" title="Add Rate" draggable>
      <p> Tariff Type </p>
      <el-select v-model="tariff_select" class="m-2" placeholder="Select" size="large">
        <el-option v-for="item in TariffOptions" :key="item.value" :label="item.label" :value="item.value"/>
      </el-select>
      <br><br>
      <p> Time </p>
      <el-time-select v-model="startTime" :max-time="endTime" placeholder="Start time" start="00:00" step="00:30" end="24:00"/>
      <el-time-select v-model="endTime" :min-time="startTime" placeholder="End time" start="00:00" step="00:30" end="24:00"/>
      <br><br>
      <p> Applied Day of Week </p>
      <el-checkbox-button v-for="week in day" :key="week" :label="week"> {{ week }} </el-checkbox-button>

      <div v-if="tariff_select === 'Charging'">
        <p>Charging Method</p>
        <el-select v-model="charging_select" class="m-2" placeholder="Select" size="large">
          <el-option v-for="item in ChargingOptions" :key="item.value" :label="item.label" :value="item.value"/>
        </el-select>

        <p>Vat</p>
          <el-input v-model="vat" />
        <p>Start Fee</p>
        <el-input v-model="start_fee" />
        <p>Charging Fee</p>
          <el-input v-model="charging_fee" />
      </div>

      <div v-if="tariff_select === 'Parking'">
        <p>Vat</p>
        <el-input v-model="charging_fee" />
        <p>Start Fee</p>
        <el-input v-model="charging_fee" />
        <p>Parging Fee</p>
        <el-input v-model="charging_fee" />
        <p>Max Fee</p>
        <el-input v-model="charging_fee" />
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addUser('cancel', false)">Cancel</el-button>
          <el-button type="primary" @click="addUser('confirm', false)">Add</el-button>
        </span>
      </template>
    </el-dialog> 
    -->
</template>
  
<style lang="scss" scoped>
.tariff {
  :deep(.svg-inline--fa) {
    height: 1.8em;
    filter: brightness(65%) saturate(100%);
  }
//   position: relative;
//   width: 100%;
//   height: 100%;
//   .tariff-list {
//     width: calc(100% - 40px);
//     height: calc(100% - 120px);
//     top: 120px;
//     left : 40px;
//     position: absolute;
//   }
//   .add-tariff {
//   width: 220px;
//   height: 40px;
//   top: 40px;
//   right : 40px;
//   position: absolute;
//   font-size: 18px;
//   background-color: #000000DF;
//   color:#FFFFFF;
//   border-radius: 20px;
// }
}
</style>