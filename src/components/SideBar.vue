<script setup>
import SideBarLink from '@/components/SideBarLink.vue'
import { storeToRefs } from 'pinia'
import { useSideMenuStore } from '@/stores/sidemenu'
import { Fold, Expand } from '@element-plus/icons-vue'

const sideMenuStore = useSideMenuStore()
const { isCollapse, sideBar } = storeToRefs(sideMenuStore)
const { handleClose, handleOpen } = sideMenuStore
const menuClose = () => {
  handleClose()
}
const menuOpen = () => {
  handleOpen()
}
</script>

<template>
  <div ref="sideBar" class="sidebar close">
    <div class="flex flex-center my-14px">
      <p class="m-cloud m-0 mr-20px">m-Cloud</p>
      <!-- buttonGroup -->
      <template v-if="true">
        <el-button
          v-if="!isCollapse"
          type="primary"
          class="collapse bg-secondary border-0 inline-block text-white"
          @click.stop="menuClose"
          ><el-icon> <Fold /> </el-icon
        ></el-button>
        <el-button
          v-else
          type="primary"
          class="expand bg-secondary border-0 mx-auto text-white"
          @click.stop="menuOpen"
        >
          <el-icon>
            <Expand />
          </el-icon>
        </el-button>
      </template>
    </div>
    <div class="sidebarLink">
      <side-bar-link />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.sidebar {
  box-sizing: border-box;
  .m-cloud {
    font-size: 4rem;
    color: var(--white);
    text-align: center;
    display: block;
    line-height: 3.2rem;
  }
  .sidebarLink {
    height: calc(100vh - 5%);
    overflow-x: hidden;
    overflow-y: scroll;
    box-sizing: border-box;
    &::-webkit-scrollbar {
      width: 0.8rem;
    }
    &::-webkit-scrollbar-track,
    &::-webkit-scrollbar-corner {
      background-color: var(--primary);
    }
    &::-webkit-scrollbar-thumb {
      background-color: var(--secondary);
      border-radius: 2rem;
    }
  }
  .collapse,
  .expand {
    padding: 1rem;
    font-size: 2.2rem;
    display: flex;
  }
}
.sidebar.close {
  .m-cloud {
    display: none;
  }
}
</style>
