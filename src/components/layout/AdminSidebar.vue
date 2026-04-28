<template>
  <Transition
    enter-active-class="transition-opacity duration-300"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity duration-300"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="layoutStore.isSidebarOpen"
      class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 md:hidden"
      @click="layoutStore.closeSidebar"
    ></div>
  </Transition>

  <aside
    class="fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-300 shadow-2xl
           bg-azul-cope dark:bg-gray-900
           border-r border-transparent dark:border-gray-800"
    :class="[
      layoutStore.isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
      layoutStore.isCollapsed ? 'w-20' : 'w-64'
    ]"
  >
    <div class="h-16 flex items-center justify-between px-6 shrink-0 bg-black/10 dark:bg-black/20 border-b border-white/5 dark:border-gray-800">

      <div v-if="!layoutStore.isCollapsed" class="flex items-center justify-center w-full fade-in">
        <img src="@/assets/logoyk1.svg" alt="YK" class="h-14 w-auto object-contain transition-all" />
      </div>

      <div v-else class="w-full flex justify-center fade-in">
        <img src="@/assets/yk.png" alt="YK" class="h-8 w-8 object-contain" />
      </div>

    </div>

    <nav
      class="flex-1 py-6 px-3 space-y-2 custom-scrollbar"
      :class="layoutStore.isCollapsed ? 'overflow-visible' : 'overflow-y-auto'"
    >
      <template v-for="item in menuItems" :key="item.id">

        <div v-if="!item.children" class="relative group">
            <RouterLink
            :to="item.route"
            @click="handleItemClick"
            class="flex items-center px-3 py-3 rounded-lg transition-all duration-200 group border-l-4"
            :class="[
                isActive(item.route)
                ? 'bg-white/10 dark:bg-gray-800 border-verde-cope text-white dark:text-verde-cope shadow-lg'
                : 'border-transparent text-gray-300 dark:text-gray-400 hover:bg-white/5 dark:hover:bg-gray-800 hover:text-white dark:hover:text-gray-100',
                layoutStore.isCollapsed ? 'justify-center pl-0 border-l-0' : ''
            ]"
            >
                <span class="shrink-0 transition-colors duration-200"
                      :class="isActive(item.route) ? 'text-verde-cope' : item.iconColor || 'group-hover:text-verde-cope'">
                    <svg v-html="item.iconSvg" class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"></svg>
                </span>

                <span v-if="!layoutStore.isCollapsed" class="ml-3 font-medium text-sm truncate">
                    {{ item.label }}
                </span>
            </RouterLink>

            <div
                v-if="layoutStore.isCollapsed"
                class="absolute left-full top-0 ml-2 px-3 py-2 bg-verde-cope text-white text-sm font-bold rounded-md shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 whitespace-nowrap pointer-events-none"
                style="width: max-content;"
            >
                {{ item.label }}
                <div class="absolute top-3 -left-1 w-2 h-2 bg-verde-cope transform rotate-45"></div>
            </div>
        </div>

        <div v-else class="relative group">
            <button
                @click="handleGroupClick(item.id)"
                class="w-full flex items-center px-3 py-3 rounded-lg transition-all duration-200 group border-l-4 border-transparent"
                :class="[
                    openGroups.includes(item.id) && !layoutStore.isCollapsed
                    ? 'bg-black/20 dark:bg-black/40 text-white dark:text-gray-100'
                    : 'text-gray-300 dark:text-gray-400 hover:bg-white/5 dark:hover:bg-gray-800 hover:text-white',
                    layoutStore.isCollapsed ? 'justify-center pl-0' : 'justify-between'
                ]"
            >
                <div class="flex items-center">
                    <span class="shrink-0 transition-colors" :class="[openGroups.includes(item.id) ? 'text-verde-cope' : item.iconColor || 'group-hover:text-verde-cope']">
                        <svg v-html="item.iconSvg" class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"></svg>
                    </span>
                    <span v-if="!layoutStore.isCollapsed" class="ml-3 font-medium text-sm truncate">{{ item.label }}</span>
                </div>

                <svg
                    v-if="!layoutStore.isCollapsed"
                    class="w-4 h-4 transition-transform duration-300"
                    :class="openGroups.includes(item.id) ? 'text-verde-cope rotate-180' : 'text-gray-400'"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            <!-- POP-OVER FLOTANTE (SOLO CUANDO COLAPSADO) -->
            <div
                v-if="layoutStore.isCollapsed"
                class="absolute left-full top-0 ml-4 w-64
                       bg-azul-cope dark:bg-gray-800
                       border-l-4 border-verde-cope
                       rounded-xl shadow-2xl
                       opacity-0 invisible
                       group-hover:opacity-100 group-hover:visible
                       transition-all duration-300 ease-out
                       origin-top-left
                       group-hover:scale-100 scale-95
                       group-hover:translate-x-1
                       z-50"
            >
                 <div class="px-3 py-2 text-xs font-semibold text-verde-cope uppercase tracking-wider border-b border-white/10 dark:border-gray-700 mb-1">
                    {{ item.label }}
                 </div>

                 <RouterLink
                  v-for="child in item.children"
                  :key="child.route"
                  :to="child.route"
                  @click="handleItemClick"
                  class="block px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
                  :class="isActive(child.route)
                    ? 'bg-white/10 text-white font-medium shadow-sm'
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="isActive(child.route) ? 'bg-verde-cope' : 'bg-gray-400'"></span>
                  {{ child.label }}
                </RouterLink>

                 <!-- Colita / Flecha apuntando al botón padre (Verde para efecto 'llave' { ) -->
                 <div
                   class="absolute left-0 top-5 -translate-x-1/2
                          w-3 h-3 bg-verde-cope
                          border-l border-b border-white/10
                          rotate-45"
                 ></div>
            </div>

            <!-- ACORDEÓN EXPANDIDO (SOLO CUANDO ESTÁ ABIERTO) -->
            <transition
                enter-active-class="transition-all duration-300 ease-out"
                enter-from-class="opacity-0 -translate-y-2"
                enter-to-class="opacity-100 translate-y-0"
                leave-active-class="transition-all duration-200 ease-in"
                leave-from-class="opacity-100 translate-y-0"
                leave-to-class="opacity-0 -translate-y-2"
            >
                <div
                    v-if="openGroups.includes(item.id) && !layoutStore.isCollapsed"
                    class="mt-2 ml-3 space-y-1 relative"
                >


                    <RouterLink
                        v-for="child in item.children"
                        :key="child.route"
                        :to="child.route"
                        @click="handleItemClick"
                        class="relative group/child flex items-center gap-3 px-3 py-2 rounded-r-lg rounded-bl-lg ml-2 text-sm transition-all duration-200"
                        :class="isActive(child.route)
                            ? 'bg-verde-cope/10 text-verde-cope font-bold translate-x-1'
                            : 'text-gray-400 hover:text-white hover:bg-white/5 hover:translate-x-1'"
                    >
                         <!-- Indicador circular animado -->
                         <span
                            class="w-1.5 h-1.5 rounded-full transition-all duration-300 ring-2"
                            :class="isActive(child.route)
                                ? 'bg-verde-cope ring-verde-cope/30 scale-110'
                                : 'bg-gray-600 ring-transparent group-hover/child:bg-gray-300'"
                         ></span>

                         {{ child.label }}
                    </RouterLink>
                </div>
            </transition>
        </div>
      </template>
    </nav>

    <div class="p-4 mt-auto border-t border-white/10 dark:border-gray-800 shrink-0">
        <div v-if="!layoutStore.isCollapsed" class="fade-in text-center">
            <p class="text-xs font-medium text-gray-400 dark:text-gray-500 mb-1">Desarrollado por</p>
            <p class="text-xs font-bold text-white dark:text-gray-300 tracking-wide">
                Área de Informática <span class="text-verde-cope">2025</span>
            </p>
        </div>
        <div v-else class="flex justify-center fade-in">
            <svg class="w-5 h-5 text-gray-400 dark:text-gray-600 hover:text-verde-cope cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
        </div>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useLayoutStore } from '@/stores/layout'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const layoutStore = useLayoutStore()
const authStore = useAuthStore()
const openGroups = ref([])

// --- NUEVA FUNCIÓN PARA CERRAR EN MÓVIL ---
const handleItemClick = () => {
  if (window.innerWidth < 768) {
      layoutStore.closeSidebar()
  }
}



// Helper para verificar roles administrativos

const menuItems = computed(() => {
    // 1. Definir Hijos y permisos individuales
    const solTecChildren = [
        ...(authStore.hasRole('Super Admin') ? [{ label: 'Bandeja Principal', route: '/admin/solicitudes/bandeja' }] : []),
        ...(authStore.hasPermission('solicitudes-tecnologicas-externas') || authStore.hasRole('Super Admin') ? [{ label: 'Mis Asignaciones', route: '/admin/solicitudes/mis-asignaciones' }] : [])
    ];

    const solAdminChildren = [
        ...(authStore.hasPermission('asignar_solicitudes-administrativas') || authStore.hasRole('Super Admin') ? [{ label: 'Bandeja Principal', route: '/admin/solicitudes/bandeja-admin' }] : []),
        ...(authStore.hasPermission('seguimiento_solicitudes-administrativas') || authStore.hasRole('Super Admin') ? [{ label: 'Mis Asignaciones', route: '/admin/solicitudes/mis-asignaciones-admin' }] : [])
    ];

    const misSolicitudesChildren = [
        ...(authStore.hasPermission('crear-solicitudes-tech') || authStore.hasRole('Super Admin') ? [{ label: 'Tecnología', route: '/admin/solicitudes/mis-solicitudes-tec' }] : []),
        ...(authStore.hasPermission('crear-solicitudes-admin') || authStore.hasRole('Super Admin') ? [{ label: 'Administrativas', route: '/admin/solicitudes/mis-solicitudes-admin' }] : [])
    ];

    const configSolicitudesChildren = [
        { label: 'Categorías Generales', route: '/admin/solicitudes/config/categorias-generales' },
        { label: 'Subcategorías', route: '/admin/solicitudes/config/subcategorias' }
    ];
    // Para grupos de solo Super Admin, validamos todo el grupo o children igual?
    // Si configSolicitudesChildren no tiene logica de permisos interna (son fijas), la validacion recae en el padre.
    // Pero si queremos consistencia:
    const showConfigSolicitudes = authStore.hasRole('Super Admin');

    const configGeneralChildren = [
        { label: 'Sincronización', route: '/admin/config/sincronizacion' }
    ];
    const showConfigGeneral = authStore.hasRole('Super Admin');

    const items = [
        {
            id: 'home',
            label: 'Dashboard',
            route: '/admin/dashboard',
            iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2 7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2v10a1 1 0 01-1 1h-3m-4 0h4" />',
            iconColor: 'text-blue-400',
            show: authStore.hasRole('Super Admin') || authStore.hasPermission('ver-dashboard-general') || authStore.hasPermission('ver-dashboard-agencia') || authStore.hasPermission('dashboard-solo-lectura')
        },
        // Auditoría
        {
            id: 'auditoria',
            label: 'Auditoría',
            route: '/admin/audit-dashboard',
            iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />',
            iconColor: 'text-purple-400',
            show: authStore.hasRole('Super Admin') || authStore.hasPermission('auditoria')
        },
        // Solicitudes Tecnologicas
        {
            id: 'solicitudes',
            label: 'Solicitudes Tecnologicas',
            iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />',
            iconColor: 'text-cyan-400',
            show: solTecChildren.length > 0,
            children: solTecChildren
        },
        // Solicitudes Administracion
        {
            id: 'solicitudes-admin',
            label: 'Solicitudes Administración',
            iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />',
            iconColor: 'text-orange-400',
            show: solAdminChildren.length > 0,
            children: solAdminChildren
        },
        // Mis Solicitudes (Creadas por mi)
        {
            id: 'mis-solicitudes-grupo',
            label: 'Mis Solicitudes',
            iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" d="M21.75 9v.906a2.25 2.25 0 01-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 001.183 1.981l6.478 3.488m8.839 2.51l-4.66-2.510m0 0l-1.023-.55a2.25 2.25 0 00-2.134 0l-1.022.55m0 0l-4.661 2.51m16.5 1.615a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V8.844a2.25 2.25 0 011.183-1.981l7.5-4.039a2.25 2.25 0 012.134 0l7.5 4.039a2.25 2.25 0 011.183 1.98V14.74z" />',
            iconColor: 'text-yellow-400',
            show: misSolicitudesChildren.length > 0,
            children: misSolicitudesChildren
        },
        // Config. Solicitudes
        {
            id: 'config_solicitudes',
            label: 'Config. Solicitudes',
            iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" d="M6 13.5V3.75m0 9.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 3.75V16.5m12-3V3.75m0 9.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 3.75V16.5m-6-9V3.75m0 3.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 9.75V10.5" />',
            iconColor: 'text-teal-400',
            show: showConfigSolicitudes,
            children: configSolicitudesChildren
        },
        // Configuraciones Generales
        {
            id: 'configuraciones',
            label: 'Configuraciones',
            iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m16.5 0H21m-1.5 0H12m-8.457 3.077l1.41-.513m14.095-5.13l1.41-.513M5.106 17.785l1.15-.964m11.49-9.642l1.149-.964M7.501 19.795l.75-1.3m7.5-12.99l.75-1.3m-6.063 16.658l.26-1.477m2.905-16.474l.26-1.478m-1.39 17.17l-.26-1.477M12.132 4.11l-.26-1.478m5.277 14.857l-1.15-.964M7.992 7.48l-1.15-.964m10.902 12.793l-1.41-.513M6.516 5.195l-1.41-.513M14.25 19.795l-.75-1.3m-4.5-12.99l-.75-1.3" />',
            iconColor: 'text-pink-400',
            show: showConfigGeneral,
            children: configGeneralChildren
        },
    ]

    return items.filter(item => item.show)
})

const isActive = (path) => route.path === path

const handleGroupClick = (id) => {
    if (layoutStore.isCollapsed) return
    if (openGroups.value.includes(id)) {
        openGroups.value = []
    } else {
        openGroups.value = [id]
    }
}
</script>

<style scoped>
.fade-in { animation: fadeIn 0.4s ease-in-out; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(255,255,255,0.2); border-radius: 20px; }
</style>
