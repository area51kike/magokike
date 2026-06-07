// ============================================================
// MAGO KIKE — main.js
// ============================================================

const SUPABASE_URL = 'https://lopzmdwdkpebaxvwciwc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_T1ebtti-F2piq1_5BFs-fg_8xgqvUyL';

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
        const finRedondeado  = Math.ceil(finMin / 60) * 60;
        const bloqueadoDesde = inicioMin - 60;
        const bloqueadoHasta = finRedondeado + 60;

        if (!HORAS_OCUPADAS[r.fecha]) HORAS_OCUPADAS[r.fecha] = [];

        HORAS.forEach(h => {
          const hMin = horaAMinutos(h);
          if (hMin >= bloqueadoDesde && hMin < bloqueadoHasta) {
            if (!HORAS_OCUPADAS[r.fecha].includes(h)) {
              HORAS_OCUPADAS[r.fecha].push(h);
            }
          }
        });

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
    const [y,m,d] = selectedDate.split('-');
    const fechaFmt = d + ' de ' + MESES[parseInt(m)-1] + ' de ' + y;
    document.getElementById('resumen').innerHTML =
      `<strong>Fecha:</strong> ${fechaFmt}<br>
       <strong>Show:</strong> ${tipo}<br>
       <strong>Duración:</strong> ${dur}<br>
       <strong>Hora de inicio:</strong> ${selectedHora}`;
    const formReserva = document.getElementById('formularioReserva');
    formReserva.style.display = 'block';
    setTimeout(() => formReserva.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
  }

  // --- Helpers de validación visual por campo ---
  function setFieldError(fieldId, msg) {
    const el = document.getElementById(fieldId);
    el.classList.remove('mk-input-ok');
    el.classList.add('mk-input-error');
    let hint = el.closest('.col-12, div').querySelector('.mk-field-hint');
    if (!hint) {
      hint = document.createElement('small');
      hint.className = 'mk-field-hint';
      el.parentElement.appendChild(hint);
    }
    hint.textContent = msg;
    hint.style.cssText = 'color:#e74c3c;font-size:11px;display:block;margin-top:4px;';
  }
  function clearFieldError(fieldId) {
    const el = document.getElementById(fieldId);
    el.classList.remove('mk-input-error');
    const hint = el.parentElement.querySelector('.mk-field-hint');
    if (hint) hint.style.display = 'none';
  }
  function setFieldOk(fieldId) {
    const el = document.getElementById(fieldId);
    el.classList.remove('mk-input-error');
    el.classList.add('mk-input-ok');
    const hint = el.parentElement.querySelector('.mk-field-hint');
    if (hint) hint.style.display = 'none';
  }
  function validarNombre() {
    const val = document.getElementById('rNombre').value.trim();
    const palabras = val.split(/\s+/).filter(p => p.length > 0);
    const soloLetras = /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]+$/.test(val);
    if (!val)                { setFieldError('rNombre', 'Por favor ingresa tu nombre.'); return false; }
    if (!soloLetras)         { setFieldError('rNombre', 'Solo letras, sin números ni símbolos.'); return false; }
    if (palabras.length < 2) { setFieldError('rNombre', 'Ingresa nombre y apellido.'); return false; }
    setFieldOk('rNombre'); return true;
  }
  function validarEmail() {
    const val = document.getElementById('rEmail').value.trim();
    const ok  = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val);
    if (!val) { setFieldError('rEmail', 'Por favor ingresa tu correo.'); return false; }
    if (!ok)  { setFieldError('rEmail', 'Formato inválido. Ej: maria@gmail.com'); return false; }
    setFieldOk('rEmail'); return true;
  }
  function validarTelefono() {
    const val = document.getElementById('rTelefono').value.replace(/\D/g, '');
    if (!val)             { setFieldError('rTelefono', 'Por favor ingresa tu teléfono.'); return false; }
    if (val.length !== 8) { setFieldError('rTelefono', 'Deben ser exactamente 8 dígitos.'); return false; }
    setFieldOk('rTelefono'); return true;
  }

  document.getElementById('rNombre').addEventListener('blur', validarNombre);
  document.getElementById('rEmail').addEventListener('blur', validarEmail);
  document.getElementById('rTelefono').addEventListener('blur', validarTelefono);
  ['rNombre','rEmail','rTelefono'].forEach(id =>
    document.getElementById(id).addEventListener('input', () => clearFieldError(id))
  );

  document.getElementById('btnEnviarReserva').addEventListener('click', async () => {
    const okNombre   = validarNombre();
    const okEmail    = validarEmail();
    const okTelefono = validarTelefono();
    if (!okNombre || !okEmail || !okTelefono) return;
    if (!selectedDate || !selectedHora) {
      alert('Por favor selecciona una fecha y hora.');
      return;
    }

    const nombre   = document.getElementById('rNombre').value.trim();
    const email    = document.getElementById('rEmail').value.trim();
    const telefono = '+503' + document.getElementById('rTelefono').value.replace(/\D/g, '').slice(0, 8);
    const tipoEl   = document.getElementById('tipoShow');
    const durEl    = document.getElementById('duracion');
    const tipo     = tipoEl.value;
    const duracion = parseInt(durEl.value);

    const btn = document.getElementById('btnEnviarReserva');
    btn.disabled    = true;
    btn.textContent = 'Enviando...';

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
        document.getElementById('rNombre').value   = '';
        document.getElementById('rEmail').value    = '';
        document.getElementById('rTelefono').value = '';
        mostrarExito(nombre.split(' ')[0]);
      } else {
        btn.disabled    = false;
        btn.textContent = 'Enviar solicitud de reserva';
        alert('Hubo un error al enviar. Intenta de nuevo.');
      }
    } catch (err) {
      console.error('Error enviando reserva:', err);
      btn.disabled    = false;
      btn.textContent = 'Enviar solicitud de reserva';
      alert('Hubo un error de conexión.');
    }
  });

  function mostrarExito(primerNombre) {
    const formulario = document.getElementById('formularioReserva');
    formulario.innerHTML = `
      <div class="mk-exito" id="mkExito">
        <div class="mk-exito-simbolo">✦</div>
        <h3 class="mk-exito-titulo">¡Solicitud enviada!</h3>
        <div class="mk-exito-divider"></div>
        <p class="mk-exito-texto">Gracias <strong>${primerNombre}</strong>, te enviaré un correo para confirmar tu reserva pronto.</p>
        <p class="mk-exito-sub">Revisa también tu bandeja de spam.</p>
      </div>`;
    document.getElementById('mkExito').scrollIntoView({ behavior: 'smooth', block: 'center' });
    lanzarEstrellas('mkExito');
  }

  function lanzarEstrellas(idContenedor) {
    const contenedor = document.getElementById(idContenedor);
    contenedor.style.position = 'relative';
    contenedor.style.overflow = 'hidden';
    const simbolos = ['✦','✧','★','✶','✸'];
    const colores  = ['#D4AF37','#fff','#C9A84C','#f5e6a3'];
    for (let i = 0; i < 20; i++) {
      const s = document.createElement('span');
      s.className   = 'mk-estrella-confeti';
      s.textContent = simbolos[Math.floor(Math.random() * simbolos.length)];
      s.style.cssText = `
        position:absolute;
        left:${Math.random()*100}%;
        top:${10 + Math.random()*80}%;
        font-size:${10 + Math.random()*20}px;
        color:${colores[Math.floor(Math.random()*colores.length)]};
        opacity:0;
        pointer-events:none;
        animation:mkEstrellaAnim ${0.5 + Math.random()*1.2}s ease forwards;
        animation-delay:${Math.random()*0.6}s;
      `;
      contenedor.appendChild(s);
    }
  }

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

  const HEADERS = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_KEY
  };

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

  // --- Estrellas ---
  let calificacionSeleccionada = 0;
  const stars = document.querySelectorAll('.mk-star-pick');

  stars.forEach(star => {
    star.addEventListener('click', () => {
      calificacionSeleccionada = parseInt(star.dataset.val);
      document.getElementById('tEstrellas').value = calificacionSeleccionada;
      actualizarEstrellas(calificacionSeleccionada);
      clearTError('estrellas');
    });
    star.addEventListener('mouseover', () => actualizarEstrellas(parseInt(star.dataset.val)));
    star.addEventListener('mouseout',  () => actualizarEstrellas(calificacionSeleccionada));
  });

  function actualizarEstrellas(val) {
    stars.forEach((s, i) => s.classList.toggle('active', i < val));
  }

  // --- Validación visual testimonios ---
  function setTError(fieldId, msg) {
    const el = fieldId === 'estrellas'
      ? document.getElementById('starPicker')
      : document.getElementById(fieldId);
    el.classList.add('mk-input-error');
    let hint = el.parentElement.querySelector('.mk-t-hint');
    if (!hint) {
      hint = document.createElement('small');
      hint.className = 'mk-t-hint';
      el.parentElement.appendChild(hint);
    }
    hint.textContent = msg;
    hint.style.cssText = 'color:#e74c3c;font-size:11px;display:block;margin-top:4px;';
  }

  function clearTError(fieldId) {
    const el = fieldId === 'estrellas'
      ? document.getElementById('starPicker')
      : document.getElementById(fieldId);
    if (!el) return;
    el.classList.remove('mk-input-error');
    el.classList.add('mk-input-ok');
    const hint = el.parentElement.querySelector('.mk-t-hint');
    if (hint) hint.style.display = 'none';
  }

  function validarTNombre() {
    const val = document.getElementById('tNombre').value.trim();
    const palabras = val.split(/\s+/).filter(p => p.length > 0);
    const soloLetras = /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]+$/.test(val);
    if (!val)                { setTError('tNombre', 'Por favor ingresa tu nombre.'); return false; }
    if (!soloLetras)         { setTError('tNombre', 'Solo letras, sin números ni símbolos.'); return false; }
    if (palabras.length < 2) { setTError('tNombre', 'Ingresa nombre y apellido.'); return false; }
    clearTError('tNombre'); return true;
  }

  function validarTCiudad() {
    const val = document.getElementById('tCiudad').value.trim();
    if (!val) { setTError('tCiudad', 'Por favor ingresa tu ciudad.'); return false; }
    clearTError('tCiudad'); return true;
  }

  function validarTMensaje() {
    const val = document.getElementById('tMensaje').value.trim();
    if (!val)            { setTError('tMensaje', 'Por favor escribe tu mensaje.'); return false; }
    if (val.length < 20) { setTError('tMensaje', 'Cuéntanos un poco más (mínimo 20 caracteres).'); return false; }
    clearTError('tMensaje'); return true;
  }

  function validarTEstrellas() {
    if (calificacionSeleccionada === 0) {
      setTError('estrellas', 'Por favor selecciona una calificación.');
      return false;
    }
    clearTError('estrellas'); return true;
  }

  document.getElementById('tNombre').addEventListener('blur', validarTNombre);
  document.getElementById('tCiudad').addEventListener('blur', validarTCiudad);
  document.getElementById('tMensaje').addEventListener('blur', validarTMensaje);
  ['tNombre','tCiudad','tMensaje'].forEach(id =>
    document.getElementById(id).addEventListener('input', () => {
      document.getElementById(id).classList.remove('mk-input-error');
      const hint = document.getElementById(id).parentElement.querySelector('.mk-t-hint');
      if (hint) hint.style.display = 'none';
    })
  );

  document.getElementById('btnEnviarTestimonio').addEventListener('click', async () => {
    const okNombre    = validarTNombre();
    const okCiudad    = validarTCiudad();
    const okMensaje   = validarTMensaje();
    const okEstrellas = validarTEstrellas();
    if (!okNombre || !okCiudad || !okMensaje || !okEstrellas) return;

    const nombre    = document.getElementById('tNombre').value.trim();
    const evento    = document.getElementById('tEvento').value;
    const ciudad    = document.getElementById('tCiudad').value.trim();
    const mensaje   = document.getElementById('tMensaje').value.trim();
    const estrellas = calificacionSeleccionada;

    const btn = document.getElementById('btnEnviarTestimonio');
    btn.disabled    = true;
    btn.textContent = 'Enviando...';

    try {
      const res = await fetch(SUPABASE_URL + '/rest/v1/testimonios', {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify({
          nombre, tipo_evento: evento, ciudad, mensaje, calificacion: estrellas
        })
      });

      if (res.ok || res.status === 201) {
        mostrarExitoTestimonio(nombre.split(' ')[0]);
      } else {
        btn.disabled    = false;
        btn.textContent = 'Enviar testimonio';
        setTError('tMensaje', 'Hubo un error al enviar. Intenta de nuevo.');
      }
    } catch (err) {
      console.error('Error enviando testimonio:', err);
      btn.disabled    = false;
      btn.textContent = 'Enviar testimonio';
    }
  });

  function mostrarExitoTestimonio(primerNombre) {
    const form = document.querySelector('.mk-testimonio-form');
    form.innerHTML = `
      <div class="mk-exito" id="mkExitoTestimonio">
        <div class="mk-exito-simbolo">✦</div>
        <h3 class="mk-exito-titulo">¡Gracias, ${primerNombre}!</h3>
        <div class="mk-exito-divider"></div>
        <p class="mk-exito-texto">Tu testimonio fue recibido y será publicado pronto.</p>
        <p class="mk-exito-sub">Lo revisaré personalmente antes de publicarlo.</p>
      </div>`;
    document.getElementById('mkExitoTestimonio').scrollIntoView({ behavior: 'smooth', block: 'center' });
    lanzarEstrellasElem('mkExitoTestimonio');
  }

  function lanzarEstrellasElem(idContenedor) {
    const contenedor = document.getElementById(idContenedor);
    contenedor.style.position = 'relative';
    contenedor.style.overflow = 'hidden';
    const simbolos = ['✦','✧','★','✶','✸'];
    const colores  = ['#D4AF37','#fff','#C9A84C','#f5e6a3'];
    for (let i = 0; i < 20; i++) {
      const s = document.createElement('span');
      s.className   = 'mk-estrella-confeti';
      s.textContent = simbolos[Math.floor(Math.random() * simbolos.length)];
      s.style.cssText = `
        position:absolute;
        left:${Math.random()*100}%;
        top:${10 + Math.random()*80}%;
        font-size:${10 + Math.random()*20}px;
        color:${colores[Math.floor(Math.random()*colores.length)]};
        opacity:0;
        pointer-events:none;
        animation:mkEstrellaAnim ${0.5 + Math.random()*1.2}s ease forwards;
        animation-delay:${Math.random()*0.6}s;
      `;
      contenedor.appendChild(s);
    }
  }

  cargarTestimonios();
})();

/* ============================================================
   LIGHTBOX — Galería
   ============================================================ */
(function () {
  const lb      = document.getElementById('mkLightbox');
  const lbImg   = document.getElementById('mkLbImg');
  const lbClose = document.getElementById('mkLbClose');
  const lbPrev  = document.getElementById('mkLbPrev');
  const lbNext  = document.getElementById('mkLbNext');
  const lbDots  = document.getElementById('mkLbDots');

  function getImgs() {
    return Array.from(document.querySelectorAll('[data-lightbox]'));
  }

  let idx = 0;

  function buildDots(imgs) {
    lbDots.innerHTML = '';
    imgs.forEach((_, i) => {
      const d = document.createElement('button');
      d.className = 'mk-lb-dot' + (i === idx ? ' active' : '');
      d.addEventListener('click', () => goTo(i));
      lbDots.appendChild(d);
    });
  }

  function updateDots() {
    lbDots.querySelectorAll('.mk-lb-dot').forEach((d, i) =>
      d.classList.toggle('active', i === idx)
    );
  }

  function openLightbox(imgs, i) {
    idx = i;
    buildDots(imgs);
    lbImg.src = imgs[idx].src;
    lbImg.classList.remove('mk-lb-saliendo');
    lb.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lb.classList.remove('active');
    document.body.style.overflow = '';
    lbImg.src = '';
  }

  function goTo(i) {
    const imgs = getImgs();
    lbImg.classList.add('mk-lb-saliendo');
    setTimeout(() => {
      idx = (i + imgs.length) % imgs.length;
      lbImg.src = imgs[idx].src;
      lbImg.classList.remove('mk-lb-saliendo');
      updateDots();
    }, 180);
  }

  document.addEventListener('click', e => {
    const img = e.target.closest('[data-lightbox]');
    if (!img) return;
    const imgs = getImgs();
    openLightbox(imgs, imgs.indexOf(img));
  });

  lbClose.addEventListener('click', closeLightbox);
  lbPrev.addEventListener('click', () => goTo(idx - 1));
  lbNext.addEventListener('click', () => goTo(idx + 1));

  lb.addEventListener('click', e => {
    if (e.target === lb) closeLightbox();
  });

  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('active')) return;
    if (e.key === 'ArrowRight') goTo(idx + 1);
    if (e.key === 'ArrowLeft')  goTo(idx - 1);
    if (e.key === 'Escape')     closeLightbox();
  });
})();
