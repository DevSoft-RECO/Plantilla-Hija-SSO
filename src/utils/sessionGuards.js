import api from '../api/axios';
import Swal from 'sweetalert2';

export const startSessionGuards = () => {
  // ----------------------------------------------------
  // REGLA A: EL "HEARTBEAT" CADA 5 MINUTOS (Vigilante)
  // ----------------------------------------------------
  setInterval(() => {
    const token = sessionStorage.getItem('access_token');
    if (token) {
      // Un sub-proceso silencioso a la Madre.
      const motherApi = import.meta.env.VITE_MOTHER_API_URL || 'http://localhost:8000';
      api.get(motherApi + '/api/me')
        .catch(() => console.log('El heartbeat detectó sesión caída.'));
    }
  }, 5 * 60 * 1000);

  // ----------------------------------------------------
  // REGLA B: AVISO CORTÉS DE CIERRE DE JORNADA (17:50 hrs)
  // ----------------------------------------------------
  const now = new Date();
  const alertTime = new Date();
  alertTime.setHours(17, 50, 0, 0); // 5:50:00 PM (Hora de Cierre)
  let msUntilAlert = alertTime.getTime() - now.getTime();

  // Si aún no son las 5:50 PM, programamos la alarma visual.
  if (msUntilAlert > 0) {
    setTimeout(() => {
      const token = sessionStorage.getItem('access_token');
      if (token) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'warning',
          title: 'Jornada por finalizar',
          text: 'Tu sesión se cerrará irremediablemente a las 6:00 PM por cierre de servidores.',
          showConfirmButton: true,
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#f59e0b',
          timer: 60000 // Oculta automáticamente al 1 minuto
        });
      }
    }, msUntilAlert);
  }
};
