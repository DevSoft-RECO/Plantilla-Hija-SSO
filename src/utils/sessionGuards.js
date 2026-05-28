import Swal from 'sweetalert2';

export const startSessionGuards = () => {


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
