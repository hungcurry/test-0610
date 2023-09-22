<script setup>
import { Search } from '@element-plus/icons-vue'
import { ref, reactive, onMounted} from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from "vue-i18n"
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { ElMessage } from 'element-plus'
import { useMStore } from '../stores/m_cloud'
import ApiFunc from '@/composables/ApiFunc'
import msi from '@/assets/msi_style'
import moment from 'moment'

const { t } = useI18n()
const MStore = useMStore()
const router = useRouter()
const MsiApi = ApiFunc()
const dialogFormVisible = ref(false)
const isLoading = ref(false)
const total_amount = ref(0)
const input = ref('')
const UserData = []
const RfidUserData = reactive([])
const newUser = reactive({id:'', name:'', phone: ''})
const add_rfid_user_ref = ref()
const add_rfid_user_rules = reactive({
  id: [
    { required: true, message: t('the_item_is_required'), trigger: 'blur' },
  ],
  name: [
    { required: true, message: t('the_item_is_required'), trigger: 'blur' },
  ],
})

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

// const handleParticipator = async() => {
//   let row_span = 1
//   let index = 0

//   RfidUserData[0].rowspan = 0
//   for (let i=1; i<RfidUserData.length; i++) {
//     if (RfidUserData[i]._id === RfidUserData[i-1]._id) {
//       RfidUserData[i].rowspan = 0
//       row_span++
//     }
//     else {
//       RfidUserData[index].rowspan = row_span
//       row_span = 1
//       index = i
//     }
//   }
//   RfidUserData[index].rowspan = row_span
// }
// // Tony: add in el-table => :span-method="objectSpanMethod"
// const objectSpanMethod = (row) => {
//   if (row.columnIndex === 0 || row.columnIndex === 1 || row.columnIndex === 2 
//     || row.columnIndex === 5 || row.columnIndex === 6 || row.columnIndex === 7
//     // || row.columnIndex === 8
//   ) {
//     if (row.row.rowspan !== 0) {
//       return {
//         rowspan: row.row.rowspan,
//         colspan: 1,
//       }
//     }
//     else {
//       return {
//         rowspan: 0,
//         colspan: 0,
//       }
//     }
//   }
// }

const search = async() => {
  RfidUserData.length = 0
  total_amount.value = 0

  if (input.value === '') {
    for (let i=0; i<UserData.length; i++) {
      if (UserData[i].tag_id !== 'DELETE' || UserData[i].name !== 'DELETE') {
        RfidUserData.push(UserData[i])
        if (UserData[i].amount) 
          total_amount.value += UserData[i].amount
      }
    }
    total_amount.value = total_amount.value.toLocaleString()
    return
  }

  let reStr = new RegExp(input.value, 'i')
  UserData.forEach((item) => {
    if (item.tag_id === 'DELETE' && item.name === 'DELETE') {
      // Donot push
    }
    else if (
      reStr.test(item.tag_id) || 
      reStr.test(item.name) ||
      reStr.test(item.phone) ||
      reStr.test(item.rfid) ||
      reStr.test(item.amount) ||
      reStr.test(item.amount_str) ||
      // reStr.test(item.occupied) ||
      reStr.test(item.used_times) ||
      reStr.test(item.updated_date_str)
    ) {
      RfidUserData.push(item)
      if (item.amount) 
        total_amount.value += item.amount
    }
  })
  total_amount.value = total_amount.value.toLocaleString()
}
const addRfidUser = () => {
  dialogFormVisible.value = true
  newUser.id = ''
  newUser.name = ''
  newUser.phone = ''
}
const detail_info = (detail) => {
  router.push({ name: 'rfidUserDetail', query:{id:detail._id} })
}
const getUserData = async() => {
  let response = await MsiApi.get_account_info('rfid')
  UserData.length = 0
  RfidUserData.length = 0
  console.log(response)
  total_amount.value = response.data?.data?.total_amount.toLocaleString()
  Object.assign(UserData, response?.data?.data?.rfid_infos)
  UserData.forEach((item) => {
    if (item.tag_id !== 'DELETE' || item.name !== 'DELETE') {
      let localTime = new Date(new Date(item.updated_date).getTime() + MStore.timeZoneOffset * -60000)
      item.updated_date_str = moment(localTime).format('YYYY-MM-DD HH:mm:ss')
      item.amount_str = item.amount?.toLocaleString()
      RfidUserData.push(item)
    }
  })
  // await handleParticipator()
}
const addRfidUserDialog = (action) => {
  if (action === 'confirm') {
    add_rfid_user_ref.value.validate(async valid => {
      if (valid) {
        let sendData = {
          "role": 'rfid',
          'tag_id': newUser.id,
          'name': newUser.name,
          'phone': newUser.phone,
        }
        let res = await MsiApi.register_member(sendData)
        if (res.data.status === 'Accepted') {
          dialogFormVisible.value = false
          await getUserData()
        }
        else if (res.data.message === 'User is exist') {
          ElMessage.error(t('id_already_exists'))
        }
        else if (res.data.message === 'Please chat to Administrator/IT.') {
          ElMessage.error(t('please_chat_to_administrator_it'))
        }
        else { 
          ElMessage.error(t('error'))
        }
      }
      else {
        return false
      }
    })
  }
  else if (action === 'cancel') {
    dialogFormVisible.value = false
  }
}

onMounted( async() => {
  isLoading.value = true
  await getUserData()
  isLoading.value = false
})
</script>

<template>
  <div class="rfid-user">
    <div class="container lg">
      <div class="flex justify-between flex-wrap lg:flex-nowrap pt-40px pb-32px">
        <el-input class="search-input mb-12px lg:mb-0" v-model="input" :placeholder="t('search')" @keyup.enter="search">
          <template #append>
            <el-button :icon="Search" @click="search" />
          </template>
        </el-input>
        <div class="w-full sm:flex justify-between lg:justify-end items-center lg:w-auto">
          <p class="total-amount box-shadow mr-2rem min-w-20rem font-bold text-center mb-12px md:mb-0"> {{ t('total_amount') + ' : $ ' + total_amount  }}</p>
          <el-button class="btn-secondary box-shadow" @click="addRfidUser"> {{ t('add_user') }} </el-button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <div class="customer-list pb-40px">
          <el-table 
              :data="RfidUserData" 
              class="white-space-nowrap text-primary"
              height="calc(100vh - 220px)"
              style="width: 100%"
              stripe 
              size="large"
              :cell-style=msi.tb_cell 
              :header-cell-style="msi.tb_header_cell"
              v-loading.fullscreen.lock="isLoading"
              :default-sort="{ prop: 'updated_date_str', order: 'ascending' }"
            >
              <el-table-column
                prop="tag_id"
                :label="t('id')"
                align="center"
                sortable
                :sort-method="(a, b) => sortFunc(a, b, 'tag_id')"
                min-width="150"
              />
              <el-table-column
                prop="name"
                :label="t('name')"
                align="center"
                sortable
                :sort-method="(a, b) => sortFunc(a, b, 'name')"
                min-width="150"
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
                prop="rfid"
                :label="t('rfid_num')"
                align="center"
                sortable
                :sort-method="(a, b) => sortFunc(a, b, 'rfid')"
                min-width="150"
              />
              <el-table-column
                prop="amount_str"
                :label="t('amount')"
                header-align="center"
                align="right"
                sortable
                :sort-method="(a, b) => sortFunc(a, b, 'amount')"
                min-width="150"
              >
                <template #default="scope">
                  <span v-if="scope.row.amount < 0" class="text-red">{{ scope.row.amount_str }}</span>
                  <span v-else>{{ scope.row.amount_str }}</span>
                </template>
              </el-table-column>

              <!-- <el-table-column
                prop="occupied"
                :label="t('occupied_evse_id')"
                align="center"
                sortable
                :sort-method="(a, b) => sortFunc(a, b, 'occupied')"
                min-width="200"
              >
                <template #default="scope">
                  <span v-if="scope.row.occupied_detail_str === ''">{{ scope.row.occupied_str }}</span>
                  <el-tooltip v-else placement="bottom-start">
                    <template #content>
                      <div v-html="scope.row.occupied_detail_str"></div>
                    </template>
                    <el-button class="overflow-hidden evse-tooltip-btn">
                      <span class="font-400 text-1.8rem line-height-2rem text-black-200"> {{ scope.row.occupied_str }} </span>
                    </el-button>
                  </el-tooltip>
                </template>
              </el-table-column> -->
              <el-table-column
                prop="used_times"
                :label="t('used_times')"
                align="center"
                sortable
                :sort-method="(a, b) => sortFunc(a, b, 'used_times')"
                min-width="200"
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
      </div>
    </div>
    <el-dialog
      v-model="dialogFormVisible"
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
            {{ t('add_user') }}
          </h4>
        </div>
      </template>
      <div class="dialog-context">
        <el-form class="max-w-500px m-auto" :rules="add_rfid_user_rules" ref="add_rfid_user_ref" :model="newUser" label-width="100px" label-position="left" :scroll-to-error=true>
          <el-form-item class="mb-24px" :label="t('id')" prop="id">
            <el-input v-model="newUser.id" />
          </el-form-item>
          <el-form-item class="mb-24px" :label="t('name')" prop="name">
            <el-input v-model="newUser.name" />
          </el-form-item>
          <el-form-item class="mb-24px" :label="t('phone')" prop="phone">
            <el-input v-model="newUser.phone" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer flex flex-center">
          <el-button
            round
            class="w-48% bg-btn-100 text-white max-w-140px"
            @click.stop="addRfidUserDialog('cancel')"
            >{{ t('cancel') }}</el-button
          >
          <el-button
            round
            class="w-48% bg-btn-200 text-white max-w-140px"
            @click.stop="addRfidUserDialog('confirm')"
          >
            {{ t('confirm') }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.rfid-user {
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
  .evse-tooltip-btn {
    background-color: unset;
  }
  .total-amount {
    line-height: 40px;
    background-color: var(--blue-200);
    border-radius: 2rem;
    padding: 0 2rem;
    cursor: default;
  }
}
</style>