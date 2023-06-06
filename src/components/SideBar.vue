<template>
  <div class="sidebar">
    <p class="m-cloud">m-Cloud</p>
    
    <!-- <img src="@/assets/img/all_msilogo.png" alt=""> -->
      <div class="sidebar-link">
        <side-bar-link/>
      </div>
  </div>
</template>

<script setup>
import SideBarLink from '../components/SideBarLink.vue'

</script>

<style lang="scss">
.sidebar {
  margin: 0;
  width: 300px;
  height: 100%;
  background-color: #2e343a;
  img {
    margin: 36px 0 36px 0;
  }

  .m-cloud {
    width: 100%;
    font-size: 40px;
    color: #FFFFFF;
    text-align: center;
  }
  // .sidebar-content {
  //   width: 100%;
  //   height: 100%;
  //   display: flex;
  //   flex-direction: column;
  //   align-items: center;
  //   p {
  //     margin: 0;
  //     font-size: 30px;
  //     text-align: center;
  //     color: rgb(255, 255, 255);
  //   }
  //   img {
  //     width: 80%;
  //     text-align: center;
  //   }
  //   .sidebar-link {
  //     width:100%;
  //   }
  // }
}


</style>
