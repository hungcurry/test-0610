<script setup>
import ApiFunc from '@/composables/ApiFunc'
import msi from '@/assets/msi_style'
import moment from "moment"
import { ref, reactive, onMounted } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { useMStore } from "../stores/m_cloud"
import { v4 as uuidv4 } from 'uuid'
import {  ElMessage } from 'element-plus'
import { useI18n } from "vue-i18n"

const { t } = useI18n()
const MStore = useMStore()
const isMSI = ref(false)
const swData = reactive([])
const fwData = reactive([])
const MsiApi = ApiFunc()
const swVisible = ref(false)
const dialog_title = ref('')
const Detail_Data = reactive([])
const type = ref('')
const index = ref('')
const isLoading = ref(false)
const softwareInfo_ref = ref()
const softwareInfo_rules = reactive({
  version: [
    { required: true, message: t('the_item_is_required'), trigger: 'blur' },
  ],
  file: [
    { required: true, message: t('the_item_is_required'), trigger: 'blur' },
  ],
})
const openDialog = () => {
  softwareInfo_ref.value.clearValidate()
}

const download_File = () => {
  const fileName = 'update_file'
  const link = document.createElement('a')
  link.href = Detail_Data.file
  link.download = fileName
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
const confirm = async (mode) => {
  if (mode === 'cancel') {
    swVisible.value = false
  } 
  else if (mode === 'confirm') {
    softwareInfo_ref.value.validate(async valid => {
      if (valid) {
        let queryData = { 
          "database": 'CPO', 
          "collection": 'VersionControl', 
          "pipelines": [
            {
              $match: {
                "type": type.value
              }
            },
            {
              $project: { _id: 1, release_note: 1 } 
            }
          ]
        }
        let response = await MsiApi.mongoAggregate(queryData)
    
        if (response.data.result.length === 0) {
          let sendData = {
            class: 'VersionControl',
            pk: uuidv4(),
            type: type.value,
            version: Detail_Data.version,
            release_date: new Date(),
            release_note: [
              {
                version: Detail_Data.version,
                file: Detail_Data.file,
                description: Detail_Data.description,
                update_time: new Date(),
              },
            ],
          }
          console.log(await MsiApi.setCollectionData('post', 'cpo', sendData))
          swVisible.value = false
        }
        else {
          if (response.data.result[0].release_note === undefined)
            response.data.result[0].release_note = []
          let send_release_note = response.data.result[0].release_note
          if (index.value === -1) {
            send_release_note.unshift({ version:Detail_Data.version, file:Detail_Data.file, description:Detail_Data.description, update_time: new Date()})
          }
          else {
            send_release_note[index.value] = { version:Detail_Data.version, file:Detail_Data.file, description:Detail_Data.description, update_time: new Date()}
          }
          let duplicate = {flag:false, i:0,j:0}
          for (let i = 0; i < send_release_note.length; i++) {
            for (let j = 0; j < send_release_note.length; j++) {
              if ( i === j) {
                break
              }
              else {
                if (send_release_note[i].version === send_release_note[j].version) {
                  duplicate.flag = true
                  duplicate.i = i
                  duplicate.j = j
                }
              }
            }
          }
    
          if (duplicate.flag === false ) {
            let sendData = { 'class' : 'VersionControl', 'pk': response.data.result[0]._id, 'release_note' : send_release_note, }
            console.log(await MsiApi.setCollectionData('patch', 'cpo', sendData))
          }
          else {
            ElMessage.error( 'index ' + duplicate.i + ' index ' + duplicate.j + ' duplicate') // TT++: zh?
          }
          swVisible.value = false
        }
        response = await MsiApi.mongoAggregate(queryData)
        if (type.value === 'XP012') {
          swData.length = 0
          Object.assign(swData, response.data.result[0])
          for (let i = 0; i < swData?.release_note?.length; i++) {
            swData.release_note[i].update_time_str = moment(
              swData.release_note[i].update_time
            ).format('YYYY-MM-DD HH:mm:ss')
          }
        } else if (type.value === 'XP011_BT') {
          fwData.length = 0
          Object.assign(fwData, response.data.result[0])
          for (let i = 0; i < fwData?.release_note?.length; i++) {
            fwData.release_note[i].update_time_str = moment(
              fwData.release_note[i].update_time
            ).format('YYYY-MM-DD HH:mm:ss')
          }
        }
      }
      else {
        return false
      }
    })
  }
}
const add = (selectType) => {
  Detail_Data.version = ''
  Detail_Data.file = ''
  Detail_Data.description = ''
  Detail_Data.update_time_str = ''

  if (selectType === 'XP012') {
    dialog_title.value = t('add_sw_release_note')
  } else if (selectType === 'XP011_BT') {
    dialog_title.value = t('add_fw_release_note')
  }

  swVisible.value = true  
  type.value = selectType
  index.value = -1
}
const detail_info = (scope,selectType) => {
  swVisible.value = true
  type.value = selectType
  if (selectType === 'XP012') {
    dialog_title.value = t('edit_sw_release_note')
  }
  else if (selectType === 'XP011_BT') {
    dialog_title.value = t('edit_fw_release_note')
  }
  index.value = scope.$index
  Detail_Data.version = scope.row.version
  Detail_Data.file = scope.row.file
  Detail_Data.description = scope.row.description
  Detail_Data.update_time_str = scope.row.update_time_str
}
const release = async (scope, selectType) => {
  if (selectType === 'XP012') swData.version = scope.row.version
  else if (selectType === 'XP011_BT') fwData.version = scope.row.version
  let queryData = { 
    "database": 'CPO', 
    "collection": 'VersionControl', 
    "pipelines": [
      {
        $match: {
          "type": selectType
        }
      },
      {
        $project: { _id: 1 } 
      }
    ]
  }
  let response = await MsiApi.mongoAggregate(queryData)
  let sendData = {
    class: 'VersionControl',
    pk: response.data.result[0]._id,
    release_date: new Date(),
    version: scope.row.version,
  }
  console.log(await MsiApi.setCollectionData('patch', 'cpo', sendData))
}
onMounted(async () => {
  isLoading.value = true
  let queryData = { 
    "database": 'CPO', 
    "collection": 'VersionControl', 
    "pipelines": [
      {
        $match: {
          "type": 'XP011_BT'
        }
      },
      {
        $project: { _id: 1, version: 1, release_note: 1 } 
      }
    ]
  }
  let response = await MsiApi.mongoAggregate(queryData)
  if (response.status === 403) {
    isLoading.value = false
    return
  }
  Object.assign(fwData, response.data.result[0])
  for (let i = 0; i < fwData?.release_note?.length; i++) {
    fwData.release_note[i].update_time_str = moment(
      fwData.release_note[i].update_time
    ).format('YYYY-MM-DD HH:mm:ss')
  }
  queryData = { 
    "database": 'CPO', 
    "collection": 'VersionControl', 
    "pipelines": [
      {
        $match: {
          "type": 'XP012'
        }
      },
      {
        $project: { _id: 1, version: 1, release_note: 1 } 
      }
    ]
  }
  response = await MsiApi.mongoAggregate(queryData)
  Object.assign(swData, response.data.result[0])
  for (let i = 0; i < swData?.release_note?.length; i++) {
    swData.release_note[i].update_time_str = moment(
      swData.release_note[i].update_time
    ).format('YYYY-MM-DD HH:mm:ss')
  }
  if (MStore?.permission?.company?.name === 'MSI') isMSI.value = true
  isLoading.value = false
})
</script>

<template>
  <div class="sw-info w-full">
    <div class="container lg pb-40px">
      <div class="pt-40px pb-20px">
        <div class="header-container">
          <strong
            class="w-full text-18px md:text-20px text-blue-1200 block break-all word-wrap mb-20px"
          >
            {{ t('ota_sw_version') }} :
            <span class="block mt-5px md:inline-block md-mt-0">{{ swData.version }}</span>
          </strong>
          <el-button
            v-if="isMSI && (MStore.rule_permission.SoftwareInfo.addSwRelease === 'O')"
            class="btn-secondary shrink-0 box-shadow"
            @click="add('XP012')"
          >
            {{ t('add_sw_release') }}</el-button
          >
        </div>
        <div class="overflow-x-auto">
          <el-table
            :data="swData.release_note"
            class="text-primary"
            style="width: 100%; height: 330px"
            stripe
            :cell-style="msi.tb_cell"
            :header-cell-style="msi.tb_header_cell"
            size="large"
            v-loading.fullscreen.lock="isLoading"
          >
            <el-table-column prop="version" :label="t('version')" min-width="200" />
            <el-table-column prop="description" :label="t('description')" min-width="350" />
            <el-table-column prop="update_time_str" :label="t('update_time')" min-width="250" />
            <el-table-column
              v-if="isMSI && (MStore.rule_permission.SoftwareInfo.release === 'O')"
              prop=""
              class="text-right"
              :label="t('release')"
              min-width="100"
            >
              <template #default="scope">
                <el-button class="btn-info" @click="release(scope, 'XP012')">
                  {{ t('release') }}
                </el-button>
              </template>
            </el-table-column>
            <el-table-column 
              v-if="isMSI && (MStore.rule_permission.SoftwareInfo.detail === 'O')" 
              prop="" 
              label="" 
              min-width="100"
            >
              <template #default="scope">
                <el-button class="btn-more" @click="detail_info(scope, 'XP012')">
                  <font-awesome-icon icon="fa-solid fa-ellipsis"/>
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
      <div class="pt-20px">
        <div class="header-container">
          <strong
            class="w-full text-18px md:text-20px text-blue-1200 block break-all word-wrap mb-20px"
          >
            {{ t('ota_fw_version') }} :
            <span class="block mt-5px md:inline-block md-mt-0">{{ fwData.version }}</span>
          </strong>
          <el-button
            class="btn-secondary shrink-0 box-shadow"
            v-if="isMSI && (MStore.rule_permission.SoftwareInfo.addFwRelease === 'O')"
            @click="add('XP011_BT')"
          >
            {{ t('add_fw_release') }}</el-button
          >
        </div>
        <div class="overflow-x-auto">
          <el-table
            :data="fwData.release_note"
            class="text-primary"
            style="width: 100%; height: 330px"
            stripe
            :cell-style="msi.tb_cell"
            :header-cell-style="msi.tb_header_cell"
            size="large"
            v-loading.fullscreen.lock="isLoading"
          >
            <el-table-column prop="version" :label="t('version')" min-width="200" />
            <el-table-column prop="description" :label="t('description')" min-width="350" />
            <el-table-column prop="update_time_str" :label="t('update_time')" min-width="250" />
            <el-table-column
              v-if="isMSI && (MStore.rule_permission.SoftwareInfo.release === 'O')"
              prop=""
              class="text-right"
              :label="t('release')"
              min-width="100"
            >
              <template #default="scope">
                <el-button class="btn-info" @click="release(scope, 'XP011_BT')">
                {{ t('release') }}
                </el-button>
              </template>
            </el-table-column>
            <el-table-column 
              v-if="isMSI && (MStore.rule_permission.SoftwareInfo.detail === 'O')" 
              prop="" 
              label="" 
              min-width="100"
            >
              <template #default="scope">
                <el-button class="btn-more" @click="detail_info(scope, 'XP011_BT')">
                  <font-awesome-icon icon="fa-solid fa-ellipsis"/>
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>
  </div>
  <el-dialog append-to-body v-model="swVisible" class="max-w-600px" width="90%" @open="openDialog">
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
      <el-form :model="Detail_Data" :rules="softwareInfo_rules" ref="softwareInfo_ref" :scroll-to-error=true>
        <el-form-item class="block" :label="t('version')" prop="version">
          <el-input v-model="Detail_Data.version" />
        </el-form-item>
        <el-form-item class="block" :label="t('file_path')" prop="file">
          <el-input v-model="Detail_Data.file" />
        </el-form-item>
<!-- 
        <el-form-item class="block" :label="t('FW Version')" prop="">
          <el-input v-model="Detail_Data.fw_version" />
        </el-form-item> -->

        <el-form-item class="flex-center" :label="t('download_file')">
          <el-button type="primary" @click="download_File">{{ t('download_file') }}</el-button>
        </el-form-item>

        <el-form-item class="block" :label="t('description')">
          <el-input v-model="Detail_Data.description" type="textarea" />
        </el-form-item>
        <el-form-item class="block" :label="t('update_time')">
          <el-input v-model="Detail_Data.update_time_str" disabled />
        </el-form-item>
      </el-form>
    </div>
    <template #footer>
      <span class="dialog-footer flex flex-center">
        <el-button
          round
          class="w-48% bg-btn-100 text-white max-w-140px"
          @click="confirm('cancel')"
          >{{ t('cancel') }}</el-button
        >
        <el-button
          round
          class="w-48% bg-btn-200 text-white max-w-140px"
          @click="confirm('confirm')"
          >{{ t('confirm') }}</el-button
        >
      </span>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.header-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 2rem;
  @media (min-width: 992px) {
    flex-wrap: nowrap;
  }
}
:deep(.el-textarea .el-textarea__inner) {
  background-color: var(--blue-1200);
  color: var(--white);
}
</style>
