<script setup>
import { Search } from '@element-plus/icons-vue'
import { ref, reactive, onMounted} from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import ApiFunc from '@/composables/ApiFunc'
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
const company = MStore?.permission?.company?.name
  
const AddCompany = () => {
  CompanyFormVisible.value = true
  edit_mode.value = 'create'
  company_title.value = 'Add Company Info'
  for (let key in companyData)
    companyData[key] = ''
  companyData.payment = {hashIV:'', hashKey:'', merchantId:'', owner:''}
  companyData.invoice = {hashIV:'', hashKey:'', merchantId:'', owner:''}
  companyData.upgrade_manager = {enable:true}
}

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

const search = async () => {
  let queryData = null
  if (input.value === '') {
    queryData = { "database":"CPO", "collection":"CompanyInformation", "query": {}}
  }
  else {
    queryData = { "database":"CPO", "collection":"CompanyInformation", "query": {
      "$or" : [ {"name":{"$regex": input.value ,"$options":"i"} } , 
                {"country":{"$regex": input.value ,"$options":"i"} } , {"city":{"$regex": input.value ,"$options":"i"} } , 
                {"address":{"$regex": input.value ,"$options":"i"} } , {"phone":{"$regex": input.value ,"$options":"i"} } , 
                {"tax_id":{"$regex": input.value ,"$options":"i"} } , 
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
  companyData.invoice.owner = 'ezPay'
  companyData.payment.owner = 'NewebPay'
  let check_format_success = true
  const regex = /^[0-9a-zA-Z-]+$/

  if (regex.test(companyData.tax_id) === false) {
    check_format_success = false
    ElMessage.error('Oops, Tax ID format error.')
  }
  if (companyData.name === undefined || companyData.name === '') {  
    check_format_success = false
    ElMessage.error('Oops, Name required.')
  }
  if (edit_mode.value === 'create') {
    if (check_format_success === false)
      return
    if (action === 'confirm') {
      CompanyFormVisible.value = false
      let sendData = {  class : 'CompanyInformation', name: companyData.name,
                        country:companyData.country, party_id:companyData.party_id,
                        city:companyData.city, detail:companyData.detail, 
                        // remark:companyData.remark,
                        invoice:companyData.invoice, payment:companyData.payment,
                        address:companyData.address, phone:companyData.phone,
                        tax_id:companyData.tax_id,
                        upgrade_manager:companyData.upgrade_manager
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
    if (check_format_success === false)
      return
    if (action === 'confirm') {
      CompanyFormVisible.value = false
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
      CompanyFormVisible.value = false
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

<template>
  <div class="customer">
    <div class="container lg">
      <div class="flex justify-between flex-wrap lg:flex-nowrap pt-40px pb-32px">
        <el-input class="search-input" v-model="input" placeholder="Search" @keyup.enter="search">
          <template #append>
            <el-button :icon="Search" @click="search" />
          </template>
        </el-input>
        <el-button class="btn-secondary box-shadow" @click="AddCompany"> Add Company </el-button>
      </div>

      <div class="overflow-x-auto">
        <div class="customer-list pb-40px">
          <el-table 
            :data="UserData" 
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
              prop="name"
              label="Name"
              align="center"
              sortable
              :sort-method="(a, b) => sortFunc(a, b, 'name')"
              min-width="200"
            />
            <el-table-column
              prop="country"
              label="Country"
              align="center"
              sortable
              :sort-method="(a, b) => sortFunc(a, b, 'country')"
              min-width="150"
            />
            <el-table-column
              prop="city"
              label="City"
              align="center"
              sortable
              :sort-method="(a, b) => sortFunc(a, b, 'city')"
              min-width="200"
            />
            <el-table-column
              prop="address"
              label="Address"
              align="center"
              sortable
              :sort-method="(a, b) => sortFunc(a, b, 'address')"
              min-width="300"
            />
            <el-table-column
              prop="phone"
              label="Phone"
              align="center"
              sortable
              :sort-method="(a, b) => sortFunc(a, b, 'phone')"
              min-width="150"
            />
            <el-table-column
              prop="tax_id"
              label="Tax ID"
              align="center"
              sortable
              :sort-method="(a, b) => sortFunc(a, b, 'tax_id')"
              min-width="150"
            />
            <el-table-column
              prop="updated_date_str"
              label="Updated Date"
              align="center"
              sortable
              :sort-method="(a, b) => sortFunc(a, b, 'updated_date_str')"
              min-width="200"
            />
            <el-table-column
              prop="detail"
              label=""
              align="center"
              min-width="150"
            >
              <template #default="scope">
                <el-button class="btn-more" @click="detail_info(scope.row)"> <font-awesome-icon icon="fa-solid fa-ellipsis" /> </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <el-dialog
          v-model="CompanyFormVisible"
          class="max-w-600px"
          :show-close="true"
          width="90%"
          destroy-on-close
          center
        >
          <template #header="{ titleId, titleClass }">
            <div class="py-2rem relative bg-blue-100">
              <h4
                :id="titleId"
                :class="titleClass"
                class="m-0 text-center text-blue-1200 font-400 text-24px line-height-26px"
              >
                {{ company_title }}
              </h4>
            </div>
          </template>
          <div class="dialog-context">
            <el-form class="max-w-500px m-auto">
              <el-form-item class="mb-24px" label="Name">
                <el-input v-model.trim="companyData.name" />
              </el-form-item>

              <el-form-item class="mb-24px" label="Country">
                <el-input v-model.trim="companyData.country" />
              </el-form-item>

              <!-- <el-form-item class="mb-24px" label="Operator ID">
                <el-input v-model.trim="companyData.party_id" />
              </el-form-item> -->

              <el-form-item class="mb-24px" label="City">
                <el-input v-model.trim="companyData.city" />
              </el-form-item>

              <el-form-item class="mb-24px" label="Address">
                <el-input v-model.trim="companyData.address" />
              </el-form-item>

              <el-form-item class="mb-24px" label="Tax ID">
                <el-input v-model.trim="companyData.tax_id" />
              </el-form-item>

              <el-form-item class="mb-24px" label="Phone">
                <el-input v-model.trim="companyData.phone" />
              </el-form-item>

              <!-- <el-form-item class="mb-24px" label="Remark">
                <el-input v-model.trim="companyData.remark" />
              </el-form-item> -->

              <el-form-item class="mb-24px" label="Invoice Hash IV">
                <el-input v-model.trim="companyData.invoice.hashIV" />
              </el-form-item>

              <el-form-item class="mb-24px" label="Invoice Hash Key">
                <el-input v-model.trim="companyData.invoice.hashKey" />
              </el-form-item>

              <el-form-item class="mb-24px" label="Invoice Merchant ID">
                <el-input v-model.trim="companyData.invoice.merchantId" />
              </el-form-item>

              <!-- <el-form-item class="mb-24px" label="Invoice Owner">
                <el-input v-model.trim="companyData.invoice.owner" />
              </el-form-item> -->

              <el-form-item class="mb-24px" label="Payment Hash IV">
                <el-input v-model.trim="companyData.payment.hashIV" />
              </el-form-item>

              <el-form-item class="mb-24px" label="Payment Hash Key">
                <el-input v-model.trim="companyData.payment.hashKey" />
              </el-form-item>

              <el-form-item class="mb-24px" label="Payment Merchant ID">
                <el-input v-model.trim="companyData.payment.merchantId" />
              </el-form-item>

              <!-- <el-form-item class="mb-24px" label="Payment Owner">
                <el-input v-model.trim="companyData.payment.owner" />
              </el-form-item> -->

              <el-form-item v-if="company === 'MSI'" class="mb-24px" label="Active">
                <el-switch v-model="companyData.upgrade_manager.enable" />
              </el-form-item>
            </el-form>
          </div>
          <template #footer>
            <span class="dialog-footer flex flex-center">
              <el-button
                v-if=" edit_mode !== 'create'"
                round
                class="w-48% bg-btn-100 text-white max-w-140px"
                @click.stop="editCompany('delete')"
              >
                Delete
              </el-button>
              <el-button
                round
                class="w-48% bg-btn-100 text-white max-w-140px"
                @click.stop="editCompany('cancel')"
              >
                Cancel
              </el-button>
              <el-button
                round
                class="w-48% bg-btn-200 text-white max-w-140px"
                @click.stop="editCompany('confirm')"
              >
                Confirm
              </el-button>
            </span>
          </template>
        </el-dialog>
      </div>
    </div>
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
}
  
</style>