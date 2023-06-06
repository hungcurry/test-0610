<template>
	<div class="tariff-detail">
		<div class="tariff-up">
			<p>Rate Profile Detail</p>
			<el-button class="add-tariff-element-btn" @click="ShowElementDialog('add')"> Add Rate </el-button>
		</div>
    <el-tabs v-model="activeName" class="demo-tabs">
      <el-tab-pane label="General" name="one">
        <div class="tariff-main">
          <div class="tariff-left">
            <p>Profile Name</p>
            <el-input v-model="TariffData.profile_name" autocomplete="off" />
            
            <!-- <p>Type</p>
            <el-select v-model="TariffData.type" class="m-2" placeholder="Select" size="large">
              <el-option v-for="item in tariff_type_opeion" :key="item.value" :label="item.label" :value="item.value"/>
            </el-select> -->

            <p>Currency</p>
            <el-select v-model="TariffData.currency" class="m-2" placeholder="Select" size="large">
              <el-option v-for="item in tariff_currency_opeion" :key="item.value" :label="item.label" :value="item.value"/>
            </el-select>
            <p>Country Code</p>
            <el-select v-model="TariffData.country_code" class="m-2" placeholder="Select" size="large">
              <el-option v-for="item in tariff_country_code_opeion" :key="item.value" :label="item.label" :value="item.value"/>
            </el-select>

            <p>Min Price</p>
              <el-input v-model="TariffData.min_price_str" autocomplete="off" />
<!-- 
            <p>Max Price</p>
            <el-input v-model="TariffData.max_price_str" autocomplete="off" /> -->

            <!-- <p>Rate URL</p>
              <el-input v-model="TariffData.tariff_alt_url" autocomplete="off" /> -->
            <!-- <p>Operator ID</p>
            <el-input v-model="TariffData.party_id" autocomplete="off" />	 -->
          </div>
          <div class="tariff-right">
            <p>Rate Description</p> <el-button @click="printElement"> Description generator </el-button>
            <div class="tariff-description">
              <div class="tariff-description-1">
                <p>English</p>
                <el-input v-model="textarea_en" :rows="20"  type="textarea" placeholder="Please input"/>
              </div>
              <div class="tariff-description-1">
                <p>Chinese</p>
                <el-input v-model="textarea_zh" :rows="20"  type="textarea" placeholder="Please input"/>
              </div>
              <div class="tariff-description-1">
                <p>Japanese</p>
                <el-input v-model="textarea_jp" :rows="20"  type="textarea" placeholder="Please input"/>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="Rate" name="two">
        <el-table :data="tariff_elements" style="width: 95%; height:800px" stripe ref="checkTable"
        :cell-style=msi.tb_cell :header-cell-style=msi.tb_header_cell size="large" >
          <el-table-column prop="price_components[0].type" label="type" min-width="50"/>
          <el-table-column prop="price_components[0].price" label="price" min-width="50"/>
          <el-table-column prop="price_components[0].vat" label="vat" min-width="50"/>
          <el-table-column prop="price_components[0].step_size" label="Unit" min-width="50"/>
          <el-table-column prop="restrictions.start_time" label="start_time" min-width="50"/>
          <el-table-column prop="restrictions.end_time" label="end_time" min-width="50"/>
          <el-table-column prop="restrictions.day_of_week" label="day_of_week" min-width="50"/>
          <el-table-column>
            <template #default="scope" >
              <el-button @click="ShowElementDialog('edit',scope)"> <font-awesome-icon icon="fa-solid fa-ellipsis" /> </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="Charger list" name="three">
        <p v-for="item in used_evse" :key="item" :label="item" :value="item"> {{ item  }}</p>        
      </el-tab-pane>


    </el-tabs>

    <el-dialog v-model="add_tariff_visible" :title= add_tariff_title  draggable>
      <p> Type </p>
      <el-select v-model="tariff_element.price_components[0].type" class="m-2" placeholder="Select" size="large" @change="seletcType">
        <el-option v-for="item in price_type_opeion" :key="item.value" :label="item.label" :value="item.value"/>
      </el-select>
      <div v-if="tariff_element.price_components[0].type === ''">
      </div>
      <div v-else>
      <div v-if="tariff_element.price_components[0].type === 'ENERGY'">
        <p>Price</p>
        <el-input-number v-model="tariff_element.price_components[0].price"  :controls="false"/>
        <p>Unit kWh</p>
        <el-input-number v-model="tariff_element.price_components[0].step_size"  :controls="false" disabled/>
      </div>
      
      <div v-else-if="tariff_element.price_components[0].type === 'TIME'">
        <p>Price ($ / hr)</p>
        <el-input-number v-model="tariff_element.price_components[0].price"  :controls="false"/>
        <p>Unit (Second)</p>
        <el-input-number v-model="tariff_element.price_components[0].step_size"  :controls="false"/>
        <p> {{'i.e. ' + tariff_element.price_components[0].step_size / 60 + ' Min ' +  tariff_element.price_components[0].price / (3600 / tariff_element.price_components[0].step_size) + ' Dollar '}}</p>
      </div>

      <div v-else-if="tariff_element.price_components[0].type === 'PARKING_TIME'">
        <p>Price ($ / hr)</p>
        <el-input-number v-model="tariff_element.price_components[0].price"  :controls="false"/>
        <p>Unit (Second)</p>
        <el-input-number v-model="tariff_element.price_components[0].step_size"  :controls="false"/>
        <p> {{'i.e. ' + tariff_element.price_components[0].step_size / 60 + ' Min ' +  tariff_element.price_components[0].price / (3600 / tariff_element.price_components[0].step_size) + ' Dollar '}}</p>
      </div>
      


      <p>Vat</p>
      <el-input-number v-model="tariff_element.price_components[0].vat"  :controls="false"/>

      
      <p>Min Duration (Second)</p>
      <el-input-number v-model="tariff_element.restrictions.min_duration"  :controls="false"/>
      <p>Max Duration (Second)</p>
      <el-input-number v-model="tariff_element.restrictions.max_duration"  :controls="false"/>
      <p>Time</p>
      <el-time-select v-model="tariff_element.restrictions.start_time" :max-time="endTime" placeholder="Start time" start="00:00" step="00:30" end="24:00"/>
      <el-time-select v-model="tariff_element.restrictions.end_time" :min-time="startTime" placeholder="End time" start="00:00" step="00:30" end="24:00"/>
      
      <div class="demo-button-style">
        <el-checkbox-group v-model="tariff_element.restrictions.day_of_week" size="large">
          <el-checkbox-button v-for="week in day" :key="week.value" :label="week.value"> {{ week.label }} </el-checkbox-button>
        </el-checkbox-group>
      </div>
      </div>
      <template #footer>
        <el-button @click="addElement('cancel')">Cancel</el-button>
        <template v-if="element_action === 'add'">
          <el-button  type="primary" @click="addElement('add')">Create</el-button>						
        </template>
        <template v-else>
          <el-button type="primary" @click="addElement('delete')">Delete</el-button>
          <el-button type="primary" @click="addElement('edit')">Modify</el-button>
        </template>
      </template>
      
    </el-dialog>
    <el-button class="cancel-tariff-btn" @click="cancel_tariff"> CANCEL </el-button>
    <el-button class="save-tariff-btn" @click="save_tariff"> SAVE </el-button>
    
  </div>
	
</template>

<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { ref, reactive, onMounted} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ApiFunc from '@/components/ApiFunc'
import CommpnFunc from '@/components/CommonFunc'
import msi from '@/assets/msi_style'
import {  ElMessageBox , ElMessage} from 'element-plus'


const printElement = () => {
  console.log(tariff_elements)
  let week = ''
  let end_time = ''
  let text_arr = []
  textarea_en.value = ''
  for(let i = 0; i < tariff_elements.length; i++) {

    for (let j = 0; j < tariff_elements[i].restrictions.day_of_week.length; j++) {
        if (tariff_elements[i].restrictions.day_of_week[j] === 'MONDAY')
          week += 'MON'
        else if (tariff_elements[i].restrictions.day_of_week[j] === 'TUESDAY')
          week += 'TUE'          
        else if (tariff_elements[i].restrictions.day_of_week[j] === 'WEDNESDAY')
          week += 'WED'          
        else if (tariff_elements[i].restrictions.day_of_week[j] === 'THURSDAY')
          week += 'THU'          
        else if (tariff_elements[i].restrictions.day_of_week[j] === 'FRIDAY')
          week += 'FRI'          
        else if (tariff_elements[i].restrictions.day_of_week[j] === 'SATURDAY')
          week += 'SAT'          
        else if (tariff_elements[i].restrictions.day_of_week[j] === 'SUNDAY')
          week += 'SUN'          

        if( j  === tariff_elements[i].restrictions.day_of_week.length - 1 )
          week += '\n'
        else 
          week += ' / '
      }
      if (tariff_elements[i].restrictions.end_time === '00:00') 
        end_time = '23:59'

    if(tariff_elements[i].price_components[0].type === 'ENERGY') {
      text_arr.push(i + 1 + '. ' + 'Charging' + '\n' + week + tariff_elements[i].restrictions.start_time + ' ~ ' + end_time + '\n'
                   +  tariff_elements[i].price_components[0].price + ' ' + TariffData.currency + " per kWh" + '\n')
    }
    else if(tariff_elements[i].price_components[0].type === 'TIME') {
      text_arr.push(i + 1 + '. ' + 'Charging' + '\n' + week + tariff_elements[i].restrictions.start_time + '~' + end_time + '\n'
                   + tariff_elements[i].price_components[0].step_size / 60 + ' Min '
                   + tariff_elements[i].price_components[0].price / (3600 / tariff_elements[i].price_components[0].step_size) + TariffData.currency + '\n')
    }

    else if(tariff_elements[i].price_components[0].type === 'PARKING_TIME') {
      text_arr.push( i + 1 + '. ' + 'Parking' +  '\n' + week +  tariff_elements[i].restrictions.start_time + ' ~ ' + end_time + '\n'
                    + tariff_elements[i].price_components[0].step_size / 60 + ' Min '
                    + tariff_elements[i].price_components[0].price / (3600 / tariff_elements[i].price_components[0].step_size) + TariffData.currency + '\n')
    }
    week = ''
    console.log(text_arr[i])
    
    textarea_en.value += text_arr[i]
  }
  if (TariffData.min_price_str !== undefined && TariffData.min_price_str !== '') {
    textarea_en.value += 'Min Price : ' + TariffData.min_price_str + ' ' + TariffData.currency 
  }
}

const router = useRouter()
const MsiApi = ApiFunc()
const MsiFunc = CommpnFunc()

const price_components = reactive([{type:'', price:'', vat:'', step_size:0}])
const restrictions = reactive({start_time:'', end_time:'',  min_duration:0, max_duration:0, day_of_week:[]})
const tariff_element = reactive({ price_components , restrictions})
const tariff_elements = reactive([])
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
const day = [ {label:'Mon.',value:'MONDAY'}, {label:'Tue.',value:'TUESDAY'}, {label:'Wed.',value:'WEDNESDAY'}, {label:'Thu.',value:'THURSDAY'},
              {label:'Fri.',value:'FRIDAY'}, {label:'Sat.',value:'SATURDAY'}, {label:'Sun.',value:'SUNDAY'}]

// const tariff_type_opeion = [{value:'AD_HOC_PAYMENT',label:'AD_HOC_PAYMENT'}]
const tariff_currency_opeion = [{value:'TWD',label:'TWD'}, {value:'USD',label:'USD'}, {value:'JPY',label:'JPY'}, {value:'EUR',label:'EUR'}]
const tariff_country_code_opeion = [{value:'TW',label:'TW'}, {value:'US',label:'US'}, {value:'JP',label:'JP'}, {value:'DE',label:'DE'}]
const price_type_opeion = [{value:'ENERGY',label:'CHARG BY ENERGY'}, {value:'TIME',label:'CHARG BY TIME'}, {value:'PARKING_TIME',label:'PARKING'}]

const textarea_en = ref('')
const textarea_zh = ref('')
const textarea_jp = ref('')
const tariff_id = route.query.id

let newObj1 = {}
let newObj2 = {}

const seletcType = (type) => {
  tariff_element.price_components[0].vat = 5
  if (type === 'ENERGY')
    tariff_element.price_components[0].step_size = 1
  else 
    tariff_element.price_components[0].step_size = 0
}

const cancel_tariff = () => {
  router.push({ name: 'tariff'})
}
const save_tariff = async () => {
  let new_tariff_alt_text = [ {language:'en', text: textarea_en.value}, {language:'zh', text: textarea_zh.value}, 
                              {language:'jp', text: textarea_jp.value}]
  TariffData.tariff_alt_text = new_tariff_alt_text
  TariffData.elements = tariff_elements
  TariffData.class = 'Tariff'
  TariffData.type = 'AD_HOC_PAYMENT'
  TariffData.party_id = 'MSI'
  if (TariffData.elements.length===0) {
	let day_of_week_arr = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
	let free_price = [{	'price_components':[{type:'ENERGY', price:0,vat:5,step_size:1}],
						'restrictions':{start_time:'00:00',end_time:'00:00',max_duration:0, min_duration:0, day_of_week:day_of_week_arr}
					}]
	TariffData.elements = free_price
  }
  console.log(TariffData.min_price_str, TariffData.max_price_str)
  if (TariffData.min_price_str !== undefined && TariffData.min_price_str !== '') {
    TariffData.min_price = {excl_vat: parseInt(TariffData.min_price_str), incl_vat: parseInt(TariffData.min_price_str)}
  }
  if (TariffData.max_price_str !== undefined && TariffData.max_price_str !== '') {
    TariffData.max_price = {excl_vat: parseInt(TariffData.max_price_str), incl_vat: parseInt(TariffData.max_price_str)}
  }

  MsiFunc.deleteEmptyKeys(TariffData)
  console.log(TariffData.max_price)
  if (tariff_id) {
    ElMessageBox.confirm('確定要修改?','Warning', {confirmButtonText: 'OK', cancelButtonText: 'Cancel', type: 'warning'})
    .then(async () => {
      if (TariffData.profile_name === undefined ) {ElMessage.error('Oops, Profile Name required.')}
      else if (TariffData.country_code === undefined ) {ElMessage.error('Oops, Country Code required.')}
      else if (TariffData.currency === undefined) {ElMessage.error('Oops, Currency required.')}
      else {
      let res = await MsiApi.setCollectionData('patch', 'ocpi', TariffData)
			ElMessage.error(res.data.message)
		}
    })
    .catch((e)=>{
      console.log(e)
    })
  }
  else {
    let senddata = Object.assign(TariffData)
    ElMessageBox.confirm('確定要建立?','Warning', {confirmButtonText: 'OK', cancelButtonText: 'Cancel', type: 'warning'})
    .then(async () => {
      if (senddata.profile_name === undefined ) {ElMessage.error('Oops, Profile Name required.')}
      else if (senddata.country_code === undefined ) {ElMessage.error('Oops, Country Code required.')}
      else if (senddata.currency === undefined) {ElMessage.error('Oops, Currency required.')}
      else {
        let res = await MsiApi.setCollectionData('post', 'ocpi', senddata)
        ElMessage.error(res.data.message)
      }
    })
    .catch((e)=>{
      console.log(e)
    })
  }
}

const ShowElementDialog = (action,scope) => {
	element_action.value = action
	add_tariff_visible.value = true
	if (action === 'add') {
		price_components.type = ''
		price_components.price = ''
		price_components.vat ='', 
		price_components.step_size = 0
		restrictions.start_time = '00:00'
		restrictions.end_time = '00:00'
		restrictions.min_duration = 0
		restrictions.max_duration = 0
		restrictions.day_of_week = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
		tariff_element.price_components = price_components
		tariff_element.restrictions= restrictions
	}
	if (action === 'edit') {
		modifyIndex.value = scope.$index
		newObj1 = Object.assign({},scope.row.price_components)
		newObj2 = Object.assign({},scope.row.restrictions)
		tariff_element.price_components = scope.row.price_components
		tariff_element.restrictions= scope.row.restrictions
	}
}

const addElement = (action) => {
	add_tariff_visible.value = false
  // if (tariff_element.price_components[0].type === 'PARKING_TIME') {
  //   tariff_element.price_components[0].step_size = tariff_element.price_components[0].step_size * 60
  //   tariff_element.price_components[0].price = (3600 / tariff_element.price_components[0].step_size * 60 )
  // }

  console.log(tariff_element)

  

  if (tariff_element.price_components[0].type === '') {
    return
  }

  if (action === 'add') {
    let element = JSON.parse(JSON.stringify(tariff_element))
    tariff_elements.push(element)
	console.log(element)
  }
	else if (action === 'edit') {
		tariff_elements[modifyIndex.value] = tariff_element
	} 
	else if (action === 'delete') {
		tariff_elements.splice(modifyIndex.value,1)
	} 
	else if (action === 'cancel') {
		tariff_elements[modifyIndex.value].price_components = newObj1
		tariff_elements[modifyIndex.value].restrictions = newObj2


    console.log(tariff_elements)

	}


  

  


}

onMounted( async() => {
	if (tariff_id) {
		let queryData = { "database":"OCPI", "collection":"Tariff", "query": { "_id": { "ObjectId" : tariff_id}}}
		let res = await MsiApi.mongoQuery(queryData)
		Object.assign(TariffData, res.data.all[0]) 
			for(let i = 0; i < TariffData?.tariff_alt_text?.length; i++) {
				if (TariffData.tariff_alt_text[i].language === 'en') {
					textarea_en.value = TariffData.tariff_alt_text[i].text
				}
				else if (TariffData.tariff_alt_text[i].language === 'zh') {
					textarea_zh.value = TariffData.tariff_alt_text[i].text
				}
				else if (TariffData.tariff_alt_text[i].language === 'jp') {
					textarea_jp.value = TariffData.tariff_alt_text[i].text
				}
			}
		Object.assign(tariff_elements, TariffData.elements) 
    console.log(TariffData)
    TariffData.min_price_str = TariffData?.min_price?.incl_vat
    TariffData.max_price_str = TariffData?.max_price?.incl_vat

    console.log(tariff_id)
    queryData = { "database":"OCPI", "collection":"Tariff", "pipelines": [
    { $match: { "_id": {"ObjectId" : tariff_id} }}, { "$project": {"id": 1,}}
  ]}
    let response = await MsiApi.mongoAggregate(queryData)
    console.log(response.data.result[0].id)
    

    queryData = { "database":"OCPI", "collection":"Connector", "pipelines": [
    { $match: { "tariff_ids": {"UUID" : response.data.result[0].id} }}, { "$project": {"_id": 1,}}
  ]}

  response = await MsiApi.mongoAggregate(queryData)
  console.log(response)
  let used_connector = response.data.result
  
  queryData = { "database":"OCPI", "collection":"EVSE", "pipelines": [
    { "$project": {"_id": 0, "connectors": 1, "evse_id":1}}]
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
    color:#FFFFFF;
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
		color:#FFFFFF;
		border-radius: 20px;
	}

	.tariff-up{
		height: 50px;
		p{
			margin: 0;
			padding: 0;
			font-size: 40px;
		}
		// width: 300px;
		.add-tariff-element-btn {
    width: 220px;
    height: 40px;
    top: 80px;
    right : 40px;
    position: absolute;
    font-size: 18px;
    background-color: #000000DF;
    color:#FFFFFF;
    border-radius: 20px;

  }
		p{
			margin: 0;
			padding: 0;
			font-size: 40px;
		}
	}
	.tariff-main {
		display: flex;
		.tariff-left{
			width: 300px;
			margin-left: 30px;
			.el-input {
				width: 250px;
				--el-input-bg-color: rgb(86, 101, 117);
				--el-input-text-color: rgb(255, 255, 255);
			}
		}
		.tariff-right{
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
}

	
</style>