<template>
    <div class="customer">

      <el-input class="search-input" v-model="input" placeholder="Please input" @keyup.enter="search">
        <template #append>
          <el-button :icon="Search" @click="search" />
        </template>
      </el-input>
  
      <el-button class="add-user-btn" @click="AddCompany"> Add Company </el-button>
  
      <div class="customer-list">
        <el-table :data="UserData" style="width: 95%; height:95%" stripe :cell-style=msi.tb_cell :header-cell-style=msi.tb_header_cell size="large"
        v-loading = "isLoading">
          <el-table-column v-for="item in UserTable" :key="item" :prop=item.value :label=item.label  :min-width=item.width :sortable="item.sortable">
            <template #default="scope" v-if ="item.type === 'button'">
              <el-button @click="detail_info(scope.row)"> <font-awesome-icon icon="fa-solid fa-ellipsis" /> </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <el-dialog v-model="CompanyFormVisible" :title=company_title draggable>
    <el-form :model="companyData">
      <el-form-item label="Company Name" >
        <el-input v-model="companyData.name" />
      </el-form-item>

      <el-form-item label="Country" >
        <el-input v-model="companyData.country" />
      </el-form-item>

      <!-- <el-form-item label="Operator ID" >
        <el-input v-model="companyData.party_id" />
      </el-form-item> -->

      <el-form-item label="City" >
        <el-input v-model="companyData.city" />
      </el-form-item>

      <el-form-item label="Address" >
        <el-input v-model="companyData.address" />
      </el-form-item>

      <el-form-item label="Tax" >
        <el-input v-model="companyData.tax_id" />
      </el-form-item>

      <el-form-item label="Phone" >
        <el-input v-model="companyData.phone" />
      </el-form-item>
      <!-- <el-form-item label="Remark" >
        <el-input v-model="companyData.remark" />
      </el-form-item> -->
      <hr>
<br>
      <el-form-item label="Invoice Hash IV" >
        <el-input v-model="companyData.invoice.hashIV" />
      </el-form-item>
      <el-form-item label="Invoice Hash Key" >
        <el-input v-model="companyData.invoice.hashKey" />
      </el-form-item>
      <el-form-item label="Invoice Merchant ID" >
        <el-input v-model="companyData.invoice.merchantId" />
      </el-form-item>
      <!-- <el-form-item label="Invoice Owner" >
        <el-input v-model="companyData.invoice.owner" />
      </el-form-item> -->
      <el-form-item label="Payment Hash IV" >
        <el-input v-model="companyData.payment.hashIV" />
      </el-form-item>
      <el-form-item label="Payment Hash Key" >
        <el-input v-model="companyData.payment.hashKey" />
      </el-form-item>
      <el-form-item label="Payment Merchant ID" >
        <el-input v-model="companyData.payment.merchantId" />
      </el-form-item>
      <!-- <el-form-item label="Payment Owner" >
        <el-input v-model="companyData.payment.owner" />
      </el-form-item> -->
      
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button v-if=" edit_mode !== 'create'" @click="editCompany('delete')">Delete</el-button>
        <el-button @click="editCompany('cancel')">Cancel</el-button>
        <el-button type="primary" @click="editCompany('confirm')">
          Confirm
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>
  
<script setup>
import { Search } from '@element-plus/icons-vue'
import { ref, reactive, onMounted} from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import ApiFunc from '@/components/ApiFunc'
import msi from '@/assets/msi_style'
import moment from "moment"
import {  ElMessageBox,ElMessage } from 'element-plus'
import { useMStore } from "../stores/m_cloud"
const MStore = useMStore();
const MsiApi = ApiFunc()
const edit_mode = ref('create')
const CompanyFormVisible = ref(false)
const UserData = reactive([])
const input = ref('')
const companyData = reactive([])
const isLoading = ref(false)
const company_title = ref('Add Company Info')
const UserTable = [ {label:'Name', value:'name', width:'80'},  
// {label:'Operator ID', value:'party_id', width:'60'}, 
                    {label:'Country', value:'country', width:'60'}, {label:'City', value:'city', width:'60'}, 
                    {label:'Address', value:'address', width:'80'}, {label:'Phone', value:'phone', width:'60'}, 
                    // {label:'Remark', value:'remark', width:'80'}, 
                    {label:'Tax ID', value:'tax_id', width:'40'}, 
                    {label:'Updated Date', value:'updated_date_str', width:'80'}, {label:'', value:'detail', width:'40', type:'button'}
                  ]
  
const AddCompany = () => {
  company_title.value = 'Add Company Info'
  for (let key in companyData)
    companyData[key] = ''
  CompanyFormVisible.value=true
  edit_mode.value = 'create'
  companyData.payment = {hashIV:'', hashKey:'', merchantId:'', owner:''}
  companyData.invoice = {hashIV:'', hashKey:'', merchantId:'', owner:''}
}

const search = async () => {
  let queryData = null
  if (input.value === '') {
    queryData = { "database":"CPO", "collection":"CompanyInformation", "query": {}}
  }
  else {
    queryData = { "database":"CPO", "collection":"CompanyInformation", "query": {
      "$or" : [ {"name":{"$regex": input.value ,"$options":"i"} } , 
                // {"party_id":{"$regex": input.value ,"$options":"i"} } , 
                {"country":{"$regex": input.value ,"$options":"i"} } , {"city":{"$regex": input.value ,"$options":"i"} } , 
                {"address":{"$regex": input.value ,"$options":"i"} } , {"phone":{"$regex": input.value ,"$options":"i"} } , 
                // {"remark":{"$regex": input.value ,"$options":"i"} } , 
                // {"tax_id":{"$regex": input.value ,"$options":"i"} } , 
                {"updated_date_str":{"$regex": input.value ,"$options":"i"} } , 
              ]
    }}
  }
  await MongoQurey(queryData)
}

const detail_info = (detail) => {
  company_title.value = 'Edit Company Info'
  edit_mode.value = 'edit'
  CompanyFormVisible.value = true
  for (let key in companyData)
    companyData[key] = ''
  Object.assign(companyData, detail)
}

const editCompany = async (action) => {
  CompanyFormVisible.value = false
  companyData.invoice.owner = 'ezPay'
  companyData.payment.owner = 'NewebPay'
  if (edit_mode.value === 'create') {
    if (action === 'confirm') {
      let sendData = {  class : 'CompanyInformation', name: companyData.name,
                        country:companyData.country, party_id:companyData.party_id,
                        city:companyData.city, detail:companyData.detail, 
                        // remark:companyData.remark,
                        invoice:companyData.invoice, payment:companyData.payment,
                        address:companyData.address, phone:companyData.phone,
                        tax_id:companyData.tax_id
                      }
      if (sendData.name === undefined || sendData.name === '') {  
        ElMessage.error('Oops, Name required.')
        return
      }
      ElMessageBox.confirm('Do you want to create?','Warning', {confirmButtonText: 'OK', cancelButtonText: 'Cancel', type: 'warning'})
      .then(async () => {
        let res = await MsiApi.setCollectionData('post', 'cpo', sendData)
        if (res.status === 201) {
          let queryData = { "database":"CPO", "collection":"CompanyInformation", "query": {}}
          await MongoQurey(queryData)
        }
      })
      .catch((e)=>{
        console.log(e)
      })
    }
  }
  else if (edit_mode.value === 'edit'){
    if (action === 'confirm') {
      let sendData = {  class : 'CompanyInformation', pk: companyData._id,name: companyData.name, 
                        country:companyData.country, party_id:companyData.party_id,
                        city:companyData.city, detail:companyData.detail, 
                        // remark:companyData.remark,
                        invoice:companyData.invoice, payment:companyData.payment,
                        address:companyData.address, phone:companyData.phone,
                        tax_id:companyData.tax_id
                      }
      ElMessageBox.confirm('Do you want to modify?','Warning', {confirmButtonText: 'OK', cancelButtonText: 'Cancel', type: 'warning'})
      .then(async () => {
        let res = await MsiApi.setCollectionData('patch', 'cpo', sendData)
        if (res.status === 200) {
          let queryData = { "database":"CPO", "collection":"CompanyInformation", "query": {}}
          await MongoQurey(queryData)
        }
      })
      .catch((e)=>{
        console.log(e)
      }) 
    }
    else if (action === 'delete') {
      let sendData = { class : 'CompanyInformation', pk : companyData._id }
      ElMessageBox.confirm('Do you want to delete?','Warning', {confirmButtonText: 'OK', cancelButtonText: 'Cancel', type: 'warning'})
      .then(async () => {
        let res = await MsiApi.setCollectionData('delete', 'cpo', sendData)
        if (res.status === 200) {
          let queryData = { "database":"CPO", "collection":"CompanyInformation", "query": {}}
          await MongoQurey(queryData)
        }
      })
      .catch((e)=>{
        console.log(e)
      })
    }
  }
}

const MongoQurey = async (queryData) => {
  isLoading.value = true
  let response = await MsiApi.mongoQuery(queryData)
  UserData.length = 0
  Object.assign(UserData, response.data.all)
  for (let i = 0; i < UserData.length; i++) { 
    let localEndTime =  new Date( (new Date(UserData[i].updated_date).getTime()) + ((MStore.timeZoneOffset ) * -60000))
    UserData[i].updated_date_str = (moment(localEndTime).format("YYYY-MM-DD HH:mm:ss"))
  }
  isLoading.value = false
  return response
}
  
onMounted( async() => {
    let queryData = { "database":"CPO", "collection":"CompanyInformation", "query": {}}
    console.log( await MongoQurey(queryData))
})
</script>
  
<style lang="scss">
.customer {
  position: relative;
  width: 100%;
  height: 100%;
  .customer-list {
    width: calc(100% - 40px);
    height: calc(100% - 120px);
    top: 120px;
    left : 40px;
    position: absolute;
  }

  .customer-list-btn {
    top: 40px;
    left: 40px;
    position: absolute;
  }
  .guest-list-btn {
    top: 40px;
    left: 160px;
    position: absolute;
  }

  .search-input {
    width: 400px;
    height: 40px;
    top: 40px;
    right : 300px;
    position: absolute;
  }

  .add-user-btn {
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