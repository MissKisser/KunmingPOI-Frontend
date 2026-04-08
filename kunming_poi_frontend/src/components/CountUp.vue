<template>
	<span :class="textClass" ref="domRef"></span>
</template>

<script setup lang="ts">
import { ref, shallowRef, watch, onMounted } from 'vue'
import { CountUp } from 'countup.js'
import { isUndefined } from 'lodash-es'

const domRef = shallowRef<any>(null)
interface CountUpProps {
	value?: number | string
	decimalPlaces?: number | string
	textClass?: string
	useGrouping?: boolean
}
const props = withDefaults(defineProps<CountUpProps>(), {
	value: 0,
	decimalPlaces: 0,
	textClass: '',
	useGrouping: false
})
watch(
	() => props.value,
	(ov: number | string, nv: number | string) => {
		if (ov !== nv) {
			if (isUndefined(countUp.value)) {
				countUp.value = new CountUp(domRef.value, Number(props.value), {
					startVal: 0,
					useGrouping: props.useGrouping,
					decimalPlaces: props.decimalPlaces as number
				})
			} else {
				countUp.value.update(Number(props.value))
			}
		}
	}
)
const countUp = ref<any>(null)
onMounted(() => {
	if (!domRef.value) return
	countUp.value = new CountUp(domRef.value, Number(props.value), {
		startVal: 0,
		useGrouping: props.useGrouping,
		decimalPlaces: props.decimalPlaces as number
	})
	countUp.value.start()
})
</script>