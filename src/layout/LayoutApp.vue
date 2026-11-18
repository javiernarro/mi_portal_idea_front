<script setup lang="ts">
import useAuth from '@/components/auth/composables/useAuth'
import { computed, ref, watch } from 'vue'
import { getMiHospedaje } from '@/components/alimentosHospedaje/services/alimentosHospedaje'
import BotonModoOscuro from './BotonModoOscuro.vue'
import PiePortal from './PiePortal.vue'
import useModoOscuro from '@/composables/useModoOscuro'
import {
  verificarPermiso,
  verificarSiMostrarCapacitacion,
  verificarSiMostrarGestion,
} from '@/guards/verificarPermiso'

const { autenticado, logout } = useAuth()
// En el teléfono (p. ej. al escanear el QR de Caseta) el menú inicia cerrado para no tapar la pantalla
const collapsed = ref<boolean>(window.innerWidth < 768)
const { oscuro } = useModoOscuro()

// "Mi hospedaje" solo aparece a quien tiene hospedaje vigente o próximo
const tieneHospedaje = ref(false)
watch(
  autenticado,
  async (v) => {
    tieneHospedaje.value = v ? !!(await getMiHospedaje().catch(() => []))?.length : false
  },
  { immediate: true },
)

const menu = computed(() => {
  return [
    {
      title: 'Inicio',
      icon: 'pi pi-home',
      href: '/home',
    },
    {
      title: 'Mis cursos',
      icon: 'pi pi-graduation-cap',
      href: '/mis-cursos',
    },
    {
      title: 'Mi cuenta',
      icon: 'pi pi-user',
      child: [
        {
          href: '/cambiar-password',
          title: 'Cambiar contraseña',
          icon: 'pi pi-lock',
        },
      ],
    },
    {
      title: 'Gestion',
      icon: 'pi pi-cog',
      hidden: !verificarSiMostrarGestion(),
      child: [
        {
          href: '/empleados',
          title: 'Empleados',
          icon: 'pi pi-users',
          hidden: !verificarPermiso('Empleados.Ver'),
        },
        {
          href: '/perfiles',
          title: 'Perfiles',
          icon: 'pi pi-address-book',
          hidden: !verificarPermiso('Perfiles.Ver'),
        },
        {
          href: '/ubicaciones',
          title: 'Ubicaciones',
          icon: 'pi pi-map-marker',
          hidden: !verificarPermiso('Ubicaciones.Ver'),
        },
        {
          href: '/departamentos',
          title: 'Departamentos',
          icon: 'pi pi-building-columns',
          hidden: !verificarPermiso('Departamentos.Ver'),
        },
        {
          href: '/empresas',
          title: 'Empresas',
          icon: 'pi pi-building',
          hidden: !verificarPermiso('Empresas.Ver'),
        },
        {
          href: '/sucursales',
          title: 'Sucursales',
          icon: 'pi pi-warehouse',
          hidden: !verificarPermiso('Sucursales.Ver'),
        },
        {
          href: '/cargos',
          title: 'Cargos',
          icon: 'pi pi-flag',
          hidden: !verificarPermiso('Cargos.Ver'),
        },
        {
          href: '/puestos',
          title: 'Puestos',
          icon: 'pi pi-hammer',
          hidden: !verificarPermiso('Puestos.Ver'),
        },
        {
          href: '/centros-costos',
          title: 'Centros de costos',
          icon: 'pi pi-dollar',
          hidden: !verificarPermiso('CentrosCostos.Ver'),
        },
        {
          href: '/ocupaciones',
          title: 'Ocupaciones especificas',
          icon: 'pi pi-briefcase',
          hidden: !verificarPermiso('Ocupaciones.Ver'),
        },
        {
          href: '/areas-tematicas',
          title: 'Areas tematicas',
          icon: 'pi pi-id-card',
          hidden: !verificarPermiso('AreasTematicas.Ver'),
        },
        {
          href: '/modelos',
          title: 'Modelos',
          icon: 'pi pi-desktop',
          hidden: !verificarPermiso('Modelos.Ver'),
        },
        {
          href: '/ordenes',
          title: 'Ordenes de trabajo',
          icon: 'pi pi-wallet',
          hidden: !verificarPermiso('Ordenes.Ver'),
        },
      ],
    },
    {
      title: 'Capacitacion',
      icon: 'pi pi-bookmark',
      hidden: !verificarSiMostrarCapacitacion(),
      child: [
        {
          href: '/cursos',
          title: 'Cursos',
          icon: 'pi pi-file-check',
          hidden: !verificarPermiso('Cursos.Ver'),
        },
        {
          href: '/clases',
          title: 'Capacitaciones',
          icon: 'pi pi-star',
          hidden: !verificarPermiso('Clases.Ver'),
        },
        {
          href: '/requerimientos',
          title: 'Requerimientos',
          icon: 'pi pi-briefcase',
          hidden: !verificarPermiso('Requerimientos.Ver'),
        },
        {
          href: '/consulta-recat',
          title: 'Consulta Re-Cat',
          icon: 'pi pi-search',
          hidden: !verificarPermiso('ConsultaReCat.Ver'),
        },
      ],
    },
    {
      title: 'Mi hospedaje',
      icon: 'pi pi-key',
      href: '/mi-hospedaje',
      hidden: !tieneHospedaje.value,
    },
    {
      title: 'Alimentos y Hospedaje',
      icon: 'pi pi-building',
      href: '/alimentos-hospedaje',
      hidden: !verificarPermiso('AlimentosHospedaje.Ver'),
    },
  ]
})

const onToggleCollapse = () => {
  collapsed.value = !collapsed.value
}
</script>

<template>
  <sidebar-menu
    :menu="menu"
    :theme="oscuro ? '' : 'white-theme'"
    :hideToggle="false"
    :collapsed="collapsed"
    v-if="autenticado"
    @update:collapsed="onToggleCollapse"
  >
    <!-- <sidebar-menu :menu="menu" :hideToggle="true" v-if="autenticado"> -->
    <template v-slot:header>
      <div class="flex justify-center">
        <img src="/logo.webp" alt="logotipo" class="logo-portal w-[150px]!" />
      </div>
    </template>
    <template v-slot:footer>
      <!-- El cambio de modo claro/oscuro siempre está visible, también con el menú cerrado -->
      <div class="px-2 pt-2 flex justify-center items-center">
        <BotonModoOscuro />
      </div>
      <div class="p-2 flex! justify-center items-center">
        <v-button
          :label="collapsed ? '' : 'Salir'"
          severity="danger"
          icon="pi pi-power-off"
          class="w-full"
          @click="logout"
        />
      </div>
    </template>
    <template v-slot:toggle-icon>
      <img
        src="/tractor-tire.png"
        alt="close-and-open"
        class="w-10! tire"
        :class="{
          animate__animated: true,
          'rotate-left': collapsed,
          'rotate-right': !collapsed,
        }"
      />
    </template>
  </sidebar-menu>

  <div class="">
    <!-- Botón de salir -->
    <div
      :class="{
        'body-full': autenticado && !collapsed,
        'body-collapsed': collapsed,
        'pt-2': true,
      }"
    >
      <div class="mt-2" :class="{ 'min-h-[calc(100vh-5rem)]': autenticado }">
        <RouterView />
      </div>
      <PiePortal :fijo="!autenticado" />
    </div>
  </div>

  <v-toast position="bottom-right" group="br" />
</template>

<style scoped>
.tire {
  transition: transform 0.6s ease-in-out;
}

.rotate-left {
  transform: rotate(-360deg);
}

.rotate-right {
  transform: rotate(360deg);
}
</style>
