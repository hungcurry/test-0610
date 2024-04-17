<script setup>
import ApiFunc from '@/composables/ApiFunc'
import Calendar from '@/components/icons/IconCalendar.vue'
import { ref, reactive, onMounted } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useI18n } from "vue-i18n"
import { useMStore } from "../stores/m_cloud"
import { useRoute, useRouter } from 'vue-router'

const { t } = useI18n()
const MsiApi = ApiFunc()
const MStore = useMStore()
const route = useRoute()
const router = useRouter()

const chargingProfilePurpose = [
  { value: 'ChargePointMaxProfile', label: t('charge_point_max_profile')},
  { value: 'TxDefaultProfile', label: t('tx_default_profile')},
  { value: 'TxProfile', label: t('tx_profile')},
]
const chargingProfileKind = [
  { value: 'Absolute', label: t('absolute')},
  { value: 'Recurring', label: t('recurring')},
  { value: 'Relative', label: t('relative')},
]
const recurrencyKind = [
  { value: '', label: t('none')},
  { value: 'Daily', label: t('daily')},
  { value: 'Weekly', label: t('weekly')},
]
const chargingRateUnit = [
  { value: 'A', label: 'A'},
  { value: 'W', label: 'W'},
]
const numberPhases = [
  { value: '', label: t('default')},
  { value: 1, label: '1'},
  { value: 3, label: '3'},
]

const profile_id = route.query.id
const charging_profile_rules = reactive({
  name: [
    { required: true, message: t('the_item_is_required'), trigger: 'blur' },
  ],
  stackLevel: [
    { required: true, message: t('the_item_is_required'), trigger: 'blur' },
  ],
  chargingProfilePurpose: [
    { required: true, message: t('the_item_is_required'), trigger: 'blur' },
  ],
  chargingProfileKind: [
    { required: true, message: t('the_item_is_required'), trigger: 'blur' },
  ],
  chargingRateUnit: [
    { required: true, message: t('the_item_is_required'), trigger: 'blur' },
  ],
})
const ruleFormRef = ref()
const charging_profile_valid = ref([])
const charging_schedule_startSchedule = ref('')
const ChargingProfileDetail = reactive({  // DialogData
  _id : undefined,
  name: undefined,
  stackLevel: undefined,
  chargingProfilePurpose: undefined,
  chargingProfileKind: undefined,
  recurrencyKind: undefined,
  validFrom: undefined,
  validTo: undefined,
  duration:undefined,
  startSchedule:undefined,
  chargingRateUnit: undefined,
  minChargingRate: undefined,
  ChargingSchedulePeriod: [{startPeriod: undefined, limit: undefined, numberPhases: undefined}],
})

const parseInput = (value) => {
  if (value.includes('.')) {
    const parts = value.split('.')
    value = parts[0] + '.' + parts[1].substring(0, 1)
  }
  return value
}

const AddChargingSchedulePeriod = () => {
  ChargingProfileDetail.ChargingSchedulePeriod.push({startPeriod: undefined, limit: undefined, numberPhases: undefined})
}
const DelChargingSchedulePeriod = (index) => {
  ChargingProfileDetail.ChargingSchedulePeriod.splice(index, 1)
}

const saveChargingProfile = () => {
  ruleFormRef.value.validate(async valid => {
    if (valid) {
      let startSchedule = ''
      let startTime = ''
      let endTime = ''
      let sendData = {charging_schedule:{charging_schedule_period:[]}}

      if (charging_profile_valid.value !== null && charging_profile_valid.value.length !== 0) {
        startTime = new Date(charging_profile_valid.value[0]).toISOString().slice(0, 19)
        endTime = new Date(charging_profile_valid.value[1]).toISOString().slice(0, 19)
      }
      if (charging_schedule_startSchedule.value) {
        startSchedule = new Date(charging_schedule_startSchedule.value).toISOString().slice(0, 19)
      }
      sendData.class = 'ChargingProfile'
      sendData.pk = ChargingProfileDetail._id
      sendData.custom = {name: ChargingProfileDetail.name}
      sendData.stack_level = ChargingProfileDetail.stackLevel
      sendData.charging_profile_purpose = ChargingProfileDetail.chargingProfilePurpose
      sendData.charging_profile_kind = ChargingProfileDetail.chargingProfileKind
      if (sendData.charging_profile_kind === 'Recurring') {
        sendData.recurrency_kind = ChargingProfileDetail.recurrencyKind
      }
      else {
        sendData.recurrency_kind = ''
      }
      sendData.valid_from = startTime
      sendData.valid_to = endTime
      sendData.charging_schedule.duration = ChargingProfileDetail.duration
      sendData.charging_schedule.start_schedule = startSchedule
      sendData.charging_schedule.charging_rate_unit = ChargingProfileDetail.chargingRateUnit
      sendData.charging_schedule.min_charging_rate = ChargingProfileDetail.minChargingRate
      ChargingProfileDetail.ChargingSchedulePeriod.forEach((item) => {
        sendData.charging_schedule.charging_schedule_period.push({
            start_period: item.startPeriod, 
            limit: item.limit, 
            number_phases: item.numberPhases
          })
      })
      // console.log(sendData)
      if (!profile_id) {
        ElMessageBox.confirm(t('do_you_want_to_create'),t('warning'), {confirmButtonText: t('ok'), cancelButtonText: t('cancel'), type: 'warning'})
          .then(async () => {
            let res = await MsiApi.setCollectionData('post', 'cpo', sendData)
            if (res.status === 201) {
              router.push({ name: 'chargingProfile' })
            }
            else {
              ElMessage.error('Error')
            }
          })
          .catch((e)=>{
            console.log(e)
          }) 
      }
      else {
        ElMessageBox.confirm(t('do_you_want_to_modify'),t('warning'), {confirmButtonText: t('ok'), cancelButtonText: t('cancel'), type: 'warning'})
          .then(async () => {
            let res = await MsiApi.setCollectionData('patch', 'cpo', sendData)
            if (res.status === 200) {
              router.push({ name: 'chargingProfile' })
            }
            else {
              ElMessage.error('Error')
            }
          })
          .catch((e)=>{
            console.log(e)
          }) 
      }
    }
    else {
      return false
    }
  })
}
const cancelChargingProfile = () => {
  router.push({ name: 'chargingProfile' })
}

const getChargingProfileDetail = async() => {
  if (profile_id) {
    let queryData = {
      database: 'CPO',
      collection: 'ChargingProfile',
      pipelines: [
        { $match: {_id: {$eq: {"ObjectId":profile_id}}} },
        { $project: { aaa: 0} }
      ],
    }
    let response = await MsiApi.mongoAggregate(queryData)
    let ChargingProfileData = response.data.result[0]

    ChargingProfileDetail._id = ChargingProfileData._id
    ChargingProfileDetail.name = ChargingProfileData.custom?.name
    ChargingProfileDetail.stackLevel = ChargingProfileData.stack_level
    ChargingProfileDetail.chargingProfilePurpose = ChargingProfileData.charging_profile_purpose
    ChargingProfileDetail.chargingProfileKind = ChargingProfileData.charging_profile_kind
    ChargingProfileDetail.recurrencyKind = ChargingProfileData.recurrency_kind
    ChargingProfileDetail.duration = ChargingProfileData.charging_schedule.duration
    ChargingProfileDetail.startSchedule = ChargingProfileData.charging_schedule.start_schedule
    ChargingProfileDetail.chargingRateUnit = ChargingProfileData.charging_schedule.charging_rate_unit
    ChargingProfileDetail.minChargingRate = ChargingProfileData.charging_schedule.min_charging_rate
    ChargingProfileDetail.ChargingSchedulePeriod = []
    ChargingProfileData.charging_schedule.charging_schedule_period.forEach((item) => {
      ChargingProfileDetail.ChargingSchedulePeriod.push({
        startPeriod: item.start_period,
        limit: item.limit,
        numberPhases: item.number_phases,
      })
    })
    if (ChargingProfileData.valid_from && ChargingProfileData.valid_to) {
      charging_profile_valid.value = [
        new Date( (new Date(ChargingProfileData.valid_from).getTime()) + ((MStore.timeZoneOffset ) * -60000)),
        new Date( (new Date(ChargingProfileData.valid_to).getTime()) + ((MStore.timeZoneOffset ) * -60000))
      ]
    }
    else {
      charging_profile_valid.value = []
    }
    if (ChargingProfileData.charging_schedule.start_schedule) {
      charging_schedule_startSchedule.value = new Date( (new Date(ChargingProfileData.charging_schedule.start_schedule).getTime()) + ((MStore.timeZoneOffset ) * -60000))
    }
  }
  else {
    ChargingProfileDetail.ChargingSchedulePeriod[0].startPeriod = 0
  }
}

onMounted(async () => {
  await getChargingProfileDetail()
  // console.log(ChargingProfileDetail)
})
</script>

<template>
  <div class="charge-profile-detail h-full">
    <div class="container lg flex-col wh-full">
      <div class="flex-grow">
        <div class="pt-40px pb-32px">
          <p class="text-36px"> {{ t('charge_profile_details') }}</p>
        </div>
  
        <el-form
          class="pr-10px pb-32px flex-col lg:flex-row overflow-x-auto"
          ref="ruleFormRef"
          :model="ChargingProfileDetail"
          :rules="charging_profile_rules"
          :scroll-to-error="true"
        >
          <div class="charging-profile lg:w-33% min-w-400px">
            <h2>{{ t('general') }}</h2>
            <el-form-item class="block" :label="t('name')" prop="name">
              <el-input v-model="ChargingProfileDetail.name" />
            </el-form-item>
            <el-form-item class="block" :label="t('stack_level')" prop="stackLevel">
              <el-input v-model.number="ChargingProfileDetail.stackLevel" />
            </el-form-item>
            <el-form-item class="block" :label="t('purpose')" prop="chargingProfilePurpose">
              <el-select
                class="el-select w-full"
                v-model="ChargingProfileDetail.chargingProfilePurpose"
                placeholder="Select"
              >
                <el-option
                  v-for="item in chargingProfilePurpose"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
            <div class="flex flex-justify-between">
              <el-form-item class="block w-60% min-w-150px pr-12px" :label="t('kind')" prop="chargingProfileKind">
                <el-select
                  class="el-select w-full"
                  v-model="ChargingProfileDetail.chargingProfileKind"
                  placeholder="Select"
                >
                  <el-option
                    v-for="item in chargingProfileKind"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>

              <el-form-item class="block" :label="t('recurrency')" prop="recurrencyKind" v-if="ChargingProfileDetail.chargingProfileKind !== 'Absolute' && ChargingProfileDetail.chargingProfileKind !== 'Relative'">
                <el-select
                  class="el-select w-full"
                  v-model="ChargingProfileDetail.recurrencyKind"
                  placeholder="Select"
                >
                  <el-option
                    v-for="item in recurrencyKind"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </div>
            <el-form-item class="block" :label="t('valid_time')" prop="validFrom">
              <div class="date-picker w-full">
                <el-date-picker
                  v-model="charging_profile_valid"
                  class="w-full"
                  type="datetimerange"
                  range-separator="-"
                  :start-placeholder="t('start_date')"
                  :end-placeholder="t('end_date')"
                  :prefix-icon="Calendar"
                />
              </div>
            </el-form-item>
          </div>

          <div class="v-line mx-20px"></div>

          <div class="charging-schedule lg:w-33% min-w-250px">
            <h2>{{ t('charging_schedule') }}</h2>
            <el-form-item class="block" :label="t('duration')" prop="duration">
              <el-input v-model.number="ChargingProfileDetail.duration" >
                <template #suffix> <span class="h-30px">s</span></template>
              </el-input>
            </el-form-item>
            <el-form-item class="block" :label="t('start_schedule')" prop="startSchedule">
              <div class="block w-full">
                <el-date-picker
                  class="w-full"
                  v-model="charging_schedule_startSchedule"
                  type="datetime"
                  :placeholder="t('select_date_and_time')"
                  :prefix-icon="Calendar"
                />
              </div>
            </el-form-item>
            <el-form-item class="block" :label="t('scheduling_unit')" prop="chargingRateUnit">
              <el-select
                class="el-select w-full"
                v-model="ChargingProfileDetail.chargingRateUnit"
                placeholder="Select"
              >
                <el-option
                  v-for="item in chargingRateUnit"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                  :disabled="item.value === 'W'"
                />
              </el-select>
            </el-form-item>
            <el-form-item class="block" :label="t('min_charging_rate')" prop="minChargingRate">
              <el-input v-model="ChargingProfileDetail.minChargingRate" 
                :formatter="(value) => `${value}`.replace(/(\.\d{1})\d+/, '$1')" 
                :parser="(value) => parseInput(`${value}`)"
              >
                <template #suffix><span class="h-30px">{{ ChargingProfileDetail.chargingRateUnit }}</span></template>
              </el-input>
            </el-form-item>
          </div>

          <div class="v-line mx-20px"></div>

          <div class="charging-schedule-period min-w-300px">
            <h2>{{ t('charging_schedule_period') }}</h2>
            <div class="overflow-x-auto max-h-430px lg:max-h-500px min-w-400px pr-12px">
              <div v-for="(item, index) in ChargingProfileDetail.ChargingSchedulePeriod">
                <div class="flex flex-justify-between">
                  <div class="w-90% min-w-350px pr-10px flex">
                    <el-form-item 
                      class="block w-full min-w-120px" 
                      :label="t('start_period')" 
                      :prop="'ChargingSchedulePeriod.' + index + '.startPeriod'"
                      :rules="[{required: true, message: t('the_item_is_required'), trigger: 'blur'}]"
                    >
                      <el-input v-model.number="item.startPeriod" :disabled="index === 0" >
                        <template #suffix> <span class="h-30px">s</span></template>
                      </el-input>
                    </el-form-item>
                    <el-form-item 
                      class="block w-full" 
                      :label="t('limit')" 
                      :prop="'ChargingSchedulePeriod.' + index + '.limit'"
                      :rules="[{required: true, message: t('the_item_is_required'), trigger: 'blur'}]"
                    >
                      <el-input v-model="item.limit" 
                        :formatter="(value) => `${value}`.replace(/(\.\d{1})\d+/, '$1')" 
                        :parser="(value) => parseInput(`${value}`)"
                      >
                        <template #suffix><span class="h-30px">{{ ChargingProfileDetail.chargingRateUnit }}</span></template>
                      </el-input>
                    </el-form-item>
                    <el-form-item class="block w-full" :label="t('number_phases')" prop="numberPhases">
                      <el-select
                        class="el-select w-full"
                        v-model="item.numberPhases"
                        :placeholder="t('select')"
                      >
                        <el-option
                          v-for="item in numberPhases"
                          :key="item.value"
                          :label="item.label"
                          :value="item.value"
                          :disabled="item.value === 3"
                        />
                      </el-select>
                    </el-form-item>
                  </div>
    
                  <el-button link type="primary" size="large" @click="DelChargingSchedulePeriod(index)" :class="{'hidden-del-period-btn': index === 0}" >
                    <img src="@/assets/img/tariff_delete1.png" alt="">
                  </el-button>
                </div>
  
                <el-divider class="my-12px lg:w-90%" />
              </div>
            </div>

            <div class="flex">
              <el-button class="w-4rem h-4rem m-auto" @click="AddChargingSchedulePeriod()"><font-awesome-icon icon="fa-solid fa-plus" /></el-button>
            </div>
          </div>
        </el-form>
      </div>
      <div class="flex justify-center mb-44px">
        <el-button class="btn-secondary bg-btn-100 md:mr-44px" @click="cancelChargingProfile"> {{t('cancel')}} </el-button>
        <el-button v-if="MStore.rule_permission.ChargingProfileDetail.save === 'O'"
        class="btn-secondary" @click="saveChargingProfile()"> {{t('save')}} </el-button>
      </div>
    </div>
  </div>
</template>


<style lang="scss" scoped>

.hidden-del-period-btn {
  display: none;
}

.charge-profile-detail {
  .el-date-editor .el-range-separator {
    color: var(--white);
  }
  .v-line {
    border-top: thick solid rgb(226, 234, 242);
    @media (min-width: 992px) {
      border-left: thick solid rgb(226, 234, 242);
    }
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

  :deep(.el-form-item__label) {
    display: block;
    font-size: 1.6rem;
  }
  :deep(.el-date-editor) {
    --el-date-editor-width: 100%;
  }
  :deep(.date-picker) {
    .el-input__wrapper {
      padding: 0 1rem;
      @media (min-width: 992px) {
        width: 100%;
      }
    }
  }
  :deep(.el-date-editor) .el-range__icon,
  :deep(.el-input) .el-input__icon {
    margin-left: 0.5rem;
    margin-right: 1.6rem;
  }
  :deep(.date-picker .el-input__wrapper) {
    width: 100%;
  }

}

</style>