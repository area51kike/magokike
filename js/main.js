// ============================================================
// MAGO KIKE — main.js
// ============================================================

// --- Navbar: sombra al hacer scroll ---
window.addEventListener('scroll', () => {
  const navbar = document.querySelector('.mk-navbar');
  if (window.scrollY > 40) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// --- Animación fade-in-up al hacer scroll ---
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll(
  '.mk-service-card, .mk-testimonial-card, .mk-stat-card, .mk-timeline-item'
).forEach(el => {
  el.classList.add('fade-in-up');
  observer.observe(el);
});

// --- Preseleccionar show desde botones de servicios ---
function preseleccionarShow(tipo) {
  setTimeout(() => {
    const tipoSelect = document.getElementById('tipoShow');
    if (tipoSelect) {
      tipoSelect.value = tipo;
      tipoSelect.dispatchEvent(new Event('change'));
    }
  }, 600);
}

/* ============================================================
   CALENDARIO DE RESERVA
   ============================================================ */
(function () {

  const OCUPADOS = [];
  const HORAS_OCUPADAS = {};

  const PRECIOS = {
    cerca:    { 30: 40, 45: 60, 60: 80, 90: 130 },
    escenico: { 30: 50, 45: 70, 60: 90, 90: 130 },
  };

  const HORAS = [
    '8:00 AM','9:00 AM','10:00 AM','11:00 AM','12:00 PM',
    '1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM','6:00 PM'
  ];

  const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                 'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  let viewYear, viewMonth;
  let selectedDate = null, selectedHora = null;

  const today = new Date();
  today.setHours(0,0,0,0);
  const minDate = new Date(today);
  minDate.setDate(today.getDate() + 2);

  viewYear  = today.getFullYear();
  viewMonth = today.getMonth();

  function horaAMinutos(h) {
    const [time, period] = h.split(' ');
    let [hh, mm] = time.split(':').map(Number);
    if (period === 'PM' && hh !== 12) hh += 12;
    if (period === 'AM' && hh === 12) hh = 0;
    return hh * 60 + mm;
  }

  async function cargarFechasOcupadas() {
    const SUPABASE_URL = 'https://lopzmdwdkpebaxvwciwc.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_T1ebtti-F2piq1_5BFs-fg_8xgqvUyL';
    try {
      const res = await fetch(
        SUPABASE_URL + '/rest/v1/reservas?or=(estado.eq.confirmado,estado.eq.confirmado_mago)&select=fecha,hora_inicio,duracion',
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': 'Bearer ' + SUPABASE_KEY
          }
        }
      );
      const data = await res.json();

      data.forEach(r => {
        const inicioMin      = horaAMinutos(r.hora_inicio);
        const finMin         = inicioMin + parseInt(r.duracion);
        const bloqueadoDesde = inicioMin - 120;
        const bloqueadoHasta = finMin + 120;

        if (!HORAS_OCUPADAS[r.fecha]) HORAS_OCUPADAS[r.fecha] = [];

        HORAS.forEach(h => {
          const hMin = horaAMinutos(h);
          if (hMin >= bloqueadoDesde && hMin < bloqueadoHasta) {
            if (!HORAS_OCUPADAS[r.fecha].includes(h)) {
              HORAS_OCUPADAS[r.fecha].push(h);
            }
          }
        });

        // Bloquear fecha completa solo si todas las horas están ocupadas
        if (HORAS_OCUPADAS[r.fecha].length >= HORAS.length) {
          if (!OCUPADOS.includes(r.fecha)) OCUPADOS.push(r.fecha);
        }
      });

      renderCal();
    } catch (err) {
      console.error('Error cargando fechas ocupadas:', err);
    }
  }

  function renderCal() {
    document.getElementById('calMes').textContent = MESES[viewMonth] + ' ' + viewYear;
    const grid = document.getElementById('calGrid');
    grid.innerHTML = '';
    const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) grid.appendChild(document.createElement('div'));

    for (let d = 1; d <= daysInMonth; d++) {
      const btn = document.createElement('button');
      btn.className = 'mk-cal-dia';
      btn.textContent = d;
      const thisDate = new Date(viewYear, viewMonth, d);
      const dateStr  = thisDate.toISOString().split('T')[0];

      if (thisDate < minDate) {
        btn.classList.add('disabled');
      } else if (OCUPADOS.includes(dateStr)) {
        btn.classList.add('ocupado');
        btn.title = 'Fecha no disponible';
      } else {
        if (thisDate.getTime() === today.getTime()) btn.classList.add('hoy');
        if (selectedDate === dateStr) btn.classList.add('selected');
        btn.addEventListener('click', () => selectDate(dateStr, btn));
      }
      grid.appendChild(btn);
    }
  }

  function selectDate(dateStr, btn) {
    document.querySelectorAll('.mk-cal-dia.selected').forEach(el => el.classList.remove('selected'));
    btn.classList.add('selected');
    selectedDate = dateStr;
    setTimeout(() => {
      document.getElementById('paso2').classList.remove('d-none');
      document.getElementById('paso2').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      setDot(2);
    }, 200);
  }


  document.getElementById('btnPaso3').addEventListener('click', () => {
    const paso3 = document.getElementById('paso3');
    paso3.classList.remove('d-none');
    paso3.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    setDot(3);
    renderHoras();
  });

  function renderHoras() {
    const grid = document.getElementById('horasGrid');
    grid.innerHTML = '';
    const horasBloqueadas = HORAS_OCUPADAS[selectedDate] || [];
    HORAS.forEach(h => {
      const btn = document.createElement('button');
      btn.className = 'mk-hora-btn';
      btn.textContent = h;
      if (horasBloqueadas.includes(h)) {
        btn.disabled = true;
        btn.style.opacity = '0.35';
        btn.style.cursor = 'not-allowed';
        btn.title = 'Hora no disponible';
      } else {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.mk-hora-btn.selected').forEach(el => el.classList.remove('selected'));
          btn.classList.add('selected');
          selectedHora = h;
          renderResumen();
        });
      }
      grid.appendChild(btn);
    });
  }

  function renderResumen() {
    const tipoEl = document.getElementById('tipoShow');
    const durEl  = document.getElementById('duracion');
    const tipo   = tipoEl.options[tipoEl.selectedIndex].text;
    const dur    = durEl.options[durEl.selectedIndex].text;
    const precio = document.getElementById('precioVal').textContent;
    const [y,m,d] = selectedDate.split('-');
    const fechaFmt = d + ' de ' + MESES[parseInt(m)-1] + ' de ' + y;
    document.getElementById('resumen').innerHTML =
      `<strong>Fecha:</strong> ${fechaFmt}<br>
       <strong>Show:</strong> ${tipo}<br>
       <strong>Duración:</strong> ${dur}<br>
       <strong>Hora de inicio:</strong> ${selectedHora}<br>
    document.getElementById('formularioReserva').style.display = 'block';
  }

  document.getElementById('btnEnviarReserva').addEventListener('click', async () => {
    const nombre   = document.getElementById('rNombre').value.trim();
    const email    = document.getElementById('rEmail').value.trim();
    const telefono = '+503' + document.getElementById('rTelefono').value.replace(/\D/g, '').slice(0, 8);

    if (!nombre || !email || !telefono) {
      alert('Por favor completa tu nombre, correo y teléfono.');
      return;
    }
    if (!selectedDate || !selectedHora) {
      alert('Por favor selecciona una fecha y hora.');
      return;
    }

    const tipoEl    = document.getElementById('tipoShow');
    const durEl     = document.getElementById('duracion');
    const tipo      = tipoEl.value;
    const duracion  = parseInt(durEl.value);

    const SUPABASE_URL = 'https://lopzmdwdkpebaxvwciwc.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_T1ebtti-F2piq1_5BFs-fg_8xgqvUyL';

    try {
      const res = await fetch(SUPABASE_URL + '/rest/v1/reservas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_KEY
        },
        body: JSON.stringify({
          nombre, email, telefono,
          fecha: selectedDate,
          hora_inicio: selectedHora,
          tipo_show: tipo,
          duracion,
          precio_total: 0,
          anticipo: 0,
          estado: 'pendiente'
        })
      });

      if (res.ok || res.status === 201) {
        document.getElementById('btnEnviarReserva').disabled = true;
        document.getElementById('rNombre').value = '';
        document.getElementById('rEmail').value  = '';
        document.getElementById('rTelefono').value = '';
        document.getElementById('rFeedback').style.display = 'block';
      } else {
        alert('Hubo un error al enviar. Intenta de nuevo.');
      }
    } catch (err) {
      console.error('Error enviando reserva:', err);
      alert('Hubo un error de conexión.');
    }
  });

  document.getElementById('calPrev').addEventListener('click', () => {
    viewMonth--;
    if (viewMonth < 0) { viewMonth = 11; viewYear--; }
    renderCal();
  });

  document.getElementById('calNext').addEventListener('click', () => {
    viewMonth++;
    if (viewMonth > 11) { viewMonth = 0; viewYear++; }
    renderCal();
  });

  function setDot(n) {
    document.querySelectorAll('.mk-paso-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i < n);
    });
  }

  cargarFechasOcupadas();
})();

/* ============================================================
   TESTIMONIOS — Supabase
   ============================================================ */
(function () {

  const SUPABASE_URL = 'https://lopzmdwdkpebaxvwciwc.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_T1ebtti-F2piq1_5BFs-fg_8xgqvUyL';
  const HEADERS = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_KEY
  };

  const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                 'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  async function cargarTestimonios() {
    try {
      const res  = await fetch(
        SUPABASE_URL + '/rest/v1/testimonios?aprobado=eq.true&order=creado_at.desc',
        { headers: HEADERS }
      );
      const data = await res.json();
      const grid     = document.getElementById('testimoniosGrid');
      const cargando = document.getElementById('testimoniosCargando');

      if (!data.length) {
        cargando.innerHTML = '<p style="font-size:14px;color:#bbb;">Aún no hay testimonios publicados. ¡Sé el primero!</p>';
        return;
      }

      cargando.remove();
      data.forEach(t => {
        const inicial       = t.nombre.charAt(0).toUpperCase();
        const cal           = t.calificacion || 5;
        const estrellasHTML = '★'.repeat(cal) + '☆'.repeat(5 - cal);
        const col           = document.createElement('div');
        col.className       = 'col-md-4';
        col.innerHTML = `
          <div class="card mk-testimonial-card h-100 p-4">
            <div class="card-body">
              <div class="mk-stars mb-3">${estrellasHTML}</div>
              <p class="mk-testimonial-text">"${t.mensaje}"</p>
            </div>
            <div class="card-footer bg-transparent border-0 d-flex align-items-center gap-3">
              <div class="mk-avatar">${inicial}</div>
              <div>
                <div class="mk-client-name">${t.nombre}</div>
                <div class="mk-client-event">${t.tipo_evento} · ${t.ciudad}</div>
              </div>
            </div>
          </div>`;
        grid.appendChild(col);
      });
    } catch (err) {
      console.error('Error cargando testimonios:', err);
    }
  }

  let calificacionSeleccionada = 0;
  const stars = document.querySelectorAll('.mk-star-pick');

  stars.forEach(star => {
    star.addEventListener('click', () => {
      calificacionSeleccionada = parseInt(star.dataset.val);
      document.getElementById('tEstrellas').value = calificacionSeleccionada;
      actualizarEstrellas(calificacionSeleccionada);
    });
    star.addEventListener('mouseover', () => {
      actualizarEstrellas(parseInt(star.dataset.val));
    });
    star.addEventListener('mouseout', () => {
      actualizarEstrellas(calificacionSeleccionada);
    });
  });

  function actualizarEstrellas(val) {
    stars.forEach((s, i) => s.classList.toggle('active', i < val));
  }

  document.getElementById('btnEnviarTestimonio').addEventListener('click', async () => {
    const nombre    = document.getElementById('tNombre').value.trim();
    const evento    = document.getElementById('tEvento').value;
    const ciudad    = document.getElementById('tCiudad').value.trim();
    const mensaje   = document.getElementById('tMensaje').value.trim();
    const estrellas = parseInt(document.getElementById('tEstrellas').value);

    if (!nombre || !ciudad || !mensaje || estrellas === 0) {
      alert('Por favor completa todos los campos y selecciona una calificación.');
      return;
    }

    try {
      const res = await fetch(SUPABASE_URL + '/rest/v1/testimonios', {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify({
          nombre, tipo_evento: evento, ciudad, mensaje, calificacion: estrellas
        })
      });

      if (res.ok || res.status === 201) {
        document.getElementById('tNombre').value  = '';
        document.getElementById('tCiudad').value  = '';
        document.getElementById('tMensaje').value = '';
        calificacionSeleccionada = 0;
        document.getElementById('tEstrellas').value = 0;
        actualizarEstrellas(0);
        const feedback = document.getElementById('tFeedback');
        feedback.style.display = 'block';
        setTimeout(() => feedback.style.display = 'none', 5000);
      } else {
        alert('Hubo un error al enviar. Intenta de nuevo.');
      }
    } catch (err) {
      console.error('Error enviando testimonio:', err);
      alert('Hubo un error de conexión.');
    }
  });

  cargarTestimonios();
})();