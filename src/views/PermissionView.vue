<script setup>
import ApiFunc from '@/composables/ApiFunc'
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessageBox } from 'element-plus'
import { ElMessage } from 'element-plus'
import { m_cloud_permission,   } from '@/composables/permission'

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

const handleCheckeditems = (str, ary) => {
  changeItem.value = true
  const checkedCount = ary.length
  checkAll.value[str] = checkedCount === allItem[str].length
  const isHasChecked = checkedCount > 0
  const isNotAllChecked = checkedCount < allItem[str].length
  isIndeterminate.value[str] = isHasChecked && isNotAllChecked
}

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

const handleCheckAll = (str, val) => {
  changeItem.value = true
  checkedItem[str] = val ? allItem[str] : []
  isIndeterminate.value[str] = false
}

const changeCompanyInfo = () => {
  displayItem.value = false
  userValue.value = undefined
  changeItem.value = false
}

const getPermissionRule = async (selType) => {
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
          for (let item in current[page]) {
            if (current[page][item] === 'O') {
              all_item[page][item] = 'O'  
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
        const checkedCount = checkedItem[key].length
        const isHasChecked = checkedCount > 0
        const isNotAllChecked = checkedCount < allItem[key].length
        if (checkedCount) {
          checkAll.value[key] = checkedCount === checkedItem[key].length 
        }
        isIndeterminate.value[key] = isHasChecked && isNotAllChecked
      }
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
          for (let item in current[page]) {
            if (current[page][item] === 'O') {
              all_item[page][item] = 'O'  
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
        const checkedCount = checkedItem[key].length
        const isHasChecked = checkedCount > 0
        const isNotAllChecked = checkedCount < allItem[key].length
        if (checkedCount) {
          checkAll.value[key] = checkedCount === checkedItem[key].length 
        }
        isIndeterminate.value[key] = isHasChecked && isNotAllChecked
      }
      allPage.value = Object.keys(current)
      displayItem.value = true
      oldType.value = a
  }
  
}

const handlerSaveForm = async () => {

  if (changeItem.value) {    
    ElMessageBox.confirm(t('do_you_want_to_modify'), t('warning'))
    .then(async () => {
      const allItemDisable = {}
      const outputObj = {}
      for (const key in allItem) {
        allItemDisable[key] = {}
        allItem[key].forEach(value => {
          allItemDisable[key][value] = 'X'
        })
      }
      for(const key in checkedItem) {
        const values = checkedItem[key]
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

      changeItem.value = false
    })    
  }
  else {
    ElMessage({ message: t('unchanged'), type: 'error',})
  }
}

const handlerResetForm = (formEl) => {
  if (!formEl) return
  formEl.resetFields()
}

onMounted( async() => {
  let queryData  = { "database": "CPO", "collection": "CompanyInformation", "pipelines": [ 
    { "$project": { name: 1, config: 1, _id:1} }
  ]}
  let res = await MsiApi.mongoAggregate(queryData)
  Object.assign(cpo_name, res.data.result)
})
</script>

<template>
  <div class="permissions">
    <div class="container lg">
      <div class="flex justify-start flex-wrap lg:flex-nowrap pt-40px pb-32px">
        <p class="title text-30px">{{ t('permission') }}</p>
      </div>
      <el-form class="mr-auto" label-width="100px" label-position="left" status-icon>
        <el-form-item class="block md:flex mb-24px items-center" :label="t('company')">
          <el-select class="el-select w-full lg:w-30%" v-model="cpoValue" :placeholder="t('select')" size="large" @change="changeCompanyInfo">
            <el-option v-for="item in cpo_name" :key="item.value"  :label="item.name" :value="item._id"/>
          </el-select>
        </el-form-item>

        <el-form-item class="block md:flex mb-24px items-center" :label="t('user_type')">
          <el-select class="el-select w-full lg:w-30%" v-model="userValue" :placeholder="t('select')" size="large" @change="getPermissionRule">
            <el-option v-for="item in userType" :key="item.value" :label="item.label" :value="item.value"/>
          </el-select>
        </el-form-item>
      </el-form>

      <el-button v-if="expand" @click="expand_close" class="btn-icon arrow"
            ><font-awesome-icon icon="fa-solid fa-arrow-down"
      /></el-button>
      <el-button v-else @click="expand_close" class="btn-icon arrow"
            ><font-awesome-icon icon="fa-solid fa-arrow-right"
      /></el-button>
      
      <div v-if="displayItem" class="BASE collapseGroup mb-20px mb-50px">
        <el-collapse v-model="activeNames" >
          <div v-for=" (item, index) in allPage" :key="item" :label="item">
            <el-collapse-item :name=index>
              <template #title>
                <p class="text-20px font-700 text-secondary whitespace-nowrap">
                  {{ t( item ) }}
                </p>
                <el-icon class="text-secondary header-icon ml-4px">
                  <SemiSelect />
                </el-icon>
                <el-checkbox class="title my-0px ml-10px" v-model="checkAll[item]" :indeterminate="isIndeterminate[item]"  @change="handleCheckAll(item, $event)"
                @click.stop
                >
                  {{ t('check_all') }}
                </el-checkbox>
              </template>
              <el-checkbox-group class="flex flex-wrap" v-model="checkedItem[item]" @change="handleCheckeditems(item, $event)">
                <el-checkbox class="w-full min-w-170px m-0 mt-4px mb-18px md:w-auto md:mr-12px"
                  v-for="item1 in allItem[item]" :key="item1" :label="item1" border>
                  {{ ( item1 ) }}
                </el-checkbox>
              </el-checkbox-group>
            </el-collapse-item>
          </div>
        </el-collapse>
      </div>
      <div v-if="displayItem" class="flex justify-center pb-40px">
        <el-button class="btn-secondary bg-btn-100 md:mr-44px" @click="handlerResetForm(ruleFormRef)">
          {{ t('cancel') }}
        </el-button>
        <el-button class="btn-secondary" @click="handlerSaveForm(ruleFormRef)">
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
  }
  :deep(.el-collapse-item__header) {
    padding: 1.2rem 0;
    user-select: none;
  }
  :deep(.el-collapse-item__content) {
    padding-bottom: 0;
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
  color: var(--gray-300);
}
:deep(.el-checkbox__input.is-indeterminate) + .el-checkbox__label {
  color: var(--gray-300);
}
:deep(.el-checkbox__input.is-checked) + .el-checkbox__label {
  color: var(--secondary);
}
</style>