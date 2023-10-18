<script setup>
import msi from '@/assets/msi_style'
import ApiFunc from '@/composables/ApiFunc'
import { ref, reactive, onMounted } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from "vue-i18n"

import { useMStore } from '@/stores/m_cloud'
const MStore = useMStore()

const { t } = useI18n()
const MsiApi = ApiFunc()
const ProgramData = reactive([])
const program_dialog_visible = ref(false)
const dialog_title = ref(t('add_program'))
const ProgramMod = reactive({})
const isLoading = ref(false)
const program_ref = ref()
const program_rules = reactive({
  name: [
    { required: true, message: t('the_item_is_required'), trigger: 'blur' },
  ],
  location: [
    { required: true, message: t('the_item_is_required'), trigger: 'blur' },
  ],
  evse: [
    { required: true, message: t('the_item_is_required'), trigger: 'blur' },
  ],
  connector: [
    { required: true, message: t('the_item_is_required'), trigger: 'blur' },
  ],
  tariff: [
    { required: true, message: t('the_item_is_required'), trigger: 'blur' },
  ],
  user: [
    { required: true, message: t('the_item_is_required'), trigger: 'blur' },
  ],
  admin_user: [
    { required: true, message: t('the_item_is_required'), trigger: 'blur' },
  ],
  currency: [
    { required: true, message: t('the_item_is_required'), trigger: 'blur' },
  ],
  price: [
    { required: true, message: t('the_item_is_required'), trigger: 'blur' },
  ],
})
const openDialog = () => {
  program_ref.value.clearValidate()
}
const deleteDialog = async () => {
  let sendData = { class: 'LimitPlan', pk: ProgramMod._id }
  let res = undefined
  program_dialog_visible.value = false

  ElMessageBox.confirm(t('do_you_want_to_delete_program'), t('warning'), {
    confirmButtonText: t('ok'),
    cancelButtonText: t('cancel'),
    type: 'warning',
  }).then(async () => {
    res = await MsiApi.setCollectionData('delete', 'cpo', sendData)
    if (res.status === 200) {
      ElMessage.success(t('delete_success'))
      await getLimitPlan()
    } else {
      ElMessage.error(res.data.message)
    }
  })
}
const cancelDialog = () => {
  program_dialog_visible.value = false
}
const confirmDialog = async () => {
  let res = undefined
  let sendData = {
    class: 'LimitPlan',
    pk: ProgramMod._id,
    name: ProgramMod.name,
    location: ProgramMod.location,
    evse: ProgramMod.evse,
    connector: ProgramMod.connector,
    tariff: ProgramMod.tariff,
    user: ProgramMod.user,
    admin_user: ProgramMod.admin_user,
    currency: ProgramMod.currency,
    price: ProgramMod.price,
  }

  program_ref.value.validate(async valid => {
    if (valid) {
      program_dialog_visible.value = false
      if (ProgramMod._id) {
        ElMessageBox.confirm(t('do_you_want_to_edit_program'), t('warning'), {
          confirmButtonText: t('ok'),
          cancelButtonText: t('cancel'),
          type: 'warning',
        }).then(async () => {
          res = await MsiApi.setCollectionData('patch', 'cpo', sendData)
          if (res.status === 200) {
            program_dialog_visible.value = false
            ElMessage.success(t('edit_success'))
            await getLimitPlan()
          } else {
            ElMessage.error(res.data.message)
          }
        })
      } 
      else {
        ElMessageBox.confirm(t('do_you_want_to_create_program'), t('warning'), {
          confirmButtonText: t('ok'),
          cancelButtonText: t('cancel'),
          type: 'warning',
        }).then(async () => {
          res = await MsiApi.setCollectionData('post', 'cpo', sendData)
          if (res.status === 201) {
            program_dialog_visible.value = false
            ElMessage.success(t('create_success'))
            await getLimitPlan()
          } else {
            ElMessage.error(res.data.message)
          }
        })
      }
    }
    else {
      return false
    }
  })
}
const add_program = async () => {
  dialog_title.value = t('add_program')
  program_dialog_visible.value = true
  ProgramMod.name = undefined
  ProgramMod.location = undefined
  ProgramMod.evse = undefined
  ProgramMod.connector = undefined
  ProgramMod.tariff = undefined
  ProgramMod.user = undefined
  ProgramMod.admin_user = undefined
  ProgramMod.currency = undefined
  ProgramMod.price = undefined
  ProgramMod._id = undefined
}
const detail_info = async (scope) => {
  dialog_title.value = t('edit_program')
  program_dialog_visible.value = true
  ProgramMod._id = scope.row._id
  ProgramMod.name = scope.row.name
  ProgramMod.location = scope.row.location
  ProgramMod.evse = scope.row.evse
  ProgramMod.connector = scope.row.connector
  ProgramMod.tariff = scope.row.tariff
  ProgramMod.user = scope.row.user
  ProgramMod.admin_user = scope.row.admin_user
  ProgramMod.currency = scope.row.currency
  ProgramMod.price = scope.row.price
}
const getLimitPlan = async () => {
  let queryData = {
    database: 'CPO',
    collection: 'LimitPlan',
    pipelines: [
      { $project: { aaa: 0 } },
    ],
  }
  isLoading.value = true
  let res = await MsiApi.mongoAggregate(queryData)
  if (res.status === 200) {
    ProgramData.length = 0
    Object.assign(ProgramData, res.data.result)
  } else {
    ElMessage.error(res.data.message)
  }
  isLoading.value = false
}
onMounted(async () => {
  await getLimitPlan()
})
</script>

<template>
  <div class="program">
    <div class="container lg">
      <div class="flex justify-end flex-wrap lg:flex-nowrap pt-40px pb-32px">
        <el-button 
          v-if="MStore.rule_permission.Program.addProgram === 'O' || MStore.permission.isCompany"  
          class="btn-secondary shrink-0 box-shadow" @click="add_program">
          {{t('add_program')}}</el-button
        >
      </div>
      <div class="overflow-x-auto pb-40px">
        <el-table
          :data="ProgramData"
          class="white-space-nowrap text-primary"
          height="calc(100vh - 220px)"
          style="width: 100%"
          stripe
          size="large"
          :cell-style="msi.tb_cell"
          :header-cell-style="msi.tb_header_cell"
          v-loading.fullscreen.lock="isLoading"
        >
          <el-table-column
            prop="name"
            :label="t('name')"
            align="center"
            sortable
            min-width="150"
          />
          <el-table-column
            prop="location"
            :label="t('station')"
            align="center"
            sortable
            min-width="150"
          />
          <el-table-column
            prop="evse"
            :label="t('evse')"
            align="center"
            sortable
            min-width="150"
          />
          <el-table-column
            prop="connector"
            :label="t('connector')"
            align="center"
            sortable
            min-width="150"
          />
          <el-table-column
            prop="tariff"
            :label="t('rate_plan')"
            align="center"
            sortable
            min-width="150"
          />
          <el-table-column
            prop="user"
            :label="t('user')"
            align="center"
            sortable
            min-width="150"
          />
          <el-table-column
            prop="admin_user"
            :label="t('cpo_account')"
            align="center"
            sortable
            min-width="200"
          />
          <el-table-column
            prop="currency"
            :label="t('currency')"
            align="center"
            sortable
            min-width="150"
          />
          <el-table-column
            prop="price"
            :label="t('price')"
            align="center"
            sortable
            min-width="150"
          />
          <el-table-column prop="" label="" align="center" min-width="100">
            <template #default="scope">
              <el-button
                v-if="scope.row.name === 'MSI-Free' && (MStore.rule_permission.Program.detail === 'O' || MStore.permission.isCompany)"
                disabled
                class="btn-more"
                @click="detail_info(scope)"
              >
                <font-awesome-icon icon="fa-solid fa-ellipsis" />
              </el-button>
              <el-button 
                v-else-if="MStore.rule_permission.Program.detail === 'O' || MStore.permission.isCompany" @click="detail_info(scope)"
                class="btn-more" >
                <font-awesome-icon icon="fa-solid fa-ellipsis" />
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
    <el-dialog
      append-to-body
      v-model="program_dialog_visible"
      class="max-w-600px"
      width="90%"
      @open="openDialog"
    >
      <template #header="{ titleId, titleClass }">
        <div class="py-2rem relative bg-blue-100">
          <h4
            :id="titleId"
            :class="titleClass"
            class="m-0 text-center text-blue-1200 font-400 text-20px lg:text-24px line-height-26px"
          >
            {{ dialog_title }}
          </h4>
        </div>
      </template>
      <div class="dialog-context">
        <el-form class="pr-10px" label-position="left" label-width="110px" :rules="program_rules" :model="ProgramMod" ref="program_ref" :scroll-to-error=true>
          <el-form-item :label="t('name')" prop="name">
            <el-input v-model="ProgramMod.name" />
          </el-form-item>
          <el-form-item :label="t('station')" prop="location">
            <el-input v-model="ProgramMod.location" placeholder="0" oninput="value=value.replace(/[^\d]/g,'')" />
          </el-form-item>
          <el-form-item :label="t('evse')" prop="evse">
            <el-input v-model="ProgramMod.evse" placeholder="0" oninput="value=value.replace(/[^\d]/g,'')" />
          </el-form-item>
          <el-form-item :label="t('connector')" prop="connector">
            <el-input v-model="ProgramMod.connector" placeholder="0" oninput="value=value.replace(/[^\d]/g,'')" />
          </el-form-item>
          <el-form-item :label="t('rate_plan')" prop="tariff">
            <el-input v-model="ProgramMod.tariff" placeholder="0" oninput="value=value.replace(/[^\d]/g,'')" />
          </el-form-item>
          <el-form-item :label="t('user')" prop="user">
            <el-input v-model="ProgramMod.user" placeholder="0" oninput="value=value.replace(/[^\d]/g,'')" />
          </el-form-item>
          <el-form-item :label="t('cpo_account')" prop="name">
            <el-input v-model="ProgramMod.admin_user" placeholder="0" oninput="value=value.replace(/[^\d]/g,'')" />
          </el-form-item>
          <el-form-item :label="t('currency')" prop="currency">
            <el-input v-model="ProgramMod.currency" placeholder="TWD" />
          </el-form-item>
          <el-form-item :label="t('price')" prop="price">
            <el-input v-model="ProgramMod.price" placeholder="0" oninput="value=value.replace(/[^\d]/g,'')" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer flex flex-center">
          <el-button
            round
            class="w-48% bg-btn-100 text-white max-w-140px"
            @click="cancelDialog"
            >{{ t('cancel') }}</el-button
          >
          <el-button
            round
            class="w-48% bg-btn-100 text-white max-w-140px"
            v-if="dialog_title === 'Edit Program'"
            @click="deleteDialog"
            >{{ t('delete') }}</el-button
          >
          <el-button
            round
            class="w-48% bg-btn-200 text-white max-w-140px"
            @click="confirmDialog"
            >{{ t('confirm') }}</el-button
          >
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.program {
  position: relative;
  width: 100%;
  height: 100%;
}
</style>
