<template>
  <div class="main-content" id="main-content">
    <router-view></router-view>
  </div>
</template>

<script setup>
// import {onMounted,onUnmounted, ref} from 'vue'
// import {  ElMessageBox } from 'element-plus'
// // import { useRouter } from "vue-router";
// // const router = useRouter()
// const logoutTime = ref(600)

// const reflashTimer = () => {
//   logoutTime.value = 600
// }

// const open = () => {
//   ElMessageBox.alert( '即將登出, 請點擊OK恢復', 'Title', {
//     confirmButtonText: 'OK',
//     callback: () => { logoutTime.value = 600 }
//   })
// }

// const checkTime = () => {
//   console.log(logoutTime.value)
//   logoutTime.value--
//   if (logoutTime.value === 30 ) {
//     open()
//   }
//   if (logoutTime.value <= 0) {
//     location.href = 'http://127.0.0.1:5173/login'
//     // router.push({ name: 'login' })
//   }
// }

// let logoutTimer = null

// onMounted( () => {
//   logoutTimer = setInterval(checkTime , 1000)
// })


// onUnmounted(() => {
//   clearTimeout( logoutTimer)
// })



</script>
