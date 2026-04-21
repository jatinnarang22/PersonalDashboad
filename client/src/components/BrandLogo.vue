<script setup>
defineProps({
  variant: {
    type: String,
    default: 'nav',
    validator: (v) => ['nav', 'hero', 'auth'].includes(v),
  },
});
</script>

<template>
  <div
    class="inline-flex items-center"
    :class="{
      'gap-2.5': variant === 'nav',
      'gap-3.5': variant === 'hero',
      'mx-auto gap-3.5': variant === 'auth',
    }"
  >
    <div
      class="brand-logo-mark relative grid place-items-center overflow-hidden rounded-xl border border-white/15 shadow-lg shadow-black/30"
      :class="{
        'h-8 w-8': variant === 'nav',
        'h-12 w-12': variant === 'hero',
        'h-14 w-14': variant === 'auth',
      }"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 56 56"
        class="h-[72%] w-[72%]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M14 14V42H20V20H40V14H14Z"
          class="brand-logo-path-a"
        />
        <path
          d="M42 42V36H24V28H36V22H18V42H42Z"
          class="brand-logo-path-b"
        />
      </svg>
      <span class="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-brand-gold/35"></span>
    </div>
    <div>
      <p
        class="font-display font-semibold tracking-tight text-slate-100"
        :class="{
          'text-sm': variant === 'nav',
          'text-xl': variant === 'hero',
          'text-2xl': variant === 'auth',
        }"
      >
        LiveContext OS
      </p>
      <p
        class="uppercase tracking-[0.22em] text-slate-500"
        :class="{
          'text-[8px]': variant === 'nav',
          'text-[10px]': variant === 'hero',
          'text-[11px]': variant === 'auth',
        }"
      >
        Digital Command Center
      </p>
    </div>
  </div>
</template>
