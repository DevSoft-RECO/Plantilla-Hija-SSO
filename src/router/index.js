import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Layouts
import AdminLayout from '@/layouts/AdminLayout.vue'

// Vistas
import CallbackView from '@/views/CallbackView.vue'
import DashboardView from '@/views/DashboardView.vue'
import UnauthorizedView from '@/views/UnauthorizedView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // 1. RUTAS PÚBLICAS
    {
      path: '/',
      redirect: '/admin/dashboard'
    },
    {
      path: '/callback',
      name: 'callback',
      component: CallbackView
    },
    {
      path: '/unauthorized',
      name: 'unauthorized',
      component: UnauthorizedView
    },

    // 2. RUTAS PROTEGIDAS
    {
      path: '/admin',
      component: AdminLayout,
      meta: { requiresAuth: true, permission: 'app_gestiones' },
      children: [
        {
          path: 'dashboard',
          name: 'dashboard',
          component: DashboardView,
          meta: { title: 'Gestiones' }
        },
        // Solicitudes
        {
          path: 'solicitudes/bandeja',
          name: 'bandeja-solicitudes',
          component: () => import('@/views/solicitudes/BandejaSolicitudes.vue'),
          meta: { title: 'Bandeja de Solicitudes (Tec)', role: 'Super Admin' }
        },
        {
          path: 'solicitudes/bandeja-admin',
          name: 'bandeja-solicitudes-admin',
          component: () => import('@/views/solicitudes/BandejaSolicitudesAdmin.vue'),
          meta: { title: 'Bandeja de Solicitudes (Admin)', role: 'Super Admin' }
        },
        {
          path: 'solicitudes/:id',
          name: 'detalle-solicitud',
          component: () => import('@/views/solicitudes/DetalleSolicitud.vue'),
          props: true,
          meta: { title: 'Detalle Solicitud' }
        },
        {
          path: 'solicitudes/config/categorias-generales',
          name: 'categorias-generales',
          component: () => import('@/views/solicitudes/config/CategoriasGeneralesView.vue'),
          meta: { title: 'Categorías Generales', role: 'Super Admin' }
        },
        {
          path: 'solicitudes/config/subcategorias',
          name: 'subcategorias',
          component: () => import('@/views/solicitudes/config/SubcategoriasView.vue'),
          meta: { title: 'Subcategorías', role: 'Super Admin' }
        },
        {
          path: 'solicitudes/mis-asignaciones',
          name: 'mis-asignaciones',
          component: () => import('@/views/solicitudes/MiBandeja.vue'),
          meta: { title: 'Mis Asignaciones (Tec)' }
        },
        {
          path: 'solicitudes/mis-asignaciones-admin',
          name: 'mis-asignaciones-admin',
          component: () => import('@/views/solicitudes/MiBandejaAdmin.vue'),
          meta: { title: 'Mis Asignaciones (Admin)' }
        },
        {
          path: 'solicitudes/mis-solicitudes-tec',
          name: 'mis-solicitudes-tec',
          component: () => import('@/views/solicitudes/MisSolicitudes.vue'),
          props: { categoriaGeneralId: 1 },
          meta: { title: 'Mis Solicitudes (Tec)', permission: 'crear_gestiones' }
        },
        {
          path: 'solicitudes/mis-solicitudes-admin',
          name: 'mis-solicitudes-admin',
          component: () => import('@/views/solicitudes/MisSolicitudes.vue'),
          props: { categoriaGeneralId: 2 },
          meta: { title: 'Mis Solicitudes (Admin)', permission: 'crear_gestiones' }
        },
        {
          path: 'solicitudes/trabajar/:id',
          name: 'trabajar-solicitud',
          component: () => import('@/views/solicitudes/TrabajarSolicitud.vue'),
          meta: { title: 'Trabajar Solicitud' }
        },
      ]
    },

    { path: '/:pathMatch(.*)*', redirect: '/' }
  ]
})

// --- GUARDIA DE NAVEGACIÓN ---
// --- GUARDIA DE NAVEGACIÓN ---
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // 0. Si vamos al Callback (Legacy) o Unauthorized, dejamos pasar SIEMPRE
  // Nota: Con la lógica anterior, el 'CallbackView' ya casi no se usará si entra por aquí,
  // pero lo dejamos por compatibilidad o fallback explícito.
  if (to.name === 'callback' || to.name === 'unauthorized') {
    return next()
  }

  const isAuthenticated = !!authStore.token

  // Caso 1: Ruta requiere Auth y no tenemos token
  if (to.matched.some(record => record.meta.requiresAuth) || to.path === '/') {
    if (!isAuthenticated) {
      console.log("🔒 Acceso Hija: Usuario sin sesión. Iniciando flujo SSO...");
      authStore.login();
      // login() redirige a ventana completa, así que paramos aquí (aunque en SPA 'return' es suficiente)
      return;
    }
  }

  // Caso 2: Estamos autenticados, verificar identidad y permisos
  if (isAuthenticated) {
    // Asegurar que el usuario esté cargado
    if (!authStore.isReady) {
      try {
        await authStore.fetchUser();
      } catch {
        // Si falla, el store ya maneja el logout, pero detenemos navegación
        return;
      }
    }



    // Verificar Permiso
    if (to.meta.permission && !authStore.hasPermission(to.meta.permission)) {
      const motherAppUrl = import.meta.env.VITE_MOTHER_APP_URL || 'http://localhost:5173';
      console.warn(`⛔ Acceso denegado: Usuario no tiene el permiso '${to.meta.permission}'. Redirigiendo a App Madre...`);
      window.location.href = `${motherAppUrl}/apps`;
      return;
    }

    // Verificar Rol
    if (to.meta.role && !authStore.hasRole(to.meta.role)) {
      // Usuario logueado pero SIN ROL -> Redirigir a App Madre
      const motherAppUrl = import.meta.env.VITE_MOTHER_APP_URL || 'http://localhost:5173';

      console.warn(`⛔ Acceso denegado: Usuario no tiene el rol '${to.meta.role}'. Redirigiendo a App Madre...`);
      window.location.href = `${motherAppUrl}/apps`;
      return;
    }
  }

  next()
})

export default router
