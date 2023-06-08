<template>
  <div class="sw-info">
    <!-- <div v-if="dev_member">

    </div>
    <div v-else>
    <h1>FW Version</h1>
    <div class="fw-container">
    <p>now version  {{ version.xp011_bt }}</p> 
    <el-input v-model="version.fw" autocomplete="off" />
    <el-button class="add-user-btn" @click="modifyVersion(version.xp011_bt_id, version.fw)"> Modify FW Version </el-button>
    </div>
    <br>
    <h1>EV Life Version</h1>
    <div class="others-container">
      <div class="ev-life-container">
        <div class="fw-container">
          <p>iOS    {{ version.ios }}</p> 
          <el-input v-model="version.ios_new" autocomplete="off" />
          <el-button class="add-user-btn" @click="modifyVersion(version.ios_id, version.ios_new)"> Modify iOS Version </el-button>
          <p>iOS Beta  {{ version.ios_beta }}</p> 
          <el-input v-model="version.ios_beta_new" autocomplete="off" />
          <el-button class="add-user-btn" @click="modifyVersion(version.ios_beta_id, version.ios_beta_new)"> Modify iOS Beta Version </el-button>
          <p>Android  {{ version.android }}</p> 
          <el-input v-model="version.android_new" autocomplete="off" />
          <el-button class="add-user-btn" @click="modifyVersion(version.android_id, version.android_new)"> Modify Android Version </el-button>
          <p>Android Beta  {{ version.android_beta }}</p> 
          <el-input v-model="version.android_beta_new" autocomplete="off" />
          <el-button class="add-user-btn" @click="modifyVersion(version.android_beta_id, version.android_beta_new)"> Modify Android Beta Version </el-button>
        </div>
      </div>
    </div>
    </div> -->

  
    <div class="sw">
      <el-button class="add-tariff" @click="editSW"> Add SW </el-button>
      <el-table :data="swData" style="width: 95%; height:300px" stripe ref="checkTable"
      :cell-style=msi.tb_cell :header-cell-style=msi.tb_header_cell size="large">
        <el-table-column prop="version" label="Version" min-width="10"/>
        <el-table-column prop="description" label="Description" min-width="60"/>
        <el-table-column prop="update_time" label="Update Time" min-width="10"/>
        
        <el-table-column  prop="" label="" min-width="30">
            <template #default="scope">
              <el-button @click="detail_info(scope.row)"> <font-awesome-icon icon="fa-solid fa-ellipsis" /> </el-button>
            </template>
        </el-table-column>
      </el-table>
    </div>


    <br><br>

    <div class="fw">
      <el-button class="add-tariff" @click="editSW"> Add FW </el-button>
      <el-table :data="fwData" style="width: 95%; height:300px" stripe ref="checkTable"
      :cell-style=msi.tb_cell :header-cell-style=msi.tb_header_cell size="large">
        <el-table-column prop="version" label="Version" min-width="10"/>
        <el-table-column prop="description" label="Description" min-width="60"/>
        <el-table-column prop="update_time" label="Update Time" min-width="10"/>
        
        <el-table-column  prop="" label="" min-width="30">
          <template #default="scope">
            <el-button @click="detail_info(scope.row)"> <font-awesome-icon icon="fa-solid fa-ellipsis" /> </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="swVisible" title="SW" draggable>
      <el-form :model="SW_Detail_Data">
        <el-form-item label="Version" >
          <el-input v-model="SW_Detail_Data.version" autocomplete="off" />
        </el-form-item>

        <el-form-item label="Description" >
          <el-input v-model="SW_Detail_Data.description" type="textarea" autocomplete="off" />
          
        </el-form-item>

      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="confirmSw('delete')">Delete</el-button>
          <el-button @click="confirmSw('cancel')">Cancel</el-button>
          <el-button type="primary" @click="confirmSw('confirm')">Confirm</el-button>
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


const swData = ref([])
const fwData = ref([])
const MsiApi = ApiFunc()
const swVisible = ref(false)

const SW_Detail_Data = reactive([])

const confirmSw = (mode) => {
  if (mode === 'delete') {

  }
  else if (mode === 'cancel') {

  }
  else if (mode === 'confirm') {
    
  }
}

const editSW = () => {
  swVisible.value = true  
}

// const activeName = ref('first')

// const version = reactive({})

// const modifyVersion = async(id, value) => {
//   const now = new Date().toISOString()
//   const formattedDate = now.split(".")[0]
//   let sendData1 = { 'class' : 'VersionControl', 'pk': id, 'version' : value, 'release_date':formattedDate}
//   await MsiApi.setCollectionData('patch', 'cpo', sendData1) 

//   let queryData = { "database":"CPO", "collection":"VersionControl", "query": {}}

//   let response = await MsiApi.mongoQuery(queryData)
//   for(let i = 0; i < response.data.all.length; i++) {
//     if (response.data.all[i].type === 'Android') {
//       version.android = response.data.all[i].version
//     }
//     else if (response.data.all[i].type === 'iOS') {
//       version.ios = response.data.all[i].version
//     }
//     else if (response.data.all[i].type === 'Android_Beta') {
//       version.android_beta = response.data.all[i].version
//     }
//     else if (response.data.all[i].type === 'iOS_Beta') {
//       version.ios_beta = response.data.all[i].version
//     }
//     else if (response.data.all[i].type === 'XP011_BT') {
//       version.xp011_bt = response.data.all[i].version
//     }
//     else if (response.data.all[i].type === 'XP011_BT_Beta') {
//       version.xp011_bt_beta = response.data.all[i].version
//     }
//   }
// }

onMounted( async() => {

  let queryData = { "database":"CPO", "collection":"VersionControl", "query": {
     "type": 'XP011_BT'
  }}
  let response = await MsiApi.mongoQuery(queryData)
  console.log(response)
  
  

  queryData = { "database":"CPO", "collection":"VersionControl", "query": {
     "type": 'XP012'
  }}
  response = await MsiApi.mongoQuery(queryData)
  console.log(response)

  // for (let i = 0; i < response.data.all.length; i++) {
  //   if (response.data.all[i].type === 'Android') {
  //     version.android = response.data.all[i].version
  //     version.android_id = response.data.all[i]._id
  //   }
  //   else if (response.data.all[i].type === 'iOS'){
  //     version.ios = response.data.all[i].version
  //     version.ios_id = response.data.all[i]._id
  //   }
  //   else if (response.data.all[i].type === 'Android_Beta'){
  //     version.android_beta = response.data.all[i].version
  //     version.android_beta_id = response.data.all[i]._id
  //   }
  //   else if (response.data.all[i].type === 'iOS_Beta'){
  //     version.ios_beta = response.data.all[i].version
  //     version.ios_beta_id = response.data.all[i]._id
  //   }
  //   else if (response.data.all[i].type === 'XP011_BT'){
  //     version.xp011_bt = response.data.all[i].version
  //     version.xp011_bt_id = response.data.all[i]._id
  //   }
  //   else if (response.data.all[i].type === 'XP011_BT_Beta'){
  //     version.xp011_bt_beta = response.data.all[i].version
  //     version.xp011_bt_beta_id = response.data.all[i]._id
  //   }
    
  // }

})




// detail [ {version: release: decription: file:}]

</script>

<style lang="scss" scoped>

.wiki{
    bottom: 120px;
    right: 40px;
    position: absolute;
}
.semver{
    bottom: 40px;
    right: 40px;
    position: absolute;
}
.npm{
    bottom: 80px;
    right: 40px;
    position: absolute;
}
.sw-info {
  padding: 10px;
}
.ota-container
{
  display: flex;
  flex-direction: row;
}

.others-container
{
  display: flex;
  flex-direction: row;
  gap:10px
}

.sw-container {
  width: 500px;
  margin-right: 20px;


  .date {
    p{
      padding: 2px;
      margin: 2px
    }
  }
  .file-size {
    p{
      padding: 2px;
      margin: 2px
    }
  }

  .note{
    p{
      padding: 2px;
      margin: 2px
    }
  }
}
.fw-container {
  width: 400px;
}


:deep(.el-tabs__item){
  font-size: 30px !important;
}
</style>