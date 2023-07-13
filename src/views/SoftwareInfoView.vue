<script setup>
import { ref, reactive, onMounted } from 'vue'
import ApiFunc from '@/composables/ApiFunc'
import msi from '@/assets/msi_style'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { useMStore } from "../stores/m_cloud"
import moment from "moment"
import { v4 as uuidv4 } from 'uuid'
import {  ElMessage } from 'element-plus'
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
  let check_format_success = true
  if (mode === 'cancel') {
    swVisible.value = false
  }
  else if (mode === 'confirm') {

    if (Detail_Data.version === '' || Detail_Data.version === undefined) {
      ElMessage.error('Oops, Version required.')
      check_format_success = false
    }
    if (Detail_Data.file === '' || Detail_Data.file === undefined) {
      ElMessage.error('Oops, file path required.')
      check_format_success = false
    }
    if (check_format_success === true) {
      let queryData = { "database":"CPO", "collection":"VersionControl", "query": {"type": type.value}}
      let response = await MsiApi.mongoQuery(queryData)

      if (response.data.all.length === 0) {
        let sendData = { 'class' : 'VersionControl', 'pk': uuidv4(), 'type':type.value, 'version':Detail_Data.version,'release_date': new Date(), 
                        'release_note' : [{ version:Detail_Data.version, file:Detail_Data.file, description:Detail_Data.description, update_time: new Date() }]
        }
        console.log(await MsiApi.setCollectionData('post', 'cpo', sendData))
        swVisible.value = false
      }
      else {
        if (response.data.all[0].release_note === undefined)
          response.data.all[0].release_note = []
        let send_release_note = response.data.all[0].release_note
        if (index.value === -1) {
          send_release_note.unshift({ version:Detail_Data.version, file:Detail_Data.file, description:Detail_Data.description, update_time: new Date()})
        }
        else {
          send_release_note[index.value] = { version:Detail_Data.version, file:Detail_Data.file, description:Detail_Data.description, update_time: new Date()}
        }
        let sendData = { 'class' : 'VersionControl', 'pk': response.data.all[0]._id, 'release_note' : send_release_note, }
        console.log(await MsiApi.setCollectionData('patch', 'cpo', sendData))
        swVisible.value = false
    }
      response = await MsiApi.mongoQuery(queryData)
      if (type.value === 'XP012')  {
        swData.length = 0
        Object.assign(swData , response.data.all[0])
        for (let i = 0; i < swData?.release_note?.length; i++) {
          swData.release_note[i].update_time_str = (moment(swData.release_note[i].update_time).format("YYYY-MM-DD HH:mm:ss"))
        }
      }
      else if(type.value === 'XP011_BT') {
        fwData.length = 0
        Object.assign(fwData, response.data.all[0])
        for (let i = 0; i < fwData?.release_note?.length; i++) {
          fwData.release_note[i].update_time_str = (moment(fwData.release_note[i].update_time).format("YYYY-MM-DD HH:mm:ss"))
        }
      }
    }
  }
}
const add = (selectType) => {
  Detail_Data.version = ''
  Detail_Data.file = ''
  Detail_Data.description = ''
  Detail_Data.update_time_str = ''

  if (selectType === 'XP012') {
    dialog_title.value = 'Add SW Release Note'
  }
  else if (selectType === 'XP011_BT') {
    dialog_title.value = 'Add FW Release Note'
  }

  swVisible.value = true  
  type.value = selectType
  index.value = -1
}
const detail_info = (scope,selectType) => {
  swVisible.value = true
  type.value = selectType
  index.value = scope.$index
  Detail_Data.version = scope.row.version
  Detail_Data.file = scope.row.file
  Detail_Data.description = scope.row.description
  Detail_Data.update_time_str = scope.row.update_time_str
}
const release = async (scope,selectType) => {
  if (selectType === 'XP012')
    swData.version = scope.row.version
  else if (selectType === 'XP011_BT')
    fwData.version = scope.row.version
  let queryData = { "database":"CPO", "collection":"VersionControl", "query": {"type": selectType}}
  let response = await MsiApi.mongoQuery(queryData)
  let sendData = { 'class' : 'VersionControl', 'pk': response.data.all[0]._id, release_date: new Date(), version : scope.row.version}
  console.log(await MsiApi.setCollectionData('patch', 'cpo', sendData))
}
onMounted( async() => {
  let queryData = { "database":"CPO", "collection":"VersionControl", "query": { "type": 'XP011_BT' }}
  let response = await MsiApi.mongoQuery(queryData)
  Object.assign(fwData , response.data.all[0])
  for (let i = 0; i < fwData?.release_note?.length; i++) {
    fwData.release_note[i].update_time_str = (moment(fwData.release_note[i].update_time).format("YYYY-MM-DD HH:mm:ss"))
  }

  queryData = { "database":"CPO", "collection":"VersionControl", "query": { "type": 'XP012' }}
  response = await MsiApi.mongoQuery(queryData)
  Object.assign(swData , response.data.all[0])
  for (let i = 0; i < swData?.release_note?.length; i++) {
    swData.release_note[i].update_time_str = (moment(swData.release_note[i].update_time).format("YYYY-MM-DD HH:mm:ss"))
  }
  if (MStore?.permission?.company?.name === 'MSI') 
    isMSI.value = true
})
</script>

<template>
  <div class="sw-info">
    <div class="container lg pb-40px">
      <div class="sw pt-40px pb-20px">
        <div class="header-container"> 
          <strong class="text-20px text-blue-1200 block">{{ 'OTA SW Version :' + swData.version }}</strong>
          <el-button class="release-btn px-30px box-shadow" v-if="isMSI" @click="add('XP012')"> Add SW Release</el-button>
        </div>
        <div class="overflow-x-auto">
          <el-table :data="swData.release_note" class="white-space-nowrap text-primary" style="width: 100%; height:330px" stripe 
          :cell-style=msi.tb_cell :header-cell-style=msi.tb_header_cell size="large">
            <el-table-column prop="version" label="Version" min-width="200"/>
            <el-table-column prop="description" label="Description" min-width="350"/>
            <el-table-column prop="update_time_str" label="Update Time" min-width="250"/>
            <el-table-column v-if="isMSI" prop="" class="text-right" label="Release" min-width="100">
              <template #default="scope">
                <el-button class="btn-Release" @click="release(scope, 'XP012')">Release</el-button>
              </template>
            </el-table-column>
            <el-table-column v-if="isMSI" prop="" label="" min-width="100">
              <template #default="scope">
                <el-button class="btn-more" @click="detail_info(scope, 'XP012')"> <font-awesome-icon icon="fa-solid fa-ellipsis" /> </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
      <div class="fw pt-20px">
        <div class="header-container">
          <strong class="text-20px text-blue-1200 block">{{ 'OTA FW Version :' + fwData.version }}</strong>
          <el-button class="release-btn px-30px box-shadow" v-if="isMSI" @click="add('XP011_BT')"> Add FW Release</el-button>
        </div>
        <div class="overflow-x-auto">
          <el-table :data="fwData.release_note" class="white-space-nowrap text-primary"  style="width: 100%; height:330px" stripe 
          :cell-style=msi.tb_cell :header-cell-style=msi.tb_header_cell size="large">
            <el-table-column prop="version" label="Version" min-width="200"/>
            <el-table-column prop="description" label="Description" min-width="350"/>
            <el-table-column prop="update_time_str" label="Update Time" min-width="250"/>
            <el-table-column v-if="isMSI" prop="" label="Release" min-width="100">
              <template #default="scope">
                <el-button class="btn-Release" @click="release(scope, 'XP011_BT')"> Release </el-button>
              </template>
            </el-table-column>
            <el-table-column v-if="isMSI" prop="" label="" min-width="100">
              <template #default="scope">
                <el-button class="btn-more" @click="detail_info(scope, 'XP011_BT')"> <font-awesome-icon icon="fa-solid fa-ellipsis" /> </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>
    <el-dialog v-model="swVisible" class="max-w-600px">
      <template #header="{ titleId, titleClass }">
        <div class="py-2rem relative bg-blue-100">
          <h4
            :id="titleId"
            :class="titleClass"
            class="m-0 text-center text-blue-1200 font-400 text-24px line-height-26px"
          >
            {{ dialog_title }}
          </h4>
        </div>
      </template>
      <div class="dialog-context">
        <el-form :model="Detail_Data">
          <el-form-item class="block" label="Version" >
            <el-input v-model="Detail_Data.version" />
          </el-form-item>
          <el-form-item class="block" label="File Path" >
            <el-input v-model="Detail_Data.file" />
          </el-form-item>

          <el-form-item class="flex-center" label="Download File" >
            <el-button type="primary"  @click="download_File">Download File</el-button>
          </el-form-item>

          <el-form-item class="block" label="Description" >
            <el-input v-model="Detail_Data.description" type="textarea" />
          </el-form-item>
          <el-form-item class="block" label="Update time" >
            <el-input v-model="Detail_Data.update_time_str" disabled />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer flex flex-center">
          <el-button round class="w-48% bg-btn-100 text-white max-w-140px" @click="confirm('cancel')">Cancel</el-button>
          <el-button round class="w-48% bg-btn-200 text-white max-w-140px" @click="confirm('confirm')">Confirm</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.release-btn {
  height: 40px;
  font-size: 18px;
  background-color: var(--secondary);
  color:#FFFFFF;
  border-radius: 20px;
}
.header-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 2rem;
}
</style>
