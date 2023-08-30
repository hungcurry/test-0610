<script setup>
import CommpnFunc from '@/composables/CommonFunc'
import ApiFunc from '@/composables/ApiFunc'
import Calendar from '@/components/icons/IconCalendar.vue'
import { ref, reactive, onMounted } from 'vue'

const MsiFunc = CommpnFunc()
const MsiApi = ApiFunc()

const chargingProfilePurpose = [
  { value: 'ChargePointMaxProfile', label: 'ChargePointMaxProfile'},
  { value: 'TxDefaultProfile', label: 'TxDefaultProfile'},
  { value: 'TxProfile', label: 'TxProfile'},
]

const chargingProfileKind = [
  { value: 'Absolute', label: 'Absolute'},
  { value: 'Recurring', label: 'Recurring'},
  { value: 'Relative', label: 'Relative'},
]
const recurrencyKind = [
  { value: 'Daily', label: 'Daily'},
  { value: 'Weekly', label: 'Weekly'},
]

const chargingRateUnit = [
  { value: 'W', label: 'W'},
  { value: 'A', label: 'A'},
]


const charging_profile_valid = ref('')
const charging_schedule_startSchedule = ref('')

const ChargingSchedulePeriod = reactive({
  startPeriod: undefined,
  limit: undefined,
  numberPhases: undefined,
})

const ChargingSchedule = reactive( {
  duration:undefined,
  startSchedule:undefined,
  chargingRateUnit: undefined,
  chargingSchedulePeriod: ChargingSchedulePeriod,
  minChargingRate: undefined,
})

const ChargingProfile = reactive( {
  chargingProfileId : undefined,
  transactionId: undefined,
  stackLevel: undefined,
  chargingProfilePurpose: undefined,
  chargingProfileKind: undefined,
  recurrencyKind: undefined,
  validFrom: undefined,
  validTo: undefined,
  chargingSchedule: ChargingSchedule,
})


const DialogVisible = ref(false)
const DialogTitle = ref('')
const DialogData = reactive({
  chargingProfileId : undefined,
  transactionId: undefined,
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
  startPeriod: undefined,
  limit: undefined,
  numberPhases: undefined,
}
)
const ChargingProfileData = reactive([])

const AddChargingProfile = () => {
  MsiFunc.setAllValuesToUndefinedRecursive(DialogData)
  DialogTitle.value =  'Add Charging Profile'
  DialogData.chargingProfileId = ChargingProfileData.length + 1
  DialogVisible.value = true
}

const CancelDialog = () => {
  DialogVisible.value = false
}
const ConfirmDialog = () => {
  let startSchedule = new Date(charging_schedule_startSchedule.value)
  startSchedule = startSchedule.toISOString().slice(0, 19)
  let startTime = new Date(charging_profile_valid.value[0])
  startTime = startTime.toISOString().slice(0, 19)
  let endTime = new Date(charging_profile_valid.value[1])
  endTime = endTime.toISOString().slice(0, 19)


  let sendObj = {chargingSchedule:{chargingSchedulePeriod:{}}}
  sendObj.chargingProfileId = DialogData.chargingProfileId
  sendObj.transactionId = DialogData.transactionId
  sendObj.stackLevel = DialogData.stackLevel
  sendObj.chargingProfilePurpose = DialogData.chargingProfilePurpose
  sendObj.chargingProfileKind = DialogData.chargingProfileKind
  sendObj.recurrencyKind = DialogData.recurrencyKind
  sendObj.validFrom = startTime
  sendObj.validTo = endTime
  sendObj.chargingSchedule.duration = DialogData.duration
  sendObj.chargingSchedule.startSchedule = startSchedule
  sendObj.chargingSchedule.chargingRateUnit = DialogData.chargingRateUnit
  sendObj.chargingSchedule.minChargingRate = DialogData.minChargingRate
  sendObj.chargingSchedule.chargingSchedulePeriod.startPeriod = DialogData.startPeriod
  sendObj.chargingSchedule.chargingSchedulePeriod.limit = DialogData.limit
  sendObj.chargingSchedule.chargingSchedulePeriod.numberPhases = DialogData.numberPhases
  MsiFunc.deleteEmptyKeys(sendObj)
}



const charging_profile_rules = reactive({
  chargingProfileId: [
    { required: true, message: 'The item is required', trigger: 'blur' },
  ],
  stackLevel: [
    { required: true, message: 'The item is required', trigger: 'blur' },
  ],
  chargingProfilePurpose: [
    { required: true, message: 'The item is required', trigger: 'blur' },
  ],
  chargingProfileKind: [
    { required: true, message: 'The item is required', trigger: 'blur' },
  ],
  chargingRateUnit: [
    { required: true, message: 'The item is required', trigger: 'blur' },
  ],
  startPeriod: [
    { required: true, message: 'The item is required', trigger: 'blur' },
  ],
  limit: [
    { required: true, message: 'The item is required', trigger: 'blur' },
  ],
})


onMounted(async () => {

  let queryData = {
    database: 'CPO',
    collection: 'OCPPChargingProfile',
    pipelines: [{ $project: { _id: 0} }],
  }
  let response = await MsiApi.mongoAggregate(queryData)

  Object.assign(ChargingProfileData, response.data.result)
})

</script>

<template>
  <div class="container lg pb-40px">
    <div class="flex flex-justify-end flex-wrap lg:flex-nowrap pt-40px pb-32px">
      <el-button class="btn-secondary box-shadow" @click="AddChargingProfile">
        Add Charging Profile
      </el-button>
    </div>

    <el-table :data="ChargingProfileData" class="white-space-nowrap text-primary" height="calc(100vh - 220px)" style="width: 100%" stripe size="large">
      <el-table-column prop="profile_name" label="Id" align="center" min-width="100" />
      <el-table-column prop="profile_name" label="Transaction Id" align="center" min-width="150" />
      <el-table-column prop="profile_name" label="Stack Level" align="center" min-width="150" />
      <el-table-column prop="profile_name" label="Purpose" align="center" min-width="150" />
      <el-table-column prop="profile_name" label="Kind" align="center" min-width="150" />
      <el-table-column prop="profile_name" label="Recurrency" align="center" min-width="150" />
      <el-table-column prop="profile_name" label="Valid From" align="center" min-width="150" />
      <el-table-column prop="profile_name" label="Valid To" align="center" min-width="150" />
      <el-table-column label="Charging Schedule" align="center" min-width="600">
        <el-table-column prop="profile_name" label="Duration" align="center" min-width="150" />
        <el-table-column prop="profile_name" label="Start Schedule" align="center" min-width="150" />
        <el-table-column prop="profile_name" label="Scheduling Unit" align="center" min-width="150" />
        <el-table-column prop="profile_name" label="Min Charging Rate" align="center" min-width="150" />
      </el-table-column>
      <el-table-column prop="profile_name" label="Charging Schedule Period" align="center" min-width="150"> 
        <el-table-column prop="profile_name" label="Start Period" align="center" min-width="150" />
        <el-table-column prop="profile_name" label="Limit" align="center" min-width="150" />
        <el-table-column prop="profile_name" label="Number Phases" align="center" min-width="150" />
      </el-table-column>
    </el-table>

    <el-dialog
      append-to-body
      v-model="DialogVisible"
      class="max-w-600px"
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
            {{ DialogTitle }}
          </h4>
        </div>
      </template>

      <div class="profileForm dialog-context">
        <el-form
          class="pr-10px"
          ref="ruleFormRef"
          :model="DialogData"
          :rules="charging_profile_rules"
          status-icon
        >
          <!-- ChargingProfile -->
          <el-form-item class="block" label="Id" prop="chargingProfileId">
            <el-input v-model.number="DialogData.chargingProfileId" />
          </el-form-item>

          <el-form-item class="block" label="Transaction Id" prop="transactionId">
            <el-input v-model.number="DialogData.transactionId" />
          </el-form-item>

          <el-form-item class="block" label="Stack Level" prop="stackLevel">
            <el-input v-model.number="DialogData.stackLevel" />
          </el-form-item>

          <el-form-item class="block" label="Purpose" prop="chargingProfilePurpose">
            <el-select
              class="el-select w-full"
              v-model="DialogData.chargingProfilePurpose"
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

          <el-form-item class="block" label="Kind" prop="chargingProfileKind">
            <el-select
              class="el-select w-full"
              v-model="DialogData.chargingProfileKind"
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

          <el-form-item class="block" label="Recurrency" prop="recurrencyKind">
            <el-select
              class="el-select w-full"
              v-model="DialogData.recurrencyKind"
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

          <el-form-item class="block" label="Valid From" prop="validFrom">
            <!-- <el-input v-model="DialogData.validFrom" /> -->

            <div class="date-picker w-full">
              <el-date-picker
                v-model="charging_profile_valid"
                class="w-full"
                type="datetimerange"
                range-separator="-"
                start-placeholder="Start Date"
                end-placeholder="End Date"
                :prefix-icon="Calendar"
              />
            </div>
          </el-form-item>

          <!-- ChargingSchedule -->
          <el-form-item class="block" label="Duration" prop="duration">
            <el-input v-model.number="DialogData.duration" />
          </el-form-item>

          <el-form-item class="block" label="Start Schedule" prop="startSchedule">
            <div class="block w-full">
              <el-date-picker
                class="w-full"
                v-model="charging_schedule_startSchedule"
                type="datetime"
                placeholder="Select date and time"
                :prefix-icon="Calendar"
              />
            </div>
          </el-form-item>

          <el-form-item class="block" label="Scheduling Unit" prop="chargingRateUnit">
            <el-select
              class="el-select w-full"
              v-model="DialogData.chargingRateUnit"
              placeholder="Select"
            >
              <el-option
                v-for="item in chargingRateUnit"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item class="block" label="Min Charging Rate" prop="minChargingRate">
            <el-input v-model.number="DialogData.minChargingRate" />
          </el-form-item>

          <!-- ChargingSchedulePeriod -->
          <el-form-item class="block" label="Start Period" prop="startPeriod">
            <el-input v-model.number="DialogData.startPeriod" />
          </el-form-item>

          <el-form-item class="block" label="Limit" prop="limit">
            <el-input v-model.number="DialogData.limit" />
          </el-form-item>

          <el-form-item class="block" label="Number Phases" prop="numberPhases">
            <el-input v-model.number="DialogData.numberPhases" />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <span class="dialog-footer flex flex-center">
          <el-button
            round
            class="w-48% bg-btn-100 text-white max-w-140px"
            @click="CancelDialog"
          >
            Cancel
          </el-button>
          <el-button
            round
            class="w-48% bg-btn-200 text-white max-w-140px"
            @click="ConfirmDialog"
          >
            Confirm
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.profileForm {
  :deep(.el-form-item__label) {
    display: block;
    font-size: 1.6rem;
  }
  .el-date-editor .el-range-separator {
    color: var(--white);
  }
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
</style>

