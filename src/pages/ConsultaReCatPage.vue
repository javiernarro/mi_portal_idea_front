<script setup lang="ts">
import NavBar from '@/layout/NavBar.vue'
import TablaReCat from '@/components/recat/components/TablaReCat.vue'
</script>

<template>
  <NavBar titulo="Consulta Re Categorización" />

  <v-card>
    <template #content>
      <TablaReCat />
    </template>
  </v-card>
</template>

<style scoped></style>
