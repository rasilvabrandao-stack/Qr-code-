const qrResult = document.getElementById("qrResult");
const qrScreen = document.getElementById("qrScreen");
const formScreen = document.getElementById("formScreen");
const welcomeText = document.getElementById("welcomeText");
const registroForm = document.getElementById("registroForm");
const areaSelect = document.getElementById("area");
const projetoSelect = document.getElementById("projeto");
const numeroProjeto = document.getElementById("numeroProjeto");
const horaInicio = document.getElementById("horaInicio");
const horaFim = document.getElementById("horaFim");

const registros = JSON.parse(localStorage.getItem("registros") || "{}");

// 🔗 SUA URL DO GOOGLE APPS SCRIPT ↓
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw1tiKAbqyt_2UIi453JOwhtMKq6dmu05Qf-d4i8LpFwD2eTJlu0U0iW0G5-J_taZO4RQ/exec";

function getHoje() {
  const hoje = new Date();
  return hoje.toISOString().slice(0, 10);
}

function horaAgora() {
  const agora = new Date();
  return agora.toTimeString().slice(0, 5);
}

function gerarHorarios() {
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const hora = h.toString().padStart(2, '0');
      const minuto = m.toString().padStart(2, '0');
      const time = `${hora}:${minuto}`;
      horaInicio.add(new Option(time, time));
      horaFim.add(new Option(time, time));
    }
  }
}

function registrarEntrada(id, nome, area, projeto, numero, inicio, fim) {
  const hoje = getHoje();
  const horaEntrada = horaAgora();

  if (!registros[hoje]) registros[hoje] = {};
  registros[hoje][id] = {
    nome,
    entrada: horaEntrada,
    area,
    projeto,
    numeroProjeto: numero,
    horaInicio: inicio,
    horaFim: fim
  };
  localStorage.setItem("registros", JSON.stringify(registros));

  // Enviar para Google Sheets
  const payload = {
    data: hoje,
    id,
    nome,
    area,
    projeto,
    numeroProjeto: numero,
    horaInicio: inicio,
    horaFim: fim,
    horaEntrada
  };

  fetch(SCRIPT_URL, {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

function registrarSaida(id) {
  const hoje = getHoje();
  const horaSaida = horaAgora();
  if (registros[hoje] && registros[hoje][id]) {
    registros[hoje][id].saida = horaSaida;
    localStorage.setItem("registros", JSON.stringify(registros));

    const payload = {
      data: hoje,
      id,
      nome: registros[hoje][id].nome,
      area: registros[hoje][id].area,
      projeto: registros[hoje][id].projeto,
      numeroProjeto: registros[hoje][id].numeroProjeto,
      horaInicio: registros[hoje][id].horaInicio,
      horaFim: registros[hoje][id].horaFim,
      horaEntrada: registros[hoje][id].entrada,
      horaSaida
    };

    fetch(SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
  }
}

function iniciarLeitorQR() {
  const html5QrCode = new Html5Qrcode("reader");
  const config = { fps: 10, qrbox: 250 };

  html5QrCode.start({ facingMode: "environment" }, config,
    qrCodeMessage => {
      try {
        const data = JSON.parse(qrCodeMessage);
        const hoje = getHoje();
        const id = data.id;
        const nome = data.nome;

        if (!registros[hoje]) registros[hoje] = {};
        const registroHoje = registros[hoje][id];

        if (!registroHoje) {
          qrScreen.style.display = "none";
          formScreen.style.display = "flex";
          welcomeText.textContent = `Bem-vindo, ${nome}!`;
          registroForm.dataset.id = id;
          registroForm.dataset.nome = nome;
          html5QrCode.stop();
        } else if (!registroHoje.saida) {
          registrarSaida(id);
          alert(`${nome}, saída registrada às ${horaAgora()}!`);
          location.reload();
        } else {
          alert(`${nome}, você já registrou entrada e saída hoje.`);
        }
      } catch (e) {
        qrResult.textContent = "QR inválido. Tente novamente.";
      }
    },
    error => {}
  );
}

// 🔘 Evento ao clicar em "Registrar Entrada"
registroForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const id = registroForm.dataset.id;
  const nome = registroForm.dataset.nome;
  const area = areaSelect.value;
  const projeto = projetoSelect.value;
  const numero = numeroProjeto.value.trim();
  const inicio = horaInicio.value;
  const fim = horaFim.value;

  if (!area || !projeto || !numero || !inicio || !fim) {
    alert("Preencha todos os campos.");
    return;
  }

  if (inicio >= fim) {
    alert("Hora de início deve ser menor que a de fim.");
    return;
  }

  registrarEntrada(id, nome, area, projeto, numero, inicio, fim);
  alert(`${nome}, entrada registrada às ${horaAgora()}.`);
  location.reload();
});

window.addEventListener("load", () => {
  gerarHorarios();
  iniciarLeitorQR();
});
