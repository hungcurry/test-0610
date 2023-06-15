<template>
  <div class="sw-info">
    <div class="sw">
      <el-button v-if="isMSI" class="add-tariff" @click="add('XP012')"> Add SW Release</el-button>
      <br>
      <span>{{ 'OTA SW Version :' + swData.version }}</span>
      <el-table :data="swData.release_note" style="width: 95%; height:400px" stripe 
      :cell-style=msi.tb_cell :header-cell-style=msi.tb_header_cell size="large">
        <el-table-column prop="version" label="Version" min-width="5"/>
        <el-table-column prop="description" label="description" min-width="15"/>
        <el-table-column prop="update_time_str" label="Update Time" min-width="10"/>
        <el-table-column v-if="isMSI" prop="" label="Release" min-width="5">
          <template #default="scope">
            <el-button @click="release(scope, 'XP012')"> Release </el-button>
          </template>
        </el-table-column>
        <el-table-column v-if="isMSI" prop="" label="" min-width="5">
          <template #default="scope">
            <el-button @click="detail_info(scope, 'XP012')"> <font-awesome-icon icon="fa-solid fa-ellipsis" /> </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <br><br>
    <div class="fw">
      <el-button v-if="isMSI" class="add-tariff" @click="add('XP011_BT')"> Add FW Release</el-button>
      <br>
      <span>{{ 'OTA FW Version :' + fwData.version }}</span>
      <el-table :data="fwData.release_note" style="width: 95%; height:400px" stripe 
      :cell-style=msi.tb_cell :header-cell-style=msi.tb_header_cell size="large">
        <el-table-column prop="version" label="Version" min-width="5"/>
        <el-table-column prop="description" label="description" min-width="15"/>
        <el-table-column prop="update_time_str" label="Update Time" min-width="10"/>
        <el-table-column v-if="isMSI" prop="" label="Release" min-width="5">
          <template #default="scope">
            <el-button @click="release(scope, 'XP011_BT')"> Release </el-button>
          </template>
        </el-table-column>
        <el-table-column v-if="isMSI" prop="" label="" min-width="5">
          <template #default="scope">
            <el-button @click="detail_info(scope, 'XP011_BT')"> <font-awesome-icon icon="fa-solid fa-ellipsis" /> </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="swVisible" :title= dialog_title draggable>
      <el-form :model="Detail_Data">
        <el-form-item label="Version" >
          <el-input v-model="Detail_Data.version" autocomplete="off" />
        </el-form-item>
        <el-form-item label="File" >
          <el-input v-model="Detail_Data.file" autocomplete="off" />
        </el-form-item>

        <el-form-item label="Download File" >
          <el-button  @click="download_File">Download File</el-button>
        </el-form-item>

        <el-form-item label="Description" >
          <el-input v-model="Detail_Data.description" type="textarea" autocomplete="off" />
        </el-form-item>
        <el-form-item label="Update time" >
          <el-input v-model="Detail_Data.update_time_str" disabled autocomplete="off" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="confirm('cancel')">Cancel</el-button>
          <el-button type="primary" @click="confirm('confirm')">Confirm</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import ApiFunc from '@/components/ApiFunc'
import msi from '@/assets/msi_style'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { useMStore } from "../stores/m_cloud"
import moment from "moment"
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
  if (mode === 'cancel') {
    swVisible.value = false
  }
  else if (mode === 'confirm') {
    let queryData = { "database":"CPO", "collection":"VersionControl", "query": {"type": type.value}}
    let response = await MsiApi.mongoQuery(queryData)
    if (response.data.all[0].release_note === undefined)
      response.data.all[0].release_note = []
    let send_release_note = response.data.all[0].release_note
    if (index.value === -1) {
      send_release_note.unshift({ version:Detail_Data.version, file:Detail_Data.file, description:Detail_Data.description, update_time: new Date()})
    }
    else {
      send_release_note[index.value] = { version:Detail_Data.version, file:Detail_Data.file, description:Detail_Data.description, update_time: new Date()}
    }
    let sendData = { 'class' : 'VersionControl', 'pk': response.data.all[0]._id, 'release_note' : send_release_note}
    console.log(await MsiApi.setCollectionData('patch', 'cpo', sendData))
    swVisible.value = false
    
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

const add = (selectType) => {
  Detail_Data.version = ''
  Detail_Data.file = ''
  Detail_Data.description = ''
  Detail_Data.update_time_str = ''

  dialog_title.value = selectType
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

<style lang="scss" scoped>

</style>