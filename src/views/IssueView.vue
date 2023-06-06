<template>
    <div class="connector" style="height:85vh;">
      <el-table style="height:100%; font-size:14px" :data="issueData"  highlight-current-row
                        :header-cell-style="msi.tb_header_cell" :cell-style="msi.tb_cell">
        <el-table-column v-for="(item) in issueTabel" :key="item" :prop=item.value :label=item.label  :min-width=item.width
        :filters="item.filter" :filter-method="item.filter_method"
        >
          <template v-if="item.label === 'Operator'" #default="scope">
            <el-button type="primary" size="small" @click="read(scope.row)">Read</el-button>
            <el-button type="primary" size="small" @click="unread(scope.row)">Unread</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
</template>

<script  setup>
import { onMounted, onUnmounted, reactive} from 'vue'
import MsiCommonApi from '@/components/ApiFunc'
import msi from '@/assets/msi_style'

const MsiApi = MsiCommonApi()
const filters = [{ text:'READ', value:true}, { text:'UNREAD', value:false}]

const filterTag = (value, rowData) => {
    console.log( value)
    console.log( rowData)
  return rowData.read === value
}

const issueTabel = [  {label:'Title', value:'title', width:'5'},
                      {label:'Name', value:'form.name', width:'5'},
                      {label:'EVSE ID', value:'form.evse_id', width:'10'},
                      {label:'Category', value:'form.category', width:'5'},
                      {label:'Desc.', value:'form.desc', width:'10'},
                      {label:'Read', value:'read', width:'5',  filter:filters, filter_method:filterTag},
                      {label:'Created Date', value:'created_date',width:'10'},
                      {label:'Operator', value:'',width:'10'},
                    ]

const issueData = reactive([])

// const read = (row) => {
//     console.log(row)
// }

const read = async (row) => {
    console.log(row)
    let sendData = { 'class' : 'IssueForm', 'pk': row._id, 'read' : true}
    await MsiApi.setCollectionData('patch', 'cpo', sendData)
    getIssueForm()
}

const unread = async (row) => {
    let sendData = { 'class' : 'IssueForm', 'pk': row._id, 'read' : false}
    await MsiApi.setCollectionData('patch', 'cpo', sendData)
    getIssueForm()
}

const getIssueForm = async() => {
  let jsonData = { "database":"CPO", "collection":"IssueForm", "query": {}}
  let response = await MsiApi.mongoQuery(jsonData)

  if (response.status === 200) {
    issueData.splice(0, issueData.length)
      Object.assign(issueData, response.data.all)
      console.log(issueData)
    }
  else {
    console.log(response.data)
  }

}


onMounted(() => {
    getIssueForm()
})

onUnmounted(() => {

})

</script>

