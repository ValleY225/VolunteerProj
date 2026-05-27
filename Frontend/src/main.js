import "./style.css";

const API_BASE =
  import.meta.env.VITE_API_BASE ??
  (window.location.hostname === "localhost" ? "http://localhost:4000" : "");
const SHIFT_OPTIONS = ["Morning", "Afternoon", "Night"];
const LANDING_HERO_IMAGE = new URL("../../PhotoOnMain.png", import.meta.url).href;
const REGISTER_BACKGROUND_IMAGE = new URL("../../images.png", import.meta.url).href;
const DASHBOARD_BACKGROUND_IMAGE = new URL("../../background.png", import.meta.url).href;
const HEART_ICON_IMAGE = new URL("../../HeartIcon.jpg", import.meta.url).href;

const app = document.querySelector("#app");
let currentMode = "landing";
let currentUser = getStoredUser();
let currentPage = currentUser ? "dashboard" : "";
let selectedEventId = null;
let eventDetailTab = "participants";
let preferredRole = null;
let selectedChatGroupId = null;
const pendingChatMessagesByGroup = new Map();

// Слушаем событие от React
window.addEventListener('userChanged', (event) => {
  const user = event.detail;
  console.log('User changed from React:', user);
  
  if (user) {
    currentUser = user;
    currentPage = "dashboard";
    render();
  } else {
    currentUser = null;
    currentMode = "login";
    render();
  }
});

// Также слушаем прямые изменения localStorage (на всякий случай)
window.addEventListener('storage', (event) => {
  if (event.key === 'ngo_current_user') {
    console.log('localStorage changed by another tab/window');
    if (event.newValue) {
      currentUser = JSON.parse(event.newValue);
      currentPage = "dashboard";
    } else {
      currentUser = null;
      currentMode = "login";
    }
    render();
  }
});

render();

function render() {
  if (currentUser) {
    renderShell(currentUser);
    return;
  }

  if (currentMode === "landing") {
    app.innerHTML = landingMarkup();
    bindLandingActions();
    return;
  }

  app.innerHTML = `
    <main class="auth-main relative min-h-screen overflow-hidden bg-slate-900 p-6 md:p-10">
      <div class="pointer-events-none absolute inset-0">
        <div class="absolute inset-0 bg-cover bg-center opacity-70" style="background-image: url('${REGISTER_BACKGROUND_IMAGE}');"></div>
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.14)_0%,rgba(15,23,42,0.50)_72%)]"></div>
      </div>
      <div class="relative mx-auto max-w-3xl">
        <header class="mb-6 rounded-2xl bg-white/90 p-6 shadow-sm ring-1 ring-slate-200 backdrop-blur-sm">
          <button id="backToLanding" type="button" class="mb-3 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200">
            Back to landing
          </button>
          <p class="text-sm font-semibold text-orange-600">NGO CONNECT</p>
          <h1 class="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">Role Access</h1>
          <p class="mt-2 text-slate-600">Register or use quick login to enter your dashboard.</p>
        </header>

        <section class="rounded-2xl bg-white/90 p-6 shadow-sm ring-1 ring-slate-200 backdrop-blur-sm">
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

  document.querySelector("#backToLanding").addEventListener("click", () => {
    currentMode = "landing";
    render();
  });

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

function landingMarkup() {
  return `
    <main class="landing-main relative min-h-screen overflow-x-hidden bg-white text-slate-900">
      <header class="sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur-md">
        <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 md:px-10">
          <div class="flex items-center gap-3">
            <div class="grid h-10 w-10 place-items-center rounded-xl bg-orange-600 text-white shadow-sm">
              <span class="text-lg">❤</span>
            </div>
            <div>
              <p class="text-xs font-semibold uppercase tracking-widest text-orange-600">NGO CONNECT</p>
              <p class="text-lg font-bold text-slate-900">Volunteer Portal</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button id="landingLoginTop" class="rounded-full border border-orange-200 bg-orange-50 px-5 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-100">Sign In</button>
            <button id="landingRegisterTop" class="rounded-full bg-orange-600 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-700">Get Started</button>
          </div>
        </div>
      </header>

      <div class="pointer-events-none absolute left-0 right-0 top-20 z-10">
        <svg viewBox="0 0 1800 180" class="landing-stream h-16 w-full opacity-70" preserveAspectRatio="none" aria-hidden="true">
          <path class="stream-line stream-line-fast" d="M0,120 C220,74 430,156 690,98 C930,44 1160,150 1390,88 C1560,42 1680,78 1800,28" fill="none" stroke="#f97316" stroke-width="12" stroke-linecap="round"></path>
          <path class="stream-line stream-line-slow" d="M0,146 C220,104 430,176 690,122 C930,70 1160,172 1390,112 C1560,68 1680,96 1800,50" fill="none" stroke="#fdba74" stroke-width="9" stroke-linecap="round"></path>
        </svg>
      </div>

      <section class="relative mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-2 md:items-center md:px-10 md:py-20">
        <div class="space-y-6">
          <div class="inline-flex rounded-full border border-orange-200 bg-orange-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-orange-700">
            Empowering Kazakhstan volunteers
          </div>
          <h1 class="text-4xl font-extrabold leading-tight md:text-5xl">
            Centralized Volunteer Management for NGOs and Participants
          </h1>
          <p class="max-w-xl text-lg text-slate-600">
            Manage events, process volunteer requests, track shifts, and export participant reports from one platform.
          </p>
          <div class="flex">
            <img src="${HEART_ICON_IMAGE}" alt="Heart icon" class="h-14 w-14 object-contain" />
          </div>
          <div class="flex flex-wrap gap-3">
            <button id="landingRegisterHero" class="rounded-full bg-orange-600 px-7 py-3 text-base font-bold text-white hover:bg-orange-700">Register Now</button>
            <button id="landingLoginHero" class="rounded-full bg-slate-100 px-7 py-3 text-base font-bold text-slate-700 hover:bg-slate-200">Login</button>
          </div>
        </div>
        <div class="rounded-3xl border border-slate-100 bg-slate-50 p-5 shadow-xl">
          <div class="overflow-hidden rounded-2xl border border-slate-100 bg-white">
            <img src="${LANDING_HERO_IMAGE}" alt="Kazakhstan volunteers standing together" class="h-full w-full object-cover" />
          </div>
        </div>
      </section>

      <section class="relative overflow-hidden bg-[#fdf9f8] py-14">
        <div class="pointer-events-none absolute inset-x-0 top-3">
          <svg viewBox="0 0 1200 150" class="landing-stream h-14 w-full opacity-60" preserveAspectRatio="none" aria-hidden="true">
            <path class="stream-line stream-line-mid" d="M0,30 C180,62 310,0 500,40 C690,82 820,22 1000,50 C1080,64 1140,52 1200,70" fill="none" stroke="#fb923c" stroke-width="9" stroke-linecap="round"></path>
            <path class="stream-line stream-line-fast" d="M0,56 C170,88 300,26 490,66 C680,106 820,44 1000,76 C1080,90 1142,82 1200,98" fill="none" stroke="#f97316" stroke-width="7.5" stroke-linecap="round"></path>
          </svg>
        </div>
        <div class="pointer-events-none absolute inset-x-0 bottom-2">
          <svg viewBox="0 0 1200 150" class="landing-stream h-14 w-full opacity-55" preserveAspectRatio="none" aria-hidden="true">
            <path class="stream-line stream-line-slow" d="M0,88 C170,48 310,112 500,74 C680,38 840,98 1020,66 C1088,56 1140,68 1200,42" fill="none" stroke="#f97316" stroke-width="9" stroke-linecap="round"></path>
            <path class="stream-line stream-line-mid" d="M0,112 C180,72 320,138 510,102 C690,66 850,126 1030,96 C1092,86 1144,98 1200,74" fill="none" stroke="#fb923c" stroke-width="7.5" stroke-linecap="round"></path>
          </svg>
        </div>
        <div class="mx-auto max-w-6xl px-6 md:px-10">
          <div class="mb-8 text-center">
            <h2 class="text-3xl font-extrabold text-slate-900">Choose Your Role</h2>
            <p class="mt-2 text-slate-600">Sign in as a participant or coordinator.</p>
          </div>
          <div class="grid gap-6 md:grid-cols-2">
            <div class="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
              <h3 class="text-2xl font-bold text-slate-900">Participant</h3>
              <p class="mt-3 text-slate-600">Browse events, request shifts, and track your request status.</p>
              <button id="landingParticipantRegister" class="mt-6 w-full rounded-2xl bg-orange-600 px-5 py-3 font-semibold text-white hover:bg-orange-700">Register as Participant</button>
            </div>
            <div class="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
              <h3 class="text-2xl font-bold text-slate-900">Coordinator</h3>
              <p class="mt-3 text-slate-600">Create events, review requests, approve volunteers, and export CSV.</p>
              <button id="landingCoordinatorRegister" class="mt-6 w-full rounded-2xl bg-orange-600 px-5 py-3 font-semibold text-white hover:bg-orange-700">Register as Coordinator</button>
            </div>
          </div>
        </div>
      </section>
    </main>
  `;
}

function bindLandingActions() {
  const toLogin = () => {
    preferredRole = null;
    currentMode = "login";
    render();
  };
  const toRegister = () => {
    preferredRole = null;
    currentMode = "register";
    render();
  };

  document.querySelector("#landingLoginTop").addEventListener("click", toLogin);
  document.querySelector("#landingLoginHero").addEventListener("click", toLogin);
  document.querySelector("#landingRegisterTop").addEventListener("click", toRegister);
  document.querySelector("#landingRegisterHero").addEventListener("click", toRegister);
  document.querySelector("#landingParticipantRegister").addEventListener("click", () => {
    preferredRole = "Participant";
    currentMode = "register";
    render();
  });
  document.querySelector("#landingCoordinatorRegister").addEventListener("click", () => {
    preferredRole = "Coordinator";
    currentMode = "register";
    render();
  });
}

function registrationFormMarkup() {
  return `
    <form id="registrationForm" class="grid gap-4">
      <label class="grid gap-1">
        <span class="text-sm font-medium text-slate-700">Name</span>
        <input id="name" name="name" type="text" class="rounded-xl border border-slate-300 px-3 py-2 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200" placeholder="Enter full name" required />
      </label>

      <label class="grid gap-1">
        <span class="text-sm font-medium text-slate-700">Email</span>
        <input id="email" name="email" type="email" class="rounded-xl border border-slate-300 px-3 py-2 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200" placeholder="Enter email" required />
      </label>

      <label class="grid gap-1">
        <span class="text-sm font-medium text-slate-700">Password</span>
        <input id="password" name="password" type="password" minlength="8" class="rounded-xl border border-slate-300 px-3 py-2 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200" placeholder="Minimum 8 characters" required />
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
            <input type="radio" name="role" value="Participant" class="accent-orange-600" ${preferredRole === "Participant" ? "checked" : ""} required />
            Participant
          </label>
          <label class="inline-flex items-center gap-2 text-slate-700">
            <input type="radio" name="role" value="Coordinator" class="accent-orange-600" ${preferredRole === "Coordinator" ? "checked" : ""} required />
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
        <span class="text-sm font-medium text-slate-700">Email</span>
        <input id="loginEmail" name="email" type="email" class="rounded-xl border border-slate-300 px-3 py-2 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200" placeholder="Enter email" required />
      </label>

      <label class="grid gap-1">
        <span class="text-sm font-medium text-slate-700">Password</span>
        <input id="loginPassword" name="password" type="password" class="rounded-xl border border-slate-300 px-3 py-2 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200" required />
      </label>

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
      preferredRole = null;
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
    <main class="dashboard-main relative min-h-screen overflow-hidden bg-slate-100" style="background-image: url('${DASHBOARD_BACKGROUND_IMAGE}'); background-size: cover; background-position: center;">
      <div class="relative flex min-h-screen">
        <aside class="portal-sidebar-surface flex w-72 flex-col border-r border-slate-200 p-5 backdrop-blur-sm">
          <div>
            <p class="text-sm font-semibold text-orange-600">NGO CONNECT</p>
            <h1 class="mt-2 text-lg font-bold text-slate-900">${user.role} Portal</h1>
          </div>
          <nav class="mt-6 grid gap-2">
            ${renderDesktopNavButtons(navItems, currentPage)}
          </nav>

          <div class="mt-auto pt-8">
            <div class="mb-3 flex justify-center">
              <img src="${HEART_ICON_IMAGE}" alt="Heart icon" class="h-11 w-11 rounded-xl border border-orange-300 object-cover ring-2 ring-orange-200" />
            </div>
            <div class="portal-user-card rounded-xl border border-slate-200 p-3">
              <div class="flex items-center gap-3">
                <img src="${resolveAvatarUrl(user.photoUrl)}" onerror="${avatarFallbackOnError()}" alt="${escapeHtml(user.name)}" class="h-12 w-12 rounded-full object-cover" />
                <div>
                  <p class="text-sm font-semibold text-slate-900">${escapeHtml(user.name)}</p>
                  <p class="text-xs text-slate-500">${user.region}</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <section class="flex-1 p-6 md:p-8">
          <header class="portal-header-surface mb-5 rounded-2xl p-5 shadow-sm ring-1 backdrop-blur-sm">
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

function renderDesktopNavButtons(navItems, activePage) {
  return navItems
    .map(
      (item) => `
        <button
          data-page="${item.page}"
          class="sidebar-link rounded-xl px-4 py-2 text-left text-sm font-semibold ${
            activePage === item.page ? "sidebar-link-active" : "sidebar-link-idle"
          }"
        >
          ${item.label}
        </button>
      `
    )
    .join("");
}

function renderCurrentPage(user) {
  const title = document.querySelector("#pageTitle");
  const content = document.querySelector("#pageContent");
  title.textContent = pageTitleFor(currentPage, user.role);

  if (user.role === "Participant") {
    if (currentPage === "dashboard") return renderParticipantDashboard(user, content);
    if (currentPage === "events") return renderParticipantEvents(user, content);
    if (currentPage === "group-chat") return renderGroupChatPage(user, content);
    return renderProfileSettings(user, content);
  }

  if (currentPage === "dashboard") return renderCoordinatorDashboard(user, content);
  if (currentPage === "create-event") return renderCoordinatorCreateEventPage(user, content);
  if (currentPage === "events") return renderCoordinatorEvents(user, content);
  if (currentPage === "groups") return renderCoordinatorGroups(user, content);
  if (currentPage === "group-chat") return renderGroupChatPage(user, content);
  if (currentPage === "event-detail") return renderCoordinatorEventDetail(user, content);
  if (currentPage === "participants") return renderCoordinatorParticipants(user, content);
  return renderProfileSettings(user, content);
}

async function renderParticipantDashboard(user, content) {
  try {
    const [events, joins] = await Promise.all([
      apiJson("/api/items"),
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
                      <span class="ml-2 rounded px-2 py-0.5 text-xs font-semibold ${join.status === "approved" ? "bg-green-100 text-green-700" : join.status === "declined" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}">${join.status || "pending"}</span>
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
      apiJson("/api/items"),
      apiJson(`/api/participants/${user.id}/joins`),
    ]);
    const joinByEventId = new Map(joins.map((join) => [join.eventId, join]));
    const forms = await Promise.all(
      events.map((event) =>
        apiJson(`/api/items/${event.id}/form`).catch(() => null)
      )
    );
    const formByEventId = new Map(events.map((event, idx) => [event.id, forms[idx]]));

    content.innerHTML = `
      <article class="rounded-xl border border-slate-200 bg-white p-4 md:col-span-2">
        <h3 class="font-semibold text-slate-900">Available Events</h3>
        <div class="mt-4 grid gap-4 md:grid-cols-2">
          ${
            events.length
              ? events
                  .map((event) => {
                    const existingJoin = joinByEventId.get(event.id);
                    const requestStatus = existingJoin?.status || null;
                    const eventForm = formByEventId.get(event.id);
                    const formFields = eventForm?.isEnabled && Array.isArray(eventForm?.fields) ? eventForm.fields : [];
                    const existingAnswers = existingJoin?.formAnswers || {};
                    return `
                    <article class="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <img src="${resolveEventImageUrl(event.photoUrl)}" onerror="${eventImageFallbackOnError()}" alt="${escapeHtml(event.name)}" class="mb-3 h-40 w-full rounded-lg object-cover" />
                      <h4 class="text-lg font-semibold text-slate-900">${escapeHtml(event.name)}</h4>
                      <p class="mt-1 text-sm text-slate-600">${escapeHtml(event.description)}</p>
                      <p class="mt-2 text-sm text-slate-500">Region: ${event.region} · ${escapeHtml(event.coordinatorName)}</p>
                      ${requestStatus ? `<p class="mt-2 text-xs font-semibold ${requestStatus === "approved" ? "text-green-700" : requestStatus === "declined" ? "text-red-700" : "text-amber-700"}">Request status: ${requestStatus}</p>` : ""}
                      <form class="participant-join-form mt-3 flex items-center gap-2" data-event-id="${event.id}">
                        <select name="shift" class="rounded-lg border border-slate-300 px-3 py-2 text-sm">
                          ${SHIFT_OPTIONS.map(
                            (shift) =>
                              `<option value="${shift}" ${existingJoin?.shift === shift ? "selected" : ""}>${shift}</option>`
                          ).join("")}
                        </select>
                        <button type="submit" class="rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-700">
                          ${existingJoin ? "Send Update Request" : "Request to Join"}
                        </button>
                      </form>
                      ${
                        formFields.length
                          ? `
                            <div class="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                              <p class="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">${escapeHtml(eventForm.title || "Join Form")}</p>
                              <div class="grid gap-2">
                                ${formFields
                                  .map((field) => {
                                    const key = String(field.key || "");
                                    const label = String(field.label || "Question");
                                    const value = escapeHtmlAttr(existingAnswers[key] || "");
                                    return `
                                      <label class="grid gap-1">
                                        <span class="text-xs font-medium text-slate-700">${escapeHtml(label)}</span>
                                        <input data-form-field="true" data-field-key="${escapeHtmlAttr(key)}" class="rounded-lg border border-slate-300 px-3 py-2 text-sm" value="${value}" />
                                      </label>
                                    `;
                                  })
                                  .join("")}
                              </div>
                            </div>
                          `
                          : ""
                      }
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
          const formAnswers = {};
          form.querySelectorAll("[data-form-field='true']").forEach((input) => {
            const key = input.getAttribute("data-field-key");
            if (key) formAnswers[key] = input.value;
          });
          const result = await apiJson(`/api/items/${eventId}/join`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ participantId: user.id, shift, formAnswers }),
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
    const [events, participants, requests] = await Promise.all([
      apiJson("/api/items"),
      apiJson(`/api/coordinators/${user.id}/participants`),
      apiJson(`/api/coordinators/${user.id}/join-requests?status=pending`),
    ]);
    const myEvents = events.filter((event) => event.coordinatorId === user.id);
    const pendingRequestItems = requests
      .slice(0, 8)
      .map(
        (row) => `
          <li class="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span>${escapeHtml(row.participantName)} requested <b>${escapeHtml(row.eventName)}</b> (${row.shift})</span>
              <span class="flex items-center gap-2">
                <button
                  type="button"
                  class="dashboard-request-decision-btn rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
                  data-join-id="${row.joinId}"
                  data-decision="approved"
                >
                  Approve
                </button>
                <button
                  type="button"
                  class="dashboard-request-decision-btn rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                  data-join-id="${row.joinId}"
                  data-decision="declined"
                >
                  Decline
                </button>
              </span>
            </div>
          </li>
        `
      )
      .join("");

    content.innerHTML = `
      <article class="rounded-xl border border-slate-200 bg-white p-5">
        <p class="text-sm text-slate-500">My events</p>
        <p class="mt-2 text-3xl font-bold text-slate-900">${myEvents.length}</p>
      </article>
      <article class="rounded-xl border border-slate-200 bg-white p-5">
        <p class="text-sm text-slate-500">Joined participants</p>
        <p class="mt-2 text-3xl font-bold text-slate-900">${participants.length}</p>
      </article>
      <article class="rounded-xl border border-slate-200 bg-white p-5">
        <p class="text-sm text-slate-500">Pending requests</p>
        <p class="mt-2 text-3xl font-bold text-slate-900">${requests.length}</p>
      </article>
      <article class="rounded-xl border border-slate-200 bg-white p-5 md:col-span-2">
        <h3 class="font-semibold text-slate-900">Pending Requests</h3>
        <ul class="mt-3 grid gap-2">
          ${
            requests.length
              ? pendingRequestItems
              : `<li class="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">No pending requests.</li>`
          }
        </ul>
      </article>
    `;

    document.querySelectorAll(".dashboard-request-decision-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const joinId = btn.getAttribute("data-join-id");
        const decision = btn.getAttribute("data-decision");
        const confirmed = window.confirm(
          decision === "approved"
            ? "Approve this volunteer request?"
            : "Decline this volunteer request?"
        );
        if (!confirmed) return;
        try {
          await apiJson(`/api/joins/${joinId}/decision`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ coordinatorId: user.id, decision }),
          });
          renderCoordinatorDashboard(user, content);
        } catch (error) {
          alert(error.message || "Failed to process request.");
        }
      });
    });
  } catch (error) {
    content.innerHTML = renderErrorCard(error.message || "Failed to load dashboard.");
  }
}

async function renderCoordinatorCreateEventPage(user, content) {
  try {
    const allEvents = await apiJson("/api/items");
    const myEvents = allEvents.filter((event) => event.coordinatorId === user.id);
    const selectedEvent =
      myEvents.find((event) => event.id === selectedEventId) || myEvents[0] || null;
    if (selectedEvent) selectedEventId = selectedEvent.id;

    const [requests, form] = selectedEvent
      ? await Promise.all([
          apiJson(
            `/api/coordinators/${user.id}/join-requests?eventId=${encodeURIComponent(selectedEvent.id)}`
          ).catch(() => []),
          apiJson(`/api/items/${selectedEvent.id}/form`).catch(() => null),
        ])
      : [[], null];

    const shiftCounts = SHIFT_OPTIONS.map((shift) => ({
      shift,
      approved: requests.filter((row) => row.shift === shift && row.status === "approved").length,
      pending: requests.filter((row) => row.shift === shift && row.status === "pending").length,
    }));

    const applicationRows = requests.length
      ? requests
          .map(
            (row) => `
              <tr class="border-t border-orange-100">
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    ${
                      row.participantPhotoUrl
                        ? `<img src="${resolveAvatarUrl(row.participantPhotoUrl)}" onerror="${avatarFallbackOnError()}" alt="${escapeHtml(row.participantName)}" class="h-8 w-8 rounded-full object-cover" />`
                        : `<span class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">${escapeHtml((row.participantName || "U").slice(0, 1))}</span>`
                    }
                    <div>
                      <p class="text-sm font-semibold text-slate-900">${escapeHtml(row.participantName)}</p>
                      <p class="text-xs text-slate-500">Shift: ${row.shift}</p>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-3 text-xs text-slate-600">${formatDateTime(row.requestedAt)}</td>
                <td class="px-4 py-3">
                  <span class="rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${
                    row.status === "approved"
                      ? "bg-green-100 text-green-700"
                      : row.status === "declined"
                        ? "bg-red-100 text-red-700"
                        : "bg-blue-100 text-blue-700"
                  }">${row.status}</span>
                </td>
                <td class="px-4 py-3 text-right">
                  ${
                    row.status === "pending"
                      ? `
                        <div class="inline-flex gap-2">
                          <button type="button" class="create-page-request-btn rounded-md bg-green-100 px-2 py-1 text-xs font-semibold text-green-700 hover:bg-green-200" data-join-id="${row.joinId}" data-decision="approved">Approve</button>
                          <button type="button" class="create-page-request-btn rounded-md bg-red-100 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-200" data-join-id="${row.joinId}" data-decision="declined">Decline</button>
                        </div>
                      `
                      : `<span class="text-xs text-slate-400">Done</span>`
                  }
                </td>
              </tr>
            `
          )
          .join("")
      : `<tr><td colspan="4" class="px-4 py-5 text-sm text-slate-500">No applications for this event yet.</td></tr>`;

    content.innerHTML = `
      <article class="rounded-2xl border border-orange-100 bg-white p-5 md:col-span-2">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="grid h-10 w-10 place-items-center rounded-lg bg-orange-600 text-white">❤</div>
            <div>
              <h3 class="text-lg font-bold text-slate-900">Create Volunteer Event</h3>
              <p class="text-xs text-slate-500">Drafting your next impact</p>
            </div>
          </div>
          ${
            selectedEvent
              ? `<button type="button" id="createPageExportCsvBtn" class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black">Export CSV</button>`
              : ""
          }
        </div>
        <form id="createEventSpecialForm" class="mt-4 grid gap-3 md:grid-cols-12">
          <input type="text" name="name" placeholder="Event Name (e.g. Coastal Cleanup 2024)" class="rounded-lg border border-orange-100 px-3 py-2 md:col-span-5" required />
          <select name="region" class="rounded-lg border border-orange-100 px-3 py-2 md:col-span-3" required>
            <option value="">Region</option>
            <option value="Almaty">Almaty</option>
            <option value="Astana">Astana</option>
          </select>
          <button id="createEventSpecialBtn" type="submit" class="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 md:col-span-2">Publish</button>
          <p id="createEventSpecialStatus" class="text-sm text-slate-600 md:col-span-2"></p>

          <textarea name="description" rows="4" class="rounded-xl border border-orange-100 px-3 py-2 md:col-span-7" placeholder="Describe the purpose, impact, and what volunteers should expect..." required></textarea>
          <div class="rounded-xl border border-orange-100 bg-slate-50 p-4 md:col-span-5">
            <label class="mb-2 block text-sm font-semibold text-slate-700">Cover Image</label>
            <input type="file" name="photo" accept="image/*" class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" required />
            <div class="mt-4 rounded-xl bg-orange-50 p-3">
              <p class="text-xs font-semibold uppercase tracking-widest text-orange-700">Pro Tips</p>
              <ul class="mt-2 space-y-1 text-xs text-slate-600">
                <li>- Use high-quality photos to increase engagement.</li>
                <li>- Be specific about expected volunteer impact.</li>
                <li>- Mention any physical activity requirements.</li>
              </ul>
            </div>
          </div>
        </form>
      </article>

      <article class="rounded-2xl border border-orange-100 bg-white p-5 md:col-span-2">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h3 class="text-base font-bold text-slate-900">Event Workspace</h3>
          <select id="manageEventSelect" class="rounded-lg border border-orange-100 px-3 py-2 text-sm">
            ${
              myEvents.length
                ? myEvents
                    .map(
                      (event) =>
                        `<option value="${event.id}" ${selectedEvent?.id === event.id ? "selected" : ""}>${escapeHtml(event.name)}</option>`
                    )
                    .join("")
                : `<option value="">No created events</option>`
            }
          </select>
        </div>

        ${
          selectedEvent
            ? `
              <div class="mt-4 border-b border-orange-100">
                <div class="flex flex-wrap gap-6 pb-3 text-sm font-semibold text-slate-600">
                  <span class="border-b-2 border-orange-600 pb-2 text-orange-700">Event Info</span>
                  <span>Shift Builder</span>
                  <span>Application Management</span>
                </div>
              </div>
              <form id="createPageEventInfoForm" class="mt-4 grid gap-3 md:grid-cols-2" data-event-id="${selectedEvent.id}">
                <input type="text" name="name" value="${escapeHtmlAttr(selectedEvent.name)}" class="rounded-lg border border-slate-300 px-3 py-2" required />
                <select name="region" class="rounded-lg border border-slate-300 px-3 py-2" required>
                  <option value="Almaty" ${selectedEvent.region === "Almaty" ? "selected" : ""}>Almaty</option>
                  <option value="Astana" ${selectedEvent.region === "Astana" ? "selected" : ""}>Astana</option>
                </select>
                <textarea name="description" rows="3" class="rounded-lg border border-slate-300 px-3 py-2 md:col-span-2" required>${escapeHtml(selectedEvent.description)}</textarea>
                <input type="file" name="photo" accept="image/*" class="rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-2" />
                <div class="md:col-span-2 flex gap-2">
                  <button type="submit" class="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700">Save Event Info</button>
                  <button type="button" class="delete-event-btn rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700" data-event-id="${selectedEvent.id}">Delete</button>
                </div>
              </form>

              <section class="mt-8 border-t border-orange-100 pt-6">
                <div class="flex items-center justify-between">
                  <div>
                    <h4 class="text-lg font-bold text-slate-900">Shift Builder</h4>
                    <p class="text-sm text-slate-500">Overview by approved and pending participants.</p>
                  </div>
                </div>
                <div class="mt-3 grid gap-3 md:grid-cols-3">
                  ${shiftCounts
                    .map(
                      (row) => `
                        <div class="rounded-xl border border-orange-100 bg-orange-50 p-4">
                          <p class="text-xs uppercase tracking-widest text-slate-500">${row.shift}</p>
                          <p class="mt-2 text-sm font-semibold text-slate-800">Approved: ${row.approved}</p>
                          <p class="text-sm text-slate-600">Pending: ${row.pending}</p>
                        </div>
                      `
                    )
                    .join("")}
                </div>
              </section>

              <section class="mt-8 border-t border-orange-100 pt-6">
                <h4 class="text-lg font-bold text-slate-900">Application Management</h4>
                <p class="text-sm text-slate-500">Review and manage volunteer signups.</p>
                <div class="mt-3 overflow-hidden rounded-xl border border-orange-100">
                  <table class="w-full text-left">
                    <thead class="bg-orange-50 text-xs uppercase tracking-widest text-slate-500">
                      <tr>
                        <th class="px-4 py-3">Applicant</th>
                        <th class="px-4 py-3">Requested</th>
                        <th class="px-4 py-3">Status</th>
                        <th class="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>${applicationRows}</tbody>
                  </table>
                </div>
              </section>

              <section class="mt-8 border-t border-orange-100 pt-6">
                <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div class="flex items-center justify-between gap-3">
                    <h5 class="text-sm font-semibold uppercase tracking-widest text-slate-500">Join Form</h5>
                    <label class="inline-flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <input type="checkbox" id="createPageFormEnabled" class="h-4 w-4 accent-indigo-600" ${
                        form?.isEnabled ? "checked" : ""
                      } />
                      Enable form on join
                    </label>
                  </div>
                  <form id="createPageJoinFormBuilder" class="mt-3 grid gap-2" data-event-id="${selectedEvent.id}">
                    <input type="text" name="title" value="${escapeHtmlAttr(form?.title || "Join Questions")}" placeholder="Form title" class="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                    <div id="createPageQuestionsWrap" class="grid gap-2">
                      ${(form?.fields?.length ? form.fields : [
                        { label: "Why do you want to join this event?" },
                        { label: "What relevant experience do you have?" },
                        { label: "Are you available for the selected shift?" },
                      ])
                        .map(
                          (field, idx) => `
                            <label class="grid gap-1">
                              <span class="text-xs font-medium text-slate-600">Question ${idx + 1}</span>
                              <input type="text" name="question" value="${escapeHtmlAttr(field?.label || "")}" class="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                            </label>
                          `
                        )
                        .join("")}
                    </div>
                    <div class="flex gap-2">
                      <button type="button" id="addCreatePageQuestionBtn" class="rounded-lg bg-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-300">+ Add Question</button>
                      <button type="submit" class="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700">Save Form</button>
                    </div>
                  </form>
                </div>
              </section>
            `
            : `<p class="mt-4 text-sm text-slate-600">Create your first event to open this workspace.</p>`
        }
      </article>
    `;

    bindCoordinatorCreateEventActions(user, content, selectedEvent);
  } catch (error) {
    content.innerHTML = renderErrorCard(error.message || "Failed to load create event workspace.");
  }
}

function bindCoordinatorCreateEventActions(user, content, selectedEvent) {
  const createForm = document.querySelector("#createEventSpecialForm");
  const createBtn = document.querySelector("#createEventSpecialBtn");
  const createStatus = document.querySelector("#createEventSpecialStatus");
  if (createForm) {
    createForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      createBtn.disabled = true;
      createBtn.textContent = "Publishing...";
      createStatus.textContent = "";
      try {
        const formData = new FormData(createForm);
        formData.append("coordinatorId", user.id);
        const result = await fetchOrThrow(`${API_BASE}/api/items`, {
          method: "POST",
          body: formData,
        });
        createStatus.textContent = result.message || "Event published.";
        createStatus.className = "text-sm text-green-700";
        createForm.reset();
        renderCoordinatorCreateEventPage(user, content);
      } catch (error) {
        createStatus.textContent = error.message || "Failed to publish event.";
        createStatus.className = "text-sm text-red-600";
      } finally {
        createBtn.disabled = false;
        createBtn.textContent = "Publish";
      }
    });
  }

  const eventSelect = document.querySelector("#manageEventSelect");
  if (eventSelect) {
    eventSelect.addEventListener("change", () => {
      selectedEventId = eventSelect.value || null;
      renderCoordinatorCreateEventPage(user, content);
    });
  }

  const eventInfoForm = document.querySelector("#createPageEventInfoForm");
  if (eventInfoForm) {
    eventInfoForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const eventId = eventInfoForm.getAttribute("data-event-id");
      const formData = new FormData(eventInfoForm);
      formData.append("coordinatorId", user.id);
      try {
        await fetchOrThrow(`${API_BASE}/api/items/${eventId}`, {
          method: "PATCH",
          body: formData,
        });
        renderCoordinatorCreateEventPage(user, content);
      } catch (error) {
        alert(error.message || "Failed to save event.");
      }
    });
  }

  if (selectedEvent) {
    const exportBtn = document.querySelector("#createPageExportCsvBtn");
    if (exportBtn) {
      exportBtn.addEventListener("click", () => {
        const url = `${API_BASE}/api/items/${selectedEvent.id}/volunteers.csv?coordinatorId=${encodeURIComponent(user.id)}`;
        window.open(url, "_blank");
      });
    }
  }

  document.querySelectorAll(".create-page-request-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const joinId = button.getAttribute("data-join-id");
      const decision = button.getAttribute("data-decision");
      try {
        await apiJson(`/api/joins/${joinId}/decision`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ coordinatorId: user.id, decision }),
        });
        renderCoordinatorCreateEventPage(user, content);
      } catch (error) {
        alert(error.message || "Failed to process request.");
      }
    });
  });

  const joinFormBuilder = document.querySelector("#createPageJoinFormBuilder");
  const questionsWrap = document.querySelector("#createPageQuestionsWrap");
  const addQuestionBtn = document.querySelector("#addCreatePageQuestionBtn");
  const formEnabledInput = document.querySelector("#createPageFormEnabled");

  if (addQuestionBtn && questionsWrap) {
    addQuestionBtn.addEventListener("click", () => {
      const index = questionsWrap.querySelectorAll("input[name='question']").length + 1;
      const row = document.createElement("label");
      row.className = "grid gap-1";
      row.innerHTML = `
        <span class="text-xs font-medium text-slate-600">Question ${index}</span>
        <input type="text" name="question" class="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      `;
      questionsWrap.appendChild(row);
    });
  }

  if (joinFormBuilder) {
    joinFormBuilder.addEventListener("submit", async (event) => {
      event.preventDefault();
      const eventId = joinFormBuilder.getAttribute("data-event-id");
      const formData = new FormData(joinFormBuilder);
      const title = String(formData.get("title") || "").trim();
      const questions = Array.from(joinFormBuilder.querySelectorAll("input[name='question']"))
        .map((input) => String(input.value || "").trim())
        .filter(Boolean);
      const fields = questions.map((label, index) => ({ key: `q_${index + 1}`, label }));
      try {
        await apiJson(`/api/items/${eventId}/form`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            coordinatorId: user.id,
            title: title || "Join Questions",
            isEnabled: Boolean(formEnabledInput?.checked),
            fields,
          }),
        });
        renderCoordinatorCreateEventPage(user, content);
      } catch (error) {
        alert(error.message || "Failed to save form.");
      }
    });
  }

  document.querySelectorAll(".delete-event-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const eventId = btn.getAttribute("data-event-id");
      try {
        await fetchOrThrow(`${API_BASE}/api/items/${eventId}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ coordinatorId: user.id }),
        });
        if (selectedEventId === eventId) selectedEventId = null;
        renderCoordinatorCreateEventPage(user, content);
      } catch (error) {
        alert(error.message || "Failed to delete event.");
      }
    });
  });
}

async function renderCoordinatorEvents(user, content) {
  try {
    const allEvents = await apiJson("/api/items");
    const myEvents = allEvents.filter((event) => event.coordinatorId === user.id);
    const otherEvents = allEvents.filter((event) => event.coordinatorId !== user.id);
    const userJoins = await apiJson(`/api/users/${user.id}/joins`).catch(() => []);
    const joinByEventId = new Map(userJoins.map((join) => [join.eventId, join]));

    content.innerHTML = `
      <article class="rounded-xl border border-slate-200 bg-white p-4 md:col-span-2">
        <h3 class="font-semibold text-slate-900">Event Settings</h3>
        <div class="mt-4 grid gap-4 md:grid-cols-2">
          ${
            myEvents.length
              ? myEvents
                  .map(
                    (event) => `
                    <article class="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <img src="${resolveEventImageUrl(event.photoUrl)}" onerror="${eventImageFallbackOnError()}" alt="${escapeHtml(event.name)}" class="mb-3 h-36 w-full rounded-lg object-cover" />
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
                          <button type="button" class="export-event-btn rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-900" data-event-id="${event.id}">Export CSV</button>
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

      <article class="rounded-xl border border-slate-200 bg-white p-4 md:col-span-2">
        <h3 class="font-semibold text-slate-900">Join Other Events</h3>
        <p class="mt-1 text-sm text-slate-600">Coordinators can also join events and collaborate.</p>
        <div class="mt-3 grid gap-3 md:grid-cols-2">
          ${
            otherEvents.length
              ? otherEvents
                  .map((event) => {
                    const existingJoin = joinByEventId.get(event.id);
                    return `
                      <div class="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <h4 class="text-sm font-semibold text-slate-900">${escapeHtml(event.name)}</h4>
                        <p class="mt-1 text-xs text-slate-600">${escapeHtml(event.description)}</p>
                        <p class="mt-1 text-xs text-slate-500">Region: ${event.region} · ${escapeHtml(event.coordinatorName)}</p>
                        ${existingJoin ? `<p class="mt-2 text-xs font-semibold ${existingJoin.status === "approved" ? "text-green-700" : existingJoin.status === "declined" ? "text-red-700" : "text-amber-700"}">Request status: ${existingJoin.status}</p>` : ""}
                        <form class="coordinator-join-form mt-2 flex gap-2" data-event-id="${event.id}">
                          <select name="shift" class="rounded-lg border border-slate-300 px-2 py-1.5 text-xs">
                            ${SHIFT_OPTIONS.map((shift) => `<option value="${shift}" ${existingJoin?.shift === shift ? "selected" : ""}>${shift}</option>`).join("")}
                          </select>
                          <button type="submit" class="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700">
                            ${existingJoin ? "Update Request" : "Join Event"}
                          </button>
                        </form>
                      </div>
                    `;
                  })
                  .join("")
              : `<p class="text-sm text-slate-600">No external events available.</p>`
          }
        </div>
        <p id="coordinatorJoinStatus" class="mt-3 text-sm text-slate-700"></p>
      </article>
    `;

    bindCoordinatorEventActions(user, content);
  } catch (error) {
    content.innerHTML = renderErrorCard(error.message || "Failed to load events.");
  }
}

async function renderCoordinatorEventDetail(user, content) {
  if (!selectedEventId) {
    content.innerHTML = renderErrorCard("No event selected. Open an event from My Events page.");
    return;
  }

  try {
    const [summary, participants, requests] = await Promise.all([
      apiJson(`/api/items/${selectedEventId}/summary?coordinatorId=${encodeURIComponent(user.id)}`),
      apiJson(
        `/api/coordinators/${user.id}/participants?eventId=${encodeURIComponent(selectedEventId)}`
      ),
      apiJson(
        `/api/coordinators/${user.id}/join-requests?eventId=${encodeURIComponent(selectedEventId)}`
      ),
    ]);

    const pendingRequests = requests.filter((row) => row.status === "pending");
    const requestsMarkup = requests.length
      ? requests
          .map(
            (row) => `
            <div class="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                  ${
                    row.participantPhotoUrl
                      ? `<img src="${resolveAvatarUrl(row.participantPhotoUrl)}" onerror="${avatarFallbackOnError()}" class="h-10 w-10 rounded-full object-cover" alt="${escapeHtml(row.participantName)}" />`
                      : ""
                  }
                  <div>
                    <p class="font-semibold text-slate-900">${escapeHtml(row.participantName)}</p>
                    <p class="text-sm text-slate-600">Shift: ${row.shift}</p>
                    <p class="text-xs text-slate-500">Requested: ${formatDateTime(row.requestedAt)}</p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span class="rounded px-2 py-1 text-xs font-semibold ${row.status === "approved" ? "bg-green-100 text-green-700" : row.status === "declined" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}">${row.status}</span>
                  ${
                    row.status === "pending"
                      ? `
                        <button type="button" class="event-request-decision-btn rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700" data-join-id="${row.joinId}" data-decision="approved">Approve</button>
                        <button type="button" class="event-request-decision-btn rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700" data-join-id="${row.joinId}" data-decision="declined">Decline</button>
                      `
                      : ""
                  }
                </div>
              </div>
            </div>
          `
          )
          .join("")
      : `<p class="text-sm text-slate-600">No requests yet.</p>`;
    const pendingRequestsMarkup = pendingRequests.length
      ? pendingRequests
          .map(
            (row) => `
            <div class="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                  ${
                    row.participantPhotoUrl
                      ? `<img src="${resolveAvatarUrl(row.participantPhotoUrl)}" onerror="${avatarFallbackOnError()}" class="h-10 w-10 rounded-full object-cover" alt="${escapeHtml(row.participantName)}" />`
                      : ""
                  }
                  <div>
                    <p class="font-semibold text-slate-900">${escapeHtml(row.participantName)}</p>
                    <p class="text-sm text-slate-600">Shift: ${row.shift}</p>
                    <p class="text-xs text-slate-500">Requested: ${formatDateTime(row.requestedAt)}</p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span class="rounded px-2 py-1 text-xs font-semibold bg-amber-100 text-amber-700">pending</span>
                  <button type="button" class="event-request-decision-btn rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700" data-join-id="${row.joinId}" data-decision="approved">Approve</button>
                  <button type="button" class="event-request-decision-btn rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700" data-join-id="${row.joinId}" data-decision="declined">Decline</button>
                </div>
              </div>
            </div>
          `
          )
          .join("")
      : `<p class="text-sm text-slate-600">No pending requests.</p>`;

    const participantsRowsMarkup = participants.length
      ? participants
          .map(
            (row) => `
            <tr class="border-t border-slate-200">
              <td class="px-3 py-2 text-sm text-slate-700">${escapeHtml(row.participantName)}</td>
              <td class="px-3 py-2 text-sm font-medium text-slate-800">${row.shift}</td>
            </tr>
          `
          )
          .join("")
      : `<tr><td class="px-3 py-3 text-sm text-slate-600" colspan="2">No approved participants yet.</td></tr>`;

    content.innerHTML = `
      <article class="rounded-xl border border-slate-200 bg-white p-4 md:col-span-2">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <button type="button" id="backToEventsBtn" class="mb-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200">Back to My Events</button>
            <h3 class="text-xl font-semibold text-slate-900">${escapeHtml(summary.event.name)}</h3>
            <p class="mt-1 text-sm text-slate-600">${escapeHtml(summary.event.description)}</p>
            <p class="mt-1 text-xs text-slate-500">Region: ${summary.event.region}</p>
          </div>
          <button id="exportCsvBtn" type="button" class="rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-900">Export Participants CSV</button>
        </div>
      </article>

      <article class="rounded-xl border border-slate-200 bg-white p-4 md:col-span-2">
        <div class="mb-4 flex flex-wrap gap-2">
          <button type="button" class="event-tab-btn rounded-lg px-3 py-2 text-sm font-semibold ${eventDetailTab === "participants" ? "bg-orange-600 text-white" : "bg-slate-100 text-slate-700"}" data-tab="participants">
            Participants (${summary.stats.approved})
          </button>
          <button type="button" class="event-tab-btn rounded-lg px-3 py-2 text-sm font-semibold ${eventDetailTab === "requests" ? "bg-orange-600 text-white" : "bg-slate-100 text-slate-700"}" data-tab="requests">
            Requests (${summary.stats.pending})
          </button>
          <button type="button" class="event-tab-btn rounded-lg px-3 py-2 text-sm font-semibold ${eventDetailTab === "declined" ? "bg-orange-600 text-white" : "bg-slate-100 text-slate-700"}" data-tab="declined">
            Declined (${summary.stats.declined})
          </button>
        </div>

        ${
          eventDetailTab === "participants"
            ? `
              <div class="overflow-x-auto">
                <table class="min-w-full border border-slate-200">
                  <thead class="bg-slate-50">
                    <tr>
                      <th class="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Participant</th>
                      <th class="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Shift</th>
                    </tr>
                  </thead>
                  <tbody>${participantsRowsMarkup}</tbody>
                </table>
              </div>
            `
            : eventDetailTab === "requests"
              ? `<div class="grid gap-3">${pendingRequestsMarkup}</div>`
              : `<div class="grid gap-3">${requests.filter((row) => row.status === "declined").length ? requests
                  .filter((row) => row.status === "declined")
                  .map(
                    (row) => `
                    <div class="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <p class="font-semibold text-slate-900">${escapeHtml(row.participantName)}</p>
                      <p class="text-sm text-slate-600">Shift: ${row.shift}</p>
                      <p class="text-xs text-slate-500">Decided: ${formatDateTime(row.decidedAt)}</p>
                    </div>
                  `
                  )
                  .join("") : `<p class="text-sm text-slate-600">No declined requests.</p>`}</div>`
        }
      </article>
    `;

    document.querySelector("#backToEventsBtn").addEventListener("click", () => {
      currentPage = "events";
      renderShell(user);
    });

    document.querySelector("#exportCsvBtn").addEventListener("click", () => {
      const url = `${API_BASE}/api/items/${selectedEventId}/volunteers.csv?coordinatorId=${encodeURIComponent(user.id)}`;
      window.open(url, "_blank");
    });

    document.querySelectorAll(".event-tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        eventDetailTab = btn.getAttribute("data-tab");
        renderCoordinatorEventDetail(user, content);
      });
    });

    document.querySelectorAll(".event-request-decision-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const joinId = btn.getAttribute("data-join-id");
        const decision = btn.getAttribute("data-decision");
        const confirmed = window.confirm(
          decision === "approved"
            ? "Approve this volunteer request?"
            : "Decline this volunteer request?"
        );
        if (!confirmed) return;
        try {
          await apiJson(`/api/joins/${joinId}/decision`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ coordinatorId: user.id, decision }),
          });
          renderCoordinatorEventDetail(user, content);
        } catch (error) {
          alert(error.message || "Failed to process request.");
        }
      });
    });
  } catch (error) {
    content.innerHTML = renderErrorCard(error.message || "Failed to load event details.");
  }
}

async function renderCoordinatorGroups(user, content) {
  try {
    const [allEvents, allUsers] = await Promise.all([
      apiJson("/api/items"),
      apiJson("/api/users"),
    ]);
    const myEvents = allEvents.filter((event) => event.coordinatorId === user.id);
    const usersById = new Map((allUsers || []).map((row) => [row.id, row]));
    const groupsByEvent = await Promise.all(
      myEvents.map(async (event) => {
        const [groups, approvedRequests] = await Promise.all([
          apiJson(`/api/items/${event.id}/groups`).catch(() => []),
          apiJson(
            `/api/coordinators/${user.id}/join-requests?eventId=${encodeURIComponent(event.id)}&status=approved`
          ).catch(() => []),
        ]);
        const eventCandidates = [
          usersById.get(event.coordinatorId),
          ...approvedRequests.map((row) => usersById.get(row.participantId)).filter(Boolean),
        ];
        const uniqueCandidates = Array.from(new Map(eventCandidates.map((member) => [member.id, member])).values());
        return {
          event,
          groups,
          memberCandidates: uniqueCandidates.filter((row) =>
            ["Participant", "Coordinator"].includes(row.role)
          ),
        };
      })
    );
    const eventNameById = new Map(myEvents.map((event) => [event.id, event.name]));

    content.innerHTML = `
      <article class="rounded-xl border border-slate-200 bg-white p-4 md:col-span-2">
        <h3 class="font-semibold text-slate-900">Create Group</h3>
        <form id="createGroupTabForm" class="mt-3 grid gap-3 md:grid-cols-3">
          <select name="eventId" class="rounded-lg border border-slate-300 px-3 py-2 text-sm" required>
            <option value="">Select event</option>
            ${myEvents
              .map((event) => `<option value="${event.id}">${escapeHtml(event.name)}</option>`)
              .join("")}
          </select>
          <input type="text" name="groupName" placeholder="Group name" class="rounded-lg border border-slate-300 px-3 py-2 text-sm" required />
          <button type="submit" class="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-black">Create Group</button>
        </form>
        <p id="groupTabStatus" class="mt-3 text-sm text-slate-700"></p>
      </article>

      <article class="rounded-xl border border-slate-200 bg-white p-4 md:col-span-2">
        <h3 class="font-semibold text-slate-900">Groups by Event</h3>
        <div class="mt-3 grid gap-4">
          ${
            groupsByEvent.some((row) => row.groups.length)
              ? groupsByEvent
                  .map((row) => {
                    if (!row.groups.length) return "";
                    return row.groups
                      .map(
                        (group) => `
                          <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <div class="flex items-center justify-between gap-2">
                              <div>
                                <p class="text-sm font-semibold text-slate-900">${escapeHtml(group.name)}</p>
                                <p class="text-xs text-slate-500">Event: ${escapeHtml(eventNameById.get(group.eventId) || "Unknown")}</p>
                              </div>
                              <span class="text-xs text-slate-500">${(group.members || []).length} members</span>
                            </div>
                            <form class="group-tab-member-form mt-3 flex gap-2" data-group-id="${group.id}">
                              <select name="memberUserId" class="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-xs">
                                <option value="">Select participant or coordinator</option>
                                ${(row.memberCandidates || [])
                                  .map(
                                    (member) =>
                                      `<option value="${member.id}">${escapeHtml(member.name)} (${member.role})</option>`
                                  )
                                  .join("")}
                              </select>
                              <button type="submit" class="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">Add</button>
                            </form>
                            <ul class="mt-3 grid gap-1">
                              ${
                                (group.members || []).length
                                  ? group.members
                                      .map(
                                        (member) =>
                                          `<li class="rounded bg-white px-2 py-1.5 text-xs text-slate-700">${escapeHtml(
                                            member.userName
                                          )} - ${escapeHtml(member.userRole)}</li>`
                                      )
                                      .join("")
                                  : `<li class="rounded bg-white px-2 py-1.5 text-xs text-slate-500">No members yet.</li>`
                              }
                            </ul>
                          </div>
                        `
                      )
                      .join("");
                  })
                  .join("")
              : `<p class="text-sm text-slate-600">No groups yet. Create one above.</p>`
          }
        </div>
      </article>
    `;

    const createGroupForm = document.querySelector("#createGroupTabForm");
    const groupStatus = document.querySelector("#groupTabStatus");
    createGroupForm?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(createGroupForm);
      const eventId = String(formData.get("eventId") || "");
      const groupName = String(formData.get("groupName") || "").trim();
      if (!eventId || !groupName) return;
      try {
        await apiJson(`/api/items/${eventId}/groups`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            coordinatorId: user.id,
            name: groupName,
          }),
        });
        groupStatus.textContent = "Group created.";
        groupStatus.className = "mt-3 text-sm font-medium text-green-700";
        renderCoordinatorGroups(user, content);
      } catch (error) {
        groupStatus.textContent = error.message || "Failed to create group.";
        groupStatus.className = "mt-3 text-sm font-medium text-red-600";
      }
    });

    document.querySelectorAll(".group-tab-member-form").forEach((form) => {
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const groupId = form.getAttribute("data-group-id");
        const memberUserId = String(new FormData(form).get("memberUserId") || "");
        if (!groupId || !memberUserId) {
          alert("Select a member first.");
          return;
        }
        try {
          await apiJson(`/api/groups/${groupId}/members`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              coordinatorId: user.id,
              memberUserId,
              participantId: memberUserId,
            }),
          });
          renderCoordinatorGroups(user, content);
        } catch (error) {
          alert(error.message || "Failed to add member.");
        }
      });
    });
  } catch (error) {
    content.innerHTML = renderErrorCard(error.message || "Failed to load groups.");
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

async function renderCoordinatorRequests(user, content) {
  try {
    const rows = await apiJson(`/api/coordinators/${user.id}/join-requests`);
    content.innerHTML = `
      <article class="rounded-xl border border-slate-200 bg-white p-4 md:col-span-2">
        <h3 class="font-semibold text-slate-900">Join Requests</h3>
        <p class="mt-1 text-sm text-slate-600">Approve or decline participant requests.</p>
        <div class="mt-4 grid gap-3">
          ${
            rows.length
              ? rows
                  .map(
                    (row) => `
                    <div class="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div class="flex flex-wrap items-center justify-between gap-3">
                        <div class="flex items-center gap-3">
                          ${row.participantPhotoUrl ? `<img src="${resolveAvatarUrl(row.participantPhotoUrl)}" onerror="${avatarFallbackOnError()}" class="h-10 w-10 rounded-full object-cover" alt="${escapeHtml(row.participantName)}" />` : ""}
                          <div>
                            <p class="font-semibold text-slate-900">${escapeHtml(row.participantName)}</p>
                            <p class="text-sm text-slate-600">${escapeHtml(row.eventName)} · Shift ${row.shift}</p>
                            <p class="text-xs text-slate-500">Requested: ${formatDateTime(row.requestedAt)}</p>
                          </div>
                        </div>
                        <div class="flex items-center gap-2">
                          <span class="rounded px-2 py-1 text-xs font-semibold ${row.status === "approved" ? "bg-green-100 text-green-700" : row.status === "declined" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}">${row.status}</span>
                          ${
                            row.status === "pending"
                              ? `
                                <button type="button" class="request-decision-btn rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700" data-join-id="${row.joinId}" data-decision="approved">Approve</button>
                                <button type="button" class="request-decision-btn rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700" data-join-id="${row.joinId}" data-decision="declined">Decline</button>
                              `
                              : ""
                          }
                        </div>
                      </div>
                    </div>
                  `
                  )
                  .join("")
              : `<p class="text-sm text-slate-600">No requests yet.</p>`
          }
        </div>
      </article>
    `;

    document.querySelectorAll(".request-decision-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const joinId = btn.getAttribute("data-join-id");
        const decision = btn.getAttribute("data-decision");
        const confirmed = window.confirm(
          decision === "approved"
            ? "Approve this volunteer request?"
            : "Decline this volunteer request?"
        );
        if (!confirmed) return;
        try {
          await apiJson(`/api/joins/${joinId}/decision`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ coordinatorId: user.id, decision }),
          });
          renderCoordinatorRequests(user, content);
        } catch (error) {
          alert(error.message || "Failed to process request.");
        }
      });
    });
  } catch (error) {
    content.innerHTML = renderErrorCard(error.message || "Failed to load requests.");
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

async function renderGroupChatPage(user, content) {
  try {
    const groups = await apiJson(`/api/users/${user.id}/groups`);
    if (!groups.length) {
      selectedChatGroupId = null;
      content.innerHTML = `
        <article class="rounded-xl border border-slate-200 bg-white p-5 md:col-span-2">
          <h3 class="font-semibold text-slate-900">Group Chat</h3>
          <p class="mt-2 text-sm text-slate-600">You are not part of any groups yet.</p>
        </article>
      `;
      return;
    }

    if (!selectedChatGroupId || !groups.some((group) => group.id === selectedChatGroupId)) {
      selectedChatGroupId = groups[0].id;
    }

    const activeGroup = groups.find((group) => group.id === selectedChatGroupId) || groups[0];
    const chat = await apiJson(
      `/api/groups/${encodeURIComponent(activeGroup.id)}/chat?userId=${encodeURIComponent(user.id)}`
    );
    const uniqueMessages = dedupeChatMessages(chat.messages || []);
    const pendingMessages = getPendingChatMessages(activeGroup.id);
    const displayMessages = buildDisplayChatMessages(uniqueMessages, pendingMessages, user.id);

    content.innerHTML = `
      <article class="portal-card rounded-xl border border-slate-200 p-4">
        <h3 class="font-semibold text-slate-900">Your Groups</h3>
        <p class="mt-1 text-sm text-slate-600">Choose a group to open chat.</p>
        <div class="mt-3 grid gap-2">
          ${renderGroupChatGroupButtons(groups, activeGroup.id)}
        </div>
      </article>

      <article class="group-chat-window rounded-2xl border border-slate-200 bg-white md:col-span-1">
        <div class="group-chat-header flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div class="min-w-0">
            <h3 class="truncate font-semibold text-slate-900">${escapeHtml(chat.group.name)}</h3>
            <p class="mt-1 text-sm text-slate-700">${escapeHtml(chat.group.description || "Group discussion")}</p>
            <p class="mt-1 text-xs font-semibold ${chat.coordinatorsOnly ? "text-amber-800" : "text-emerald-800"}">
              Write mode: ${chat.coordinatorsOnly ? "Only Coordinators" : "All Members"}
            </p>
          </div>
          ${
            chat.canManageSettings
              ? `
                <label class="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-900">
                  <input id="groupChatWriteSwitch" type="checkbox" class="accent-orange-600" ${
                    chat.coordinatorsOnly ? "checked" : ""
                  } />
                  Coordinators only
                </label>
              `
              : ""
          }
        </div>

        <div id="groupChatMessages" class="group-chat-messages max-h-[410px] space-y-2 overflow-y-auto px-3 py-3">
          ${renderGroupChatMessages(displayMessages, user)}
        </div>

        ${
          chat.canWrite
            ? `
              <form id="groupChatForm" class="group-chat-compose grid gap-2 border-t border-slate-200 bg-white px-3 py-3">
                <textarea id="groupChatMessage" rows="3" maxlength="1200" class="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900" placeholder="Write message to the group..." required></textarea>
                <button id="groupChatSendBtn" type="submit" class="rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700">Send Message</button>
              </form>
            `
            : `<p class="m-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">Only coordinators can send messages in this group.</p>`
        }
      </article>
    `;

    document.querySelectorAll(".group-chat-group-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectedChatGroupId = btn.getAttribute("data-group-id");
        renderGroupChatPage(user, content);
      });
    });

    const switchEl = document.querySelector("#groupChatWriteSwitch");
    if (switchEl) {
      switchEl.addEventListener("change", async () => {
        try {
          await apiJson(`/api/groups/${activeGroup.id}/chat/settings`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              coordinatorId: user.id,
              coordinatorsOnly: switchEl.checked,
            }),
          });
          renderGroupChatPage(user, content);
        } catch (error) {
          alert(error.message || "Failed to update chat settings.");
        }
      });
    }

    const sendPendingMessage = (pendingRow) =>
      sendPendingChatMessage({
        groupId: activeGroup.id,
        pendingRow,
        user,
        onDone: () => renderGroupChatPage(user, content),
      });

    document.querySelectorAll(".group-chat-retry-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const tempId = btn.getAttribute("data-temp-id");
        if (!tempId) return;
        const row = getPendingChatMessages(activeGroup.id).find((item) => item.localId === tempId);
        if (!row) return;
        sendPendingMessage(row);
      });
    });

    const form = document.querySelector("#groupChatForm");
    if (form) {
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const input = document.querySelector("#groupChatMessage");
        const text = String(input?.value || "").trim();
        if (!text) return;
        const pendingRow = createPendingChatMessage(user, text);
        appendPendingChatMessage(activeGroup.id, pendingRow);
        renderGroupChatPage(user, content);
        sendPendingMessage(pendingRow);
      });
    }

    const messagesEl = document.querySelector("#groupChatMessages");
    if (messagesEl) {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
  } catch (error) {
    content.innerHTML = renderErrorCard(error.message || "Failed to load group chat.");
  }
}

function dedupeChatMessages(messages) {
  const uniqueMessages = [];
  const messageKeys = new Set();
  for (const row of messages || []) {
    const key = row.id || `${row.senderId}|${row.createdAt}|${row.message}`;
    if (messageKeys.has(key)) continue;
    messageKeys.add(key);
    uniqueMessages.push(row);
  }
  return uniqueMessages;
}

function buildDisplayChatMessages(serverMessages, pendingMessages, currentUserId) {
  return [
    ...(serverMessages || []).map((row) => ({
      ...row,
      localId: row.id,
      deliveryStatus: row.senderId === currentUserId ? "sent" : "",
    })),
    ...(pendingMessages || []),
  ].sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
}

function renderGroupChatGroupButtons(groups, activeGroupId) {
  return (groups || [])
    .map(
      (group) => `
        <button type="button" class="group-chat-group-btn rounded-lg border px-3 py-2 text-left ${
          group.id === activeGroupId
            ? "border-orange-300 bg-orange-50 text-orange-800"
            : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
        }" data-group-id="${group.id}">
          <p class="text-sm font-semibold">${escapeHtml(group.name)}</p>
          <p class="text-xs text-slate-500">${escapeHtml(group.eventName)} · ${group.memberCount} members</p>
        </button>
      `
    )
    .join("");
}

function chatDeliveryStatusText(row, isSelf) {
  if (row.deliveryStatus === "sending") return "Sending...";
  if (row.deliveryStatus === "failed") return "Failed";
  if (isSelf) return "Sent";
  return "";
}

function chatBubbleClass(isSelf) {
  return isSelf
    ? "bg-[#FFB399] text-slate-900 ring-1 ring-[#FF9A86]"
    : "bg-[#FFF0BE] text-slate-900 ring-1 ring-[#FFD6A6]";
}

function renderGroupChatMessages(messages, currentUser) {
  if (!messages.length) {
    return `<p class="text-sm text-slate-700">No messages yet. Start the conversation.</p>`;
  }

  return messages
    .map((row) => {
      const self = row.senderId === currentUser.id;
      const avatarUrl = resolveAvatarUrl(row.senderPhotoUrl || (self ? currentUser.photoUrl : ""));
      const statusText = chatDeliveryStatusText(row, self);
      return `
        <div class="group-chat-row flex ${self ? "justify-end" : "justify-start"}">
          <div class="flex max-w-[90%] items-end gap-2 ${self ? "flex-row-reverse" : "flex-row"}">
            <img src="${avatarUrl}" onerror="${avatarFallbackOnError()}" alt="${escapeHtml(row.senderName || "Member")}" class="h-7 w-7 rounded-full object-cover ring-1 ring-slate-300" />
            <div class="group-chat-bubble max-w-[82%] rounded-2xl px-3 py-2 ${chatBubbleClass(self)}">
              <p class="text-[11px] font-semibold ${self ? "text-slate-900" : "text-slate-800"}">${escapeHtml(
                row.senderName
              )} · ${escapeHtml(row.senderRole)}</p>
              <p class="mt-1 whitespace-pre-wrap break-words text-sm text-slate-900">${escapeHtml(row.message)}</p>
              <div class="mt-1 flex items-center justify-between gap-2">
                <p class="text-[10px] text-slate-700">${formatDateTime(row.createdAt)}</p>
                ${
                  statusText
                    ? `<p class="text-[10px] font-semibold ${
                        row.deliveryStatus === "failed"
                          ? "text-red-700"
                          : row.deliveryStatus === "sending"
                            ? "text-amber-700"
                            : "text-slate-600"
                      }">${statusText}</p>`
                    : ""
                }
              </div>
              ${
                row.deliveryStatus === "failed"
                  ? `<button type="button" class="group-chat-retry-btn mt-1 rounded-md bg-red-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-red-700" data-temp-id="${escapeHtmlAttr(row.localId)}">Retry</button>`
                  : ""
              }
            </div>
          </div>
        </div>
      `;
    })
    .join("");
}

function createPendingChatMessage(user, text) {
  return {
    localId: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    senderId: user.id,
    senderName: user.name,
    senderRole: user.role,
    senderPhotoUrl: user.photoUrl || "",
    message: text,
    createdAt: new Date().toISOString(),
    deliveryStatus: "sending",
  };
}

async function sendPendingChatMessage({ groupId, pendingRow, user, onDone }) {
  try {
    updatePendingChatMessage(groupId, pendingRow.localId, { deliveryStatus: "sending" });
    await apiJson(`/api/groups/${groupId}/chat/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, message: pendingRow.message }),
    });
    removePendingChatMessage(groupId, pendingRow.localId);
  } catch (_error) {
    updatePendingChatMessage(groupId, pendingRow.localId, { deliveryStatus: "failed" });
  } finally {
    onDone();
  }
}

function getPendingChatMessages(groupId) {
  return pendingChatMessagesByGroup.get(groupId) || [];
}

function appendPendingChatMessage(groupId, row) {
  const current = getPendingChatMessages(groupId);
  pendingChatMessagesByGroup.set(groupId, [...current, row]);
}

function updatePendingChatMessage(groupId, localId, patch) {
  const current = getPendingChatMessages(groupId);
  if (!current.length) return;
  pendingChatMessagesByGroup.set(
    groupId,
    current.map((row) => (row.localId === localId ? { ...row, ...patch } : row))
  );
}

function removePendingChatMessage(groupId, localId) {
  const current = getPendingChatMessages(groupId);
  if (!current.length) return;
  const next = current.filter((row) => row.localId !== localId);
  if (next.length) pendingChatMessagesByGroup.set(groupId, next);
  else pendingChatMessagesByGroup.delete(groupId);
}

function bindCoordinatorEventActions(user, content) {
  document.querySelectorAll(".event-settings-form").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const eventId = form.getAttribute("data-event-id");
      const formData = new FormData(form);
      formData.append("coordinatorId", user.id);
      try {
        await fetchOrThrow(`${API_BASE}/api/items/${eventId}`, {
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
        await fetchOrThrow(`${API_BASE}/api/items/${eventId}`, {
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

  document.querySelectorAll(".export-event-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const eventId = btn.getAttribute("data-event-id");
      const url = `${API_BASE}/api/items/${eventId}/volunteers.csv?coordinatorId=${encodeURIComponent(user.id)}`;
      window.open(url, "_blank");
    });
  });

  document.querySelectorAll(".coordinator-join-form").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const eventId = form.getAttribute("data-event-id");
      const shift = new FormData(form).get("shift");
      const statusEl = document.querySelector("#coordinatorJoinStatus");
      try {
        const result = await apiJson(`/api/items/${eventId}/join`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ participantId: user.id, shift }),
        });
        if (statusEl) {
          statusEl.textContent = result.message;
          statusEl.className = "mt-3 text-sm font-medium text-green-700";
        }
        renderCoordinatorEvents(user, content);
      } catch (error) {
        if (statusEl) {
          statusEl.textContent = error.message || "Failed to join event.";
          statusEl.className = "mt-3 text-sm font-medium text-red-600";
        }
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
            data-email="${escapeHtmlAttr(user.email || "")}"
            data-default-password="12345678">
            <span class="flex items-center gap-3">
              <img src="${resolveAvatarUrl(user.photoUrl)}" onerror="${avatarFallbackOnError()}" alt="${escapeHtml(user.name)}" class="h-9 w-9 rounded-full object-cover" />
              <span>
                <span class="block text-sm font-semibold text-slate-900">${escapeHtml(user.name)}</span>
                <span class="block text-xs text-slate-500">${user.role} · ${user.region} · ${escapeHtml(user.email || "")}</span>
              </span>
            </span>
            <span class="rounded bg-orange-100 px-2 py-1 text-xs font-semibold text-orange-700">Use</span>
          </button>
        `
      )
      .join("");

    document.querySelectorAll(".quick-user-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        form.querySelector('input[name="email"]').value = btn.getAttribute("data-email") || "";
        form.querySelector('input[name="password"]').value = btn.getAttribute("data-default-password") || "";
        form.requestSubmit();
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
      { page: "group-chat", label: "Group Chat" },
      { page: "profile", label: "Profile Settings" },
    ];
  }
  return [
    { page: "dashboard", label: "Dashboard" },
    { page: "create-event", label: "Create Event" },
    { page: "events", label: "My Events" },
    { page: "groups", label: "Groups" },
    { page: "group-chat", label: "Group Chat" },
    { page: "participants", label: "Participants" },
    { page: "profile", label: "Profile Settings" },
  ];
}

function pageTitleFor(page, role) {
  if (page === "dashboard") return `${role} Dashboard`;
  if (page === "create-event") return "Create Volunteer Event";
  if (page === "events") return role === "Participant" ? "Events & Shift Join" : "Event Settings";
  if (page === "groups") return "Groups";
  if (page === "group-chat") return "Group Chat";
  if (page === "event-detail") return "Event Details";
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

function resolveAssetUrl(photoUrl) {
  const value = String(photoUrl || "");
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `${API_BASE}${value}`;
}

function resolveAvatarUrl(photoUrl) {
  const resolved = resolveAssetUrl(photoUrl);
  return resolved || HEART_ICON_IMAGE;
}

function avatarFallbackOnError() {
  return `this.onerror=null;this.src='${escapeHtmlAttr(HEART_ICON_IMAGE)}';`;
}

function resolveEventImageUrl(photoUrl) {
  const resolved = resolveAssetUrl(photoUrl);
  return resolved || LANDING_HERO_IMAGE;
}

function eventImageFallbackOnError() {
  return `this.onerror=null;this.src='${escapeHtmlAttr(LANDING_HERO_IMAGE)}';`;
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}
