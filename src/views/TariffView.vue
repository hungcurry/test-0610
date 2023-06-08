<template>
  <div class="tariff">
    <el-button class="add-tariff" @click="editTariff"> Add Rate Plan</el-button>
    <div class="tariff-list">
      <el-table :data="TariffData" style="width: 95%; height:95%" stripe ref="checkTable"
      :cell-style=msi.tb_cell :header-cell-style=msi.tb_header_cell size="large">
        <el-table-column prop="profile_name" label="Name" min-width="10"/>
        <el-table-column prop="tariff_text" label="Description" min-width="60"/>
        <el-table-column prop="min_price_str" label="Min Price" min-width="10"/>
        <!-- <el-table-column prop="max_price_str" label="Max Price" min-width="10"/> -->
        <el-table-column prop="currency" label="Currency" min-width="10"/>
        <el-table-column fixed="right" label="Operations" min-width="15">
          <template #default="scope">
            <el-button link type="primary" size="large" @click="deleteTariff (scope.row)" >Delete</el-button>
            <el-button link type="primary" size="large" @click="copyTariff(scope)">Copy</el-button>
            <el-button link type="primary" size="large" @click="editTariff(scope.row)">More</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

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
          <el-input v-model="vat" autocomplete="off" />
        <p>Start Fee</p>
        <el-input v-model="start_fee" autocomplete="off" />
        <p>Charging Fee</p>
          <el-input v-model="charging_fee" autocomplete="off" />
      </div>

      <div v-if="tariff_select === 'Parking'">
        <p>Vat</p>
        <el-input v-model="charging_fee" autocomplete="off" />
        <p>Start Fee</p>
        <el-input v-model="charging_fee" autocomplete="off" />
        <p>Parging Fee</p>
        <el-input v-model="charging_fee" autocomplete="off" />
        <p>Max Fee</p>
        <el-input v-model="charging_fee" autocomplete="off" />
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addUser('cancel', false)">Cancel</el-button>
          <el-button type="primary" @click="addUser('confirm', false)">Add</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>
  
<script setup>
import { ref, reactive, onMounted} from 'vue'
import {useRouter } from 'vue-router'
import ApiFunc from '@/components/ApiFunc'
import msi from '@/assets/msi_style'
import {  ElMessageBox,ElMessage } from 'element-plus'

const router = useRouter()
const MsiApi = ApiFunc()
const TariffData = reactive([])
const day = ['Mon.', 'Tue.', 'Wed.', 'Thu', 'Fri.', 'Sat.', 'Sun.']
const tariff_select = ref ('Charging')
const charging_select = ref ('Time')
const addTariffFormVisible = ref(false)
const TariffOptions = [ { value: 'Charging', label: 'Charging',}, {value: 'Parking',label: 'Parking',}  ]
const ChargingOptions = [{ value: 'Time', label:'by Time'}, { value: 'Energy', label:'by Energy'}]

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
  router.push({ name: 'tariffDetail', query:{id:row._id} })
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
  let queryData = { "database":"OCPI", "collection":"Tariff", "query": {}}
  let response = await MsiApi.mongoQuery(queryData)
  Object.assign(TariffData, response.data.all) 
  for (let i = 0; i < TariffData.length; i++) {
    TariffData[i].tariff_text = TariffData[i].tariff_alt_text[0].text
    TariffData[i].tariff_name = TariffData[i].energy_mix?.supplier_name
    TariffData[i].min_price_str = TariffData[i]?.min_price?.incl_vat
    TariffData[i].max_price_str = TariffData[i]?.max_price?.incl_vat
  }
})

</script>

<style lang="scss">

.tariff {
  position: relative;
  width: 100%;
  height: 100%;
  .tariff-list {
    width: calc(100% - 40px);
    height: calc(100% - 120px);
    top: 120px;
    left : 40px;
    position: absolute;
  }
  .add-tariff {
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

</style>