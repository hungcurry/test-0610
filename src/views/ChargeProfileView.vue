<script setup>

let ChargingSchedulePeriod = {
  startPeriod: undefined,
  limit: undefined,
  numberPhases: undefined,
}

let ChargingSchedule = {
  duration:undefined,
  startSchedule:undefined,
  chargingRateUnit: undefined,
  chargingSchedulePeriod: ChargingSchedulePeriod,
  minChargingRate: undefined,
}

let ChargingProfile = {
  chargingProfileId : undefined,
  transactionId: undefined,
  stackLevel: undefined,
  chargingProfilePurpose: undefined,
  chargingProfileKind: undefined,
  recurrencyKind: undefined,
  validFrom: undefined,
  validTo: undefined,
  chargingSchedule: ChargingSchedule,
}



</script>

<template>
  <div></div>
</template>

<style>
</style>