<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
const emit = defineEmits(['update:modelValue'])
const props = defineProps({
  modelValue: {
    typeof: String,
    default: 'no name',
  },
  data: {
    type: Array,
    default: () => [],
  },
})
const inputHander = (e) => {
  const value = e.target.value
  emit('update:modelValue', value)
}
let select = ref(null)
let list = ref(null)
const selectClose = () => {
  const selects = document.querySelectorAll('.select')
  selects.forEach((select) => {
    select.removeAttribute('open')
  })
}
const clickHandler = (e) => {
  e.stopPropagation()
  if (e.target.nodeName !== 'LABEL') return
  selectClose()
}
onMounted(() => {
  list.value.addEventListener('click', clickHandler)
  select.value.addEventListener('click', selectClose)
})
onUnmounted(() => {
  if (list.value && select.value) {
    list.value.removeEventListener('click', clickHandler)
    select.value.removeEventListener('click', selectClose)
  }
})
</script>

<template>
  <details ref="select">
    <summary class="summary radios">
      <slot>default img</slot>
      <span>{{ props.modelValue }}</span>
      <input
        v-for="item in props.data"
        :key="item.value"
        type="radio"
        :id="item.value"
        :value="item.value"
        @input="inputHander"
      />
    </summary>
    <ul class="list no-scrollbar" ref="list">
      <li v-for="item in props.data" :key="item.value">
        <label :for="item.value">{{ item.value }}</label>
      </li>
    </ul>
  </details>
</template>

<style lang="scss" scoped>
.select {
  position: relative;
  width: 100%;
  min-width: 20rem;
  user-select: none;
  @media (min-width: 768px) {
    width: auto;
  }
  .summary {
    padding: 0.6rem 1.2rem;
    cursor: pointer;
    border-radius: 2rem;
    background-color: var(--blue-1200);
    list-style: none;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--white);
    padding: 1rem 1.6rem;
    z-index: 10;
    @media (min-width: 768px) {
      justify-content: flex-start;
    }
    // fake select
    &.radios {
      counter-reset: radios;
      &::before {
        content: var(--selection);
      }
    }
    &::-webkit-details-marker {
      display: none;
    }
    &:focus {
      outline: none;
    }
    &:after {
      content: '';
      display: inline-block;
      position: absolute;
      top: 50%;
      right: 1rem;
      width: 0.5rem;
      height: 0.5rem;
      border-bottom: 0.2rem solid currentColor;
      border-left: 0.2rem solid currentColor;
      border-bottom-left-radius: 0.2rem;
      transform: rotate(-45deg) translateY(-100%);
      transform-origin: center center;
      transition: transform ease-in-out 100ms;
      color: var(--white);
    }
    span {
      color: var(--white);
      font-size: 1.6rem;
    }
  }
  .list {
    width: 100%;
    max-height: 12rem;
    background-color: var(--primary);
    list-style: none;
    position: absolute;
    top: calc(100% - 3rem);
    left: 50%;
    transform: translateX(-50%);
    padding: 1.6rem;
    padding-top: 3.5rem;
    margin: 0;
    box-sizing: border-box;
    border-radius: 0.5rem;
    color: var(--white);
    overflow-y: scroll;
    z-index: 1;
    max-height: 15rem;
    border-radius: 2rem;
    counter-reset: labels;
  }
  li {
    margin: 0;
    position: relative;
    z-index: 30;
    &:first-child {
      padding-top: 0;
    }
    &:last-child {
      padding-bottom: 0;
      border-bottom: none;
    }
  }
  label {
    width: 100%;
    display: block;
    cursor: pointer;
    padding: 1rem 0;
    font-size: 1.6rem;
    text-align: center;
    @media (min-width: 768px) {
      padding-left: 2.8rem;
      text-align: left;
    }
    &:hover {
      background-color: var(--blue-1200);
    }
  }
}
input[type='radio'] {
  counter-increment: radios;
  appearance: none;
  display: none;
  &:checked {
    display: inline;
    --display: block;
  }
}
// open
.select[open] {
  .summary {
    z-index: 20;
    ::after {
      transform: rotate(133deg) translate(35%, 85%);
    }
  }
  .list {
    z-index: 11;
  }
}
</style>
