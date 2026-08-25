<template>
  <div
    v-if="muiTesterOnly"
    class="relative inline-flex flex-col items-center gap-2 z-[1000] text-center"
  >
    <button
      id="pinnedFirmwareButton"
      class="btn-primary disabled:bg-zinc-600 max-w-64"
      type="button"
      :disabled="!canSelectFirmware"
      :title="canSelectFirmware ? $t('firmware.mui_locked') : $t('flash.disabled_until_device')"
    >
      <span class="block truncate">
        {{ selectedVersion.replace('Meshtastic Firmware ', '').replace('Technical ', '') }}
      </span>
    </button>
    <p class="max-w-xs text-xs leading-snug text-theme-muted">
      {{ $t('firmware.mui_locked') }}
    </p>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { useDeviceStore } from '../stores/deviceStore'
import { useFirmwareStore } from '../stores/firmwareStore'
import { muiTesterOnly } from '~/utils/muiTester'

const { t } = useI18n()

const store = useFirmwareStore()
const deviceStore = useDeviceStore()
store.fetchList()

const selectedVersion = computed(() => {
  if (store.$state.selectedFirmware?.id) {
    return store.$state.selectedFirmware.title
  }
  return t('firmware.mui_candidate')
})

const canSelectFirmware = computed(() => {
  return (deviceStore.selectedTarget?.hwModel ?? 0) > 0
})
</script>
