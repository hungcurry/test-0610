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
    <div class="container lg flex-col wh-full">
      <div class="flex justify-between flex-wrap lg:flex-nowrap pt-40px pb-32px">
        <p class="tariff-detail-title">Rate Profile Details</p>
        <el-button class="add-tariff-element-btn w-full md:w-auto mt-4 md:mt-0 md:ml-30px box-shadow" @click="ShowAddElementDialog"> Add Rate </el-button>
      </div>

      <div class="tabs flex-grow">
        <el-tabs v-model="activeName">
          <el-tab-pane label="General" name="one">
            <div class="overflow-x-auto flex pb-24px">
              <div class="left mt-24px mr-20px">
                <el-form class="flex-col w-350px">
                  <el-form-item class="mb-24px sm:w-50% lg-w-full" label="Profile Name">
                    <el-input v-model.trim="TariffData.profile_name"/>
                  </el-form-item>
                  <el-form-item class="mb-24px sm:w-50% lg-w-full" label="Currency">
                    <el-select v-model="TariffData.currency" placeholder="Select" size="large">
                      <el-option v-for="item in tariff_currency_opeion" :key="item.value" :label="item.label"
                        :value="item.value" />
                    </el-select>
                  </el-form-item>
                  <el-form-item class="mb-24px sm:w-50% lg-w-full" label="Country Code">
                    <el-select v-model="TariffData.country_code" placeholder="Select" size="large">
                      <el-option v-for="item in tariff_country_code_opeion" :key="item.value" :label="item.label"
                        :value="item.value" />
                    </el-select>
                  </el-form-item>
                  <el-form-item class="mb-24px sm:w-50% lg-w-full" label="Min Price">
                    <el-input v-model.trim="TariffData.min_price_str"/>
                  </el-form-item>
                </el-form>
              </div>
  
              <div class="v-line mr-20px"></div>
              <div class="right flex mt-24px mr-20px">
                <div class="flex-col mr-24px">
                  <p class="mb-12px">English</p>
                  <el-input 
                    v-model="textarea_en" 
                    :rows="20" 
                    type="textarea" 
                    class="w-400px"
                    placeholder="1. Charging Day of Week: Mon./Tue./Wed./Thu./Fri. Time: 08:00 ~ 18:00 TWD $10/per kWh; Time: 18:00 ~ 07:59 TWD $6/per kWh Day of Week: Sat./Sun. Time: 00:00 ~ 23:59 TWD $6/per kWh 
  2. Parking Day of Week: Mon./Tue./Wed./Thu./Fri. Time: 08:00 ~ 18:00 TWD $40/per hour; Time: 18:00 ~ 07:59 TWD $20/per hour Day of Week: Sat./Sun. Time: 00:00 ~ 23:59 TWD $20/per hour" />
                </div>
                <div class="flex-col">
                  <p class="mb-12px">Chinese</p>
                  <el-input 
                    v-model="textarea_zh" 
                    :rows="20" 
                    type="textarea" 
                    class="w-400px"
                    placeholder="1. 充電費 平日：星期一到星期五 時間：早上八點到晚上六點費用：一度電10元；時間：晚上六點到早上八點  費用：一度電6元 假日：星期六到星期日 時間：00:00 ~23:59 費用：一度電6元
  2. 停車費 平日：星期一到星期五 時間：早上八點到晚上六點 費用：每小時40元；時間：晚上六點到早上八點 費用：每小時20元 假日：星期六到星期日 時間：00:00 ~23:59 費用：每小時20元" />
                </div>
              </div>

            </div>
          </el-tab-pane>


          <el-tab-pane label="Rate" name="two">
            <el-table 
              :data="tariff_elements" 
              class="white-space-nowrap text-primary"
              height="calc(100vh - 340px)"
              style="width: 100%"
              stripe 
              size="large"
              empty=""
              :cell-style=msi.tb_cell
              :header-cell-style=msi.tb_header_cell 
            >
              <el-table-column
                prop="price_components_type_str"
                label="Type"
                sortable
                min-width="200"
              />
              <el-table-column
                prop="price_components[0].price"
                label="Price"
                sortable
                min-width="100"
              />
              <el-table-column
                prop="price_components[0].vat"
                label="Vat"
                sortable
                min-width="100"
              />
              <el-table-column
                prop="price_components_step_size_str"
                label="Unit"
                sortable
                min-width="100"
              />
              <el-table-column
                prop="restrictions.start_time"
                label="Start Time"
                sortable
                min-width="150"
              />
              <el-table-column
                prop="restrictions.end_time"
                label="End Time"
                sortable
                min-width="150"
              />
              <el-table-column
                prop="restrictions_min_duration_str"
                label="Active (Minute)"
                sortable
                min-width="200"
              />
              <el-table-column
                prop="restrictions_max_duration_str"
                label="Deactivate (Minute)"
                sortable
                min-width="220"
              />
              <el-table-column
                prop="restrictions.day_of_week"
                label="Day Of Week"
                sortable
                min-width="180"
              />
              <el-table-column
                prop="detail"
                label=""
                align="center"
                min-width="100"
              >
                <template #default="scope">
                  <el-button class="btn-more" @click="ShowEditElementDialog(scope)"> <font-awesome-icon icon="fa-solid fa-ellipsis" />
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>


          <el-tab-pane label="EVSE list" name="three">
            <p v-for="item in used_evse" :key="item" :label="item" :value="item" class="mt-18px"> {{ item }}</p>
          </el-tab-pane>
        </el-tabs>
      </div>

      <div class="flex justify-center mb-44px">
        <el-button class="button bg-btn-100 mr-44px" @click="cancel_tariff"> Cancel </el-button>
        <el-button class="button bg-btn-200 mr-44px" @click="save_tariff"> Save </el-button>
      </div>

      <el-dialog 
        v-model="add_tariff_visible" 
        class="max-w-600px"
        :show-close="true"
        width="90%"
        destroy-on-close
        center
        draggable
      >
        <template #header="{ titleId, titleClass }">
          <div class="py-2rem relative bg-blue-100">
            <h4
              :id="titleId"
              :class="titleClass"
              class="m-0 text-center text-blue-1200 font-400 text-24px line-height-26px"
            >
              {{ add_tariff_title }}
            </h4>
          </div>
        </template>

        <div class="dialog-context">
          <el-form class="max-w-500px m-auto">
            <el-form-item class="mb-24px" label="Type">
              <el-select v-model="new_element.price_type" placeholder="Select" size="large"
                @change="seletcType">
                <el-option v-for="item in price_type_opeion" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>

            <div v-if="new_element.price_type === 'ENERGY'">
              <el-form-item class="mb-24px" label="Price (kWh)">
                <el-input-number v-model="new_element.price_price" :controls="false" />
              </el-form-item>
              <el-form-item class="mb-24px" label="Unit (Wh)">
                <el-input-number v-model="new_element.step_size_str" :controls="false" disabled />
              </el-form-item>
            </div>
            <div v-else-if="new_element.price_type === 'TIME'">
              <el-form-item class="mb-24px" label="Price ($ / hr)">
                <el-input-number v-model="new_element.price_price" :controls="false" />
              </el-form-item>
              <el-form-item class="mb-24px" label="Unit (Minute)">
                <el-input-number v-model="new_element.step_size_str" :controls="false" />
              </el-form-item>

              <!-- <p> {{ 'i.e. ' + new_element.step_size_str + ' Min ' +
              new_element.price_price /  60 * new_element.step_size_str
              + ' Dollar ' + 'excl Vat'}}</p>  -->
            </div>
            <div v-else-if="new_element.price_type === 'PARKING_TIME'">
              <el-form-item class="mb-24px" label="Price ($ / hr)">
                <el-input-number v-model="new_element.price_price" :controls="false" />
              </el-form-item>
              <el-form-item class="mb-24px" label="Unit (Minute)">
                <el-input-number v-model="new_element.step_size_str" :controls="false" />
              </el-form-item>
              <!-- <p> {{ 'i.e. ' + new_element.step_size_str + ' Min ' +
              new_element.price_price /  60 * new_element.step_size_str
              + ' Dollar ' + 'excl Vat'}}</p> -->
            </div>

            <el-form-item class="mb-24px" label="Vat">
              <el-input-number v-model="new_element.vat" :controls="false" />
            </el-form-item>

            <div v-if="new_element.price_type === 'PARKING_TIME'">
              <el-form-item class="mb-24px" label="Active Time (Minute)">
                <!-- <el-input-number v-model="new_element.min_duration" :controls="false" /> -->
                <el-input-number v-model="new_element.min_duration_str" :controls="false" />
              </el-form-item>
              <el-form-item class="mb-24px" label="Deactivate Time (Minute)">
                <!-- <el-input-number v-model="new_element.max_duration" :controls="false" /> -->
                <el-input-number v-model="new_element.max_duration_str" :controls="false" />
              </el-form-item>
            </div>

            <el-form-item class="time-select mb-24px" label="Time">
              <el-time-select v-model="new_element.start_time" :max-time="new_element.end_time" placeholder="Start time"
            start="00:00" step="00:30" end="24:00" />
              <el-time-select v-model="new_element.end_time" :min-time="new_element.start_time" placeholder="End time"
              start="00:00" step="00:30" end="24:00" />
            </el-form-item>

            <div class="demo-button-style">
              <el-checkbox-group v-model="new_element.day_of_week" size="large">
                <el-checkbox-button v-for="week in day" :key="week.value" :label="week.value" class="week-btn"> {{ week.label }}
                </el-checkbox-button>
              </el-checkbox-group>
            </div>
          </el-form>
        </div>

        
        <template #footer>
          <el-button round class="w-48% bg-btn-100 text-white max-w-140px" @click="editElement('cancel')">Cancel</el-button>
          <template v-if="element_action === 'add'">
            <el-button round class="w-48% bg-btn-200 text-white max-w-140px" @click="editElement('add')">Create</el-button>
          </template>
          <template v-else>
            <el-button round class="w-48% bg-btn-100 text-white max-w-140px" @click="editElement('delete')">Delete</el-button>
            <el-button round class="w-48% bg-btn-200 text-white max-w-140px" @click="editElement('edit')">Modify</el-button>
          </template>
        </template>
      </el-dialog>

    </div>
  </div>
</template>

<style lang="scss" scoped >

.tariff-detail {
  height: 100%;
  .tariff-detail-title {
    font-size: 36px;
  }
  .add-tariff-element-btn {
    width: 20rem;
    height: 4rem;
    padding: 0.8rem 2rem;
    font-size: 1.8rem;
    background-color: var(--secondary);
    color: var(--white);
    border-radius: 2rem;
  }
  .v-line {
    border-left: thick solid rgb(226, 234, 242);
  }
  .button {
    width: 140px;
    height: 4rem;
    padding: 0.8rem 2rem;
    font-size: 1.8rem;
    color: var(--white);
    border-radius: 2rem;
  }
  .button:hover {
    color: var(--el-color-info);
  }
  .time-select {
    :deep(.el-input__inner) {
      padding-left: 20px;
    }
  }
  .week-btn {
    width: 14%;
    :deep(.el-checkbox-button__inner) {
      width: 100%;
    }
  }
}

.el-form-item {
  display: block;
}
:deep(.el-form-item__label) {
  display: block;
  font-size: 1.6rem;
}
:deep(.el-input__wrapper) {
  height: 38px;
  width: 50%;
  .el-icon {
    top: 0;
    right: 0;
    color: var(--white);
    width: 2rem;
  }
  @media (min-width: 992px) {
    width: 350px
  }
}

:deep(.el-icon.el-input__prefix-icon) {
  top: 18px;
  left: 10px;
}


::-webkit-scrollbar {
  width: 0.8rem;
  height: 0.8rem;
}
::-webkit-scrollbar-thumb {
  background-color: var(--gray-300);
}
::-webkit-scrollbar-thumb {
  border-radius: 2rem;
}

.el-table {
  .cell {
    white-space: pre-line;
  }
}</style>