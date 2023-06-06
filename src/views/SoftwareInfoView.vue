<template>
  <div class="sw-info">

  <el-tabs v-model="activeName" class="demo-tabs" >
    <el-tab-pane class="first-tab" label="OTA" name="first">
      <div class="ota-container">
        <div class="sw-container">
          <p>SW Release Note</p>
          <el-collapse class="sw-container"  accordion>
            <el-collapse-item title="version 0.1.2.2" name="1">
              <div class="date">
                <p>Release Date : 2023 / 04 / 27</p> 
              </div>
              <div class="note">
                <p> Descriptions</p>
                <p> Fixed:</p>
                <p> 1. Fixd profile data not saved correctly.</p>
                <p> 2. Fixd WebUI title of Windows Chrome browser display abnornal</p>
                <p> 3. Fixd icon of type 2 gun not correct on UI</p>
                <p> Changes:</p>
                <p> 1. Change controlboard FW reset time to 15 sec.</p>
                <p> 2. Add "Connection Test" in WebUI About page.</p>
                <p> 3. Modify Payment page to display parking rate instead of parking fee</p>
                <p> 4. Display parking/charging fees with data from CPO.</p>
                <p> 4. Modify charge current settings in WebUI</p>
                <p> 5. Modify detection area of Camera page in WebUI</p>
                <p> 6. Improved UI speed</p>
                <p> 7. Add 'minmaxcurrent' in profile.ini</p>
                <p> 8. Add 'manufacture_mode' in setting.ini for mfg test.(auto start charging)</p>
                <p> 9. Update LPR module: v0.1.0.7 Date:2023/04/24</p>
              </div>
            </el-collapse-item>
            <el-collapse-item title="Version 0.1.2.1" name="2">
              <div class="date">
                Release Date : 2023 / 04 / 10
              </div>
              <div class="note">
                <p>Descriptions :</p>
                <p> Fixed:</p>
                <p> 1. Fixed charging fee in finish page have float point in TWD</p>
                <p> 2. Fixed parking fee shows 0 if parking more than 1 day</p>
                <p> Changes:</p>
                <p> 1. Merge local auth list with offline mode.</p>
                <p> 2. Show parking screen if parking time greater than min_duration in tariff</p>
                <p> 3. Remove float point in UI if the end is '.0' (UI Finished)</p>
                <p> 4. Update UI language base on PM provided at 2023/3/24.</p>
                <p> 5. Update partial UI of m-Connect+</p>
                <p> 6. Change UI to kWh</p>
                <p> 7. Exchange Gun Type/name in standby UI</p>
                <p> 8. Add set charge current function at charging start</p>
                <p> 9. Update LPR module: v0.1.0.6 Date:2023/04/10</p>   
              </div>
            </el-collapse-item>
          </el-collapse>
        </div>

        <div class="fw-container">
          <p>FW Release Note</p>
          <el-collapse accordion>
            <el-collapse-item title="Version 4.0.10" name="1">
              <div class="date">
                Release Date : 2023 / 05 / 03
              </div>
              <div class="note">
                <p>Descriptions :</p>
                <p>01. Adjust Task size</p>
                <p>02. New schedule charging</p>
                <p>03. Fix below 16 amps will have problems</p>
                <p>04. Delay the communication time without connection</p>
              </div>
            </el-collapse-item>
            <el-collapse-item title="Version 4.0.9" name="2">
              <div class="date">
                Release Date : 2023 / 04 / 26
              </div>
              <div class="note">
                <p>Descriptions :</p>
                <p>01. Add demoflag</p>
                <p>02. Fix firmware update error</p>
                <p>03. Adjust the current field setting</p>
                <p>04. Adjust the method for current display</p>
                <p>05. Fix led error about pushing emergency button</p>
                <p>06. Fix the pilot error that cp voltage is too low</p>
                <p>07. Set higher memory block</p>
              </div>
            </el-collapse-item>
            <p>now version  {{ version.xp011_bt }}</p> 
            <el-input v-model="version.fw" autocomplete="off" />
            <el-button class="add-user-btn" @click="modifyVersion(version.xp011_bt_id, version.fw)"> Modify FW Version </el-button>
          </el-collapse>
        </div>
      </div>
    </el-tab-pane>
    <el-tab-pane label="Others" name="second">
      <div class="others-container">
        <div class="fw-container">
          <p>m-Cloud Release Note</p>
          <el-collapse  accordion>

            <el-collapse-item title="Version 0.0.8" name="8">
              <div class="date">
                Release Date : 2023 / 05 / 26
              </div>
              <div class="note">
                <p>Descriptions</p>
                <p>Funcation:</p>
                  <p>1. Add Logout</p>
                  <p>2. Add MSI permission</p>
                  <p>3. Add MSI Clear EVSE List</p>
                  <p>4. Add Rate Description Generator</p>
                  <p>5. Change Date to local time</p>
                  <p>5. Add time zone required</p>
                  <p>6. Add Delete RFID Card</p>
                <p>Issue:</p>
                  <p>1. Fix Admin company</p>
                  <p>2. Fix Min Price</p>
                  <p>3. Fix Dashboard data empty</p>
                  <p>4. Fix Charger Log price</p>
                  <p>5. Fix RFID edit issue</p>
                <p>Layout:</p>
                  <p>1. Remove Active </p>
                  <p>2. Fix Payment / Charger log Date format</p>
                  <p>3. Filter non MSI page</p>
                  <p>4. Remove non required item</p>
                  <p>5. Add Scroll bar in RFID Layout</p>
                  <p>6. Fix Rate Description layout</p>
              </div>
            </el-collapse-item>

            <el-collapse-item title="Version 0.0.7" name="7">
              <div class="date">
                Release Date : 2023 / 05 / 23
              </div>
              <div class="note">
                <p>Descriptions :</p>
                <p>Funcation</p>
                <p>1. Add env </p>
                <p>2. create member detail info </p>
                <p>3. Check item is null</p>
                <p>4. Add user binding card and device</p>
                <p>5. Add Rate Table</p>
                <p>6. Add Charger Log Table item</p>
                <p>6. Add Table filter</p>
                <p>Issue:</p>
                <p>Layout</p>
                <p>1. Del issue report</p>
                <p>2. Fix dashboard layout</p>
                <p>3. Reomve table item</p>
              </div>
            </el-collapse-item>


            <el-collapse-item title="Version 0.0.6" name="6">
              <div class="date">
                Release Date : 2023 / 05 / 17
              </div>
              <div class="note">
                <p>Descriptions :</p>
                <p>Funcation</p>
                <p>1. create rate copy / delete funcation </p>
                <p>2. create member detail info </p>

                <p>Issue:</p>

                <p>Layout</p>
                <p>1. Modify Layout</p>
                <p>2. Modify String</p>
              </div>
            </el-collapse-item>

            <el-collapse-item title="Version 0.0.5" name="5">
              <div class="date">
                Release Date : 2023 / 05 / 15
              </div>
              <div class="note">
                <p>Descriptions :</p>
                <p>add funcation</p>
                <p>1. create station add TimeZone / Coordinates / Address funcation </p>

                <p>fix issue</p>
                <p>1. Company page haskKey -> hashKey</p>
                <p>2. Tariff page Modify tariff element </p>

                <p>Layout</p>
                <p>1. Map page List Mode Header </p>
                <p>2. evse deatil page add tariff</p>
                <p>3. station page remove create evse</p>
                <p>4. add evse page  create evse</p>
                <p>5. add evse page unconnect and connect </p>
                <p>6. payment page time display</p>
              </div>
            </el-collapse-item>


            <el-collapse-item title="Version 0.0.4" name="4">
              <div class="date">
                Release Date : 2023 / 05 / 11
              </div>
              <div class="note">
                <p>Descriptions :</p>
                <p>1. Add dashboard data</p>
                <p>2. Add Company item</p>
                <p>3. Fix evse edit tariff profile name</p>
                <p>4. Fix Layout (dashboard / payment / charger log) </p>
              </div>
            </el-collapse-item>

            <el-collapse-item title="Version 0.0.3" name="3">
              <div class="date">
                Release Date : 2023 / 05 / 10
              </div>
              <div class="note">
                <p>Descriptions :</p>
                <p>1. Add reset layout and dashboard data</p>
              </div>
            </el-collapse-item>

            <el-collapse-item title="Version 0.0.2" name="2">
              <div class="date">
                Release Date : 2023 / 05 / 10
              </div>
              <div class="note">
                <p>Descriptions :</p>
                <p>1. Add reset layout and dashboard data</p>
              </div>
            </el-collapse-item>


            <el-collapse-item title="Version 0.0.1" name="1">
              <div class="date">
                Release Date : 2023 / 05 / 09
              </div>
              <div class="note">
                <p>Descriptions :</p>
                <p>1. Add Software info page</p>
              </div>
            </el-collapse-item>
          </el-collapse>
        </div>
        <div class="cpo-container">

          <div class="fw-container">
          <p>CPO Release Note</p>
          <el-collapse  accordion>
            <el-collapse-item title="Version 0.9.0.5" name="1">
              <div class="date">
                Release Date : 2023 / 05 / 09
              </div>
              <div class="note">
                <p>Descriptions :</p>
                <p>1. Add get TimeZone API</p>
              </div>
            </el-collapse-item>
          </el-collapse>
        </div>

        </div>
        <div class="ev-life-container">

          <div class="fw-container">
          <p>EV-Life Release Note</p>
          <el-collapse  accordion>
            <el-collapse-item title="Version 0.9.1" name="1">
              <div class="date">
                Release Date : 2023 / 05 / 03
              </div>
              <div class="note">
                <p>Descriptions :</p>
                <p>1. Fix Issue</p>
              </div>
            </el-collapse-item>
          </el-collapse>
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
        <div class="qr-pay-container">

          <div class="fw-container">
          <p>QR-Pay Release Note</p>
          <el-collapse  accordion>
            <el-collapse-item title="Version 0.0.0" name="1">
              <div class="date">
                
              </div>
              <div class="note">
                <p>Descriptions :</p>
                
              </div>
            </el-collapse-item>
          </el-collapse>
        </div>

        </div>
      </div>
    </el-tab-pane>
  </el-tabs>
<!-- 

  <a class="wiki" href="https://en.wikipedia.org/wiki/Software_versioning">Wiki Software Versioning</a>
  <a class="npm" href="https://docs.npmjs.com/about-semantic-versioning">NPM Semantic Versioning</a>
  <a class="semver" href="https://semver.org/">Semantic Versioning</a> -->

  
</div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import ApiFunc from '@/components/ApiFunc'
const MsiApi = ApiFunc()
const activeName = ref('first')

const version = reactive({})

const modifyVersion = async(id, value) => {
console.log(id, value)
  let sendData1 = { 'class' : 'VersionControl', 'pk': id, 'version' : value}
  await MsiApi.setCollectionData('patch', 'cpo', sendData1) 

  let queryData = { "database":"CPO", "collection":"VersionControl", "query": {}}

  let response = await MsiApi.mongoQuery(queryData)
  console.log(response)  
  for(let i = 0; i < response.data.all.length; i++) {
    if (response.data.all[i].type === 'Android') {
      version.android = response.data.all[i].version
    }
    else if (response.data.all[i].type === 'iOS'){
      version.ios = response.data.all[i].version
    }
    else if (response.data.all[i].type === 'Android_Beta'){
      version.android_beta = response.data.all[i].version
    }
    else if (response.data.all[i].type === 'iOS_Beta'){
      version.ios_beta = response.data.all[i].version
    }
    else if (response.data.all[i].type === 'XP011_BT'){
      version.xp011_bt = response.data.all[i].version
    }
    else if (response.data.all[i].type === 'XP011_BT_Beta'){
      version.xp011_bt_beta = response.data.all[i].version
    }
  }
}

onMounted( async() => {

  let queryData = { "database":"CPO", "collection":"VersionControl", "query": {}}

  let response = await MsiApi.mongoQuery(queryData)
  console.log(response)  

  for (let i = 0; i < response.data.all.length; i++) {
    if (response.data.all[i].type === 'Android') {
      version.android = response.data.all[i].version
      version.android_id = response.data.all[i]._id
    }
    else if (response.data.all[i].type === 'iOS'){
      version.ios = response.data.all[i].version
      version.ios_id = response.data.all[i]._id
    }
    else if (response.data.all[i].type === 'Android_Beta'){
      version.android_beta = response.data.all[i].version
      version.android_beta_id = response.data.all[i]._id
    }
    else if (response.data.all[i].type === 'iOS_Beta'){
      version.ios_beta = response.data.all[i].version
      version.ios_beta_id = response.data.all[i]._id
    }
    else if (response.data.all[i].type === 'XP011_BT'){
      version.xp011_bt = response.data.all[i].version
      version.xp011_bt_id = response.data.all[i]._id
    }
    else if (response.data.all[i].type === 'XP011_BT_Beta'){
      version.xp011_bt_beta = response.data.all[i].version
      version.xp011_bt_beta_id = response.data.all[i]._id
    }
    
  }

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