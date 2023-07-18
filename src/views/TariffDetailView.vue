<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ApiFunc from '@/composables/ApiFunc'
import CommpnFunc from '@/composables/CommonFunc'
import msi from '@/assets/msi_style'
import { ElMessageBox, ElMessage } from 'element-plus'

// const printElement = () => {
//   let week = ''
//   let text_arr = []
//   textarea_en.value = ''
//   for (let i = 0; i < tariff_elements.length; i++) {
//     for (let j = 0; j < tariff_elements[i].restrictions.day_of_week.length; j++) {
//       if (tariff_elements[i].restrictions.day_of_week[j] === 'MONDAY')
//         week += 'MON'
//       else if (tariff_elements[i].restrictions.day_of_week[j] === 'TUESDAY')
//         week += 'TUE'
//       else if (tariff_elements[i].restrictions.day_of_week[j] === 'WEDNESDAY')
//         week += 'WED'
//       else if (tariff_elements[i].restrictions.day_of_week[j] === 'THURSDAY')
//         week += 'THU'
//       else if (tariff_elements[i].restrictions.day_of_week[j] === 'FRIDAY')
//         week += 'FRI'
//       else if (tariff_elements[i].restrictions.day_of_week[j] === 'SATURDAY')
//         week += 'SAT'
//       else if (tariff_elements[i].restrictions.day_of_week[j] === 'SUNDAY')
//         week += 'SUN'

//       if (j === tariff_elements[i].restrictions.day_of_week.length - 1) week += '\n'
//       else week += ' / '
//     }
//     if (tariff_elements[i].restrictions.end_time === '00:00')
//       tariff_elements[i].restrictions.end_time = '23:59'
//     if (tariff_elements[i].price_components[0].type === 'ENERGY') {
//       text_arr.push(i + 1 + '. ' + 'Charging' + '\n' + week + tariff_elements[i].restrictions.start_time + ' ~ ' + tariff_elements[i].restrictions.end_time + '\n'
//         + tariff_elements[i].price_components[0].price + ' ' + TariffData.currency + " per kWh" + '\n')
//     }
//     else if (tariff_elements[i].price_components[0].type === 'TIME') {
//       text_arr.push(i + 1 + '. ' + 'Charging' + '\n' + week + tariff_elements[i].restrictions.start_time + '~' + tariff_elements[i].restrictions.end_time + '\n'
//         + (tariff_elements[i].price_components[0].step_size / 60).toFixed(2) + ' Min '
//         + (tariff_elements[i].price_components[0].price / (3600 / tariff_elements[i].price_components[0].step_size)).toFixed(2) + TariffData.currency + '\n')
//     }

//     else if (tariff_elements[i].price_components[0].type === 'PARKING_TIME') {
//       text_arr.push(i + 1 + '. ' + 'Parking' + '\n' + week + tariff_elements[i].restrictions.start_time + ' ~ ' + tariff_elements[i].restrictions.end_time + '\n'
//         + (tariff_elements[i].price_components[0].step_size / 60).toFixed(2) + ' Min '
//         + (tariff_elements[i].price_components[0].price / (3600 / tariff_elements[i].price_components[0].step_size)).toFixed(2) + TariffData.currency + '\n')
//     }
//     week = ''
//     textarea_en.value += text_arr[i]
//   }
//   if (TariffData.min_price_str !== undefined && TariffData.min_price_str !== '') {
//     textarea_en.value += 'Min Price : ' + TariffData.min_price_str + ' ' + TariffData.currency
//   }
// }

const router = useRouter()
const MsiApi = ApiFunc()
const MsiFunc = CommpnFunc()
const tariff_elements = reactive([])

const new_element = ref({day_of_week:[]})
const element_action = ref('')
const route = useRoute()
const activeName = ref('one')
const add_tariff_title = ref('Add Rate')
const add_tariff_visible = ref(false)
const modifyIndex = ref(0)
const startTime = ref('')
const endTime = ref('')
const used_evse = reactive([])
const TariffData = reactive({})
const day = [{ label: 'Mon.', value: 'MONDAY' }, { label: 'Tue.', value: 'TUESDAY' }, { label: 'Wed.', value: 'WEDNESDAY' }, { label: 'Thu.', value: 'THURSDAY' },
{ label: 'Fri.', value: 'FRIDAY' }, { label: 'Sat.', value: 'SATURDAY' }, { label: 'Sun.', value: 'SUNDAY' }]
const tariff_currency_opeion = [{ value: 'TWD', label: 'TWD' }, { value: 'USD', label: 'USD' }, { value: 'JPY', label: 'JPY' }, { value: 'EUR', label: 'EUR' }]
const tariff_country_code_opeion = [{ value: 'TW', label: 'TW' }, { value: 'US', label: 'US' }, { value: 'JP', label: 'JP' }, { value: 'DE', label: 'DE' }]
const price_type_opeion = [{ value: 'ENERGY', label: 'Charging By Energy' }, { value: 'TIME', label: 'Charging By Time' }, { value: 'PARKING_TIME', label: 'Parking By Time' }]

const textarea_en = ref('')
const textarea_zh = ref('')
const tariff_id = route.query.id

const seletcType = (type) => {
  if (type === 'ENERGY')
    new_element.value.step_size = 1
  else
    new_element.value.step_size = 0
}

const cancel_tariff = () => {
  router.push({ name: 'tariff' })
}
const save_tariff = async () => {
  let new_tariff_alt_text = [{ language: 'en', text: textarea_en.value }, { language: 'zh', text: textarea_zh.value }]
  TariffData.tariff_alt_text = new_tariff_alt_text
  TariffData.elements = tariff_elements
  TariffData.class = 'Tariff'
  TariffData.type = 'AD_HOC_PAYMENT'
  TariffData.party_id = 'MSI'
  if (TariffData.elements.length === 0) {
    let day_of_week_arr = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
    let free_price = [{
      'price_components': [{ type: 'ENERGY', price: 0, vat: 5, step_size: 1 }],
      'restrictions': { start_time: '00:00', end_time: '23:59', max_duration: 0, min_duration: 0, day_of_week: day_of_week_arr }
    }]
    TariffData.elements = free_price
  }
  if (TariffData.min_price_str !== undefined && TariffData.min_price_str !== '') {
    TariffData.min_price = { excl_vat: parseInt(TariffData.min_price_str), incl_vat: parseInt(TariffData.min_price_str) }
  }
  if (TariffData.max_price_str !== undefined && TariffData.max_price_str !== '') {
    TariffData.max_price = { excl_vat: parseInt(TariffData.max_price_str), incl_vat: parseInt(TariffData.max_price_str) }
  }

  MsiFunc.deleteEmptyKeys(TariffData)
  if (tariff_id) {
    ElMessageBox.confirm('Do you want to modify?', 'Warning', { confirmButtonText: 'OK', cancelButtonText: 'Cancel', type: 'warning' })
      .then(async () => {
        if (TariffData.profile_name === undefined) { ElMessage.error('Oops, Profile Name required.') }
        else if (TariffData.country_code === undefined) { ElMessage.error('Oops, Country Code required.') }
        else if (TariffData.currency === undefined) { ElMessage.error('Oops, Currency required.') }
        else {
          for(let i = 0; i < TariffData.elements.length; i++) {
            delete TariffData.elements[i].price_components_type_str
            delete TariffData.elements[i].price_components_step_size_str
            delete TariffData.elements[i].restrictions_max_duration_str
            delete TariffData.elements[i].restrictions_min_duration_str            
          }
          let res = await MsiApi.setCollectionData('patch', 'ocpi', TariffData)
          if (res.status === 200)
            ElMessage.success(res.data.message)
          else {
            ElMessage.error(res.data.message)
          }
          router.push({ name: 'tariff' })
        }
      })
      .catch((e) => {
        console.log(e)
      })
  }
  else {
    ElMessageBox.confirm('Do you want to create?', 'Warning', { confirmButtonText: 'OK', cancelButtonText: 'Cancel', type: 'warning' })
    .then(async () => {
      if (TariffData.profile_name === undefined) { ElMessage.error('Oops, Profile Name required.') }
      else if (TariffData.country_code === undefined) { ElMessage.error('Oops, Country Code required.') }
      else if (TariffData.currency === undefined) { ElMessage.error('Oops, Currency required.') }
      else {
        for(let i = 0; i < TariffData.elements.length; i++) {
            delete TariffData.elements[i].price_components_type_str
            delete TariffData.elements[i].price_components_step_size_str
            delete TariffData.elements[i].restrictions_max_duration_str
            delete TariffData.elements[i].restrictions_min_duration_str
          }
        console.log(TariffData)
        let res = await MsiApi.setCollectionData('post', 'ocpi', TariffData)
        console.log(res)
        if (res.status === 201) {
          ElMessage.success(res.data.message)
        }
        else {
          ElMessage.error(res.data.message)
        }
        router.push({ name: 'tariff' })
      }
    })
    .catch((e) => {
      console.log(e)
    })
  }
}

const ShowAddElementDialog = () => {
  add_tariff_visible.value = true
  element_action.value = 'add'
  add_tariff_title.value = 'Add Rate'
  new_element.value.price_type = ''
  new_element.value.vat = 5
  new_element.value.price_price = 0
  new_element.value.step_size = new_element.value.step_size_str = 1
  new_element.value.min_duration = new_element.value.max_duration = 0
  new_element.value.min_duration_str = new_element.value.max_duration_str =  0
  new_element.value.start_time = new_element.value.end_time = '00:00'
  new_element.value.day_of_week = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
}

const ShowEditElementDialog = (scope) => {
  add_tariff_visible.value = true
  element_action.value = 'edit'
  add_tariff_title.value = 'Edit Rate'
  modifyIndex.value = scope.$index
  new_element.value.day_of_week.length =  0
  new_element.value.price_type = scope.row.price_components[0].type
  new_element.value.price_price = scope.row.price_components[0].price
  if (new_element.value.price_type !== 'ENERGY') 
    new_element.value.step_size_str = scope.row.price_components[0].step_size / 60 
  else 
    new_element.value.step_size_str = scope.row.price_components[0].step_size

  new_element.value.vat = scope.row.price_components[0].vat
  new_element.value.min_duration_str = scope.row.restrictions.min_duration / 60
  new_element.value.max_duration_str = scope.row.restrictions.max_duration / 60
  new_element.value.start_time = scope.row.restrictions.start_time 
  new_element.value.end_time = scope.row.restrictions.end_time
  for (let i = 0; i < scope.row.restrictions.day_of_week.length; i++) {
    new_element.value.day_of_week.push(scope.row.restrictions.day_of_week[i]) 
  }
}

const editElement = (action) => {
  if (new_element.value.end_time === '00:00')
    new_element.value.end_time = '23:59'
  let tempArr = []
  for(let i = 0; i < new_element.value.day_of_week.length; i++) {
    tempArr.push(new_element.value.day_of_week[i])
  }
  if (new_element.value.price_type !== 'PARKING_TIME') {
    new_element.value.max_duration = new_element.value.min_duration = 0
  }

  if (new_element.value.price_type === "ENERGY")
    new_element.value.price_components_type_str = 'Charging By Energy'
  else if (new_element.value.price_type === "TIME")
    new_element.value.type_str = 'Charging By Time'
  else if (new_element.value.price_type === "PARKING_TIME")
    new_element.value.type_str = 'Parking By Time'

    new_element.value.min_duration = new_element.value.min_duration_str * 60
    new_element.value.max_duration = new_element.value.max_duration_str * 60
    if (new_element.value.price_type !== "ENERGY")
      new_element.value.step_size = new_element.value.step_size_str * 60

  let modify_element = { price_components:[{ type:new_element.value.price_type, price:new_element.value.price_price,
                                            step_size:new_element.value.step_size, vat:new_element.value.vat} ],
                                            restrictions:{ min_duration:new_element.value.min_duration, max_duration:new_element.value.max_duration,
                                            start_time:new_element.value.start_time, end_time:new_element.value.end_time, day_of_week:tempArr
                                            }
                                          }
  if (action === 'add') {
    let element = JSON.parse(JSON.stringify(modify_element))
    if (element.price_components[0].type === "ENERGY") {
      element.price_components_type_str = 'Charging By Energy'
      element.price_components_step_size_str = 1 
    }
    else if (element.price_components[0].type === "TIME") {
      element.price_components_type_str = 'Charging By Time'
      element.price_components_step_size_str = new_element.value.step_size / 60
    }
    else if (element.price_components[0].type === "PARKING_TIME") {
      element.price_components_type_str = 'Parking By Time'
      element.price_components_step_size_str = new_element.value.step_size / 60
      element.restrictions_min_duration_str = new_element.value.min_duration / 60
      element.restrictions_max_duration_str = new_element.value.max_duration / 60
    }
    tariff_elements.push(element)
  }
  else if (action === 'edit') {
    console.log(modify_element)
    tariff_elements[modifyIndex.value] = modify_element
    if (tariff_elements[modifyIndex.value].price_components[0].type === "ENERGY") {
      tariff_elements[modifyIndex.value].price_components_type_str = 'Charging By Energy'
      tariff_elements[modifyIndex.value].price_components_step_size_str = 1
    }
    else if (tariff_elements[modifyIndex.value].price_components[0].type === "TIME") {
      tariff_elements[modifyIndex.value].price_components_type_str = 'Charging By Time'
      tariff_elements[modifyIndex.value].price_components_step_size_str = modify_element.price_components[0] / 60
    }
    else if (tariff_elements[modifyIndex.value].price_components[0].type === "PARKING_TIME") {
      tariff_elements[modifyIndex.value].price_components_type_str = 'Parking By Time'
      tariff_elements[modifyIndex.value].price_components_step_size_str = modify_element.price_components[0].step_size / 60
      tariff_elements[modifyIndex.value].restrictions_min_duration_str = modify_element.restrictions.min_duration / 60
      tariff_elements[modifyIndex.value].restrictions_max_duration_str = modify_element.restrictions.max_duration / 60
    }
  }
  else if (action === 'delete') {
    tariff_elements.splice(modifyIndex.value, 1)
  }
  add_tariff_visible.value = false
}

onMounted(async () => {
  if (tariff_id) {
    let queryData = { "database": "OCPI", "collection": "Tariff", "query": { "_id": { "ObjectId": tariff_id } } }
    let res = await MsiApi.mongoQuery(queryData)
    Object.assign(TariffData, res.data.all[0])
    for (let i = 0; i < TariffData?.tariff_alt_text?.length; i++) {
      if (TariffData.tariff_alt_text[i].language === 'en') {
        textarea_en.value = TariffData.tariff_alt_text[i].text
      }
      else if (TariffData.tariff_alt_text[i].language === 'zh') {
        textarea_zh.value = TariffData.tariff_alt_text[i].text
      }
    }
    Object.assign(tariff_elements, TariffData.elements)
    console.log(tariff_elements)
    for (let i = 0; i < tariff_elements.length; i++) {
      if (tariff_elements[i].price_components[0].type === "ENERGY") {
        tariff_elements[i].price_components_type_str = 'Charging By Energy'
        tariff_elements[i].price_components_step_size_str = tariff_elements[i].price_components[0].step_size
      }
      else if (tariff_elements[i].price_components[0].type === "TIME") {
        tariff_elements[i].price_components_type_str = 'Charging By Time'
        tariff_elements[i].price_components_step_size_str = tariff_elements[i].price_components[0].step_size / 60
      }
      else if (tariff_elements[i].price_components[0].type === "PARKING_TIME") {
        tariff_elements[i].price_components_type_str = 'Parking By Time'
        tariff_elements[i].price_components_step_size_str = tariff_elements[i].price_components[0].step_size / 60
        tariff_elements[i].restrictions_min_duration_str = tariff_elements[i].restrictions.min_duration / 60
        tariff_elements[i].restrictions_max_duration_str = tariff_elements[i].restrictions.max_duration / 60
      }
    }
    TariffData.min_price_str = TariffData?.min_price?.incl_vat
    TariffData.max_price_str = TariffData?.max_price?.incl_vat
    queryData = {
      "database": "OCPI", "collection": "Tariff", "pipelines": [
        { $match: { "_id": { "ObjectId": tariff_id } } }, { "$project": { "id": 1, } }
      ]
    }
    let response = await MsiApi.mongoAggregate(queryData)
    queryData = {
      "database": "OCPI", "collection": "Connector", "pipelines": [
        { $match: { "tariff_ids": { "UUID": response.data.result[0].id } } }, { "$project": { "_id": 1, } }
      ]
    }
    response = await MsiApi.mongoAggregate(queryData)
    let used_connector = response.data.result

    queryData = {
      "database": "OCPI", "collection": "EVSE", "pipelines": [
        { "$project": { "_id": 0, "connectors": 1, "evse_id": 1 } }]
    }
    response = await MsiApi.mongoAggregate(queryData)
    let evse = response.data.result

    for (let i = 0; i < used_connector.length; i++) {
      for (let j = 0; j < evse.length; j++) {
        if (used_connector[i]._id === evse[j].connectors[0]) {
          used_evse.push(evse[j].evse_id)
        }
      }
    }
  }
})
</script>

<template>
  <div class="tariff-detail">
    <div class="tariff-up">
      <p>Rate Profile Details</p>
      <el-button class="add-tariff-element-btn" @click="ShowAddElementDialog"> Add Rate </el-button>
    </div>
    <el-tabs v-model="activeName" class="demo-tabs">
      <el-tab-pane label="General" name="one">
        <div class="tariff-main">
          <div class="tariff-left">
            <p>Profile Name</p>
            <el-input v-model="TariffData.profile_name" />

            <p>Currency</p>
            <el-select v-model="TariffData.currency" placeholder="Select" size="large">
              <el-option v-for="item in tariff_currency_opeion" :key="item.value" :label="item.label"
                :value="item.value" />
            </el-select>
            <p>Country Code</p>
            <el-select v-model="TariffData.country_code" placeholder="Select" size="large">
              <el-option v-for="item in tariff_country_code_opeion" :key="item.value" :label="item.label"
                :value="item.value" />
            </el-select>

            <p>Min Price</p>
            <el-input v-model="TariffData.min_price_str" />
            <!-- 
            <p>Max Price</p>
            <el-input v-model="TariffData.max_price_str" /> -->

            <!-- <p>Rate URL</p>
              <el-input v-model="TariffData.tariff_alt_url" /> -->
            <!-- <p>Operator ID</p>
            <el-input v-model="TariffData.party_id" />	 -->
          </div>
          <div class="tariff-right">
            <!-- <p>Rate Description</p> <el-button @click="printElement"> Description generator </el-button> -->
            <div class="tariff-description">
              <div class="tariff-description-1">
                <p>English</p>
                <el-input v-model="textarea_en" :rows="20" type="textarea" placeholder="1. Charging Day of Week: Mon./Tue./Wed./Thu./Fri. Time: 08:00 ~ 18:00 TWD $10/per kWh; Time: 18:00 ~ 07:59 TWD $6/per kWh Day of Week: Sat./Sun. Time: 00:00 ~ 23:59 TWD $6/per kWh 
2. Parking Day of Week: Mon./Tue./Wed./Thu./Fri. Time: 08:00 ~ 18:00 TWD $40/per hour; Time: 18:00 ~ 07:59 TWD $20/per hour Day of Week: Sat./Sun. Time: 00:00 ~ 23:59 TWD $20/per hour" />
              </div>
              <div class="tariff-description-1">
                <p>Chinese</p>
                <el-input v-model="textarea_zh" :rows="20" type="textarea" placeholder="1. 充電費 平日：星期一到星期五 時間：早上八點到晚上六點費用：一度電10元；時間：晚上六點到早上八點  費用：一度電6元 假日：星期六到星期日 時間：00:00 ~23:59 費用：一度電6元
2. 停車費 平日：星期一到星期五 時間：早上八點到晚上六點 費用：每小時40元；時間：晚上六點到早上八點 費用：每小時20元 假日：星期六到星期日 時間：00:00 ~23:59 費用：每小時20元" />
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="Rate" name="two">
        <el-table :data="tariff_elements" style="width: 95%; height:800px" stripe :cell-style=msi.tb_cell
          :header-cell-style=msi.tb_header_cell size="large">
          <el-table-column prop="price_components_type_str" label="Type" min-width="50" />
          <el-table-column prop="price_components[0].price" label="Price" min-width="30" />
          <el-table-column prop="price_components[0].vat" label="Vat" min-width="30" />
          <el-table-column prop="price_components_step_size_str" label="Unit" min-width="30" />
          <el-table-column prop="restrictions.start_time" label="Start Time" min-width="50" />
          <el-table-column prop="restrictions.end_time" label="End Time" min-width="50" />
          <el-table-column prop="restrictions_min_duration_str" label="Active (Minute)" min-width="50" />
          <el-table-column prop="restrictions_max_duration_str" label="Deactivate (Minute)" min-width="50" />
          <el-table-column prop="restrictions.day_of_week" label="Day Of Week" min-width="50" />
          <el-table-column min-width="20">
            <template #default="scope">
              <el-button @click="ShowEditElementDialog(scope)"> <font-awesome-icon icon="fa-solid fa-ellipsis" />
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="EVSE list" name="three">
        <p v-for="item in used_evse" :key="item" :label="item" :value="item"> {{ item }}</p>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="add_tariff_visible" :title=add_tariff_title draggable>
      <p> Type </p>
      <el-select v-model="new_element.price_type" placeholder="Select" size="large"
        @change="seletcType">
        <el-option v-for="item in price_type_opeion" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <div v-if="new_element.price_type === ''">
      </div>
      <div v-else>
        <div v-if="new_element.price_type === 'ENERGY'">
          <p>Price (kWh)</p>
          <el-input-number v-model="new_element.price_price" :controls="false" />
          <p>Unit (Wh)</p>
          <el-input-number v-model="new_element.step_size_str" :controls="false" disabled />
        </div>

        <div v-else-if="new_element.price_type === 'TIME'">
          <p>Price ($ / hr)</p>
          <el-input-number v-model="new_element.price_price" :controls="false" />
          <p>Unit (Minute)</p>
          <el-input-number v-model="new_element.step_size_str" :controls="false" />
          <!-- <p> {{ 'i.e. ' + new_element.step_size_str + ' Min ' +
            new_element.price_price /  60 * new_element.step_size_str
            + ' Dollar ' + 'excl Vat'}}</p>  -->
        </div>

        <div v-else-if="new_element.price_type === 'PARKING_TIME'">
          <p>Price ($ / hr)</p>
          <el-input-number v-model="new_element.price_price" :controls="false" />
          <p>Unit (Minute)</p>
          <el-input-number v-model="new_element.step_size_str" :controls="false" />
          <!-- <p> {{ 'i.e. ' + new_element.step_size_str + ' Min ' +
            new_element.price_price /  60 * new_element.step_size_str
            + ' Dollar ' + 'excl Vat'}}</p> -->
        </div>

        <p>Vat</p>
        <el-input-number v-model="new_element.vat" :controls="false" />
        <div v-if="new_element.price_type === 'PARKING_TIME'">
          <p>Active Time (Minute)</p>
          <!-- <el-input-number v-model="new_element.min_duration" :controls="false" /> -->
          <el-input-number v-model="new_element.min_duration_str" :controls="false" />
          <p>Deactivate Time (Minute)</p>
          <!-- <el-input-number v-model="new_element.max_duration" :controls="false" /> -->
          <el-input-number v-model="new_element.max_duration_str" :controls="false" />
        </div>        
        <p>Time</p>
        <el-time-select v-model="new_element.start_time" :max-time="new_element.end_time" placeholder="Start time"
          start="00:00" step="00:30" end="24:00" />
        <el-time-select v-model="new_element.end_time" :min-time="new_element.start_time" placeholder="End time"
          start="00:00" step="00:30" end="24:00" />

        <div class="demo-button-style">
          <el-checkbox-group v-model="new_element.day_of_week" size="large">
            <el-checkbox-button v-for="week in day" :key="week.value" :label="week.value"> {{ week.label }}
            </el-checkbox-button>
          </el-checkbox-group>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="editElement('cancel')">Cancel</el-button>
        <template v-if="element_action === 'add'">
          <el-button type="primary" @click="editElement('add')">Create</el-button>
        </template>
        <template v-else>
          <el-button type="primary" @click="editElement('delete')">Delete</el-button>
          <el-button type="primary" @click="editElement('edit')">Modify</el-button>
        </template>
      </template>
    </el-dialog>

    <el-button class="cancel-tariff-btn" @click="cancel_tariff"> Cancel </el-button>
    <el-button class="save-tariff-btn" @click="save_tariff"> Save </el-button>
  </div>
</template>

<style lang="scss" scoped >
.tariff-detail {
  width: 100%;
  height: 100%;

  .cancel-tariff-btn {
    width: 220px;
    height: 40px;
    bottom: 40px;
    // right: 700px;
    left: 1000px;
    position: absolute;
    font-size: 18px;
    background-color: #000000DF;
    color: #FFFFFF;
    border-radius: 20px;
  }

  .save-tariff-btn {
    width: 220px;
    height: 40px;
    bottom: 40px;
    // left: 800px;
    left: 1300px;
    position: absolute;
    font-size: 18px;
    background-color: #000000DF;
    color: #FFFFFF;
    border-radius: 20px;
  }

  .tariff-up {
    height: 50px;

    p {
      margin: 0;
      padding: 0;
      font-size: 40px;
    }

    // width: 300px;
    .add-tariff-element-btn {
      width: 220px;
      height: 40px;
      top: 80px;
      right: 40px;
      position: absolute;
      font-size: 18px;
      background-color: #000000DF;
      color: #FFFFFF;
      border-radius: 20px;

    }

    p {
      margin: 0;
      padding: 0;
      font-size: 40px;
    }
  }

  .tariff-main {
    display: flex;

    .tariff-left {
      width: 300px;
      margin-left: 30px;

      .el-input {
        width: 250px;
        --el-input-bg-color: rgb(86, 101, 117);
        --el-input-text-color: rgb(255, 255, 255);
      }
    }

    .tariff-right {
      .tariff-description {
        display: flex;
        flex-direction: row;
        gap: 20px;

        // .tariff-description {
        //   width: 300px;
        // }
        p {
          width: 400px;
        }
      }

      .el-textarea {
        margin-bottom: 10px;
      }

    }
  }

  // .tariff-main1 {
  // .el-input {
  // 		width: 250px;
  // 		--el-input-bg-color: rgb(86, 101, 117);
  // 		--el-input-text-color: rgb(255, 255, 255);
  // 	}
  // margin-left: 30px;
  // }

  .price-component {
    width: 300px;
    margin-left: 30px;

  }

  .price-restrictions {
    width: 500px;
    margin-left: 30px;
  }
}

.demo-button-style {
  margin-top: 24px;
}

.el-table {
  .cell {
    white-space: pre-line;
  }
}</style>