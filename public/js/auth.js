function showMsg(text, ok = true) {
  const element = document.getElementById("formMessage");
  if (!element) return;
  element.textContent = text;
  element.dataset.state = ok ? "success" : "error";
}

function setCurrent(user) {
  const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role };
  try {
    localStorage.setItem("ctea-user", JSON.stringify(safeUser));
    localStorage.setItem("conexiontea_user_name", user.name);
  } catch (error) {}
}

async function readApiResponse(response) {
  const body = await response.text();
  if (response.status === 405) {
    throw new Error("Esta página parece abierta con Live Server u otro puerto. Abre http://localhost:3000/login.html y deja npm start activo.");
  }
  if (!body) {
    throw new Error(`El servidor respondió vacío (HTTP ${response.status}). Verifica que MySQL esté conectado y que npm start siga activo.`);
  }
  try {
    return JSON.parse(body);
  } catch (error) {
    throw new Error(`El servidor devolvió una respuesta inesperada (HTTP ${response.status}). Reinicia npm start e inténtalo de nuevo.`);
  }
}

async function submitAuth(form, endpoint, payload, successMessage) {
  const button = form.querySelector("button[type='submit']");
  button.disabled = true;
  showMsg("Conectando con ConexiónTEA…");

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(payload)
    });
    const result = await readApiResponse(response);
    if (!response.ok) throw new Error(result.error || "No se pudo completar la solicitud.");

    setCurrent(result.user);
    showMsg(successMessage);
    window.setTimeout(() => { window.location.href = "dashboard.html"; }, 650);
  } catch (error) {
    const message = error instanceof TypeError
      ? "No se pudo conectar con la API. Inicia el servidor con npm start y abre http://localhost:3000."
      : error.message;
    showMsg(message, false);
    button.disabled = false;
  }
}

const registroForm = document.getElementById("registroForm");
registroForm?.addEventListener("submit", event => {
  event.preventDefault();
  const name = document.getElementById("regName").value.trim();
  const email = document.getElementById("regEmail").value.trim().toLowerCase();
  const password = document.getElementById("regPassword").value;
  const role = document.getElementById("regRole").value;

  if (!name || !email || password.length < 8 || !role) {
    showMsg("Revisa tus datos. La contraseña debe tener al menos 8 caracteres.", false);
    return;
  }
  submitAuth(registroForm, "/api/auth/register", { name, email, password, role }, "Cuenta creada. Abriendo tu espacio…");
});

const loginForm = document.getElementById("loginForm");
loginForm?.addEventListener("submit", event => {
  event.preventDefault();
  const email = document.getElementById("loginEmail").value.trim().toLowerCase();
  const password = document.getElementById("loginPassword").value;

  if (!email || !password) {
    showMsg("Escribe tu correo y contraseña para continuar.", false);
    return;
  }
  submitAuth(loginForm, "/api/auth/login", { email, password }, "Sesión iniciada. Abriendo tu espacio…");
});

document.querySelectorAll('a[href="dashboard.html"]').forEach(link => {
  link.addEventListener("click", async event => {
    event.preventDefault();
    showMsg("Conectando con la cuenta de demostración…");
    try {
      const response = await fetch("/api/auth/demo", {
        method: "POST",
        credentials: "same-origin"
      });
      const result = await readApiResponse(response);
      if (!response.ok) throw new Error(result.error || "No se pudo abrir la demo.");
      setCurrent(result.user);
      window.location.href = "dashboard.html";
    } catch (error) {
      showMsg(error.message, false);
    }
  });
});
