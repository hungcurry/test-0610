<script setup>
import ApiFunc from '@/composables/ApiFunc'
import dashboard from '@/assets/img/permission_dashboard.png'
import payment from '@/assets/img/permission_payment.png'
import evse from '@/assets/img/permission_evse.png'
import account from '@/assets/img/permission_account.png'
import log from '@/assets/img/permission_log.png'
import setting from '@/assets/img/permission_setting.png'
import other from '@/assets/img/permission_dashboard.png'
import { ref, reactive, onMounted , onBeforeMount , computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessageBox } from 'element-plus'
import { ElMessage } from 'element-plus'
import { m_cloud_permission , mapKeysGroup } from '@/composables/permission'
import { useMStore } from '@/stores/m_cloud'

const MStore = useMStore()
const { t } = useI18n()
const MsiApi = ApiFunc()
const userType = ref([
  {
    value: 'AdminUser',
    label: t('admin_user'),
  },
  {
    value: 'DeveloperUser',
    label: t('developer_user'),
  },
  {
    value: 'FAEUser',
    label: t('fae_user'),
  },
  {
    value: 'ViewerUser',
    label: t('viewer_user'),
  },
  {
    value: 'CustomerServiceUser',
    label: t('customer_service_user'),
  },
  {
    value: 'EngineerUser',
    label: t('engineer_user'),
  },
])
const changeItem = ref(false)
const cpo_name = reactive([])
const activeNames = ref([])
const ruleFormRef = ref()
const cpoValue = ref('')
const userValue = ref('')
const displayItem = ref(false)
const allPage = ref([])
const allItem = reactive({})
const checkedItem = reactive({})
const checkAll = ref({})
const isIndeterminate = ref({})
const oldType = ref('')
const expand = ref(true)

const expand_close = () => {
  if (expand.value) {
    expand.value = false
    activeNames.value = []
  }
  else {
    expand.value = true
    activeNames.value = []
    if (m_cloud_permission?.[userValue.value]) {             
      if ( Object.keys(m_cloud_permission[userValue.value]).length)
      {   
        for (let i = 0; i < Object.keys(m_cloud_permission[userValue.value]).length; i++)
        activeNames.value.push(i)
      }
    }
  }
}
const changeCompanyInfo = () => {
  displayItem.value = false
  userValue.value = undefined
  changeItem.value = false
}
const getPermissionRule = async (selType) => {
  expand.value = true
  if (changeItem.value) {
    await ElMessageBox.confirm(t('do_you_want_to_discard_the_changes'), t('warning'))
    .then(async () => {
      changeItem.value = false
      allPage.value.length = 0
      activeNames.value = []
      for (let i = 0; i < Object.keys(m_cloud_permission[userValue.value]).length; i++)
        activeNames.value.push(i)

      const select_cpo = cpo_name.find(item => item._id === cpoValue.value)
      if (select_cpo === undefined) {
        ElMessage({ message: t('pelase_select_company'), type: 'error',})
        return
      }
      let current = {}

      if (select_cpo?.config?.m_cloud?.permissions?.[userValue.value]) {
        let all_item = {}
        all_item =  JSON.parse(JSON.stringify(m_cloud_permission[userValue.value]))
        current = {}
        current =  JSON.parse(JSON.stringify(select_cpo?.config?.m_cloud?.permissions?.[userValue.value]))
        for (let page in current) {
          if (!all_item[page]) continue
          for (let item in current[page]) {
            if (current[page][item] === 'O' && all_item[page][item] ) {
              all_item[page][item] = 'O';
            } else if (current[page][item] === 'X' && all_item[page][item] ) {
              all_item[page][item] = 'X';
            }
          }
        }
        current = {}
        current =  JSON.parse(JSON.stringify(all_item))
        Object.assign(allPage.value, all_item)  
      }
      else {
        current = {}
        current = JSON.parse(JSON.stringify(m_cloud_permission[userValue.value]))
        Object.assign(allPage.value, m_cloud_permission[userValue.value])  
      }
      for (let key in allPage.value) {
        allItem[key] = Object.keys(allPage.value[key])
        checkedItem[key] = Object.keys(allPage.value[key]).filter((subKey) => allPage.value[key][subKey] === 'O')
        // const checkedCount = checkedItem[key].length
        // const isHasChecked = checkedCount > 0
        // const isNotAllChecked = checkedCount < allItem[key].length
        // if (checkedCount) {
        //   checkAll.value[key] = checkedCount === checkedItem[key].length 
        // }
        // isIndeterminate.value[key] = isHasChecked && isNotAllChecked
      }

      // 轉換格式出 checkedItem2 / allItem2
      changeAllPageKey.value.forEach((key) => {
        checkedItem2.value[key] = {};
        allItem2.value[key] = {};
        mapKeys.value[key].forEach((subKey) => {
          checkedItem2.value[key][subKey] = []
          allItem2.value[key][subKey] = []
        });
      });
      changeAllPageKey.value.forEach((key)=>{
        allPageKey.value.forEach((subKey)=>{
          if(checkedItem2.value[key]?.[subKey]){
            checkedItem2.value[key][subKey] = [...checkedItem[subKey]]
            allItem2.value[key][subKey] = [...allItem[subKey]]
          }
        })
      })
      // 轉換格式出 checkAll / isIndeterminate
      changeAllPageKey.value.forEach((str)=>{
        checkAllState(str)
      })
      // modal
      getPageModel()
      getSwitchModel()

      allPage.value = Object.keys(current)
      displayItem.value = true
      oldType.value = selType
    })
    .catch(() => {
      userValue.value = oldType.value
      return
    })
  }
  else {
      allPage.value.length = 0
      activeNames.value = []
      for (let i = 0; i < Object.keys(m_cloud_permission[userValue.value]).length; i++)
        activeNames.value.push(i)

      const select_cpo = cpo_name.find(item => item._id === cpoValue.value)
      if (select_cpo === undefined) {
        ElMessage({ message: t('pelase_select_company'), type: 'error',})
        return
      }
      let current = {}

      if (select_cpo?.config?.m_cloud?.permissions?.[userValue.value]) {
        let all_item = {}
        all_item =  JSON.parse(JSON.stringify(m_cloud_permission[userValue.value]))
        current = {}
        current =  JSON.parse(JSON.stringify(select_cpo?.config?.m_cloud?.permissions?.[userValue.value]))
        for (let page in current) {
          if (!all_item[page]) continue
          for (let item in current[page]) {
            if (current[page][item] === 'O' && all_item[page][item] ) {
              all_item[page][item] = 'O';
            } else if (current[page][item] === 'X' && all_item[page][item] ) {
              all_item[page][item] = 'X';
            }
          }
        }
        current = {}
        current =  JSON.parse(JSON.stringify(all_item))
        Object.assign(allPage.value, all_item)  
      }
      else {
        current = {}
        current = JSON.parse(JSON.stringify(m_cloud_permission[userValue.value]))
        Object.assign(allPage.value, m_cloud_permission[userValue.value])
      }
      for (let key in allPage.value) {
        allItem[key] = Object.keys(allPage.value[key])
        checkedItem[key] = Object.keys(allPage.value[key]).filter((subKey) => allPage.value[key][subKey] === 'O')
        // const checkedCount = checkedItem[key].length
        // const isHasChecked = checkedCount > 0
        // const isNotAllChecked = checkedCount < allItem[key].length
        // if (checkedCount) {
        //   checkAll.value[key] = checkedCount === checkedItem[key].length 
        // }
        // isIndeterminate.value[key] = isHasChecked && isNotAllChecked
      }
    

      // 轉換格式出 checkedItem2 / allItem2
      changeAllPageKey.value.forEach((key) => {
        checkedItem2.value[key] = {};
        allItem2.value[key] = {};
        mapKeys.value[key].forEach((subKey) => {
          checkedItem2.value[key][subKey] = []
          allItem2.value[key][subKey] = []
        });
      });
      changeAllPageKey.value.forEach((key)=>{
        allPageKey.value.forEach((subKey)=>{
          if(checkedItem2.value[key]?.[subKey]){
            checkedItem2.value[key][subKey] = [...checkedItem[subKey]]
            allItem2.value[key][subKey] = [...allItem[subKey]]
          }
        })
      })
      // 轉換格式出 checkAll / isIndeterminate
      changeAllPageKey.value.forEach((str)=>{
        checkAllState(str)
      })
      // modal
      getPageModel()
      getSwitchModel()

      allPage.value = Object.keys(current)
      displayItem.value = true
      oldType.value = selType
  }
}
const handlerSaveForm = async () => {
  if (changeItem.value) {    
    ElMessageBox.confirm(t('do_you_want_to_modify'), t('warning'))
    .then(async () => {

      const submitObj = {};
      changeAllPageKey.value.forEach((key) => {
        allPageKey.value.forEach((subKey) => {
          if(checkedItem2.value[key][subKey]){
            submitObj[subKey] = checkedItem2.value[key][subKey];
          }
        });
      });

      const allItemDisable = {}
      const outputObj = {}
      for (const key in allItem) {
        allItemDisable[key] = {}
        allItem[key].forEach(value => {
          allItemDisable[key][value] = 'X'
        })
      }
      // for(const key in checkedItem) {
      //   const values = checkedItem[key]
      //   const innerObj = {}
      //   values.forEach(value => {
      //     innerObj[value] = 'O'
      //   })
      //   outputObj[key] = innerObj
      // }
      
      for(const key in submitObj) {
        const values = submitObj[key]
        const innerObj = {}
        values.forEach(value => {
          innerObj[value] = 'O'
        })
        outputObj[key] = innerObj
      }
      const c = {}
      for (const key in allItemDisable) {
        if (Object.hasOwn(outputObj,key)) {
          c[key] = { ...allItemDisable[key], ...outputObj[key] }
        } else {
          c[key] = { ...allItemDisable[key] }
        }
      }
      const result = cpo_name.find(item => item._id === cpoValue.value)
      if (result.config === undefined)
        result.config = {}
      if (result.config.m_cloud === undefined)
        result.config.m_cloud = {}
      if (result.config.m_cloud.permissions === undefined)
        result.config.m_cloud.permissions = {}
      result.config.m_cloud.permissions[userValue.value] = c
      let sendData = {  class : 'CompanyInformation', pk: cpoValue.value, config: result.config}
      let res = await MsiApi.setCollectionData('patch', 'cpo', sendData)
      if (res.status === 200) {
        ElMessage({ message: t('edit_success'), type: 'success',})
      }
      else {
        ElMessage({ message: t('error'), type: 'error',})
      }
      changeItem.value = false
    })    
  }
  else {
    ElMessage({ message: t('unchanged'), type: 'error',})
  }
}
const handlerResetForm = () => {
  cpoValue.value = ''
  userValue.value = ''
  displayItem.value = false
}
onMounted( async() => {
  let queryData  = { "database": "CPO", "collection": "CompanyInformation", "pipelines": [ 
    { "$project": { name: 1, config: 1, _id:1} }
  ]}
  let res = await MsiApi.mongoAggregate(queryData)
  Object.assign(cpo_name, res.data.result)
})
// ---- add ------
let idx = 1
const mapKeys = ref({
  Dashboard: [],
  Payment: [],
  EvseManagement: [],
  //---------------------
  AccountManagement: [],
  LogMonitor: [],
  AdvancedSetting: [],
  Other: [],
})
const checkedItem2 = ref({})
const allItem2 = ref({})
const pageModel = ref({})
const switchModel = ref({})
const allPageKey = computed(() => {
  if (m_cloud_permission[userValue.value] === undefined) return
  return Object.keys(JSON.parse(JSON.stringify(m_cloud_permission?.[userValue?.value])))
})
const changeAllPageKey = computed(() => {
  return Object.keys(mapKeys.value)
})
const sliceKeys = ref([
  { text: t('dashboard'), value: changeAllPageKey.value[0], num: idx++ , icon: dashboard },
  { text: t('payment'), value: changeAllPageKey.value[1], num: idx++ , icon: payment },
  { text: t('evse_management'), value: changeAllPageKey.value[2] , num: idx++ , icon: evse },
  //---------------------
  { text: t('account_management'), value: changeAllPageKey.value[3], num: idx++ , icon: account },
  { text: t('log_monitor'), value: changeAllPageKey.value[4], num: idx++ , icon: log },
  { text: t('advanced_setting'), value: changeAllPageKey.value[5], num: idx++ , icon: setting },
  { text: t('others'), value: changeAllPageKey.value[6] ,num: idx++ , icon: other },
])
const baseBlockKey = computed(() => {
  let ary = [...sliceKeys.value]
  return ary.slice(0,3)
})
const advanceBlockKey = computed(() => {
  let ary = [...sliceKeys.value]
  return ary.slice(3,ary.length)
})
const checkedItem2Length = computed(() => {
  if(allPageKey.value === undefined) return
  let obj = {}
  allPageKey.value.forEach((key)=>{
    changeAllPageKey.value.forEach((changekey)=>{
      if(checkedItem2.value?.[changekey]?.[key]?.length === 0){
        obj[key] = 0
      }
      if(checkedItem2.value?.[changekey]?.[key]?.length > 0){
        const checkedCount = checkedItem2?.value?.[changekey]?.[key]?.length
        obj[key] = checkedCount
      }
    })
  })
  return obj
})
const checkedItem2Length_total = computed(() => {
  if (checkedItem2Length.value === undefined) return;
  let obj = {};
  Object.entries(mapKeys.value).forEach(([key, subKeys]) => {
    const sum = subKeys.reduce((pre, itemKey) => {
      return pre + (checkedItem2Length.value[itemKey] || 0)
    },0)
    obj[key] = sum;
  });
  return obj;
})
const allItem2Length = computed(() => {
  if(allPageKey.value === undefined) return
  let obj = {}
  allPageKey.value.forEach((key)=>{
    changeAllPageKey.value.forEach((changekey)=>{
      if(allItem2.value?.[changekey]?.[key]?.length === 0){
        obj[key] = 0
      }
      if(allItem2.value?.[changekey]?.[key]?.length > 0){
        const checkedCount = allItem2?.value?.[changekey]?.[key]?.length
        obj[key] = checkedCount
      }
    })
  })
  return obj
})
const allItem2Length_total = computed(() => {
  if(allItem2Length.value === undefined) return
  let obj = {};
  Object.entries(mapKeys.value).forEach(([key, subKeys]) => {
    const sum = subKeys.reduce((pre, itemKey) => {
      return pre + (allItem2Length.value[itemKey] || 0)
    },0)
    obj[key] = sum;
  });
  return obj;
})
const initPageModel = ()=> {
  changeAllPageKey.value.forEach((key) => {
    pageModel.value[key] = {};
    mapKeys.value[key].forEach((subKey) => {
      pageModel.value[key][subKey] = [];
    });
  });
}
const getPageModel = ()=> {
  pageModel.value = JSON.parse(JSON.stringify(checkedItem2.value))
}
const getSwitchModel = ()=> {
  changeAllPageKey.value.forEach((key)=>{
    allPageKey.value.forEach((subKey)=>{
      if(pageModel.value[key]?.[subKey]){
        switchModel.value[subKey] = pageModel.value[key]?.[subKey][0] === 'page'
      }
    })
  })
}
const handleCheckAll = (str ,payload, val) => {
  changeItem.value = true
  if(val === true){
    pageModel.value[str] = JSON.parse(JSON.stringify(allItem2.value[str]))
    checkedItem2.value[str] = pageModel.value[str]
    Object.keys((payload)).forEach((key)=>{
      switchModel.value[key] = true
    })
  }else {
    // 清空
    let obj = JSON.parse(JSON.stringify(allItem2.value[str]))
    Object.keys(obj).forEach((key)=> obj[key] = [])

    pageModel.value[str] = obj
    checkedItem2.value[str] = pageModel.value[str]
    Object.keys((payload)).forEach((key)=>{
      switchModel.value[key] = false
    })
  }
  isIndeterminate.value[str] = false
}
const handleCheckeditems = (str, substr , ary) => {
  changeItem.value = true
  // switchModel state
  const isPage = ary.includes('page')
  const pageIndex = ary.indexOf('page')
  if (pageIndex !== -1) {
    ary.splice(pageIndex, 1)
    ary.unshift('page')
  }
  switchModel.value[substr] = isPage
  checkedItem2.value[str][substr] = ary
  checkAllState(str)
}
const handleCheckedSwitchs = (str, substr , val) => {
  changeItem.value = true
  // ---------------
  // @子項目全開或全關
  // if(val === true){
  //   pageModel.value[str][substr] = allItem2.value[str][substr]
  //   checkedItem2.value[str][substr] = pageModel.value[str][substr]
  // }else {
  //   pageModel.value[str][substr] = []
  //   checkedItem2.value[str][substr] = pageModel.value[str][substr]
  // }
  // ---------------
  if(val === true){
    pageModel.value[str][substr].unshift('page')
    checkedItem2.value[str][substr] = pageModel.value[str][substr]
  }else {
    pageModel.value[str][substr].shift('page')
    checkedItem2.value[str][substr] = pageModel.value[str][substr]
  }
  checkAllState(str)
}
const checkAllState = (str) => {
  // checkAll state
  const checkedCount = checkedItem2Length_total.value[str]
  checkAll.value[str] = checkedCount === allItem2Length_total.value[str]
  // isIndeterminate state
  const isHasChecked = checkedCount > 0
  const isNotAllChecked = checkedCount < allItem2Length_total.value[str]
  isIndeterminate.value[str] = isHasChecked && isNotAllChecked
}
onBeforeMount(() => {
  initPageModel()
  mapKeys.value = mapKeysGroup
})
</script>

<template>
  <div class="permissions">
    <div class="container lg">
      <div class="flex justify-start flex-wrap lg:flex-nowrap pt-40px pb-32px">
        <p class="title text-30px text-blue-1200">{{ t('permission') }}</p>
      </div>

      <el-row :gutter="10">
        <el-col :xs="24" :md="12" >
          <el-form class="mr-auto w-100% lg:flex" label-width="100px" label-position="left" status-icon>
            <el-form-item class="lg:w-50% block md:flex mb-24px items-center lg:mr-24px" :label="t('company')">
              <el-select
                class="el-select w-full"
                v-model="cpoValue"
                :placeholder="t('select')"
                size="large"
                @change="changeCompanyInfo"
              >
                <el-option
                  v-for="item in cpo_name"
                  :key="item.id"
                  :label="item.name"
                  :value="item._id"
                />
              </el-select>
            </el-form-item>
            <el-form-item class="lg:w-50% block md:flex mb-24px items-center" :label="t('user_type')">
              <el-select
                class="el-select w-full"
                v-model="userValue"
                :placeholder="t('select')"
                size="large"
                @change="getPermissionRule"
              >
                <el-option
                  v-for="item in userType"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-form>
        </el-col>
      </el-row>

      <template v-if="true">
        <el-button v-if="expand" @click="expand_close" class="btn-icon arrow my-6">
          <font-awesome-icon icon="fa-solid fa-arrow-down" />
        </el-button>
        <el-button v-else @click="expand_close" class="btn-icon arrow my-6">
          <font-awesome-icon icon="fa-solid fa-arrow-right" />
        </el-button>
      </template>

      <el-row :gutter="10">
        <el-col :xs="24" :md="12" >
          <div v-if="displayItem" class="base collapseGroup mb-20px mb-16px">
            <el-collapse v-model="activeNames">
              <div v-for="key in baseBlockKey" :key="key.value">
                <el-collapse-item  :name="key.num">
                  <template #title>
                    <img class="header-icon mr-4px mb-3px" 
                      :src="key.icon" alt=""
                    >
                    <h3 class="m-0 text-16px font-700 text-secondary whitespace-nowrap">
                      {{ key.text }}
                    </h3>
                    <el-checkbox
                      class="title my-0px ml-10px w-40px flex-center"
                      v-model="checkAll[key.value]"
                      :indeterminate="isIndeterminate[key.value]"
                      @change="handleCheckAll(key.value ,pageModel[key.value], $event)"
                      @click.stop
                    >
                    </el-checkbox>
                  </template>
                  <div v-for="(item) in mapKeys[key.value]" :key="item">
                    <div class="flex justify-between items-center">
                      <p class="text-20px font-700 m-0 text-blue-1100">{{ t( item ) }}</p>
                      <el-switch size="small" v-model="switchModel[item]"
                      @change="handleCheckedSwitchs(key.value, item, $event)"
                      style="--el-switch-on-color: #61a8d8; --el-switch-off-color: #9e9e9e"/>
                    </div>
                    <template v-for="item1 in allItem[item]" :key="item1">
                      <el-checkbox-group
                        class="inline-block"
                        v-model="pageModel[key.value][item]"
                        @change="handleCheckeditems(key.value ,item, $event)"
                      >
                        <el-checkbox
                          class="w-full min-w-180px m-0 mt-4px mb-16px md:w-auto md:mr-30px"
                          :label="item1"
                          v-if="item1 !== 'page'"
                        >
                        <span v-if="item1 !== 'page'">{{ item1 }}</span>
                        </el-checkbox>
                      </el-checkbox-group>
                    </template>
                  </div>
                </el-collapse-item>
              </div>
            </el-collapse>
          </div>
        </el-col>
        <el-col :xs="24" :md="12" >
          <div v-if="displayItem" class="advance collapseGroup mb-20px mb-16px">
            <el-collapse v-model="activeNames">
              <div v-for="key in advanceBlockKey" :key="key.value">
                <el-collapse-item  :name="key.num">
                  <template #title>
                    <img class="header-icon mr-4px mb-3px" 
                      :src="key.icon" alt=""
                    >
                    <h3 class="m-0 text-16px font-700 text-secondary whitespace-nowrap">
                      {{ key.text }}
                    </h3>
                    <el-checkbox
                      class="title my-0px ml-10px w-40px flex-center"
                      v-model="checkAll[key.value]"
                      :indeterminate="isIndeterminate[key.value]"
                      @change="handleCheckAll(key.value ,pageModel[key.value], $event)"
                      @click.stop
                    >
                    </el-checkbox>
                  </template>
                  <div v-for="(item) in mapKeys[key.value]" :key="item">
                    <div class="flex justify-between items-center">
                      <p class="text-20px font-700 m-0 text-blue-1100">{{ t( item ) }}</p>    
                      <el-switch size="small" v-model="switchModel[item]"
                      @change="handleCheckedSwitchs(key.value, item, $event)"
                      style="--el-switch-on-color: #61a8d8; --el-switch-off-color: #9e9e9e"/>
                    </div>
                    <template v-for="item1 in allItem[item]" :key="item1">
                      <el-checkbox-group
                        class="inline-block"
                        v-model="pageModel[key.value][item]"
                        @change="handleCheckeditems(key.value ,item, $event)"
                      >
                      <el-checkbox
                        class="w-full min-w-180px m-0 mt-4px mb-16px md:w-auto md:mr-30px"
                        :label="item1"
                        v-if="item1 !== 'page'"
                      >
                      <span v-if="item1 !== 'page'">{{ item1 }}</span>
                      </el-checkbox>
                    </el-checkbox-group>
                    </template>
                  </div>
                </el-collapse-item>
              </div>
            </el-collapse>
          </div>
        </el-col>
      </el-row>

      <div v-if="displayItem" class="flex justify-center pb-40px">
        <el-button class="btn-secondary bg-btn-100 md:mr-44px" 
          v-if="MStore.rule_permission.Permission.cancel === 'O' || MStore.permission.isCompany" 
          @click="handlerResetForm(ruleFormRef)"
        >
          {{ t('cancel') }}
        </el-button>
        <el-button class="btn-secondary" 
          v-if="MStore.rule_permission.Permission.save === 'O' || MStore.permission.isCompany" 
          @click="handlerSaveForm(ruleFormRef)"
        >
          {{ t('save') }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.permissions {
  .el-collapse {
    --el-collapse-header-height: auto;
    --el-collapse-content-bg-color: var(--gray-100);
    border: 0;
  }
  :deep(.el-collapse-item__header) {
    border: 0;
    padding: 1.2rem 1.6rem;
    user-select: none;
    background-color: var(--gray-100);
    justify-content: center;
    border-radius: 1rem;
    &.is-active {
      border-radius: 1rem 1rem 0  0;
    }
  }
  :deep(.el-collapse-item__wrap) {
    border-radius: 0 0 1rem 1rem;
  }
  :deep(.el-collapse-item__content) {
    border: 0;
    padding: 0.6rem 1.6rem;
    padding-bottom: 0;
    @media (min-width: 768px) {
      padding-left: 4.4rem;
    }
    .el-checkbox{
      --el-checkbox-checked-bg-color: var(--blue-900);
    }
  }
  .checkbox-group{
    border-bottom: 0.1rem solid var(--gray-200);
    margin-bottom: 1.6rem;
  }
  .el-collapse-item:last-child {
    margin-bottom: 1.6rem;
  }
}
.el-checkbox.is-bordered.is-checked {
  background-color: var(--btn-300);
  :deep(.el-checkbox__label) {
    color: var(--primary);
  }
}
// state
:deep(.el-checkbox__input) + .el-checkbox__label {
  color: var(--blue-900);
}
:deep(.el-checkbox__input.is-indeterminate) + .el-checkbox__label {
  color: var(--blue-900);
}
:deep(.el-checkbox__input.is-checked) + .el-checkbox__label {
  color: var(--blue-900);
}
</style>
