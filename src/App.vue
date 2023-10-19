<script setup>
import { RouterView } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ref, watchEffect } from 'vue'
import i18n from '@/locales'

const localeLang = ref()
const { locale, messages } = useI18n()
const changeLanguage = () => {
	locale.value = i18n.global.locale.value
    localeLang.value = messages.value[locale.value].elLang
}
watchEffect(changeLanguage);
</script>

<template>
    <el-config-provider :locale="localeLang">
        <RouterView />
    </el-config-provider>
</template>

<style lang="scss">
body {
    font-family: 'Roboto', sans-serif, Avenir, Helvetica, Arial, sans-serif;
}
</style>