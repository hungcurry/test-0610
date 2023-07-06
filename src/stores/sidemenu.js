import { ref, onMounted } from 'vue'
import { defineStore } from 'pinia'
export const useSideMenuStore = defineStore('sideMenu', () => {
  // sideMenu
  const isCollapse = ref(true)
  const layoutRight = ref(null)
  const sideBar = ref(null)

  const handleOpen = () => {
    isCollapse.value = false
    layoutRight.value.classList.add('open')
    sideBar.value.classList.remove('close')
  }
  const handleClose = () => {
    isCollapse.value = true
    layoutRight.value.classList.remove('open')
    sideBar.value.classList.add('close')
  }
  onMounted(() => {})
  return {
    layoutRight,
    sideBar,
    isCollapse,
    handleOpen,
    handleClose,
  }
})
