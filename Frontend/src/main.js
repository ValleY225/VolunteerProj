import "./style.css";

const API_BASE = "http://localhost:4000";
const SHIFT_OPTIONS = ["Morning", "Afternoon", "Night"];

const app = document.querySelector("#app");
let currentMode = "register";
let currentUser = getStoredUser();
let currentPage = currentUser ? "dashboard" : "";

render();

function render() {
  if (currentUser) {
    renderShell(currentUser);
    return;
  }

  app.innerHTML = `
    <main class="min-h-screen bg-slate-100 p-6 md:p-10">
      <div class="mx-auto max-w-3xl">
        <header class="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p class="text-sm font-semibold text-orange-600">NGO CONNECT</p>
          <h1 class="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">Role Access</h1>
          <p class="mt-2 text-slate-600">Register or use quick login to enter your dashboard.</p>
        </header>

        <section class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div class="mb-5 inline-flex rounded-xl bg-slate-100 p-1">
            <button id="tab-register" class="rounded-lg px-4 py-2 text-sm font-semibold ${
              currentMode === "register" ? "bg-orange-600 text-white" : "text-slate-700"
            }">Register</button>
            <button id="tab-login" class="rounded-lg px-4 py-2 text-sm font-semibold ${
              currentMode === "login" ? "bg-orange-600 text-white" : "text-slate-700"
            }">Login</button>
          </div>

          ${currentMode === "register" ? registrationFormMarkup() : loginFormMarkup()}
          <p id="statusMessage" class="mt-4 text-sm text-slate-700"></p>
        </section>
      </div>
    </main>
  `;

  document.querySelector("#tab-register").addEventListener("click", () => {
    currentMode = "register";
    render();
  });
  document.querySelector("#tab-login").addEventListener("click", () => {
    currentMode = "login";
    render();
  });

  if (currentMode === "register") bindRegistrationForm();
  else bindLoginForm();
}

function registrationFormMarkup() {
  return `
    <form id="registrationForm" class="grid gap-4">
      <label class="grid gap-1">
        <span class="text-sm font-medium text-slate-700">Name</span>
        <input id="name" name="name" type="text" class="rounded-xl border border-slate-300 px-3 py-2 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200" placeholder="Enter full name" required />
      </label>

      <label class="grid gap-1">
        <span class="text-sm font-medium text-slate-700">Photo for login</span>
        <input id="photo" name="photo" type="file" accept="image/*" class="rounded-xl border border-slate-300 px-3 py-2 text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-orange-100 file:px-3 file:py-1.5 file:font-medium file:text-orange-700" required />
      </label>

      <label class="grid gap-1">
        <span class="text-sm font-medium text-slate-700">Region of action</span>
        <select id="region" name="region" class="rounded-xl border border-slate-300 px-3 py-2 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200" required>
          <option value="">Select region</option>
          <option value="Almaty">Almaty</option>
          <option value="Astana">Astana</option>
        </select>
      </label>

      <label class="grid gap-1">
        <span class="text-sm font-medium text-slate-700">Date of birthday</span>
        <input id="birthDate" name="birthDate" type="date" class="rounded-xl border border-slate-300 px-3 py-2 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200" required />
      </label>

      <fieldset class="rounded-xl border border-slate-300 p-3">
        <legend class="px-1 text-sm font-medium text-slate-700">Role</legend>
        <div class="mt-1 flex flex-wrap gap-5">
          <label class="inline-flex items-center gap-2 text-slate-700">
            <input type="radio" name="role" value="Participant" class="accent-orange-600" required />
            Participant
          </label>
          <label class="inline-flex items-center gap-2 text-slate-700">
            <input type="radio" name="role" value="Coordinator" class="accent-orange-600" required />
            Coordinator
          </label>
        </div>
      </fieldset>

      <button type="submit" id="submitBtn" class="mt-1 rounded-xl bg-orange-600 px-4 py-2.5 font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-slate-400">
        Register
      </button>
    </form>
  `;
}

function loginFormMarkup() {
  return `
    <form id="loginForm" class="grid gap-4">
      <label class="grid gap-1">
        <span class="text-sm font-medium text-slate-700">Name</span>
        <input id="loginName" name="name" type="text" class="rounded-xl border border-slate-300 px-3 py-2 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200" placeholder="Enter full name" required />
      </label>

      <label class="grid gap-1">
        <span class="text-sm font-medium text-slate-700">Date of birthday</span>
        <input id="loginBirthDate" name="birthDate" type="date" class="rounded-xl border border-slate-300 px-3 py-2 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200" required />
      </label>

      <fieldset class="rounded-xl border border-slate-300 p-3">
        <legend class="px-1 text-sm font-medium text-slate-700">Role</legend>
        <div class="mt-1 flex flex-wrap gap-5">
          <label class="inline-flex items-center gap-2 text-slate-700">
            <input type="radio" name="role" value="Participant" class="accent-orange-600" required />
            Participant
          </label>
          <label class="inline-flex items-center gap-2 text-slate-700">
            <input type="radio" name="role" value="Coordinator" class="accent-orange-600" required />
            Coordinator
          </label>
        </div>
      </fieldset>

      <button type="submit" id="loginBtn" class="mt-1 rounded-xl bg-orange-600 px-4 py-2.5 font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-slate-400">
        Login
      </button>
    </form>
    <div class="mt-5">
      <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Quick Login Users</h3>
      <div id="quickUsersContainer" class="mt-2 grid gap-2"></div>
    </div>
  `;
}

function bindRegistrationForm() {
  const form = document.querySelector("#registrationForm");
  const statusMessage = document.querySelector("#statusMessage");
  const submitBtn = document.querySelector("#submitBtn");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    statusMessage.textContent = "";
    submitBtn.disabled = true;
    submitBtn.textContent = "Registering...";

    try {
      const formData = new FormData(form);
      const response = await fetch(`${API_BASE}/api/register`, {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Registration failed.");

      statusMessage.textContent = `Registered ${result.user.name}. You can login now.`;
      statusMessage.className = "mt-4 text-sm font-medium text-green-700";
      form.reset();
      currentMode = "login";
      setTimeout(render, 700);
    } catch (error) {
      statusMessage.textContent = error.message || "Unexpected error happened.";
      statusMessage.className = "mt-4 text-sm font-medium text-red-600";
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Register";
    }
  });
}

function bindLoginForm() {
  const form = document.querySelector("#loginForm");
  const statusMessage = document.querySelector("#statusMessage");
  const loginBtn = document.querySelector("#loginBtn");
  loadQuickUsersForLogin(form);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    statusMessage.textContent = "";
    loginBtn.disabled = true;
    loginBtn.textContent = "Logging in...";

    try {
      const payload = Object.fromEntries(new FormData(form).entries());
      const response = await fetch(`${API_BASE}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Login failed.");

      currentUser = result.user;
      currentPage = "dashboard";
      saveUser(currentUser);
      render();
    } catch (error) {
      statusMessage.textContent = error.message || "Unexpected error happened.";
      statusMessage.className = "mt-4 text-sm font-medium text-red-600";
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = "Login";
    }
  });
}

function renderShell(user) {
  const navItems = roleNavItems(user.role);
  if (!navItems.some((item) => item.page === currentPage)) {
    currentPage = navItems[0].page;
  }

  app.innerHTML = `
    <main class="min-h-screen bg-slate-100">
      <div class="flex min-h-screen">
        <aside class="flex w-72 flex-col border-r border-slate-200 bg-white p-5">
          <div>
            <p class="text-sm font-semibold text-orange-600">NGO CONNECT</p>
            <h1 class="mt-2 text-lg font-bold text-slate-900">${user.role} Portal</h1>
          </div>
          <nav class="mt-6 grid gap-2">
            ${navItems
              .map(
                (item) => `
                  <button
                    data-page="${item.page}"
                    class="sidebar-link rounded-xl px-4 py-2 text-left text-sm font-semibold ${
                      currentPage === item.page
                        ? "bg-orange-600 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }"
                  >
                    ${item.label}
                  </button>
                `
              )
              .join("")}
          </nav>

          <div class="mt-auto pt-8">
            <div class="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div class="flex items-center gap-3">
                <img src="${API_BASE}${user.photoUrl}" alt="${escapeHtml(user.name)}" class="h-12 w-12 rounded-full object-cover" />
                <div>
                  <p class="text-sm font-semibold text-slate-900">${escapeHtml(user.name)}</p>
                  <p class="text-xs text-slate-500">${user.region}</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <section class="flex-1 p-6 md:p-8">
          <header class="mb-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="text-sm text-slate-500">Navigation</p>
                <h2 id="pageTitle" class="mt-1 text-2xl font-bold text-slate-900"></h2>
              </div>
              <button id="logoutBtn" class="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-900">Logout</button>
            </div>
          </header>

          <section id="pageContent" class="grid gap-4 md:grid-cols-2">
            <article class="rounded-xl border border-slate-200 bg-white p-4 md:col-span-2">
              <h3 class="font-semibold text-slate-900">Loading...</h3>
            </article>
          </section>
        </section>
      </div>
    </main>
  `;

  document.querySelectorAll(".sidebar-link").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentPage = btn.getAttribute("data-page");
      renderShell(user);
    });
  });

  document.querySelector("#logoutBtn").addEventListener("click", () => {
    currentUser = null;
    clearUser();
    currentMode = "login";
    currentPage = "";
    render();
  });

  renderCurrentPage(user);
}

function renderCurrentPage(user) {
  const title = document.querySelector("#pageTitle");
  const content = document.querySelector("#pageContent");
  title.textContent = pageTitleFor(currentPage, user.role);

  if (user.role === "Participant") {
    if (currentPage === "dashboard") return renderParticipantDashboard(user, content);
    if (currentPage === "events") return renderParticipantEvents(user, content);
    return renderProfileSettings(user, content);
  }

  if (currentPage === "dashboard") return renderCoordinatorDashboard(user, content);
  if (currentPage === "events") return renderCoordinatorEvents(user, content);
  if (currentPage === "participants") return renderCoordinatorParticipants(user, content);
  return renderProfileSettings(user, content);
}

async function renderParticipantDashboard(user, content) {
  try {
    const [events, joins] = await Promise.all([
      apiJson("/api/events"),
      apiJson(`/api/participants/${user.id}/joins`),
    ]);
    content.innerHTML = `
      <article class="rounded-xl border border-slate-200 bg-white p-5">
        <p class="text-sm text-slate-500">Total events</p>
        <p class="mt-2 text-3xl font-bold text-slate-900">${events.length}</p>
      </article>
      <article class="rounded-xl border border-slate-200 bg-white p-5">
        <p class="text-sm text-slate-500">Joined events</p>
        <p class="mt-2 text-3xl font-bold text-slate-900">${joins.length}</p>
      </article>
      <article class="rounded-xl border border-slate-200 bg-white p-5 md:col-span-2">
        <h3 class="font-semibold text-slate-900">Current Event Log</h3>
        <ul class="mt-3 grid gap-2">
          ${
            joins.length
              ? joins
                  .map(
                    (join) => `
                    <li class="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                      ${escapeHtml(join.eventName)} (${join.eventRegion}) - <b>${join.shift}</b>
                    </li>
                  `
                  )
                  .join("")
              : `<li class="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">No current event logs yet.</li>`
          }
        </ul>
      </article>
    `;
  } catch (error) {
    content.innerHTML = renderErrorCard(error.message || "Failed to load dashboard.");
  }
}

async function renderParticipantEvents(user, content) {
  try {
    const [events, joins] = await Promise.all([
      apiJson("/api/events"),
      apiJson(`/api/participants/${user.id}/joins`),
    ]);
    const joinByEventId = new Map(joins.map((join) => [join.eventId, join]));

    content.innerHTML = `
      <article class="rounded-xl border border-slate-200 bg-white p-4 md:col-span-2">
        <h3 class="font-semibold text-slate-900">Available Events</h3>
        <div class="mt-4 grid gap-4 md:grid-cols-2">
          ${
            events.length
              ? events
                  .map((event) => {
                    const existingJoin = joinByEventId.get(event.id);
                    return `
                    <article class="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <img src="${API_BASE}${event.photoUrl}" alt="${escapeHtml(event.name)}" class="mb-3 h-40 w-full rounded-lg object-cover" />
                      <h4 class="text-lg font-semibold text-slate-900">${escapeHtml(event.name)}</h4>
                      <p class="mt-1 text-sm text-slate-600">${escapeHtml(event.description)}</p>
                      <p class="mt-2 text-sm text-slate-500">Region: ${event.region} · ${escapeHtml(event.coordinatorName)}</p>
                      <form class="participant-join-form mt-3 flex items-center gap-2" data-event-id="${event.id}">
                        <select name="shift" class="rounded-lg border border-slate-300 px-3 py-2 text-sm">
                          ${SHIFT_OPTIONS.map(
                            (shift) =>
                              `<option value="${shift}" ${existingJoin?.shift === shift ? "selected" : ""}>${shift}</option>`
                          ).join("")}
                        </select>
                        <button type="submit" class="rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-700">
                          ${existingJoin ? "Update Shift" : "Join Event"}
                        </button>
                      </form>
                    </article>
                  `;
                  })
                  .join("")
              : `<p class="text-sm text-slate-600">No events available yet.</p>`
          }
        </div>
        <p id="participantActionStatus" class="mt-3 text-sm text-slate-700"></p>
      </article>
    `;

    document.querySelectorAll(".participant-join-form").forEach((form) => {
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const eventId = form.getAttribute("data-event-id");
        const shift = new FormData(form).get("shift");
        const statusEl = document.querySelector("#participantActionStatus");
        try {
          const result = await apiJson(`/api/events/${eventId}/join`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ participantId: user.id, shift }),
          });
          statusEl.textContent = result.message;
          statusEl.className = "mt-3 text-sm font-medium text-green-700";
          renderParticipantEvents(user, content);
        } catch (error) {
          statusEl.textContent = error.message || "Failed to join event.";
          statusEl.className = "mt-3 text-sm font-medium text-red-600";
        }
      });
    });
  } catch (error) {
    content.innerHTML = renderErrorCard(error.message || "Failed to load events.");
  }
}

async function renderCoordinatorDashboard(user, content) {
  try {
    const [events, participants] = await Promise.all([
      apiJson("/api/events"),
      apiJson(`/api/coordinators/${user.id}/participants`),
    ]);
    const myEvents = events.filter((event) => event.coordinatorId === user.id);

    content.innerHTML = `
      <article class="rounded-xl border border-slate-200 bg-white p-5">
        <p class="text-sm text-slate-500">My events</p>
        <p class="mt-2 text-3xl font-bold text-slate-900">${myEvents.length}</p>
      </article>
      <article class="rounded-xl border border-slate-200 bg-white p-5">
        <p class="text-sm text-slate-500">Joined participants</p>
        <p class="mt-2 text-3xl font-bold text-slate-900">${participants.length}</p>
      </article>
      <article class="rounded-xl border border-slate-200 bg-white p-5 md:col-span-2">
        <h3 class="font-semibold text-slate-900">Recent Participants</h3>
        <ul class="mt-3 grid gap-2">
          ${
            participants.length
              ? participants
                  .slice(0, 8)
                  .map(
                    (row) => `
                    <li class="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                      ${escapeHtml(row.participantName)} joined <b>${escapeHtml(row.eventName)}</b> (${row.shift})
                    </li>
                  `
                  )
                  .join("")
              : `<li class="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">No participants yet.</li>`
          }
        </ul>
      </article>
    `;
  } catch (error) {
    content.innerHTML = renderErrorCard(error.message || "Failed to load dashboard.");
  }
}

async function renderCoordinatorEvents(user, content) {
  try {
    const allEvents = await apiJson("/api/events");
    const myEvents = allEvents.filter((event) => event.coordinatorId === user.id);

    content.innerHTML = `
      <article class="rounded-xl border border-slate-200 bg-white p-4 md:col-span-2">
        <h3 class="font-semibold text-slate-900">Create Event</h3>
        <form id="createEventForm" class="mt-3 grid gap-3 md:grid-cols-2">
          <input type="text" name="name" placeholder="Event Name" class="rounded-lg border border-slate-300 px-3 py-2" required />
          <select name="region" class="rounded-lg border border-slate-300 px-3 py-2" required>
            <option value="">Select region</option>
            <option value="Almaty">Almaty</option>
            <option value="Astana">Astana</option>
          </select>
          <textarea name="description" rows="3" class="rounded-lg border border-slate-300 px-3 py-2 md:col-span-2" placeholder="Description" required></textarea>
          <input type="file" name="photo" accept="image/*" class="rounded-lg border border-slate-300 px-3 py-2 md:col-span-2" required />
          <button id="createEventBtn" type="submit" class="rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700 md:col-span-2">Create Event</button>
        </form>
        <p id="eventActionStatus" class="mt-3 text-sm text-slate-700"></p>
      </article>

      <article class="rounded-xl border border-slate-200 bg-white p-4 md:col-span-2">
        <h3 class="font-semibold text-slate-900">Event Settings</h3>
        <div class="mt-4 grid gap-4 md:grid-cols-2">
          ${
            myEvents.length
              ? myEvents
                  .map(
                    (event) => `
                    <article class="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <img src="${API_BASE}${event.photoUrl}" alt="${escapeHtml(event.name)}" class="mb-3 h-36 w-full rounded-lg object-cover" />
                      <form class="event-settings-form grid gap-2" data-event-id="${event.id}">
                        <input type="text" name="name" value="${escapeHtmlAttr(event.name)}" class="rounded-lg border border-slate-300 px-3 py-2 text-sm" required />
                        <textarea name="description" rows="2" class="rounded-lg border border-slate-300 px-3 py-2 text-sm" required>${escapeHtml(event.description)}</textarea>
                        <select name="region" class="rounded-lg border border-slate-300 px-3 py-2 text-sm" required>
                          <option value="Almaty" ${event.region === "Almaty" ? "selected" : ""}>Almaty</option>
                          <option value="Astana" ${event.region === "Astana" ? "selected" : ""}>Astana</option>
                        </select>
                        <input type="file" name="photo" accept="image/*" class="rounded-lg border border-slate-300 px-3 py-2 text-xs" />
                        <div class="flex gap-2">
                          <button type="submit" class="rounded-lg bg-orange-600 px-3 py-2 text-xs font-semibold text-white hover:bg-orange-700">Save Event</button>
                          <button type="button" class="delete-event-btn rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700" data-event-id="${event.id}">Delete</button>
                        </div>
                      </form>
                    </article>
                  `
                  )
                  .join("")
              : `<p class="text-sm text-slate-600">No events created yet.</p>`
          }
        </div>
      </article>
    `;

    bindCoordinatorEventActions(user, content);
  } catch (error) {
    content.innerHTML = renderErrorCard(error.message || "Failed to load events.");
  }
}

async function renderCoordinatorParticipants(user, content) {
  try {
    const rows = await apiJson(`/api/coordinators/${user.id}/participants`);
    content.innerHTML = `
      <article class="rounded-xl border border-slate-200 bg-white p-4 md:col-span-2">
        <h3 class="font-semibold text-slate-900">Participants & Shifts</h3>
        <div class="mt-3 overflow-x-auto">
          <table class="min-w-full border border-slate-200">
            <thead class="bg-slate-50">
              <tr>
                <th class="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Participant</th>
                <th class="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Event</th>
                <th class="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Shift</th>
              </tr>
            </thead>
            <tbody>
              ${
                rows.length
                  ? rows
                      .map(
                        (row) => `
                        <tr class="border-t border-slate-200">
                          <td class="px-3 py-2 text-sm text-slate-700">${escapeHtml(row.participantName)}</td>
                          <td class="px-3 py-2 text-sm text-slate-700">${escapeHtml(row.eventName)}</td>
                          <td class="px-3 py-2 text-sm font-medium text-slate-800">${row.shift}</td>
                        </tr>
                      `
                      )
                      .join("")
                  : `<tr><td class="px-3 py-3 text-sm text-slate-600" colspan="3">No participants joined your events yet.</td></tr>`
              }
            </tbody>
          </table>
        </div>
      </article>
    `;
  } catch (error) {
    content.innerHTML = renderErrorCard(error.message || "Failed to load participants.");
  }
}

function renderProfileSettings(user, content) {
  content.innerHTML = `
    <article class="rounded-xl border border-slate-200 bg-white p-5 md:col-span-2">
      <h3 class="font-semibold text-slate-900">Profile Settings</h3>
      <form id="profileForm" class="mt-4 grid gap-3 md:grid-cols-2">
        <input type="text" name="name" value="${escapeHtmlAttr(user.name)}" class="rounded-lg border border-slate-300 px-3 py-2" required />
        <select name="region" class="rounded-lg border border-slate-300 px-3 py-2" required>
          <option value="Almaty" ${user.region === "Almaty" ? "selected" : ""}>Almaty</option>
          <option value="Astana" ${user.region === "Astana" ? "selected" : ""}>Astana</option>
        </select>
        <input type="date" name="birthDate" value="${escapeHtmlAttr(user.birthDate)}" class="rounded-lg border border-slate-300 px-3 py-2" required />
        <input type="file" name="photo" accept="image/*" class="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <button id="profileBtn" type="submit" class="rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700 md:col-span-2">Save Profile</button>
      </form>
      <p id="profileStatus" class="mt-3 text-sm text-slate-700"></p>
    </article>
  `;

  const form = document.querySelector("#profileForm");
  const btn = document.querySelector("#profileBtn");
  const status = document.querySelector("#profileStatus");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    btn.disabled = true;
    btn.textContent = "Saving...";
    try {
      const formData = new FormData(form);
      const response = await fetch(`${API_BASE}/api/users/${user.id}`, {
        method: "PATCH",
        body: formData,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Failed to update profile.");
      currentUser = result.user;
      saveUser(currentUser);
      status.textContent = "Profile updated.";
      status.className = "mt-3 text-sm font-medium text-green-700";
      renderShell(currentUser);
    } catch (error) {
      status.textContent = error.message || "Unexpected error happened.";
      status.className = "mt-3 text-sm font-medium text-red-600";
    } finally {
      btn.disabled = false;
      btn.textContent = "Save Profile";
    }
  });
}

function bindCoordinatorEventActions(user, content) {
  const createForm = document.querySelector("#createEventForm");
  const createBtn = document.querySelector("#createEventBtn");
  const status = document.querySelector("#eventActionStatus");

  createForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    createBtn.disabled = true;
    createBtn.textContent = "Creating...";
    try {
      const formData = new FormData(createForm);
      formData.append("coordinatorId", user.id);
      const result = await fetchOrThrow(`${API_BASE}/api/events`, {
        method: "POST",
        body: formData,
      });
      status.textContent = result.message;
      status.className = "mt-3 text-sm font-medium text-green-700";
      createForm.reset();
      renderCoordinatorEvents(user, content);
    } catch (error) {
      status.textContent = error.message || "Failed to create event.";
      status.className = "mt-3 text-sm font-medium text-red-600";
    } finally {
      createBtn.disabled = false;
      createBtn.textContent = "Create Event";
    }
  });

  document.querySelectorAll(".event-settings-form").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const eventId = form.getAttribute("data-event-id");
      const formData = new FormData(form);
      formData.append("coordinatorId", user.id);
      try {
        await fetchOrThrow(`${API_BASE}/api/events/${eventId}`, {
          method: "PATCH",
          body: formData,
        });
        renderCoordinatorEvents(user, content);
      } catch (error) {
        alert(error.message || "Failed to save event.");
      }
    });
  });

  document.querySelectorAll(".delete-event-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const eventId = btn.getAttribute("data-event-id");
      try {
        await fetchOrThrow(`${API_BASE}/api/events/${eventId}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ coordinatorId: user.id }),
        });
        renderCoordinatorEvents(user, content);
      } catch (error) {
        alert(error.message || "Failed to delete event.");
      }
    });
  });
}

async function loadQuickUsersForLogin(form) {
  const container = document.querySelector("#quickUsersContainer");
  if (!container) return;
  container.innerHTML = `<p class="text-sm text-slate-500">Loading users...</p>`;
  try {
    const users = await apiJson("/api/users/short");
    if (!users.length) {
      container.innerHTML = `<p class="text-sm text-slate-500">No registered users yet.</p>`;
      return;
    }
    container.innerHTML = users
      .slice(0, 8)
      .map(
        (user) => `
          <button type="button" class="quick-user-btn flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left hover:bg-slate-100"
            data-name="${escapeHtmlAttr(user.name)}"
            data-birth-date="${escapeHtmlAttr(user.birthDate)}"
            data-role="${escapeHtmlAttr(user.role)}">
            <span class="flex items-center gap-3">
              <img src="${API_BASE}${user.photoUrl}" alt="${escapeHtml(user.name)}" class="h-9 w-9 rounded-full object-cover" />
              <span>
                <span class="block text-sm font-semibold text-slate-900">${escapeHtml(user.name)}</span>
                <span class="block text-xs text-slate-500">${user.role} · ${user.region}</span>
              </span>
            </span>
            <span class="rounded bg-orange-100 px-2 py-1 text-xs font-semibold text-orange-700">Use</span>
          </button>
        `
      )
      .join("");

    document.querySelectorAll(".quick-user-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        form.querySelector('input[name="name"]').value = btn.getAttribute("data-name") || "";
        form.querySelector('input[name="birthDate"]').value = btn.getAttribute("data-birth-date") || "";
        const role = btn.getAttribute("data-role");
        const roleInput = form.querySelector(`input[name="role"][value="${role}"]`);
        if (roleInput) roleInput.checked = true;
      });
    });
  } catch (_error) {
    container.innerHTML = `<p class="text-sm text-red-600">Failed to load quick users.</p>`;
  }
}

function roleNavItems(role) {
  if (role === "Participant") {
    return [
      { page: "dashboard", label: "Dashboard" },
      { page: "events", label: "Events" },
      { page: "profile", label: "Profile Settings" },
    ];
  }
  return [
    { page: "dashboard", label: "Dashboard" },
    { page: "events", label: "My Events" },
    { page: "participants", label: "Participants" },
    { page: "profile", label: "Profile Settings" },
  ];
}

function pageTitleFor(page, role) {
  if (page === "dashboard") return `${role} Dashboard`;
  if (page === "events") return role === "Participant" ? "Events & Shift Join" : "Event Settings";
  if (page === "participants") return "Participants & Shifts";
  return "Profile Settings";
}

function renderErrorCard(message) {
  return `
    <article class="rounded-xl border border-slate-200 bg-white p-4 md:col-span-2">
      <h3 class="font-semibold text-slate-900">Error</h3>
      <p class="mt-1 text-sm text-red-600">${escapeHtml(message)}</p>
    </article>
  `;
}

async function apiJson(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, options);
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "Request failed.");
  return result;
}

async function fetchOrThrow(url, options = {}) {
  const response = await fetch(url, options);
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "Request failed.");
  return result;
}

function getStoredUser() {
  const raw = localStorage.getItem("ngo_current_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (_error) {
    return null;
  }
}

function saveUser(user) {
  localStorage.setItem("ngo_current_user", JSON.stringify(user));
}

function clearUser() {
  localStorage.removeItem("ngo_current_user");
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeHtmlAttr(value) {
  return escapeHtml(value);
}
