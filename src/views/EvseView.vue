<script setup>
import ApiFunc from '@/composables/ApiFunc'
import msi from '@/assets/msi_style'
import moment from 'moment'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useMStore } from '../stores/m_cloud'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

const MStore = useMStore()
const router = useRouter()
const multipleSelection = ref([])
const swVersion = ref('')
const sw_version_visable = ref(false)
const updataEvseId = []
const activeName = ref('1')
const route = useRoute()
const update_file = ref('')
const MsiApi = ApiFunc()
const edit_button_str = ref( 'update_or_restart')
const editMode = ref(false)
const isLoading = ref(false)
const EvseData = reactive([])
const EvseConnectData = reactive([])
const EvseUnConnectData = reactive([])
const EvseHomeDevice = reactive([])
const company_filter_item = reactive([])
const status_filter_item = [
  { text: t('available'), value: 'AVAILABLE' },
  { text: t('charging'), value: 'CHARGING' },
  { text: t('offline'), value: 'UNKNOWN' },
  { text: t('error'), value: 'ERROR' },
  { text: t('inoperative'), value: 'INOPERATIVE' },
]

const filterCompany = (value, row) => {
  return row.byCompany === value
}

const updateSW = async () => {
  sw_version_visable.value = true
  let queryData = { database: 'CPO', collection: 'VersionControl',
    pipelines: [{ $match: { type: { $eq: 'XP012' } } },
    { $project: { _id: 0, type:0, release_date:0, "release_note.description": 0,"release_note.update_time": 0} }
  ]}
  let response = await MsiApi.mongoAggregate(queryData)
  swVersion.value = response.data.result[0].version
  let release_note = response.data.result[0].release_note.find(
    (obj) => obj.version === swVersion.value
  )
  if (release_note) {
    update_file.value = release_note.file
  }
  updataEvseId.length = 0
  for (let i = 0; i < multipleSelection.value.length; i++) {
    updataEvseId.push(multipleSelection.value[i].evse_id)
  }
  if (updataEvseId.length === 0) {
    return
  }
}
const updateConfirm = async () => {
  let sendData = {
    evse_ids: updataEvseId,
    location: update_file.value,
    retrieveDate: '2022-10-27 12:12:12',
  }
  if (update_file.value === '') 
    ElMessage.error(t('file_not_found'))
  const response = await MsiApi.updateFw(sendData)
  if (response.status === 200) {
    sw_version_visable.value = false
  } else {
    console.log(response)
  }
}
const handleSelectionChange = (val) => {
  multipleSelection.value = val
}
const evseReset = (type) => {
  updataEvseId.length = 0
  for (let i = 0; i < multipleSelection.value.length; i++) {
    updataEvseId.push(multipleSelection.value[i].evse_id)
  }
  if (EvseConnectData.length === 0) {
    ElMessage({
      message: t('not_found_evse'),
      type: 'warning',
    })
    return
  }
  if (updataEvseId.length === 0) {
    ElMessage({
      message: t('please_choose_evse'),
      type: 'warning',
    })
    return
  }

  let reset_message = t('do_you_want_to_soft_reset')
  if (type === 'hard')  
    reset_message = t('do_you_want_to_hard_reset')

  if (confirm(reset_message) === true) {
    const json = JSON.stringify({ evse_id: updataEvseId, reset_type: type })
    MsiApi.reset_evse(json)
      .then(() => {
        alert(t('reset_success'))
      })
      .catch(() => {
        alert(t('reset_fail'))
      })
  }
}

const status_filter = (value, rowData) => {
  return rowData.status === value
}

const detail_info = async (detail) => {
  router.push({ name: 'evseDetail', query: {  evse_id: detail.uid }})
}

const add_charger = () => {
  if (EvseData.length >= MStore.program.evse && MStore.permission.isMSI === false) {
    ElMessage.error(t('please_confirm_your_subscription_plan'))
    return
  }
  router.push({ name: 'evseEdit' })
}

const edit = () => {
  if (editMode.value === false) {
    editMode.value = true
    edit_button_str.value = 'cancel'
  } else {
    editMode.value = false
    edit_button_str.value = 'update_or_restart'
  }
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

const refreshPage = async () => {
  isLoading.value = true
  let queryData = { database: 'CPO', collection: 'VersionControl',
    pipelines: [
    { $match: { type: { $eq: 'XP012' } } },  
    { $project: { _id:0, version:1} }],
  }
  let response = await MsiApi.mongoAggregate(queryData)
  if (response.status === 403) {
    isLoading.value = false
    return
  }
  swVersion.value = response.data.result[0].version

  queryData = { database: 'CPO', collection: 'CompanyInformation',
                pipelines: [{ $project: { _id: 1, name: 1 } }],
              }
  let response1 = MsiApi.mongoAggregate(queryData)

  queryData = { database: 'OCPI', collection: 'Location',
    pipelines: [{ $project: { _id: 0, evses: 1, name: 1 } }],
  }
  let response2 = MsiApi.mongoAggregate(queryData)

  queryData = { database: 'OCPI', collection: 'EVSE',
    pipelines: [{ $project: { _id: 1, connectors: 0 } }],
  }
  let response3 = MsiApi.mongoAggregate(queryData)


  queryData = { database: 'CPO', collection: 'ChargePointInfo',
    pipelines: [{ $project: { _id: 0, evse_id: 1, hmi: 1 } }],
  }
  let response4 = MsiApi.mongoAggregate(queryData)
  queryData = { database: 'CPO', collection: 'HMIControlBoardInfo',
    pipelines: [{ $project: { _id: 1, hmi_board_sw_version: 1 } }],
  }
  let response5 = MsiApi.mongoAggregate(queryData)
  const [result1, result2, result3, result4, result5] = await Promise.all([response1, response2, response3, response4, response5])

  let company_filter =  result1.data.result.map(item => {
    return { text: item.name,value: item._id }
  })
  Object.assign(company_filter_item, company_filter)

  let company_list = result1.data.result

  let locationData = result2.data.result
  EvseData.length = 0
  EvseHomeDevice.length = 0
  EvseUnConnectData.length = 0
  EvseConnectData.length = 0

  Object.assign(EvseData, result3.data.result)
  let chargePointInfoData = result4.data.result
  let hmiInfoData = result5.data.result

  isLoading.value = false
  EvseData.forEach((item)=> {
    let localEndTime = new Date( new Date(item.last_updated).getTime() + MStore.timeZoneOffset * -60000)
    item.last_updated_str = moment(localEndTime).format('YYYY-MM-DD HH:mm:ss')
    switch (item.status) {
      case 'AVAILABLE':
        item.status_str = t('available')
      break
      case 'CHARGING':
        item.status_str = t('charging')
      break
      case 'UNKNOWN':
        item.status_str = t('offline')
      break
      case 'OUTOFORDER':
        item.status_str = t('error')
      break
      case 'INOPERATIVE':
        item.status_str = t('inoperative')
      break
      default:
        item.status_str = t('others')
    }
  })

  for (let i = 0; i < EvseData.length; i++) {
    for (let j = 0; j < locationData.length; j++) {
      for (let k = 0; k < locationData[j]?.evses?.length; k++) {
        if (EvseData[i]._id === locationData[j].evses[k]) {
          EvseData[i].locationName = locationData[j].name
          break
        }
      }
      if (EvseData[i].locationName) break
    }
  }
  for (let i = 0; i < EvseData.length; i++) {
    if (EvseData[i].locationName === undefined) {
      if (EvseData[i].evse_id.startsWith('XP01')) {
        EvseHomeDevice.push(EvseData[i])
      }
      else 
        EvseUnConnectData.push(EvseData[i])
      
    } else {
      EvseConnectData.push(EvseData[i])
    }
  }

  for (let i = 0; i < EvseData.length; i++) {
    for (let j = 0; j < chargePointInfoData.length; j++)
      if (EvseData[i].evse_id === chargePointInfoData[j].evse_id) {
        EvseData[i].hmi = chargePointInfoData[j].hmi
        break
      }
  }
  for (let i = 0; i < EvseData.length; i++) {
    if (EvseData[i].hmi !== undefined) {
      for (let j = 0; j < hmiInfoData.length; j++) {
        if (EvseData[i].hmi === hmiInfoData[j]._id) {
          EvseData[i].hmi_version = hmiInfoData[j].hmi_board_sw_version
        }
      }
    }
  }
  for (let i = 0; i < EvseData.length; i++) {
    if (EvseData[i].byCompany !== undefined) {
      for (let j = 0; j < company_list.length; j++) {
        if (EvseData[i].byCompany === company_list[j]._id) {
          EvseData[i].byCompany_str = company_list[j].name
        }
      }
    }
  }
}
onMounted(async () => {
  if (route.query.page === 'unpaired') {
    activeName.value = '2'
  }
  await refreshPage()
})
</script>

<template>
  <div class="evse">
    <div class="container lg pb-40px">
      <div class="pt-40px pb-20px overflow-x-auto">
        <div class="flex lg:justify-end pr-10px">
          <el-button
            v-if="editMode === true && (MStore.rule_permission.EVSE.update === 'O')" 
            class="btn-secondary shrink-0 update-button px-30px box-shadow"
            @click="updateSW"
          >
          {{ t('update_sw') }}
          </el-button>
          <el-button
            v-if="editMode === true && (MStore.rule_permission.EVSE.reset === 'O')"
            class="btn-secondary shrink-0 soft-reset-button px-30px box-shadow"
            @click="evseReset('soft')"
          >
          {{ t('soft_reset') }}
          </el-button>
          <el-button
            v-if="editMode === true && (MStore.rule_permission.EVSE.reset === 'O')"
            class="btn-secondary shrink-0 hard-reset-button px-30px box-shadow"
            @click="evseReset('hard')"
          >
          {{ t('hard_reset') }}
          </el-button>
          <el-button
            v-if="editMode === false && (MStore.rule_permission.EVSE.addEVSE === 'O')"
            class="btn-secondary shrink-0 add-charger px-30px box-shadow"
            @click="add_charger"
          >
          {{ t('add_evse') }}</el-button
          >
          <el-button 
            v-if="MStore.rule_permission.EVSE.update === 'O' || MStore.rule_permission.EVSE.reset === 'O'"
            class="btn-secondary shrink-0 edit px-30px box-shadow" @click="edit">
            {{ t(edit_button_str) }}</el-button
          >
          <el-button 
            v-if="MStore.rule_permission.EVSE.update === 'O' || MStore.rule_permission.EVSE.reset === 'O'"
            class="btn-secondary shrink-0 edit px-30px box-shadow" @click="refreshPage">
            {{ t('Refresh') }}</el-button
          >
        </div>
      </div>

      <div class="tabs">
        <el-tabs v-model="activeName">
          <el-tab-pane :label="t('paired')" name="1">
            <el-table
              class="evse-table"
              :data="EvseConnectData"
              style="width: 100%; height: calc(100vh - 260px)"
              stripe
              :cell-style="msi.tb_cell"
              :header-cell-style="msi.tb_header_cell"
              size="large"
              v-loading.fullscreen.lock="isLoading"
              @selection-change="handleSelectionChange"
              :default-sort="{ prop: 'locationName', order: 'ascending' }"
            >
            <el-table-column v-if="MStore.permission.isMSI"
                prop="byCompany_str"
                :label="t('company')"
                align="center"
                :filters="company_filter_item"
                :filter-method="filterCompany"
                min-width="200"
              />
              <el-table-column
                prop="locationName"
                :label="t('station')"
                align="center"
                sortable
                :sort-method="(a, b) => sortFunc(a, b, 'locationName')"
                min-width="150"
              />
              <el-table-column
                prop="floor_level"
                :label="t('floor_level')"
                align="center"
                sortable
                :sort-method="(a, b) => sortFunc(a, b, 'floor_level')"
                min-width="150"
              />
              <el-table-column
                prop="evse_id"
                :label="t('evse_id')"
                align="center"
                sortable
                :sort-method="(a, b) => sortFunc(a, b, 'evse_id')"
                min-width="300"
              />
              <el-table-column
                prop="status"
                :label="t('status')"
                align="center"
                min-width="150"
                :filters="status_filter_item"
                :filter-method="status_filter"
              >
                <template #default="scope">
                  <p
                    class="available text-center"
                    v-if="scope.row.status === 'AVAILABLE'"
                  >
                    {{ '●' + scope.row.status_str }}
                  </p>
                  <p
                    class="charging text-center"
                    v-else-if="scope.row.status === 'CHARGING'"
                  >
                    {{ '●' + scope.row.status_str }}
                  </p>
                  <p
                    class="offline text-center"
                    v-else-if="scope.row.status === 'UNKNOWN'"
                  >
                    {{ '●' + scope.row.status_str }}
                  </p>
                  <p
                    class="error text-center"
                    v-else-if="scope.row.status === 'OUTOFORDER'"
                  >
                    {{ '●' + scope.row.status_str }}
                  </p>
                  <p
                    class="error text-center"
                    v-else-if="scope.row.status === 'INOPERATIVE'"
                  >
                    {{ '●' + scope.row.status_str }}
                  </p>
                </template>
              </el-table-column>

              <el-table-column
                prop="hmi_version"
                :label="t('sw_ver')"
                align="center"
                sortable
                :sort-method="(a, b) => sortFunc(a, b, 'hmi_version')"
                min-width="150"
              />
              <el-table-column 
                prop="latest SW"
                :label="t('latest_sw')"
                align="center"
                min-width="150"
              >
                <template #default="scope">
                  <p class="text-center" v-if="scope.row.hmi_version === swVersion">
                    {{ 'V' }}
                  </p>
                </template>
              </el-table-column>
              <el-table-column
                prop="last_updated_str"
                :label="t('updated_time')"
                align="center"
                sortable
                :sort-method="(a, b) => sortFunc(a, b, 'last_updated_str')"
                min-width="200"
              />

              <el-table-column
                v-if="editMode === false"
                prop=""
                label=""
                align="center"
                min-width="150"
              >
                <template #default="scope">
                  <el-button class="btn-more" @click="detail_info(scope.row)">
                    <font-awesome-icon icon="fa-solid fa-ellipsis" />
                  </el-button>
                </template>
              </el-table-column>

              <el-table-column v-else type="selection" align="center" min-width="150" />
            </el-table>
          </el-tab-pane>
          <el-tab-pane :label="t('unpaired')" name="2">
            <el-table
              class="evse-table"
              :data="EvseUnConnectData"
              style="width: 100%; height: calc(100vh - 260px)"
              stripe
              :cell-style="msi.tb_cell"
              :header-cell-style="msi.tb_header_cell"
              size="large"
              v-loading.fullscreen.lock="isLoading"
              @selection-change="handleSelectionChange"
            >
              <el-table-column
                prop="evse_id"
                :label="t('evse_id')"
                align="center"
                sortable
                :sort-method="(a, b) => sortFunc(a, b, 'evse_id')"
                min-width="300"
              />
              <el-table-column
                prop="status"
                :label="t('status')"
                align="center"
                min-width="150"
                :filters="status_filter_item"
                :filter-method="status_filter"
              >
                <template #default="scope">
                  <p
                    class="available text-center"
                    v-if="scope.row.status === 'AVAILABLE'"
                  >
                    {{ '●' + scope.row.status_str }}
                  </p>
                  <p
                    class="charging text-center"
                    v-else-if="scope.row.status === 'CHARGING'"
                  >
                    {{ '●' + scope.row.status_str }}
                  </p>
                  <p
                    class="offline text-center"
                    v-else-if="scope.row.status === 'UNKNOWN'"
                  >
                    {{ '●' + scope.row.status_str }}
                  </p>
                  <p
                    class="error text-center"
                    v-else-if="scope.row.status === 'OUTOFORDER'"
                  >
                    {{ '●' + scope.row.status_str }}
                  </p>
                  <p
                    class="error text-center"
                    v-else-if="scope.row.status === 'INOPERATIVE'"
                  >
                    {{ '●' + scope.row.status_str }}
                  </p>
                </template>
              </el-table-column>
              <el-table-column
                prop="hmi_version"
                :label="t('sw_ver')"
                sortable
                align="center"
                :sort-method="(a, b) => sortFunc(a, b, 'hmi_version')"
                min-width="150"
              />
              <el-table-column prop="" :label="t('latest_sw')" align="center" min-width="150">
                <template #default="scope">
                  <p class="text-center" v-if="scope.row.hmi_version === swVersion">{{ 'V' }}</p>
                </template>
              </el-table-column>

              <el-table-column
                prop="last_updated_str"
                :label="t('updated_time')"
                align="center"
                sortable
                :sort-method="(a, b) => sortFunc(a, b, 'last_updated_str')"
                min-width="200"
              />
              <el-table-column
                v-if="editMode === false"
                prop=""
                label=""
                align="center"
                min-width="150"
              >
                <template #default="scope">
                  <el-button class="btn-more" @click="detail_info(scope.row)">
                    <font-awesome-icon icon="fa-solid fa-ellipsis" />
                  </el-button>
                </template>
              </el-table-column>
              <el-table-column v-else type="selection" align="center" min-width="150" />
            </el-table>
          </el-tab-pane>

          <el-tab-pane :label="t('home_device')" name="3">
            <el-table
              class="evse-table"
              :data="EvseHomeDevice"
              style="width: 100%; height: calc(100vh - 260px)"
              stripe
              :cell-style="msi.tb_cell"
              :header-cell-style="msi.tb_header_cell"
              size="large"
              v-loading.fullscreen.lock="isLoading"
              @selection-change="handleSelectionChange"
            >
              <el-table-column
                prop="evse_id"
                :label="t('evse_id')"
                align="center"
                sortable
                :sort-method="(a, b) => sortFunc(a, b, 'evse_id')"
                min-width="300"
              />
              <el-table-column
                prop="status"
                :label="t('status')"
                align="center"
                min-width="150"
                :filters="status_filter_item"
                :filter-method="status_filter"
              >
                <template #default="scope">
                  <p
                    class="available text-center"
                    v-if="scope.row.status === 'AVAILABLE'"
                  >
                    {{ '●' + scope.row.status_str }}
                  </p>
                  <p
                    class="charging text-center"
                    v-else-if="scope.row.status === 'CHARGING'"
                  >
                    {{ '●' + scope.row.status_str }}
                  </p>
                  <p
                    class="offline text-center"
                    v-else-if="scope.row.status === 'UNKNOWN'"
                  >
                    {{ '●' + scope.row.status_str }}
                  </p>
                  <p
                    class="error text-center"
                    v-else-if="scope.row.status === 'OUTOFORDER'"
                  >
                    {{ '●' + scope.row.status_str }}
                  </p>
                  <p
                    class="error text-center"
                    v-else-if="scope.row.status === 'INOPERATIVE'"
                  >
                    {{ '●' + scope.row.status_str }}
                  </p>
                </template>
              </el-table-column>
              <el-table-column
                prop="hmi_version"
                :label="t('sw_ver')"
                sortable
                align="center"
                :sort-method="(a, b) => sortFunc(a, b, 'hmi_version')"
                min-width="150"
              />
              <el-table-column prop="" :label="t('latest_sw')" align="center" min-width="150">
                <template #default="scope">
                  <p class="text-center" v-if="scope.row.hmi_version === swVersion">{{ 'V' }}</p>
                </template>
              </el-table-column>

              <el-table-column
                prop="last_updated_str"
                :label="t('updated_time')"
                align="center"
                sortable
                :sort-method="(a, b) => sortFunc(a, b, 'last_updated_str')"
                min-width="200"
              />
              <el-table-column
                v-if="editMode === false"
                prop=""
                label=""
                align="center"
                min-width="150"
              >
                <template #default="scope">
                  <el-button class="btn-more" @click="detail_info(scope.row)">
                    <font-awesome-icon icon="fa-solid fa-ellipsis" />
                  </el-button>
                </template>
              </el-table-column>
              <el-table-column v-else type="selection" align="center" min-width="150" />
            </el-table>
          </el-tab-pane>


        </el-tabs>
      </div>

      <el-dialog v-model="sw_version_visable" class="max-w-600px" width="90%">
        <template #header="{ titleId, titleClass }">
          <div class="py-2rem relative bg-blue-100">
            <h4
              :id="titleId"
              :class="titleClass"
              class="m-0 text-center text-blue-1200 font-400 text-24px line-height-26px"
            >
            {{ t('update_sw') }}
            </h4>
          </div>
        </template>
        <div class="dialog-context">
          <p class="text-center">{{ t('now_version') + ' : ' + swVersion }}</p>
        </div>
        <template #footer>
          <span class="dialog-footer flex flex-center">
            <el-button
              round
              class="w-48% bg-btn-100 text-white max-w-140px"
              @click="sw_version_visable = false"
              >
              {{ t('cancel') }}
              </el-button
            >
            <el-button
              round
              class="w-48% bg-btn-200 text-white max-w-140px"
              @click="updateConfirm()"
              >
              {{t('confirm')}}
              </el-button
            >
          </span>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.evse {
  width: 100%;
  height: 100%;
  position: relative;
  .update-button {
    background-color: var(--blue-900);
  }
  .soft-reset-button {
    background-color: var(--blue-900);
  }
  .hard-reset-button {
    background-color: var(--blue-900);
  }
  :deep(.el-table tr) {
    height: 6.5rem;
  }
  .el-checkbox__inner {
    width: 20px;
    height: 20px;
    border-color: #000000;
  }
  // tabs lg
  :deep(.el-tabs__item) {
    font-size: 24px;
    font-weight: 700;
  }
}
</style>
