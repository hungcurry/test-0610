<script setup>
import { Search } from '@element-plus/icons-vue'
import { ref, reactive, onMounted} from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import ApiFunc from '@/composables/ApiFunc'
import msi from '@/assets/msi_style'
import moment from "moment"
import {  ElMessageBox,ElMessage } from 'element-plus'
import { useMStore } from "../stores/m_cloud"
import { useI18n } from "vue-i18n"

const { t } = useI18n()
const MStore = useMStore();
const MsiApi = ApiFunc()
const edit_mode = ref('create')
const CompanyFormVisible = ref(false)
const UserData = reactive([])
const input = ref('')
const companyData = reactive([])
const isLoading = ref(false)
const company_title = ref(t('add_company_info'))
const company = MStore?.permission?.company?.name
const company_ref = ref()
const session_currency_opeion = [{ value: 'TWD', label: 'TWD' }, { value: 'USD', label: 'USD' }, { value: 'JPY', label: 'JPY' }, { value: 'EUR', label: 'EUR' },{ value: 'CNY', label: 'CNY' }]

const validAgreedFee = (rule, value, callback) => {
  if (value < 3 && value !== undefined && value !== '') {
    callback(new Error(t('the_agreed_fee_must_be_greater_than_3')))
  }
  else {
    callback()
  }
}
const validTaxid = (rule, value, callback) => {
  const regex = /^[0-9a-zA-Z-]+$/
  if (regex.test(value) && value?.length === 8) {
    callback()
  }
  else if (value?.length === 0 || value?.length === undefined) {
    callback(new Error(t('the_item_is_required')))
  }
  else if (value?.length !== 8) {
    callback(new Error(t('the_tax_id_must_be_8_characters_in_length')))
  }
  else {
    callback(new Error(t('please_check_the_format_of_the_tax_id')))
  }
}

const company_rules = reactive({
  name: [
    { required: true, message: t('the_item_is_required'), trigger: 'blur' },
  ],
  tax_id: [
    { required: true, trigger: 'blur', validator: validTaxid },
  ],
  upgrade_manager_agreed_fee: [
    { required: false, trigger: 'blur', validator: validAgreedFee },
  ],
})
  
const AddCompany = () => {
  CompanyFormVisible.value = true
  edit_mode.value = 'create'
  company_title.value = t('add_company_info')
  for (let key in companyData)
    companyData[key] = ''
  companyData._id = undefined
  companyData.payment = {hashIV:'', hashKey:'', merchantId:'', owner:''}
  companyData.invoice = {hashIV:'', hashKey:'', merchantId:'', owner:''}
  companyData.upgrade_manager = {enable:true}
  companyData.upgrade_manager_enable = true
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
    queryData = { 
      "database": 'CPO', 
      "collection": 'CompanyInformation', 
      "pipelines": [
        {
          $project: { _id: 1, salt: 0, hashed_password: 0 } 
        }
      ]
    }
  }
  else {
    // search for CPO.LimitPlan to find subscription plan names that match the criteria.
    queryData = { 
      "database": 'CPO', 
      "collection": 'LimitPlan', 
      "pipelines": [
        {
          $match : {
            name: {
              $regex: input.value,
              $options: "i",
            }
          }
        },
        {
          $project: { _id: 1, name: 1 } 
        }
      ]
    }
    let res = await MsiApi.mongoAggregate(queryData)

    let plan_id =[]
    for (let i=0; i<res.data.result.length; i++) {
      plan_id.push(res.data.result[i]._id)
    }
    
    let hour = (Math.floor(Math.abs(MStore.timeZoneOffset) / 60)).toString().padStart(2, '0')
    let min = (Math.abs(MStore.timeZoneOffset) % 60).toString().padStart(2, '0')
    let timezone = MStore.timeZoneOffset > 0? '-' + hour + min : '+' + hour + min

    queryData = { 
      database: 'CPO', 
      collection: 'CompanyInformation', 
      pipelines: [
        {
          $addFields: { "due_plan_str": { $toString: "$upgrade_manager.subscribe.due_plan" } }
        },
        {
          $addFields: {
            "updated_date_str": { 
              $dateToString: {
                format: '%Y-%m-%d %H:%M:%S',
                date: {
                  $dateFromString: {
                    dateString: { $toString: '$updated_date'}
                  }
                },
                timezone: timezone
              }
            }
          }
        },
        {
          $match : {
            $or: [
              {
                name: {
                  $regex: input.value,
                  $options: "i",
                },
              },
              {
                country: {
                  $regex: input.value,
                  $options: "i",
                },
              },
              {
                city: {
                  $regex: input.value,
                  $options: "i",
                },
              },
              {
                address: {
                  $regex: input.value,
                  $options: "i",
                },
              },
              {
                phone: {
                  $regex: input.value,
                  $options: "i",
                },
              },
              {
                tax_id: {
                  $regex: input.value,
                  $options: "i",
                },
              },
              {
                updated_date_str: {
                  $regex: input.value,
                  $options: "i",
                },
              },
              {
                "due_plan_str": { $in: plan_id}
              }
            ]
          }
        },
        { 
          $project: { _id: 1, salt: 0, hashed_password: 0 } 
        }
      ]
    }
  }
  console.log(await MongoAggregate(queryData))
}

const detail_info = (detail) => {
  company_title.value = t('edit_company_info')
  edit_mode.value = 'edit'
  CompanyFormVisible.value = true
  for (let key in companyData)
    companyData[key] = ''
  Object.assign(companyData, detail)
  companyData.invoice_hashIV = companyData.invoice.hashIV
  companyData.invoice_hashKey = companyData.invoice.hashKey
  companyData.invoice_merchantId = companyData.invoice.merchantId
  companyData.payment_hashIV = companyData.payment.hashIV
  companyData.payment_hashKey = companyData.payment.hashKey
  companyData.payment_merchantId = companyData.payment.merchantId
  companyData.upgrade_manager_enable = companyData.upgrade_manager.enable
}

const checkCompanyName = async() => {
  let queryData = { 
    "database": 'CPO', 
    "collection": 'CompanyInformation', 
    "pipelines": [
      { 
        $match: { 
          $and: [
            {
              "name": companyData.name
            },
            {
              _id: { $ne: {"ObjectId" : companyData._id}}
            }
          ]
        },
      },
      {
        $project: { _id: 1, name: 1 } 
      }
    ]
  }
  let response = await MsiApi.mongoAggregate(queryData) 
  if (response.data.result.length !== 0) {
    ElMessage({ type: 'error', message: t('company_already_exists') })
    return false
  }

  return true
}

const editCompany = async (action) => {
  companyData.invoice.owner = 'ezPay'
  companyData.payment.owner = 'NewebPay'

  if (action === 'cancel') {
    CompanyFormVisible.value = false
    return
  }
  if (edit_mode.value === 'create') {
    if (action === 'confirm') {
      company_ref.value.validate(async valid => {
        if (valid && await checkCompanyName() === true) {
          CompanyFormVisible.value = false
          companyData.invoice.hashIV = companyData.invoice_hashIV
          companyData.invoice.hashKey = companyData.invoice_hashKey
          companyData.invoice.merchantId = companyData.invoice_merchantId
          companyData.payment.hashIV = companyData.payment_hashIV
          companyData.payment.hashKey = companyData.payment_hashKey
          companyData.payment.merchantId = companyData.payment_merchantId
          if (companyData.upgrade_manager_agreed_fee) {
            if (companyData.upgrade_manager.session_fee === undefined)
              companyData.upgrade_manager.session_fee = []
            companyData.upgrade_manager.session_fee.push({type: 'AgreeFee', price: companyData.upgrade_manager_agreed_fee})
          }
          if (companyData.upgrade_manager_session_fee) {
            if (companyData.upgrade_manager.session_fee === undefined)
              companyData.upgrade_manager.session_fee = []
            companyData.upgrade_manager.session_fee.push({type: 'Session', price: companyData.upgrade_manager_session_fee, currency: companyData.upgrade_manager_session_fee_currency})
          }
          companyData.upgrade_manager.enable = companyData.upgrade_manager_enable
          let sendData = {  class : 'CompanyInformation', name: companyData.name,
                            country:companyData.country, party_id:companyData.party_id,
                            city:companyData.city, detail:companyData.detail, 
                            // remark:companyData.remark,
                            invoice:companyData.invoice, payment:companyData.payment,
                            address:companyData.address, phone:companyData.phone,
                            tax_id:companyData.tax_id,
                            upgrade_manager:companyData.upgrade_manager
                          }
            ElMessageBox.confirm(t('do_you_want_to_create'),t('warning'), {confirmButtonText: t('ok'), cancelButtonText: t('cancel'), type: 'warning'})
            .then(async () => {
              let res = await MsiApi.setCollectionData('post', 'cpo', sendData)
              if (res.status === 201) {
                let queryData = { 
                  "database": 'CPO', 
                  "collection": 'CompanyInformation', 
                  "pipelines": [
                    {
                      $project: { _id: 1, salt: 0, hashed_password: 0 } 
                    }
                  ]
                }
                await MongoAggregate(queryData)
              }
            })
            .catch((e)=>{
              console.log(e)
            })
        }
        else {
          return false
        }
      })

    }
  }
  else if (edit_mode.value === 'edit'){
    if (action === 'confirm') {
      company_ref.value.validate(async valid => {
        if (valid && await checkCompanyName() === true) {
          CompanyFormVisible.value = false
          ElMessageBox.confirm(t('do_you_want_to_modify'),t('warning'), {confirmButtonText: t('ok'), cancelButtonText: t('cancel'), type: 'warning'})
          .then(async () => {
            companyData.invoice.hashIV = companyData.invoice_hashIV
            companyData.invoice.hashKey = companyData.invoice_hashKey
            companyData.invoice.merchantId = companyData.invoice_merchantId
            companyData.payment.hashIV = companyData.payment_hashIV
            companyData.payment.hashKey = companyData.payment_hashKey
            companyData.payment.merchantId = companyData.payment_merchantId
            companyData.upgrade_manager.enable = companyData.upgrade_manager_enable
            if (companyData.upgrade_manager_agreed_fee) {
              if (companyData.upgrade_manager.session_fee === undefined) {
                companyData.upgrade_manager.session_fee = []
                companyData.upgrade_manager.session_fee.push({type: 'AgreeFee', price: companyData.upgrade_manager_agreed_fee})
              }
              else {
                for (let i=0; i<companyData.upgrade_manager.session_fee.length; i++) {
                  if (companyData.upgrade_manager.session_fee[i].type === 'AgreeFee') {
                    companyData.upgrade_manager.session_fee[i].price = companyData.upgrade_manager_agreed_fee
                    break
                  }
                  else if (i === companyData.upgrade_manager.session_fee.length-1) {
                    companyData.upgrade_manager.session_fee.push({type: 'AgreeFee', price: companyData.upgrade_manager_agreed_fee})
                  }
                }
              }
            }
            if (companyData.upgrade_manager_session_fee) {
              if (companyData.upgrade_manager.session_fee === undefined) {
                companyData.upgrade_manager.session_fee = []
                companyData.upgrade_manager.session_fee.push({type: 'Session', price: companyData.upgrade_manager_session_fee, currency: companyData.upgrade_manager_session_fee_currency})
              }
              else {
                for (let i=0; i<companyData.upgrade_manager.session_fee.length; i++) {
                  if (companyData.upgrade_manager.session_fee[i].type === 'Session') {
                    companyData.upgrade_manager.session_fee[i].price = companyData.upgrade_manager_session_fee
                    companyData.upgrade_manager.session_fee[i].currency = companyData.upgrade_manager_session_fee_currency
                    break
                  }
                  else if (i === companyData.upgrade_manager.session_fee.length-1) {
                    companyData.upgrade_manager.session_fee.push({type: 'Session', price: companyData.upgrade_manager_session_fee, currency: companyData.upgrade_manager_session_fee_currency})
                  }
                }
              }
            }
            let sendData = {  class : 'CompanyInformation', pk: companyData._id,name: companyData.name, 
                              country:companyData.country, party_id:companyData.party_id,
                              city:companyData.city, detail:companyData.detail, 
                              // remark:companyData.remark,
                              invoice:companyData.invoice, payment:companyData.payment,
                              address:companyData.address, phone:companyData.phone,
                              tax_id:companyData.tax_id,
                              upgrade_manager:companyData.upgrade_manager
                            }
            let res = await MsiApi.setCollectionData('patch', 'cpo', sendData)
            if (res.status === 200) {
              let queryData = { 
                "database": 'CPO', 
                "collection": 'CompanyInformation', 
                "pipelines": [
                  {
                    $project: { _id: 1, salt: 0, hashed_password: 0 } 
                  }
                ]
              }
              await MongoAggregate(queryData)
            }
          })
          .catch((e)=>{
            console.log(e)
          }) 
        }
        else {
          return false
        }
      })

    }
    else if (action === 'delete') {
      CompanyFormVisible.value = false
      let sendData = { class : 'CompanyInformation', pk : companyData._id }
      ElMessageBox.confirm(t('do_you_want_to_delete'),t('warning'), {confirmButtonText: t('ok'), cancelButtonText: t('cancel'), type: 'warning'})
      .then(async () => {
        let res = await MsiApi.setCollectionData('delete', 'cpo', sendData)
        if (res.status === 200) {
          let queryData = { 
            "database": 'CPO', 
            "collection": 'CompanyInformation', 
            "pipelines": [
              {
                $project: { _id: 1, salt: 0, hashed_password: 0 } 
              }
            ]
          }
          await MongoAggregate(queryData)
        }
      })
      .catch((e)=>{
        console.log(e)
      })
    }
  }
}

const MongoAggregate = async (queryData) => {
  isLoading.value = true
  let response = await MsiApi.mongoAggregate(queryData)
  UserData.length = 0
  Object.assign(UserData, response.data.result)

  let ProgramData = []
  queryData = { 
    "database": 'CPO', 
    "collection": 'LimitPlan', 
    "pipelines": [
      {
        $project: { _id: 1, name: 1 } 
      }
    ]
  }
  let res = await MsiApi.mongoAggregate(queryData)
  if (res.status === 200) {
    Object.assign(ProgramData, res.data.result)
  } else {
    ElMessage.error(res.data.message)
  }
  for (let i = 0; i < UserData.length; i++) { 
    let localEndTime =  new Date( (new Date(UserData[i].updated_date).getTime()) + ((MStore.timeZoneOffset ) * -60000))
    UserData[i].updated_date_str = (moment(localEndTime).format("YYYY-MM-DD HH:mm:ss"))
    for (let j = 0; j < ProgramData.length; j++ )
      if (UserData[i]?.upgrade_manager?.subscribe?.due_plan === ProgramData[j]._id) {
        UserData[i].subscribe_str = ProgramData[j].name
        break
      }
    for (let j = 0; j < UserData[i]?.upgrade_manager.session_fee?.length; j++) {
      if (UserData[i]?.upgrade_manager.session_fee[j].type === 'AgreeFee') {
        UserData[i].upgrade_manager_agreed_fee = UserData[i]?.upgrade_manager.session_fee[j].price
      }
      else if (UserData[i]?.upgrade_manager.session_fee[j].type === 'Session') {
        UserData[i].upgrade_manager_session_fee = UserData[i]?.upgrade_manager.session_fee[j].price
        UserData[i].upgrade_manager_session_fee_currency = UserData[i]?.upgrade_manager.session_fee[j].currency
      }
    }
  }
  console.log(UserData)
  isLoading.value = false
  return response
}
  
onMounted( async() => {
    let queryData = { 
      "database": 'CPO', 
      "collection": 'CompanyInformation', 
      "pipelines": [
        {
          $project: { _id: 1, salt: 0, hashed_password: 0 } 
        }
      ]
    }
    console.log( await MongoAggregate(queryData))
})
</script>

<template>
  <div class="customer">
    <div class="container lg">
      <div class="flex justify-between flex-wrap lg:flex-nowrap pt-40px pb-32px">
        <el-input class="search-input" v-model="input" :placeholder="t('search')" @keyup.enter="search">
          <template #append>
            <el-button :icon="Search" @click="search" />
          </template>
        </el-input>
        <el-button 
          v-if="MStore.rule_permission.Company.addCompany === 'O' || MStore.permission.isCompany"
          class="btn-secondary box-shadow" @click="AddCompany"> {{ t('add_company') }} </el-button>
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
              :label="t('name')"
              align="center"
              sortable
              :sort-method="(a, b) => sortFunc(a, b, 'name')"
              min-width="200"
            />
            <el-table-column
              prop="country"
              :label="t('country')"
              align="center"
              sortable
              :sort-method="(a, b) => sortFunc(a, b, 'country')"
              min-width="150"
            />
            <el-table-column
              prop="city"
              :label="t('city')"
              align="center"
              sortable
              :sort-method="(a, b) => sortFunc(a, b, 'city')"
              min-width="200"
            />
            <el-table-column
              prop="address"
              :label="t('address')"
              align="center"
              sortable
              :sort-method="(a, b) => sortFunc(a, b, 'address')"
              min-width="300"
            />
            <el-table-column
              prop="phone"
              :label="t('phone')"
              align="center"
              sortable
              :sort-method="(a, b) => sortFunc(a, b, 'phone')"
              min-width="150"
            />
            <el-table-column
              prop="tax_id"
              :label="t('tax_id')"
              align="center"
              sortable
              :sort-method="(a, b) => sortFunc(a, b, 'tax_id')"
              min-width="150"
            />
            <el-table-column
              prop="subscribe_str"
              :label="t('subscribe')"
              align="center"
              sortable
              :sort-method="(a, b) => sortFunc(a, b, 'tax_id')"
              min-width="150"
            />
            <el-table-column
              prop="updated_date_str"
              :label="t('updated_date')"
              align="center"
              sortable
              :sort-method="(a, b) => sortFunc(a, b, 'updated_date_str')"
              min-width="200"
            />
            <el-table-column
              prop=""
              label=""
              align="center"
              min-width="150"
            >
              <template #default="scope">
                <el-button 
                  v-if="MStore.rule_permission.Company.detail === 'O' || MStore.permission.isCompany"
                  class="btn-more" @click="detail_info(scope.row)"> <font-awesome-icon icon="fa-solid fa-ellipsis" /> </el-button>
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
            <el-form class="max-w-500px m-auto" :rules="company_rules" ref="company_ref" :model="companyData" :scroll-to-error=true>
              <el-form-item class="mb-24px" :label="t('name')" prop="name">
                <el-input v-model="companyData.name" />
              </el-form-item>

              <el-form-item class="mb-24px" :label="t('country')" prop="country">
                <el-input v-model="companyData.country" />
              </el-form-item>

              <!-- <el-form-item class="mb-24px" label="Operator ID">
                <el-input v-model="companyData.party_id" />
              </el-form-item> -->

              <el-form-item class="mb-24px" :label="t('city')" prop="city">
                <el-input v-model="companyData.city" />
              </el-form-item>

              <el-form-item class="mb-24px" :label="t('address')" prop="address">
                <el-input v-model="companyData.address" />
              </el-form-item>

              <el-form-item class="mb-24px" :label="t('tax_id')" prop="tax_id">
                <el-input v-model="companyData.tax_id" />
              </el-form-item>

              <el-form-item class="mb-24px" :label="t('phone')" prop="phone">
                <el-input v-model="companyData.phone" />
              </el-form-item>

              <!-- <el-form-item class="mb-24px" label="Remark">
                <el-input v-model="companyData.remark" />
              </el-form-item> -->

              <el-form-item class="mb-24px" :label="t('agreed_fee')" prop="upgrade_manager_agreed_fee">
                <el-input v-model="companyData.upgrade_manager_agreed_fee" @input="validAgreedFee">
                  <template #suffix><span class="h-30px">%</span></template>
                </el-input>
              </el-form-item>

              <div class="flex">
                <el-form-item class="mb-24px w-90%" :label="t('session_fee')" prop="upgrade_manager_session_fee">
                  <el-input v-model="companyData.upgrade_manager_session_fee" />
                </el-form-item>
                <el-form-item class="mb-24px" :label="t('currency')" prop="currency">
                  <el-select v-model="companyData.upgrade_manager_session_fee_currency" placeholder="Select" size="large" class="">
                    <el-option v-for="item in session_currency_opeion" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </el-form-item>
              </div>

              <el-form-item class="mb-24px" :label="t('invoice_hash_iv')">
                <el-input v-model="companyData.invoice_hashIV" />
              </el-form-item>

              <el-form-item class="mb-24px" :label="t('invoice_hash_key')">
                <el-input v-model="companyData.invoice_hashKey" />
              </el-form-item>

              <el-form-item class="mb-24px" :label="t('invoice_merchant_id')">
                <el-input v-model="companyData.invoice_merchantId" />
              </el-form-item>

              <!-- <el-form-item class="mb-24px" label="Invoice Owner">
                <el-input v-model="companyData.invoice.owner" />
              </el-form-item> -->

              <el-form-item class="mb-24px" :label="t('payment_hash_iv')">
                <el-input v-model="companyData.payment_hashIV" disabled />
              </el-form-item>

              <el-form-item class="mb-24px" :label="t('payment_hash_key')">
                <el-input v-model="companyData.payment_hashKey" disabled />
              </el-form-item>

              <el-form-item class="mb-24px" :label="t('payment_merchant_id')">
                <el-input v-model="companyData.payment_merchantId" disabled />
              </el-form-item>

              <!-- <el-form-item class="mb-24px" label="Payment Owner">
                <el-input v-model="companyData.payment.owner" />
              </el-form-item> -->

              <el-form-item v-if="company === 'MSI'" class="mb-24px w-4em" :label="t('active')">
                <el-switch v-model="companyData.upgrade_manager_enable" />
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
                {{ t('delete') }}
              </el-button>
              <el-button
                round
                class="w-48% bg-btn-100 text-white max-w-140px"
                @click.stop="editCompany('cancel')"
              >
                {{ t('cancel') }}
              </el-button>
              <el-button
                round
                class="w-48% bg-btn-200 text-white max-w-140px"
                @click.stop="editCompany('confirm')"
              >
                {{ t('confirm') }}
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
  :deep(.el-input) {
    height: 30px;
  }
}
  
</style>