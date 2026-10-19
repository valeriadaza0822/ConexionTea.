/* =========================================================
   CONEXIÓNTEA 2.0
   DASHBOARD
   PICTOGRAMAS ARASAAC + VOZ
   ========================================================= */


/* =========================================================
   DATOS DE PICTOGRAMAS
   ========================================================= */

const pictograms = [

    {
        search: "hola",
        text: "Hola"
    },

    {
        search: "querer",
        text: "Quiero"
    },

    {
        search: "jugar",
        text: "Jugar"
    },

    {
        search: "escuela",
        text: "Escuela"
    },

    {
        search: "comer",
        text: "Comer"
    },

    {
        search: "agua",
        text: "Agua"
    },

    {
        search: "descansar",
        text: "Descansar"
    },

    {
        search: "feliz",
        text: "Estoy feliz"
    }

];

let currentUser = null;
let chatRefreshTimer = null;


/* =========================================================
   ACTIVIDADES
   ========================================================= */

let activities = [];
let routine = [];
let calendar = [];

async function plannerRequest(url, options = {}) {
    const response = await fetch(url, {
        credentials: "same-origin",
        ...options,
        headers: {
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...options.headers
        }
    });
    const result = response.status === 204 ? null : await response.json();
    if (!response.ok) {
        const error = new Error(result?.error || "No se pudo guardar la información.");
        error.status = response.status;
        throw error;
    }
    return result;
}

function showPlannerError(panel, error) {
    panel.innerHTML = `<p class="planner-message error" role="alert">${escapeHTML(error.message)}</p>`;
}


/* =========================================================
   CONTACTOS
   ========================================================= */

const chats = {

    familia: {

        title: "Chat familiares",

        description:
            "Comunícate con las personas de confianza registradas en tu perfil."

    },

    profesional: {

        title: "Chat profesional",

        description:
            "Espacio de comunicación con profesionales de apoyo."

    },

    pares: {

        title: "Chat con pares",

        description:
            "Espacio para comunicación con otros usuarios."

    }

};


/* =========================================================
   CONFIGURACIÓN DE VOZ
   ========================================================= */

let speechVoices = [];

let voiceSettings = {

    voiceName: "",

    lang: "es-ES",

    rate: 1,

    pitch: 1,

    volume: 1

};


/* =========================================================
   CARGAR VOCES
   ========================================================= */

function loadVoices() {

    speechVoices =
        window.speechSynthesis.getVoices();

}


if ("speechSynthesis" in window) {

    loadVoices();

    window.speechSynthesis.onvoiceschanged =
        loadVoices;

}


/* =========================================================
   ESCAPAR HTML
   ========================================================= */

function escapeHTML(value) {

    return String(value)

        .replaceAll("&", "&amp;")

        .replaceAll("<", "&lt;")

        .replaceAll(">", "&gt;")

        .replaceAll('"', "&quot;")

        .replaceAll("'", "&#039;");

}


/* =========================================================
   HABLAR
   ========================================================= */

function speakText(text) {

    if (
        !text ||
        !("speechSynthesis" in window)
    ) {

        return;

    }


    window.speechSynthesis.cancel();


    const utterance =
        new SpeechSynthesisUtterance(text);


    utterance.lang =
        voiceSettings.lang;


    utterance.rate =
        Number(voiceSettings.rate);


    utterance.pitch =
        Number(voiceSettings.pitch);


    utterance.volume =
        Number(voiceSettings.volume);


    const selectedVoice =
        speechVoices.find(
            voice =>
                voice.name ===
                voiceSettings.voiceName
        );


    if (selectedVoice) {

        utterance.voice =
            selectedVoice;

    }


    window.speechSynthesis.speak(
        utterance
    );

}


/* =========================================================
   HTML CONFIGURACIÓN DE VOZ
   ========================================================= */

function voiceSettingsHTML() {

    return `

        <details class="voice-settings">

            <summary>
                Configuración de voz
            </summary>

            <div class="voice-settings-body">

                <label>

                    Voz

                    <select id="voiceSelect">

                        <option value="">
                            Voz predeterminada
                        </option>

                    </select>

                </label>


                <label>

                    Velocidad:

                    <span>
                        <span id="voiceRateValue">
                            1
                        </span>
                    </span>

                    <input
                        type="range"
                        id="voiceRate"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value="1"
                    >

                </label>


                <label>

                    Tono:

                    <span id="voicePitchValue">
                        1
                    </span>

                    <input
                        type="range"
                        id="voicePitch"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value="1"
                    >

                </label>


                <label>

                    Volumen:

                    <span id="voiceVolumeValue">
                        1
                    </span>

                    <input
                        type="range"
                        id="voiceVolume"
                        min="0"
                        max="1"
                        step="0.1"
                        value="1"
                    >

                </label>


                <button
                    type="button"
                    class="secondary-btn"
                    id="testVoiceBtn"
                >
                    Probar voz
                </button>

            </div>

        </details>

    `;

}


/* =========================================================
   CONFIGURAR VOZ
   ========================================================= */

function initVoiceSettings() {

    const select =
        document.getElementById(
            "voiceSelect"
        );

    const rate =
        document.getElementById(
            "voiceRate"
        );

    const pitch =
        document.getElementById(
            "voicePitch"
        );

    const volume =
        document.getElementById(
            "voiceVolume"
        );


    if (!select) {

        return;

    }


    select.innerHTML = `

        <option value="">
            Voz predeterminada
        </option>

    `;


    const spanishVoices =
        speechVoices.filter(
            voice =>
                voice.lang
                    .toLowerCase()
                    .startsWith("es")
        );


    const voicesToShow =
        spanishVoices.length
            ? spanishVoices
            : speechVoices;


    voicesToShow.forEach(
        voice => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                voice.name;

            option.textContent =
                `${voice.name} (${voice.lang})`;

            select.appendChild(
                option
            );

        }
    );


    select.value =
        voiceSettings.voiceName;


    rate.value =
        voiceSettings.rate;


    pitch.value =
        voiceSettings.pitch;


    volume.value =
        voiceSettings.volume;


    updateVoiceValues();


    select.addEventListener(
        "change",
        () => {

            voiceSettings.voiceName =
                select.value;

        }
    );


    rate.addEventListener(
        "input",
        () => {

            voiceSettings.rate =
                Number(rate.value);

            updateVoiceValues();

        }
    );


    pitch.addEventListener(
        "input",
        () => {

            voiceSettings.pitch =
                Number(pitch.value);

            updateVoiceValues();

        }
    );


    volume.addEventListener(
        "input",
        () => {

            voiceSettings.volume =
                Number(volume.value);

            updateVoiceValues();

        }
    );


    const testButton =
        document.getElementById(
            "testVoiceBtn"
        );


    if (testButton) {

        testButton.addEventListener(
            "click",
            () => {

                speakText(
                    "Esta es una prueba de la voz de ConexiónTEA 2.0."
                );

            }
        );

    }

}


/* =========================================================
   MOSTRAR VALORES DE VOZ
   ========================================================= */

function updateVoiceValues() {

    const rateValue =
        document.getElementById(
            "voiceRateValue"
        );

    const pitchValue =
        document.getElementById(
            "voicePitchValue"
        );

    const volumeValue =
        document.getElementById(
            "voiceVolumeValue"
        );


    if (rateValue) {

        rateValue.textContent =
            voiceSettings.rate;

    }


    if (pitchValue) {

        pitchValue.textContent =
            voiceSettings.pitch;

    }


    if (volumeValue) {

        volumeValue.textContent =
            voiceSettings.volume;

    }

}


/* =========================================================
   BUSCAR PICTOGRAMA ARASAAC
   ========================================================= */

async function getARASAACPictogram(
    searchText
) {

    try {

        const url =
            `https://api.arasaac.org/api/pictograms/es/search/${encodeURIComponent(searchText)}`;


        const response =
            await fetch(url);


        if (!response.ok) {

            throw new Error(
                "No se pudo consultar ARASAAC"
            );

        }


        const results =
            await response.json();


        if (
            !Array.isArray(results) ||
            results.length === 0
        ) {

            return null;

        }


        return results[0];

    }

    catch (error) {

        console.error(
            "Error ARASAAC:",
            error
        );

        return null;

    }

}


/* =========================================================
   CREAR TARJETA DE PICTOGRAMA
   ========================================================= */

function createPictogramCard(
    pictogram,
    container
) {

    const button =
        document.createElement("button");


    button.type =
        "button";


    button.className =
        "pictogram-card";


    button.dataset.text =
        pictogram.text;


    button.setAttribute(
        "aria-label",
        pictogram.text
    );


    button.innerHTML = `

        <div class="pictogram-loading">

            Buscando...

        </div>

        <span class="pictogram-label">

            ${escapeHTML(
                pictogram.text
            )}

        </span>

    `;


    button.addEventListener(
        "click",
        () => {

            addPictogramToMessage(
                pictogram.text
            );

            speakText(
                pictogram.text
            );

        }
    );


    container.appendChild(
        button
    );


    loadPictogramImage(
        pictogram,
        button
    );

}


/* =========================================================
   CARGAR IMAGEN ARASAAC
   ========================================================= */

async function loadPictogramImage(
    pictogram,
    card
) {

    const result =
        await getARASAACPictogram(
            pictogram.search
        );


    const loading =
        card.querySelector(
            ".pictogram-loading"
        );


    if (!result) {

        if (loading) {

            loading.className =
                "pictogram-error";

            loading.textContent =
                "Pictograma no disponible";

        }

        return;

    }


    const pictogramId =
        result._id ||
        result.id;


    if (!pictogramId) {

        return;

    }


    const image =
        document.createElement(
            "img"
        );


    image.className =
        "pictogram-image";


    image.alt =
        pictogram.text;


    image.loading =
        "lazy";


    image.src =
        `https://static.arasaac.org/pictograms/${pictogramId}/${pictogramId}_500.png`;


    image.addEventListener(
        "error",
        () => {

            image.replaceWith(
                createPictogramError()
            );

        }
    );


    if (loading) {

        loading.replaceWith(
            image
        );

    }

}


/* =========================================================
   ERROR DE IMAGEN
   ========================================================= */

function createPictogramError() {

    const element =
        document.createElement("div");


    element.className =
        "pictogram-error";


    element.textContent =
        "Imagen no disponible";


    return element;

}


/* =========================================================
   PICTOGRAMAS EN COMUNICACIÓN
   ========================================================= */

function renderCommunication() {

    const panel =
        document.getElementById(
            "panelContent"
        );


    panel.innerHTML = `

        <div class="communication-box">

            <label for="messageInput">

                Mensaje

            </label>


            <textarea
                id="messageInput"
                class="message-box"
                placeholder="Selecciona pictogramas o escribe un mensaje..."
                aria-label="Mensaje"
            ></textarea>


            <h3>
                Pictogramas
            </h3>


            <div
                id="communicationPictograms"
                class="pictogram-grid"
            ></div>


            <div class="action-buttons">

                <button
                    type="button"
                    class="primary-btn"
                    id="speakMessageBtn"
                >
                    Escuchar mensaje
                </button>


                <button
                    type="button"
                    class="secondary-btn"
                    id="clearMessageBtn"
                >
                    Limpiar
                </button>


                <button
                    type="button"
                    class="secondary-btn"
                    id="sendMessageBtn"
                >
                    Enviar
                </button>

            </div>


            ${voiceSettingsHTML()}


            <h3>
                Frases rápidas
            </h3>


            <div class="phrase-list">

                <button
                    type="button"
                    class="phrase-btn"
                    data-phrase="Hola, ¿cómo estás?"
                >
                    Hola, ¿cómo estás?
                </button>


                <button
                    type="button"
                    class="phrase-btn"
                    data-phrase="Quiero jugar"
                >
                    Quiero jugar
                </button>


                <button
                    type="button"
                    class="phrase-btn"
                    data-phrase="Necesito ayuda"
                >
                    Necesito ayuda
                </button>


                <button
                    type="button"
                    class="phrase-btn"
                    data-phrase="Quiero descansar"
                >
                    Quiero descansar
                </button>

            </div>

        </div>

    `;


    const container =
        document.getElementById(
            "communicationPictograms"
        );


    pictograms.forEach(
        pictogram => {

            createPictogramCard(
                pictogram,
                container
            );

        }
    );


    initVoiceSettings();


    const messageInput =
        document.getElementById(
            "messageInput"
        );


    document
        .getElementById(
            "speakMessageBtn"
        )
        .addEventListener(
            "click",
            () => {

                speakText(
                    messageInput.value
                );

            }
        );


    document
        .getElementById(
            "clearMessageBtn"
        )
        .addEventListener(
            "click",
            () => {

                messageInput.value = "";

            }
        );


    document
        .getElementById(
            "sendMessageBtn"
        )
        .addEventListener(
            "click",
            () => {

                if (!messageInput.value.trim()) {

                    alert(
                        "Escribe o construye un mensaje antes de enviarlo."
                    );

                    return;

                }


                alert(
                    "Mensaje preparado para enviar."
                );

            }
        );


    document
        .querySelectorAll(
            ".phrase-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        messageInput.value =
                            button.dataset.phrase;

                        speakText(
                            button.dataset.phrase
                        );

                    }
                );

            }
        );

}


/* =========================================================
   AGREGAR PICTOGRAMA AL MENSAJE
   ========================================================= */

function addPictogramToMessage(
    text
) {

    const input =
        document.getElementById(
            "messageInput"
        );


    if (!input) {

        return;

    }


    if (input.value.trim()) {

        input.value +=
            " " + text;

    } else {

        input.value =
            text;

    }


    input.focus();

}


/* =========================================================
   PANEL PICTOGRAMAS
   ========================================================= */

function renderPictograms() {
    const panel = document.getElementById("panelContent");
    let currentView = "explorar";
    let categories = [];
    let savedItems = [];

    panel.innerHTML = `
        <section class="pictogram-library" aria-label="Biblioteca de pictogramas">
            <div class="library-toolbar">
                <label class="library-search">Buscar en la biblioteca
                    <input id="librarySearch" type="search" placeholder="Ej. agua, jugar, feliz" autocomplete="off">
                </label>
                <label class="library-category">Categoría
                    <select id="libraryCategory" aria-label="Filtrar por categoría">
                        <option value="">Cargando categorías…</option>
                    </select>
                </label>
                <div class="library-tabs" role="tablist" aria-label="Vistas de la biblioteca">
                    <button type="button" role="tab" aria-selected="true" data-library-view="explorar">Explorar</button>
                    <button type="button" role="tab" aria-selected="false" data-library-view="favoritos">Mis favoritos</button>
                    <button type="button" role="tab" aria-selected="false" data-library-view="guardados">Mis guardados</button>
                </div>
            </div>
            <div class="pictogram-grid library-grid" id="libraryGrid"></div>
            <p class="planner-message" id="libraryEmpty" hidden></p>
        </section>
        ${voiceSettingsHTML()}`;

    const grid = panel.querySelector("#libraryGrid");
    const searchInput = panel.querySelector("#librarySearch");
    const categorySelect = panel.querySelector("#libraryCategory");
    const emptyMessage = panel.querySelector("#libraryEmpty");

    async function loadView(view) {
        currentView = view;
        panel.querySelectorAll("[data-library-view]").forEach(button => {
            const selected = button.dataset.libraryView === view;
            button.setAttribute("aria-selected", String(selected));
        });
        grid.innerHTML = '<p class="planner-message">Cargando pictogramas…</p>';

        try {
            if (!categories.length) {
                categories = (await plannerRequest("/api/pictograms/categories")).categories;
                categorySelect.innerHTML = categories.map(category =>
                    `<option value="${escapeHTML(category)}">${escapeHTML(category)}</option>`
                ).join("");
            }
            const query = new URLSearchParams({ view, category: categorySelect.value });
            savedItems = (await plannerRequest(`/api/pictograms?${query}`)).pictograms;
            renderCards();
        } catch (error) {
            showPlannerError(panel, error);
        }
    }

    function renderCards() {
        const query = searchInput.value.trim().toLocaleLowerCase("es");
        const matches = savedItems.filter(item =>
            `${item.text} ${item.search}`.toLocaleLowerCase("es").includes(query)
        );
        grid.replaceChildren();
        emptyMessage.hidden = matches.length > 0;
        if (!matches.length) {
            emptyMessage.textContent = currentView === "favoritos"
                ? "No hay favoritos en esta categoría. Cambia de categoría o marca alguno desde Explorar."
                : currentView === "guardados"
                    ? "No hay pictogramas guardados en esta categoría. Cambia de categoría o guarda alguno desde Explorar."
                    : "No encontramos pictogramas con esa búsqueda.";
            return;
        }

        matches.forEach(pictogram => {
            const card = document.createElement("article");
            card.className = "library-card";
            createPictogramCard(pictogram, card);

            const categoryLabel = document.createElement("p");
            categoryLabel.className = "library-category-label";
            categoryLabel.textContent = pictogram.category;
            card.appendChild(categoryLabel);

            const actions = document.createElement("div");
            actions.className = "library-actions";
            actions.innerHTML = `
                <button type="button" class="library-action ${pictogram.favorite ? "is-active" : ""}"
                    data-action="favorite" aria-pressed="${pictogram.favorite}"
                    aria-label="${pictogram.favorite ? "Quitar de favoritos" : "Marcar como favorito"}">
                    <span aria-hidden="true">★</span>${pictogram.favorite ? "Quitar favorito" : "Marcar favorito"}
                </button>
                <button type="button" class="library-action ${pictogram.saved ? "is-active" : ""}"
                    data-action="saved" aria-pressed="${pictogram.saved}">
                    <span aria-hidden="true">▣</span>${pictogram.saved ? "Guardado" : "Guardar"}
                </button>`;
            actions.querySelector('[data-action="favorite"]').addEventListener("click", () => updatePictogram(pictogram, "favorite"));
            actions.querySelector('[data-action="saved"]').addEventListener("click", () => updatePictogram(pictogram, "saved"));
            card.appendChild(actions);
            grid.appendChild(card);
        });
    }

    async function updatePictogram(pictogram, key) {
        const updated = { ...pictogram, [key]: !pictogram[key] };
        try {
            await plannerRequest(`/api/pictograms/${encodeURIComponent(pictogram.search)}`, {
                method: "PUT",
                body: JSON.stringify({ favorite: updated.favorite, saved: updated.saved })
            });
            await loadView(currentView);
        } catch (error) {
            showPlannerError(panel, error);
        }
    }

    panel.querySelectorAll("[data-library-view]").forEach(button => {
        button.addEventListener("click", () => loadView(button.dataset.libraryView));
    });
    categorySelect.addEventListener("change", () => loadView(currentView));
    searchInput.addEventListener("input", renderCards);
    initVoiceSettings();
    loadView("explorar");
}


/* =========================================================
   ACTIVIDADES
   ========================================================= */

async function renderActivities() {
    const panel = document.getElementById("panelContent");
    panel.innerHTML = '<p class="planner-message">Cargando actividades…</p>';
    try {
        activities = (await plannerRequest("/api/activities")).activities;
        panel.innerHTML = `
            <form class="planner-form" id="activityForm">
                <label>Actividad<input name="title" maxlength="120" placeholder="Nueva actividad" required></label>
                <label>Descripción<input name="description" maxlength="500" placeholder="Detalle opcional"></label>
                <button class="planner-button" type="submit">Agregar actividad</button>
            </form>
            <div class="planner-list">
                ${activities.length ? activities.map(activity => `
                    <article class="planner-item ${activity.status === "completada" ? "is-complete" : ""}">
                        <div><strong>${escapeHTML(activity.title)}</strong><p>${escapeHTML(activity.description || "Sin descripción")}</p></div>
                        <div class="planner-actions">
                            <button type="button" data-activity-status="${activity.id}" data-status="${activity.status === "completada" ? "pendiente" : "completada"}">${activity.status === "completada" ? "Reabrir" : "Completar"}</button>
                            <button type="button" class="planner-delete" data-activity-delete="${activity.id}" aria-label="Eliminar ${escapeHTML(activity.title)}">Eliminar</button>
                        </div>
                    </article>
                `).join("") : '<p class="planner-message">Aún no hay actividades. Agrega la primera.</p>'}
            </div>`;

        panel.querySelector("#activityForm").addEventListener("submit", async event => {
            event.preventDefault();
            const form = event.currentTarget;
            const data = Object.fromEntries(new FormData(form));
            try {
                await plannerRequest("/api/activities", { method: "POST", body: JSON.stringify(data) });
                await renderActivities();
            } catch (error) { showPlannerError(panel, error); }
        });
        panel.querySelectorAll("[data-activity-status]").forEach(button => button.addEventListener("click", async () => {
            try {
                await plannerRequest(`/api/activities/${button.dataset.activityStatus}`, {
                    method: "PATCH", body: JSON.stringify({ status: button.dataset.status })
                });
                await renderActivities();
            } catch (error) { showPlannerError(panel, error); }
        }));
        panel.querySelectorAll("[data-activity-delete]").forEach(button => button.addEventListener("click", async () => {
            try {
                await plannerRequest(`/api/activities/${button.dataset.activityDelete}`, { method: "DELETE" });
                await renderActivities();
            } catch (error) { showPlannerError(panel, error); }
        }));
    } catch (error) { showPlannerError(panel, error); }
}


/* =========================================================
   RUTINA
   ========================================================= */

async function renderRoutine() {
    const panel = document.getElementById("panelContent");
    panel.innerHTML = '<p class="planner-message">Cargando rutina…</p>';
    try {
        routine = (await plannerRequest("/api/routine")).routine;
        panel.innerHTML = `
            <form class="planner-form" id="routineForm">
                <label>Hora<input name="time" type="time"></label>
                <label>Actividad<input name="title" maxlength="120" placeholder="Paso de la rutina" required></label>
                <button class="planner-button" type="submit">Agregar a hoy</button>
            </form>
            <ol class="routine-list planner-routine-list">
                ${routine.length ? routine.map(item => `
                    <li class="${item.completed ? "is-complete" : ""}">
                        <label><input type="checkbox" data-routine-status="${item.id}" ${item.completed ? "checked" : ""}><span>${item.time ? `<time>${escapeHTML(item.time)}</time>` : ""}${escapeHTML(item.title)}</span></label>
                        <button type="button" class="planner-delete" data-routine-delete="${item.id}" aria-label="Eliminar ${escapeHTML(item.title)}">Eliminar</button>
                    </li>
                `).join("") : '<li class="planner-message">Agrega los pasos para organizar el día.</li>'}
            </ol>`;

        panel.querySelector("#routineForm").addEventListener("submit", async event => {
            event.preventDefault();
            const data = Object.fromEntries(new FormData(event.currentTarget));
            try {
                await plannerRequest("/api/routine", { method: "POST", body: JSON.stringify(data) });
                await renderRoutine();
            } catch (error) { showPlannerError(panel, error); }
        });
        panel.querySelectorAll("[data-routine-status]").forEach(input => input.addEventListener("change", async () => {
            try {
                await plannerRequest(`/api/routine/${input.dataset.routineStatus}`, {
                    method: "PATCH", body: JSON.stringify({ completed: input.checked })
                });
                await renderRoutine();
            } catch (error) { showPlannerError(panel, error); }
        }));
        panel.querySelectorAll("[data-routine-delete]").forEach(button => button.addEventListener("click", async () => {
            try {
                await plannerRequest(`/api/routine/${button.dataset.routineDelete}`, { method: "DELETE" });
                await renderRoutine();
            } catch (error) { showPlannerError(panel, error); }
        }));
    } catch (error) { showPlannerError(panel, error); }
}


/* =========================================================
   CALENDARIO
   ========================================================= */

async function renderCalendar() {
    const panel = document.getElementById("panelContent");
    panel.innerHTML = '<p class="planner-message">Cargando calendario…</p>';
    try {
        calendar = (await plannerRequest("/api/calendar")).events;
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
        panel.innerHTML = `
            <form class="planner-form planner-calendar-form" id="calendarForm">
                <label>Evento<input name="title" maxlength="120" placeholder="Nombre del evento" required></label>
                <label>Fecha<input name="date" type="date" value="${today}" required></label>
                <label>Hora<input name="time" type="time"></label>
                <label>Descripción<input name="description" maxlength="500" placeholder="Detalle opcional"></label>
                <button class="planner-button" type="submit">Guardar evento</button>
            </form>
            <div class="planner-list">
                ${calendar.length ? calendar.map(item => `
                    <article class="planner-item">
                        <div><time class="planner-date" datetime="${escapeHTML(item.date)}">${escapeHTML(new Date(`${item.date}T00:00:00`).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" }))}${item.time ? ` · ${escapeHTML(item.time)}` : ""}</time><strong>${escapeHTML(item.title)}</strong><p>${escapeHTML(item.description || "Sin descripción")}</p></div>
                        <button type="button" class="planner-delete" data-calendar-delete="${item.id}" aria-label="Eliminar ${escapeHTML(item.title)}">Eliminar</button>
                    </article>
                `).join("") : '<p class="planner-message">Aún no hay eventos. Agrega el primero.</p>'}
            </div>`;

        panel.querySelector("#calendarForm").addEventListener("submit", async event => {
            event.preventDefault();
            const data = Object.fromEntries(new FormData(event.currentTarget));
            try {
                await plannerRequest("/api/calendar", { method: "POST", body: JSON.stringify(data) });
                await renderCalendar();
            } catch (error) { showPlannerError(panel, error); }
        });
        panel.querySelectorAll("[data-calendar-delete]").forEach(button => button.addEventListener("click", async () => {
            try {
                await plannerRequest(`/api/calendar/${button.dataset.calendarDelete}`, { method: "DELETE" });
                await renderCalendar();
            } catch (error) { showPlannerError(panel, error); }
        }));
    } catch (error) { showPlannerError(panel, error); }
}


/* =========================================================
   CHATS
   ========================================================= */

async function renderChat(type) {
    if (chatRefreshTimer) window.clearInterval(chatRefreshTimer);
    const panel = document.getElementById("panelContent");
    panel.innerHTML = '<p class="planner-message">Cargando conversaciones…</p>';

    try {
        const result = await plannerRequest("/api/chat/contacts");
        const requestResult = await plannerRequest("/api/chat/requests");
        const contacts = result.contacts.filter(contact => {
            if (type === "familia") {
                return currentUser.role === "persona"
                    ? contact.role === "familiar"
                    : currentUser.role === "familiar" && contact.role === "persona";
            }
            if (type === "profesional") {
                return currentUser.role === "persona"
                    ? contact.role === "profesional"
                    : currentUser.role === "familiar"
                        ? contact.role === "profesional"
                        : currentUser.role === "profesional" && ["persona", "familiar"].includes(contact.role);
            }
            return currentUser.role === "persona" && contact.role === "persona";
        });
        const relationshipOptions = currentUser.role === "persona"
            ? `<select name="relationship" aria-label="Tipo de vínculo"><option value="familiar">Educador o cuidador</option><option value="profesional">Profesional</option></select>`
            : "";

        panel.innerHTML = `
            <section class="chat-workspace" aria-label="Conversaciones">
                <aside class="chat-contact-panel">
                    <h3>Personas vinculadas</h3>
                    <div class="chat-contact-list">
                        ${contacts.length ? contacts.map(contact => `
                            <button type="button" class="chat-contact" data-contact-id="${contact.id}">
                                <span class="chat-contact-avatar" aria-hidden="true">${escapeHTML(contact.name.charAt(0).toUpperCase())}</span>
                                <span><strong>${escapeHTML(contact.name)}</strong><small>${escapeHTML(contact.role === "familiar" ? "Educador / cuidador" : contact.role === "profesional" ? "Profesional" : "Persona con TEA")}</small></span>
                            </button>
                        `).join("") : '<p class="planner-message">Aún no tienes personas vinculadas.</p>'}
                    </div>
                    <form class="chat-link-form" id="chatLinkForm">
                        <h3>Conectar una cuenta</h3>
                        <label>Correo de la persona<input name="email" type="email" autocomplete="email" placeholder="persona@correo.com" required></label>
                        ${relationshipOptions}
                        <button class="planner-button" type="submit">Enviar solicitud</button>
                        <small id="chatLinkStatus" role="status" aria-live="polite"></small>
                    </form>
                    ${requestResult.requests.length ? `
                        <section class="chat-invitations">
                            <h3>Solicitudes recibidas</h3>
                            ${requestResult.requests.map(invite => `
                                <article class="chat-invitation">
                                    <strong>${escapeHTML(invite.requesterName)}</strong>
                                    <small>${escapeHTML(invite.requesterEmail)} · ${invite.relationship === "familiar" ? "Educador / cuidador" : "Profesional"}</small>
                                    <div><button type="button" data-invite-decision="aceptar" data-invite-id="${invite.id}">Aceptar</button><button type="button" data-invite-decision="rechazar" data-invite-id="${invite.id}">Rechazar</button></div>
                                </article>
                            `).join("")}
                        </section>` : ""}
                </aside>
                <section class="chat-conversation" id="chatConversation" aria-live="polite">
                    <p class="planner-message">${contacts.length ? "Selecciona una persona para abrir la conversación." : "Envía o acepta una solicitud de vínculo para habilitar el chat."}</p>
                </section>
            </section>`;

        panel.querySelector("#chatLinkForm").addEventListener("submit", async event => {
            event.preventDefault();
            const form = event.currentTarget;
            const data = Object.fromEntries(new FormData(form));
            const status = panel.querySelector("#chatLinkStatus");
            const button = form.querySelector("button[type='submit']");
            button.disabled = true;
            try {
                await plannerRequest("/api/chat/requests", { method: "POST", body: JSON.stringify(data) });
                status.textContent = "Solicitud enviada. El chat se abrirá cuando la acepten.";
                form.reset();
            } catch (error) {
                status.textContent = error.message;
            } finally {
                button.disabled = false;
            }
        });

        panel.querySelectorAll("[data-invite-decision]").forEach(button => {
            button.addEventListener("click", async () => {
                try {
                    await plannerRequest(`/api/chat/requests/${button.dataset.inviteId}`, {
                        method: "PATCH", body: JSON.stringify({ decision: button.dataset.inviteDecision })
                    });
                    await renderChat(type);
                } catch (error) { showPlannerError(panel, error); }
            });
        });

        panel.querySelectorAll("[data-contact-id]").forEach(button => {
            button.addEventListener("click", () => {
                const contact = contacts.find(item => String(item.id) === button.dataset.contactId);
                if (contact) openConversation(contact);
            });
        });
        panel.querySelector("[data-contact-id]")?.click();

        async function openConversation(contact) {
            if (chatRefreshTimer) window.clearInterval(chatRefreshTimer);
            panel.querySelectorAll("[data-contact-id]").forEach(button => {
                button.classList.toggle("active", button.dataset.contactId === String(contact.id));
            });
            const conversation = panel.querySelector("#chatConversation");
            conversation.innerHTML = `
                <header class="chat-conversation-header">
                    <span class="chat-contact-avatar" aria-hidden="true">${escapeHTML(contact.name.charAt(0).toUpperCase())}</span>
                    <div><strong>${escapeHTML(contact.name)}</strong><small>Conversación privada</small></div>
                </header>
                <div class="chat-messages" id="chatMessages" aria-live="polite"></div>
                <form class="chat-composer" id="chatComposer">
                    <label for="chatMessage">Mensaje</label>
                    <textarea id="chatMessage" name="text" maxlength="2000" placeholder="Escribe un mensaje…" required></textarea>
                    <button class="planner-button" type="submit">Enviar mensaje</button>
                </form>`;

            async function refreshMessages() {
                try {
                    const data = await plannerRequest(`/api/chat/${contact.id}/messages`);
                    const messageList = conversation.querySelector("#chatMessages");
                    if (!messageList) return;
                    messageList.innerHTML = data.messages.length ? data.messages.map(message => `
                        <article class="chat-message ${Number(message.senderId) === Number(currentUser.id) ? "outgoing" : "incoming"}">
                            <p>${escapeHTML(message.text)}</p>
                            <time>${escapeHTML(new Date(`${message.sentAt.replace(" ", "T")}Z`).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" }))}</time>
                        </article>
                    `).join("") : '<p class="planner-message">Todavía no hay mensajes. Puedes iniciar la conversación.</p>';
                    messageList.scrollTop = messageList.scrollHeight;
                } catch (error) {
                    showPlannerError(conversation, error);
                }
            }

            conversation.querySelector("#chatComposer").addEventListener("submit", async event => {
                event.preventDefault();
                const textarea = event.currentTarget.elements.text;
                const text = textarea.value.trim();
                if (!text) return;
                const submitButton = event.currentTarget.querySelector("button[type='submit']");
                submitButton.disabled = true;
                try {
                    await plannerRequest("/api/chat/messages", {
                        method: "POST",
                        body: JSON.stringify({ recipientId: contact.id, text })
                    });
                    textarea.value = "";
                    await refreshMessages();
                } catch (error) {
                    showPlannerError(conversation, error);
                } finally {
                    submitButton.disabled = false;
                }
            });

            await refreshMessages();
            chatRefreshTimer = window.setInterval(refreshMessages, 4000);
        }
    } catch (error) {
        showPlannerError(panel, error);
    }
}


/* =========================================================
   PERFIL
   ========================================================= */

function renderProfile() {

    const panel =
        document.getElementById(
            "panelContent"
        );


    const name =
        localStorage.getItem(
            "conexiontea_user_name"
        ) ||
        "Usuario";


    panel.innerHTML = `

        <div class="form-grid">

            <div class="form-group">

                <label>
                    Nombre
                </label>

                <input
                    type="text"
                    value="${escapeHTML(name)}"
                    id="profileName"
                >

            </div>


            <div class="form-group">

                <label>
                    Perfil
                </label>

                <select>

                    <option>
                        Usuario
                    </option>

                    <option>
                        Cuidador
                    </option>

                    <option>
                        Profesional
                    </option>

                </select>

            </div>

        </div>

    `;

}


/* =========================================================
   CAMBIO DE PANEL
   ========================================================= */

function showSection(
    section
) {

    if (!['familia', 'profesional', 'pares'].includes(section) && chatRefreshTimer) {
        window.clearInterval(chatRefreshTimer);
        chatRefreshTimer = null;
    }

    const title =
        document.getElementById(
            "panelTitle"
        );


    switch (section) {

        case "comunicacion":

            title.textContent =
                "Comunicación";

            renderCommunication();

            break;


        case "pictogramas":

            title.textContent =
                "Biblioteca de pictogramas";

            renderPictograms();

            break;


        case "actividades":

            title.textContent =
                "Actividades";

            renderActivities();

            break;


        case "rutina":

            title.textContent =
                "Rutina diaria";

            renderRoutine();

            break;


        case "calendario":

            title.textContent =
                "Calendario";

            renderCalendar();

            break;


        case "progreso":

            title.textContent =
                "Mi progreso";

            document.getElementById(
                "panelContent"
            ).innerHTML = `

                <p>
                    Has completado el 72% de las
                    actividades registradas.
                </p>

            `;

            break;


        case "familia":

            title.textContent =
                "Chat familiares";

            renderChat("familia");

            break;


        case "profesional":

            title.textContent =
                "Chat profesional";

            renderChat("profesional");

            break;


        case "pares":

            title.textContent =
                "Chat con pares";

            renderChat("pares");

            break;


        case "perfil":

            title.textContent =
                "Mi perfil";

            renderProfile();

            break;

    }


    document
        .querySelectorAll(
            ".menu-btn"
        )
        .forEach(
            button => {

                button.classList.toggle(
                    "active",
                    button.dataset.section ===
                    section
                );

            }
        );


    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

}


/* =========================================================
   MENÚ
   ========================================================= */

document.addEventListener("click", event => {
    const sectionButton = event.target.closest("[data-section]");
    if (sectionButton) showSection(sectionButton.dataset.section);
});


/* =========================================================
   USUARIO
   ========================================================= */

async function loadUser() {
    let storedName;
    try {
        const result = await plannerRequest("/api/auth/me");
        currentUser = result.user;
        storedName = currentUser.name;
        localStorage.setItem("conexiontea_user_name", storedName);

        const roleSettings = {
            persona: {
                label: "PANEL PERSONAL",
                title: `Hola, ${storedName}`,
                description: "Tu espacio para comunicarte, organizar tu día y guardar tus pictogramas.",
                roleName: "Persona con TEA"
            },
            familiar: {
                label: "PANEL DEL EDUCADOR",
                title: `Hola, ${storedName}`,
                description: "Acompaña a las personas vinculadas y mantén sus conversaciones en un solo lugar.",
                roleName: "Educador / cuidador"
            },
            profesional: {
                label: "PANEL PROFESIONAL",
                title: `Hola, ${storedName}`,
                description: "Comunícate con las personas vinculadas y organiza el acompañamiento profesional.",
                roleName: "Profesional"
            }
        };
        const settings = roleSettings[currentUser.role] || roleSettings.persona;
        document.getElementById("welcomeEyebrow").textContent = settings.label;
        document.getElementById("welcomeTitle").textContent = settings.title;
        document.getElementById("welcomeText").textContent = settings.description;
        document.getElementById("sidebarRole").textContent = settings.roleName;
        renderRoleQuickLinks(currentUser);
        updateChatNavigation(currentUser.role);
    } catch (error) {
        window.location.replace("login.html");
        return false;
    }


    const sidebarName =
        document.getElementById(
            "sidebarUserName"
        );


    const sidebarAvatar =
        document.getElementById(
            "userAvatar"
        );


    const welcomeAvatar =
        document.getElementById(
            "welcomeAvatar"
        );


    if (sidebarName) {

        sidebarName.textContent =
            storedName;

    }


    const firstLetter =
        storedName
            .charAt(0)
            .toUpperCase();


    if (sidebarAvatar) {

        sidebarAvatar.textContent =
            firstLetter;

    }


    if (welcomeAvatar) {

        welcomeAvatar.textContent =
            firstLetter;

    }
    return true;
}

async function renderRoleQuickLinks(user) {
    if (user.role === "persona") return;
    const grid = document.getElementById("quickGrid");
    let contacts = [];
    try {
        contacts = (await plannerRequest("/api/chat/contacts")).contacts;
    } catch (error) {}

    const roleLabel = user.role === "familiar" ? "Personas acompañadas" : "Personas vinculadas";
    const chatSection = user.role === "familiar" ? "familia" : "profesional";
    const count = contacts.length;
    grid.innerHTML = `
        <button class="quick-card role-quick-card" data-section="${chatSection}">
            <span class="quick-icon">${count}</span>
            <strong>${roleLabel}</strong>
            <small>${count === 1 ? "1 persona vinculada" : `${count} personas vinculadas`}</small>
        </button>
        <button class="quick-card role-quick-card" data-section="${chatSection}">
            <span class="quick-icon">↗</span>
            <strong>Conversaciones</strong>
            <small>Mensajes privados entre cuentas vinculadas</small>
        </button>
        <button class="quick-card role-quick-card" data-section="pictogramas">
            <span class="quick-icon">P</span>
            <strong>Biblioteca de pictogramas</strong>
            <small>Explorar, guardar y marcar favoritos</small>
        </button>`;
}

function updateChatNavigation(role) {
    const familyChat = document.getElementById("navFamilyChat");
    const professionalChat = document.getElementById("navProfessionalChat");
    const peerChat = document.getElementById("navPeerChat");

    if (role === "familiar") {
        familyChat.querySelector("span").textContent = "Chat con personas vinculadas";
        professionalChat.querySelector("span").textContent = "Chat con profesionales";
    } else if (role === "profesional") {
        familyChat.querySelector("span").textContent = "Chat con personas vinculadas";
        professionalChat.querySelector("span").textContent = "Chat con personas vinculadas";
    }

    const sectionsByRole = {
        persona: ["comunicacion", "pictogramas", "actividades", "rutina", "calendario", "progreso", "familia", "profesional", "pares", "perfil"],
        familiar: ["familia", "profesional", "pictogramas", "calendario", "perfil"],
        profesional: ["profesional", "pictogramas", "calendario", "perfil"]
    };
    const allowedSections = sectionsByRole[role] || sectionsByRole.persona;
    document.querySelectorAll(".menu-btn").forEach(button => {
        button.hidden = !allowedSections.includes(button.dataset.section);
    });
    document.querySelectorAll(".quick-grid [data-section]").forEach(button => {
        button.hidden = role !== "persona";
    });
    document.querySelector(".progress-panel").hidden = role !== "persona";
}


/* =========================================================
   CERRAR SESIÓN
   ========================================================= */

const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );


if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async () => {
            try {
                await plannerRequest("/api/auth/logout", { method: "POST" });
            } catch (error) {}
            localStorage.removeItem(
                "conexiontea_user_name"
            );

            window.location.href =
                "login.html";

        }
    );

}


/* =========================================================
   ACCESIBILIDAD
   ========================================================= */

const fontSizeControl =
    document.getElementById(
        "fontSizeControl"
    );


if (fontSizeControl) {

    fontSizeControl.addEventListener(
        "change",
        () => {

            document.body.classList.remove(
                "font-large",
                "font-extra-large"
            );


            if (
                fontSizeControl.value ===
                "large"
            ) {

                document.body.classList.add(
                    "font-large"
                );

            }


            if (
                fontSizeControl.value ===
                "extra-large"
            ) {

                document.body.classList.add(
                    "font-extra-large"
                );

            }

        }
    );

}


/* =========================
   TEMA
   ========================= */

const themeControl =
    document.getElementById(
        "themeControl"
    );


if (themeControl) {

    try {
        const savedTheme = localStorage.getItem("ctea-theme");
        if (savedTheme === "dark" || savedTheme === "relaxed") {
            document.body.classList.add(savedTheme);
            themeControl.value = savedTheme;
        }
    } catch (error) {}

    themeControl.addEventListener(
        "change",
        () => {

            document.body.classList.remove(
                "dark",
                "relaxed"
            );


            if (
                themeControl.value ===
                "dark"
            ) {

                document.body.classList.add(
                    "dark"
                );

            }


            if (
                themeControl.value ===
                "relaxed"
            ) {

                document.body.classList.add(
                    "relaxed"
                );

            }

            try {
                localStorage.setItem("ctea-theme", themeControl.value);
            } catch (error) {}

        }
    );

}


/* =========================
   REDUCIR ANIMACIONES
   ========================= */

const reduceMotion =
    document.getElementById(
        "reduceMotion"
    );


if (reduceMotion) {

    reduceMotion.addEventListener(
        "change",
        () => {

            document.body.classList.toggle(
                "reduce-motion",
                reduceMotion.checked
            );

        }
    );

}


/* =========================
   LECTURA DE TEXTO
   ========================= */

const screenReader =
    document.getElementById(
        "screenReader"
    );


if (screenReader) {

    screenReader.addEventListener(
        "change",
        () => {

            if (
                screenReader.checked
            ) {

                speakText(
                    "La lectura de texto está activada."
                );

            }

        }
    );

}


/* =========================
   VIBRACIÓN
   ========================= */

const vibrationControl =
    document.getElementById(
        "vibrationControl"
    );


if (vibrationControl) {

    vibrationControl.addEventListener(
        "change",
        () => {

            if (
                vibrationControl.checked &&
                navigator.vibrate
            ) {

                navigator.vibrate(100);

            }

        }
    );

}


/* =========================================================
   INICIAR DASHBOARD
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {
        if (await loadUser()) {
            const initialSection = currentUser.role === "familiar"
                ? "familia"
                : currentUser.role === "profesional"
                    ? "profesional"
                    : "comunicacion";
            showSection(initialSection);
        }
    }
);