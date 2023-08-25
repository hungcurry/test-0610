<script setup>
import msi from '@/assets/msi_style'
import ApiFunc from '@/composables/ApiFunc'
import { ref, reactive, onMounted } from 'vue'
import { useMStore } from '../stores/m_cloud'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { ElMessage } from 'element-plus'
import { useI18n } from "vue-i18n"

const { t } = useI18n()
const MStore = useMStore()
const MsiApi = ApiFunc()
const first_name = ref('')
const last_name = ref('')
const email = ref('')
const ProgramVisible = ref(false)
const CheckProgramVisible = ref(false)
const CardData = reactive([])
const program_plan = reactive([])
const select_plan = reactive([])
const ProgramData = reactive([])
const companyData = reactive({})
const Effective = ref('1')
const currentRow = ref()
const isLoading = ref(false)
const selectProgram = ref('1')
let companyId = ''
let upgrade_manager = {}
let queryData = null
let response = null

const adminInfo_ref = ref()
const adminInfo_rules = reactive({
  name: [
    { required: true, message: t('the_item_is_required'), trigger: 'blur' },
  ],
  address_str: [
    { required: true, message: t('the_item_is_required'), trigger: 'blur' },
  ],
  phone: [
    { required: true, message: t('the_item_is_required'), trigger: 'blur' },
  ],
  tax_id: [
    { required: true, message: t('the_item_is_required'), trigger: 'blur' },
  ],
  email: [
    { required: true, message: t('the_item_is_required'), trigger: 'blur' },
  ],
})
const cancelProgram = () => {
  ProgramVisible.value = false
  selectProgram.value = '1'
}
const subscribeProgram = async () => {
  adminInfo_ref.value.validate(async valid => {
    if (valid) {
      let sendData = {
        class: 'CompanyInformation',
        pk: companyId,
        plan: select_plan[0]._id,
        invoice_detail: {
          title: companyData.name,
          address: companyData.address_str,
          phone: companyData.phone,
          email: companyData.email,
        },
        tax_id: companyData.tax_id,
      }
      console.log(await MsiApi.subscribe_plan(sendData))
      if (Effective.value === '1') {
        sendData = {}
        console.log(await MsiApi.auth_payment(sendData))

        // reset program data
        let queryData = {}
        if (companyData.name !== 'MSI') {
          queryData = {
            database: 'CPO',
            collection: 'LimitPlan',
            pipelines: [{ $match: { name: { $ne: 'MSI-Free' } } }],
          }
        } else {
          queryData = {
            database: 'CPO',
            collection: 'LimitPlan',
            pipelines: [
              { $project: { aaa: 0 } },
            ],
          }
        }
        let response = await MsiApi.mongoAggregate(queryData)
        if (response.status === 200) {
          program_plan.length = 0
          Object.assign(program_plan, response.data.result)
          for (let i = 0; i < program_plan.length; i++) {
            if (program_plan[i]._id === select_plan[0]._id) {
              ProgramData.length = 0
              Object.assign(ProgramData, [program_plan[i]])
              break
            }
          }
        }
      }
      CheckProgramVisible.value = false
    }
    else {
      return false
    }
  })
}
const cancelCheckProgram = () => {
  CheckProgramVisible.value = false
  Effective.value = '1'
  companyData.email = MStore.user_data.email
  companyData.name = MStore.permission.company.name
  companyData.address = MStore.permission.company.address
  companyData.city = MStore.permission.company.city
  companyData.phone = MStore.permission.company.phone
  companyData.tax_id = MStore.permission.company.tax_id
  companyData.address_str = ''
  if (MStore.permission.company.city !== undefined) {
    companyData.address_str += MStore.permission.company.city
  }
  if (MStore.permission.company.address !== undefined) {
    companyData.address_str += MStore.permission.company.address
  }
}
const confirmProgram = () => {
  if (currentRow.value === undefined) {
    ElMessage.error(t('please_select_program'))
  } else {
    if (CardData.length === 0) {
      ElMessage.error(t('please_binding_card'))
    } else {
      ProgramVisible.value = false
      CheckProgramVisible.value = true
      Object.assign(select_plan, [currentRow.value])
    }
  }
}
const handleCurrentChange = (val) => {
  if (val === null)
    return
  currentRow.value = val
  selectProgram.value = val._id
}
const card_delete = async () => {
  const json = JSON.stringify({
    c6n: CardData[0].card6No,
    c4n: CardData[0].card4No,
    bindD: CardData[0].bindingDate,
  })
  let response = await MsiApi.unregister_bind_card(json)
  if (response.status === 200) CardData.length = 0
  else ElMessage.error(response.data.message)
}
const add_program = () => {
  ProgramVisible.value = true
}
const add_card = async () => {
  let response = await MsiApi.bind_card()
  if (response.status === 200) {
    document.body.innerHTML += response.data
    document.getElementById('formMSI').submit()
  } else {
    ElMessage.error(response.data.message)
  }
}
onMounted(async () => {
  first_name.value = MStore.user_data.first_name
  last_name.value = MStore.user_data.last_name
  email.value = MStore.user_data.email
  companyData.email = MStore.user_data.email
  companyData.name = MStore.permission.company.name
  companyData.address = MStore.permission.company.address
  companyData.city = MStore.permission.company.city
  companyData.phone = MStore.permission.company.phone
  companyData.tax_id = MStore.permission.company.tax_id
  companyData.address_str = ''
  if (MStore.permission.company.city !== undefined) {
    companyData.address_str += MStore.permission.company.city
  }
  if (MStore.permission.company.address !== undefined) {
    companyData.address_str += MStore.permission.company.address
  }

  queryData = {
    database: 'CPO',
    collection: 'CompanyInformation',
    pipelines: [
      { $match: { name: { $eq: companyData.name } } },
      { $project: { _id: 1, upgrade_manager: 1 } },
    ],
  }
  response = await MsiApi.mongoAggregate(queryData)
  if (response.status === 200) {
    companyId = response.data.result[0]._id
    upgrade_manager = response.data.result[0]?.upgrade_manager
  } else {
    ElMessage.error(response.data.message)
  }

  response = await MsiApi.search_bind_card()
  if (response.status === 200) {
    if (response.data.cards.length > 0) {
      Object.assign(CardData, [response.data.cards[0].detail])
      CardData[0].card_num_str = CardData[0].card6No + '******' + CardData[0].card4No
      CardData[0].expireDate = 
        (response.data.cards[0].detail.expireDate % 100).toString().padStart(2, '0') + 
        (Math.floor(response.data.cards[0].detail.expireDate / 100)).toString().padStart(2, '0')
    }
  } else {
    ElMessage.error(response.data.message)
  }
  if (companyData.name !== 'MSI') {
    queryData = {
      database: 'CPO',
      collection: 'LimitPlan',
      pipelines: [{ $match: { name: { $ne: 'MSI-Free' } } }],
    }
  } else {
    queryData = {
      database: 'CPO',
      collection: 'LimitPlan',
      pipelines: [
        { $project: { aaa: 0 } },
        // { $match: { "name": {"$eq": "MSI-Free"}} }
      ],
    }
  }
  response = await MsiApi.mongoAggregate(queryData)
  if (response.status === 200) {
    Object.assign(program_plan, response.data.result)
    for (let i = 0; i < program_plan.length; i++) {
      if (program_plan[i]._id === upgrade_manager?.subscribe?.plan) {
        Object.assign(ProgramData, [program_plan[i]])
        break
      }
    }
  } else {
    ElMessage.error(response.data.message)
  }
})

</script>

<template>
<div class="temp">
    <div class="container lg">
      <div class="flex justify-start flex-wrap lg:flex-nowrap pt-40px pb-32px">
        <p class="title">{{ t('admin_info') }}</p>
      </div>

      <el-form class="pb-40px" label-width="100px" label-position="left">
        <el-form-item class="block md:flex" :label="t('first_name')">
          <el-input class="lg:w-30%" v-model="first_name" disabled />
        </el-form-item>

        <el-form-item class="block md:flex" :label="t('last_name')">
          <el-input class="lg:w-30%" v-model="last_name" disabled />
        </el-form-item>

        <el-form-item class="block md:flex" :label="t('e_mail')">
          <el-input class="lg:w-30%" v-model="email" disabled/>
        </el-form-item>

        <el-form-item class="block md:flex" :label="t('credit_card')">
          <el-button
            class="w-full lg:w-30%"
            v-if="companyData.name === 'MSI'"
            @click="add_card"
            disabled
          >
            {{ t('msi_not_support_binding_card') }}
          </el-button>
          <el-button
            class="w-full lg:w-30%"
            v-else-if="CardData.length !== 0 || (first_name === undefined && last_name === undefined)"
            @click="add_card"
            disabled
          >
            {{ t('add_card') }}
          </el-button>
          <el-button class="w-full lg:w-30%" v-else @click="add_card">
            {{ t('add_card') }}
          </el-button>
        </el-form-item>

        <el-form-item class="block md:flex" :label="t('add_program')">
          <el-button
            class="w-full lg:w-30%"
            v-if="ProgramData.length > 0"
            @click="add_program"
            disabled
          >
            {{ t('add_program') }}
          </el-button>
          <el-button
            class="w-full lg:w-30%"
            v-else-if="CardData.length > 0"
            @click="add_program"
          >
          {{ t('add_program') }}
          </el-button>
          <el-button class="w-full lg:w-30%" v-else @click="add_program" disabled>
            {{ t('add_program') }}
          </el-button>
        </el-form-item>

        <!-- table -->
        <el-form-item class="block" :label="t('card_list')">
          <div class="overflow-x-auto">
            <el-table
              :data="CardData"
              class="white-space-nowrap text-primary"
              style="width: 100%"
              stripe
              :cell-style="msi.tb_cell"
              :header-cell-style="msi.tb_header_cell"
              size="large"
              v-loading.fullscreen.lock="isLoading"
            >
              <el-table-column prop="card_num_str" :label="t('card_number')" min-width="150" />
              <el-table-column
                prop="expireDate"
                :label="t('expire_date_mm_yy')"
                min-width="200"
              />
              <el-table-column prop="bindingDate" :label="t('binding_date')" min-width="150" />
              <el-table-column min-width="150">
                <el-button @click="card_delete"> {{ t('delete_card') }}</el-button>
              </el-table-column>
            </el-table>
          </div>
        </el-form-item>
        <el-form-item class="block" :label="t('program')">
          <div class="overflow-x-auto">
            <el-table
              :data="ProgramData"
              class="white-space-nowrap text-primary"
              style="width: 100%"
              stripe
              :cell-style="msi.tb_cell"
              :header-cell-style="msi.tb_header_cell"
              size="large"
              v-loading.fullscreen.lock="isLoading"
            >
              <el-table-column
                prop="name"
                :label="t('name')"
                align="center"
                min-width="200"
              />
              <el-table-column
                prop="location"
                :label="t('station')"
                align="center"
                min-width="150"
              />
              <el-table-column
                prop="evse"
                :label="t('evse_quantity')"
                align="center"
                min-width="200"
              />
              <!-- <el-table-column
                prop="connector"
                :label="t('connector')"
                align="center"
                min-width="150"
              /> -->
              <el-table-column
                prop="tariff"
                :label="t('rate_plan')"
                align="center"
                min-width="150"
              />
              <el-table-column prop="user" label="User" align="center" min-width="150" />
              <el-table-column
                prop="admin_user"
                :label="t('cpo_account')"
                align="center"
                min-width="150"
              />
              <el-table-column
                prop="currency"
                :label="t('currency')"
                align="center"
                min-width="150"
              />
              <el-table-column
                prop="price"
                :label="t('price')"
                align="center"
                min-width="150"
              />
              <el-table-column>
                <el-button @click="add_program" disabled v-if="(first_name === undefined && last_name === undefined)"> <font-awesome-icon icon="fa-solid fa-ellipsis" /></el-button>
                <el-button v-else class="btn-more" @click="add_program">
                  <font-awesome-icon icon="fa-solid fa-ellipsis"
                /></el-button>
              </el-table-column>
            </el-table>
          </div>
        </el-form-item>
      </el-form>
    </div>

    <el-dialog 
      append-to-body 
      v-model="ProgramVisible" 
      class="max-w-1000px" 
      width="90%"
      @close="cancelProgram"
    >
      <template #header="{ titleId, titleClass }">
        <div class="py-2rem relative bg-blue-100">
          <h4
            :id="titleId"
            :class="titleClass"
            class="m-0 text-center text-blue-1200 font-400 text-20px lg:text-24px line-height-26px"
          >
            {{ t('select_program') }}
          </h4>
        </div>
      </template>
      <div class="dialog-context">
        <div class="pr-10px">
          <el-table
            :data="program_plan"
            @current-change="handleCurrentChange"
            highlight-current-row
          >

            <el-table-column min-width="40"  >
              <template #default="scope">
                <el-radio-group v-model="selectProgram">
                <el-radio :label="scope.row._id" size="large"> {{""}}</el-radio>
              </el-radio-group>
              </template>
            </el-table-column>
            

            <el-table-column 
              prop="name" 
              :label="t('name')" 
              min-width="150" 
            />
            <el-table-column
              prop="location"
              :label="t('station')"
              align="center"
              min-width="100"
            />
            <el-table-column
              prop="evse"
              :label="t('evse_quantity')"
              align="center"
              min-width="150"
            />
            <!-- <el-table-column
              prop="connector"
              :label="t('connector')"
              align="center"
              min-width="150"
            /> -->
            <el-table-column
              prop="tariff"
              :label="t('rate_plan')"
              align="center"
              min-width="150"
            />
            <el-table-column 
              prop="user" 
              :label="t('user')" 
              align="center" 
              min-width="80" 
            />
            <el-table-column
              prop="admin_user"
              :label="t('cpo_account')"
              align="center"
              min-width="150"
            />
            <el-table-column
              prop="currency"
              :label="t('currency')"
              align="center"
              min-width="100"
            />
            <el-table-column 
              prop="price" 
              :label="t('price')" 
              align="center" 
              min-width="100" 
            />
          </el-table>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer flex flex-center">
          <el-button
            round
            class="w-48% bg-btn-100 text-white max-w-140px"
            @click="cancelProgram"
            >{{ t('cancel') }}</el-button
          >
          <el-button
            round
            class="w-48% bg-btn-100 text-white max-w-140px"
            @click="confirmProgram"
            >{{ t('confirm') }}</el-button
          >
        </span>
      </template>
    </el-dialog>
    <el-dialog
      append-to-body
      v-model="CheckProgramVisible"
      class="max-w-1000px"
      width="90%"
      @close="cancelCheckProgram"
    >
      <template #header="{ titleId, titleClass }">
        <div class="py-2rem relative bg-blue-100">
          <h4
            :id="titleId"
            :class="titleClass"
            class="m-0 text-center text-blue-1200 font-400 text-20px lg:text-24px line-height-26px"
          >
            {{ t('check_program') }}
          </h4>
        </div>
      </template>
      <div class="dialog-context">
        <div class="pr-10px">
          <div class="mb-2 flex items-center text-sm">
            <el-radio-group v-model="Effective">
              <el-radio label="1" size="large">{{ t('effective_immediately') }}</el-radio>
              <el-radio label="2" size="large"
                >{{ t('effective_date_will_start_in_a_month') }}</el-radio
              >
            </el-radio-group>
          </div>
          <el-form label-position="left" label-width="100px" :rules="adminInfo_rules" :model="companyData" ref="adminInfo_ref" :scroll-to-error=true>
            <el-table
              :data="select_plan"
              @current-change="handleCurrentChange"
              highlight-current-row
            >
              <el-table-column prop="name" :label="t('program_name')" min-width="150" />
              <el-table-column prop="location" :label="t('station')" min-width="150" />
              <el-table-column prop="evse" :label="t('evse_quantity')" min-width="150" />
              <!-- <el-table-column prop="connector" :label="t('connector')" min-width="150" /> -->
              <el-table-column prop="tariff" :label="t('rate_plan')" min-width="150" />
              <el-table-column prop="user" :label="t('user')" min-width="150" />
              <el-table-column prop="admin_user" :label="t('cpo_account')" min-width="150" />
              <el-table-column prop="currency" :label="t('currency')" min-width="150" />
              <el-table-column prop="price" :label="t('price')" min-width="150" />
            </el-table>
            <br />
            <el-form-item :label="t('title')" prop="name">
              <el-input v-model="companyData.name" style="width: 300px" />
            </el-form-item>
            <el-form-item :label="t('address')" prop="address_str">
              <el-input v-model="companyData.address_str" style="width: 300px" />
            </el-form-item>
            <el-form-item :label="t('phone')" prop="phone">
              <el-input v-model="companyData.phone" style="width: 300px" />
            </el-form-item>
            <el-form-item :label="t('tax_id')" prop="tax_id">
              <el-input v-model="companyData.tax_id" style="width: 300px" />
            </el-form-item>
            <el-form-item :label="t('e_mail')" prop="email">
              <el-input v-model="companyData.email" style="width: 300px"/>
            </el-form-item>
          </el-form>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer flex flex-center">
          <el-button
            round
            class="w-48% bg-btn-100 text-white max-w-140px"
            @click="cancelCheckProgram"
            >{{ t('cancel') }}</el-button
          >
          <el-button
            round
            class="w-48% bg-btn-100 text-white max-w-140px"
            v-if="companyData.name === 'MSI'"
            disabled
            @click="subscribeProgram"
            >{{ t('confirm') }}</el-button
          >
          <el-button
            round
            class="w-48% bg-btn-100 text-white max-w-140px"
            v-else
            @click="subscribeProgram"
            >{{ t('confirm') }}</el-button
          >
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.title {
  font-size: 30px;
}
.el-input {
  --el-input-bg-color: rgb(86, 101, 117);
  --el-input-text-color: rgb(255, 255, 255);
}
.temp {
  :deep(.el-form-item__content) {
    display: block;
    width: 100%;
  }
}
</style>
