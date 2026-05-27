const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs/promises");
const { createClient } = require("@supabase/supabase-js");
const { randomUUID, createHash } = require("crypto");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const app = express();
const PORT = 4000;
const ROOT_DIR = path.join(__dirname, "..");
const UPLOADS_DIR = path.join(ROOT_DIR, "uploads");

const ALLOWED_ROLES = ["Participant", "Coordinator"];
const ALLOWED_REGIONS = ["Almaty", "Astana"];
const ALLOWED_SHIFTS = ["Morning", "Afternoon", "Night"];
const ALLOWED_JOIN_STATUSES = ["pending", "approved", "declined"];
const LEGACY_DEFAULT_PASSWORD_HASH = "ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    "Missing Supabase env vars. Required: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (recommended)."
  );
  process.exit(1);
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    "SUPABASE_SERVICE_ROLE_KEY not found. Falling back to public key; this requires permissive table policies."
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
    cb(null, `${Date.now()}-${randomUUID()}${ext}`);
  },
});
const upload = multer({ storage });

function normalizeName(name) {
  return String(name || "").trim().toLowerCase();
}

function mapUserRow(row, fallbackEmail = null) {
  return {
    id: row.id,
    name: row.name,
    email: row.email || fallbackEmail,
    region: row.region,
    birthDate: row.birth_date,
    role: row.role,
    photoUrl: row.photo_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at || null,
  };
}

function mapEventRow(row, coordinatorName = "Unknown Coordinator") {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    region: row.region,
    photoUrl: row.photo_url,
    coordinatorId: row.coordinator_id,
    coordinatorName,
    shifts: row.shifts || null, // ← ДОБАВИТЬ ЭТУ СТРОКУ
    createdAt: row.created_at,
    updatedAt: row.updated_at || null,
  };
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

function hashPassword(password) {
  return createHash("sha256").update(String(password)).digest("hex");
}

function legacyEmailBase(name) {
  const base = String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
  return base || "user";
}

function buildLegacyEmailMap(users) {
  const sorted = [...(users || [])].sort((a, b) => {
    const aTime = new Date(a.created_at || 0).getTime();
    const bTime = new Date(b.created_at || 0).getTime();
    if (aTime !== bTime) return aTime - bTime;
    return String(a.id).localeCompare(String(b.id));
  });
  const usedEmails = new Set(
    sorted
      .map((user) => String(user.email || "").trim().toLowerCase())
      .filter(Boolean)
  );
  const mapped = new Map();

  for (const user of sorted) {
    const currentEmail = String(user.email || "").trim().toLowerCase();
    if (!currentEmail) {
      const base = legacyEmailBase(user.name);
      let suffix = 1;
      let candidate = `${base}@mail.ms`;
      while (usedEmails.has(candidate)) {
        suffix += 1;
        candidate = `${base}${suffix}@mail.ms`;
      }
      mapped.set(user.id, candidate);
      usedEmails.add(candidate);
    }
  }
  return mapped;
}

async function hasUserRole(userId, expectedRole) {
  const result = await supabase.from("users").select("id,role").eq("id", userId).maybeSingle();
  if (result.error) {
    const message = String(result.error.message || "");
    if (message.toLowerCase().includes("invalid input syntax for type uuid")) return false;
    throw result.error;
  }
  return result.data?.role === expectedRole;
}

async function getManagedEventsForCoordinator(coordinatorId, eventId = null) {
  const eventsQuery = supabase.from("events").select("id,name,coordinator_id");
  const scopedEventsQuery = eventId ? eventsQuery.eq("id", eventId) : eventsQuery;
  const [eventsResult, joinsResult] = await Promise.all([
    scopedEventsQuery,
    supabase
      .from("joins")
      .select("event_id")
      .eq("participant_id", coordinatorId)
      .eq("status", "approved"),
  ]);
  if (eventsResult.error) throw eventsResult.error;
  if (joinsResult.error) throw joinsResult.error;

  const approvedEventIds = new Set((joinsResult.data || []).map((row) => row.event_id));
  return (eventsResult.data || []).filter(
    (event) => event.coordinator_id === coordinatorId || approvedEventIds.has(event.id)
  );
}

async function resolveManagedEvent(coordinatorId, eventId) {
  if (!(await hasUserRole(coordinatorId, "Coordinator"))) {
    return { ok: false, status: 403, message: "Only coordinator accounts can access this route." };
  }

  const eventResult = await supabase.from("events").select("*").eq("id", eventId).maybeSingle();
  if (eventResult.error) throw eventResult.error;
  if (!eventResult.data) {
    return { ok: false, status: 404, message: "Event not found." };
  }
  if (eventResult.data.coordinator_id === coordinatorId) {
    return { ok: true, event: eventResult.data };
  }

  const joinResult = await supabase
    .from("joins")
    .select("id")
    .eq("event_id", eventId)
    .eq("participant_id", coordinatorId)
    .eq("status", "approved")
    .maybeSingle();
  if (joinResult.error) throw joinResult.error;
  if (joinResult.data) {
    return { ok: true, event: eventResult.data };
  }

  return {
    ok: false,
    status: 403,
    message: "You can manage only events you created or joined as approved coordinator.",
  };
}

async function getGroupAccessContext(userId, groupId) {
  const userResult = await supabase.from("users").select("id,name,role,photo_url").eq("id", userId).maybeSingle();
  if (userResult.error) {
    const message = String(userResult.error.message || "").toLowerCase();
    if (message.includes("invalid input syntax for type uuid")) {
      return { ok: false, status: 403, message: "Invalid user id." };
    }
    throw userResult.error;
  }
  if (!userResult.data || !["Participant", "Coordinator"].includes(userResult.data.role)) {
    return { ok: false, status: 403, message: "Only Participant or Coordinator can access group chat." };
  }

  const groupResult = await supabase.from("event_groups").select("*").eq("id", groupId).maybeSingle();
  if (groupResult.error) throw groupResult.error;
  if (!groupResult.data) return { ok: false, status: 404, message: "Group not found." };

  const membersResult = await supabase
    .from("event_group_members")
    .select("participant_id")
    .eq("group_id", groupId);
  if (membersResult.error) throw membersResult.error;

  const memberIds = new Set((membersResult.data || []).map((row) => row.participant_id));
  const isMember = memberIds.has(userId);
  let canManage = false;
  if (userResult.data.role === "Coordinator") {
    const access = await resolveManagedEvent(userId, groupResult.data.event_id);
    canManage = access.ok;
  }

  if (!isMember && !canManage) {
    return { ok: false, status: 403, message: "You do not have access to this group chat." };
  }

  return {
    ok: true,
    user: userResult.data,
    group: groupResult.data,
    memberIds,
    isMember,
    canManage,
  };
}

function mapJoinSchemaError(error, fallbackMessage) {
  const text = String(error?.message || "");
  if (text.includes("column") && text.includes("joins") && text.includes("does not exist")) {
    return "Database schema is outdated. Please run Backend/supabase/schema.sql in Supabase SQL editor.";
  }
  return fallbackMessage;
}

function isMissingUsersColumn(error, column) {
  const message = String(error?.message || "").toLowerCase();
  return String(error?.code || "") === "42703" && message.includes(`column users.${column} does not exist`);
}

async function ensureStorage() {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
}

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(UPLOADS_DIR));

app.get("/api/health", async (_req, res) => {
  const { error } = await supabase.from("users").select("id").limit(1);
  if (error) return res.status(500).json({ ok: false, message: error.message });
  return res.json({ ok: true });
});

app.get("/api/users", async (req, res) => {
  try {
    let query = supabase.from("users").select("*");
    if (req.query.role) query = query.eq("role", req.query.role);
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw error;
    return res.json((data || []).map(mapUserRow));
  } catch {
    return res.status(500).json({ message: "Failed to fetch users." });
  }
});

app.get("/api/users/short", async (_req, res) => {
  try {
    let { data, error } = await supabase
      .from("users")
      .select("id,name,email,role,region,birth_date,photo_url,created_at")
      .order("created_at", { ascending: false });
    if (error && isMissingUsersColumn(error, "email")) {
      const fallback = await supabase
        .from("users")
        .select("id,name,role,region,birth_date,photo_url,created_at")
        .order("created_at", { ascending: false });
      data = fallback.data || [];
      error = fallback.error || null;
    }
    if (error) throw error;
    const legacyEmailMap = buildLegacyEmailMap(data || []);
    return res.json(
      (data || []).map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email || legacyEmailMap.get(row.id) || null,
        role: row.role,
        region: row.region,
        birthDate: row.birth_date,
        photoUrl: row.photo_url,
      }))
    );
  } catch {
    return res.status(500).json({ message: "Failed to fetch quick users." });
  }
});

app.post("/api/register", upload.single("photo"), async (req, res) => {
  try {
    const { name, email, password, region, birthDate, role } = req.body;
    if (!name || !email || !password || !region || !birthDate || !role) {
      return res.status(400).json({ message: "All fields are required." });
    }
    if (!req.file) return res.status(400).json({ message: "Photo is required." });
    if (!ALLOWED_ROLES.includes(role)) return res.status(400).json({ message: "Invalid role selected." });
    if (!ALLOWED_REGIONS.includes(region)) return res.status(400).json({ message: "Invalid region selected." });
    if (String(password).length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    }

    const emailValue = String(email).trim().toLowerCase();
    const existingEmail = await supabase.from("users").select("id").eq("email", emailValue).maybeSingle();
    if (existingEmail.error) throw existingEmail.error;
    if (existingEmail.data) {
      return res.status(400).json({ message: "Email already registered." });
    }

    const insert = {
      id: randomUUID(),
      name: String(name).trim(),
      email: emailValue,
      password_hash: hashPassword(password),
      region,
      birth_date: birthDate,
      role,
      photo_url: `/uploads/${req.file.filename}`,
      created_at: new Date().toISOString(),
    };
    const { data, error } = await supabase.from("users").insert(insert).select("*").single();
    if (error) throw error;
    return res.status(201).json({ message: "Registration completed.", user: mapUserRow(data) });
  } catch {
    return res.status(500).json({ message: "Failed to register user." });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const emailValue = String(email).trim().toLowerCase();
    const byEmail = await supabase.from("users").select("*").eq("email", emailValue).maybeSingle();
    const missingEmailColumn = isMissingUsersColumn(byEmail.error, "email");
    if (byEmail.error && !missingEmailColumn) throw byEmail.error;

    let found = missingEmailColumn ? null : byEmail.data || null;
    let fallbackEmail = null;
    if (!found) {
      let uniqueRows = [];
      if (missingEmailColumn) {
        const legacyRows = await supabase.from("users").select("*");
        if (legacyRows.error) throw legacyRows.error;
        uniqueRows = legacyRows.data || [];
      } else {
        const [nullEmailRows, blankEmailRows] = await Promise.all([
          supabase.from("users").select("*").is("email", null),
          supabase.from("users").select("*").eq("email", ""),
        ]);
        if (nullEmailRows.error) throw nullEmailRows.error;
        if (blankEmailRows.error) throw blankEmailRows.error;
        const merged = [...(nullEmailRows.data || []), ...(blankEmailRows.data || [])];
        uniqueRows = Array.from(new Map(merged.map((row) => [row.id, row])).values());
      }
      const legacyEmailMap = buildLegacyEmailMap(uniqueRows);
      const match = uniqueRows.find((row) => legacyEmailMap.get(row.id) === emailValue);
      if (match) {
        found = match;
        fallbackEmail = legacyEmailMap.get(match.id) || null;
      }
    }

    if (!found) return res.status(401).json({ message: "Invalid email or password." });
    const expectedHash = String(found.password_hash || "").trim() || LEGACY_DEFAULT_PASSWORD_HASH;
    if (expectedHash !== hashPassword(password)) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    return res.json({ message: "Login successful.", user: mapUserRow(found, fallbackEmail) });
  } catch {
    return res.status(500).json({ message: "Failed to login." });
  }
});

app.patch("/api/users/:userId", upload.single("photo"), async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, region, birthDate } = req.body;
    const updates = { updated_at: new Date().toISOString() };
    if (name !== undefined && String(name).trim()) updates.name = String(name).trim();
    if (region !== undefined) {
      if (!ALLOWED_REGIONS.includes(region)) return res.status(400).json({ message: "Invalid region selected." });
      updates.region = region;
    }
    if (birthDate !== undefined && String(birthDate).trim()) updates.birth_date = birthDate;
    if (req.file) updates.photo_url = `/uploads/${req.file.filename}`;

    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", userId)
      .select("*")
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ message: "User not found." });
    return res.json({ message: "Profile updated.", user: mapUserRow(data) });
  } catch {
    return res.status(500).json({ message: "Failed to update profile." });
  }
});

app.get(["/api/events", "/api/items"], async (_req, res) => {
  try {
    const [eventsResult, usersResult] = await Promise.all([
      supabase.from("events").select("*").order("created_at", { ascending: false }),
      supabase.from("users").select("id,name").eq("role", "Coordinator"),
    ]);
    if (eventsResult.error) throw eventsResult.error;
    if (usersResult.error) throw usersResult.error;

    const coordinatorById = new Map((usersResult.data || []).map((u) => [u.id, u.name]));
    const result = (eventsResult.data || []).map((event) =>
      mapEventRow(event, coordinatorById.get(event.coordinator_id) || "Unknown Coordinator")
    );
    return res.json(result);
  } catch {
    return res.status(500).json({ message: "Failed to fetch events." });
  }
});

app.post(["/api/events", "/api/items"], upload.single("photo"), async (req, res) => {
  try {
    const { name, description, region, coordinatorId, shifts } = req.body;
    if (!name || !description || !region || !coordinatorId) {
      return res.status(400).json({ message: "All event fields are required." });
    }
    if (!req.file) return res.status(400).json({ message: "Event photo is required." });
    if (!ALLOWED_REGIONS.includes(region)) return res.status(400).json({ message: "Invalid region selected." });

    const coordinatorResult = await supabase
      .from("users")
      .select("id,name,role")
      .eq("id", coordinatorId)
      .single();
    if (coordinatorResult.error || coordinatorResult.data?.role !== "Coordinator") {
      return res.status(400).json({ message: "Coordinator account is invalid." });
    }

    const insert = {
      id: randomUUID(),
      name: String(name).trim(),
      description: String(description).trim(),
      region,
      photo_url: `/uploads/${req.file.filename}`,
      coordinator_id: coordinatorId,
      shifts: shifts || null,
      created_at: new Date().toISOString(),
    };
    const { data, error } = await supabase.from("events").insert(insert).select("*").single();
    if (error) throw error;
    return res.status(201).json({
      message: "Event created successfully.",
      event: mapEventRow(data, coordinatorResult.data.name),
    });
  } catch (error) {
    console.error('Create event error:', error);
    return res.status(500).json({ message: "Failed to create event." });
  }
});

app.post(["/api/events/:eventId/join", "/api/items/:eventId/join"], async (req, res) => {
  try {
    const { eventId } = req.params;
    const { participantId, shift, formAnswers } = req.body;
    
    console.log('Join request received:', { eventId, participantId, shift }); // ОТЛАДКА
    
    if (!participantId || !shift) {
      return res.status(400).json({ message: "Participant and shift are required." });
    }

    const [eventResult, userResult] = await Promise.all([
      supabase.from("events").select("id").eq("id", eventId).single(),
      supabase.from("users").select("id,role").eq("id", participantId).single(),
    ]);
    
    console.log('Event result:', eventResult);
    console.log('User result:', userResult);
    
    if (eventResult.error || !eventResult.data) {
      return res.status(404).json({ message: "Event not found." });
    }
    if (userResult.error || !["Participant", "Coordinator"].includes(userResult.data?.role)) {
      return res.status(400).json({ message: "Only Participant or Coordinator can join events." });
    }

    const existingResult = await supabase
      .from("joins")
      .select("id")
      .eq("event_id", eventId)
      .eq("participant_id", participantId)
      .maybeSingle();
    
    console.log('Existing join:', existingResult);

    if (existingResult.error) throw existingResult.error;

    const now = new Date().toISOString();
    const joinData = {
      shift: String(shift),
      form_answers: formAnswers || null,
      status: "pending",
      requested_at: now,
    };

    if (existingResult.data) {
      const { error, data } = await supabase
        .from("joins")
        .update({ ...joinData, decided_at: null, updated_at: now })
        .eq("id", existingResult.data.id)
        .select();
      
      console.log('Update result:', { error, data });
      if (error) throw error;
      return res.json({ message: "Join request updated and sent for review." });
    }

    const insertData = {
      id: randomUUID(),
      event_id: eventId,
      participant_id: participantId,
      ...joinData,
      joined_at: now,
    };
    
    console.log('Insert data:', insertData);
    
    const { error, data } = await supabase
      .from("joins")
      .insert(insertData)
      .select();
    
    console.log('Insert result:', { error, data });
    
    if (error) throw error;
    return res.json({ message: "Join request sent. Waiting for coordinator decision." });
    
  } catch (error) {
    console.error('Join error details:', error);
    return res.status(500).json({ 
      message: "Failed to join event: " + (error.message || "Unknown error"),
      details: error.message 
    });
  }
});

app.get("/api/coordinators/:coordinatorId/join-requests", async (req, res) => {
  try {
    const { coordinatorId } = req.params;
    if (!(await hasUserRole(coordinatorId, "Coordinator"))) {
      return res.status(403).json({ message: "Only coordinator accounts can access this route." });
    }
    const status = req.query.status;
    const eventId = req.query.eventId;
    const events = await getManagedEventsForCoordinator(coordinatorId, eventId);
    if (!events.length) return res.json([]);

    let joinsQuery = supabase.from("joins").select("*").in("event_id", events.map((e) => e.id));
    if (status && ALLOWED_JOIN_STATUSES.includes(String(status))) {
      joinsQuery = joinsQuery.eq("status", status);
    }
    const [joinsResult, usersResult] = await Promise.all([
      joinsQuery.order("requested_at", { ascending: false }),
      supabase.from("users").select("id,name,photo_url,role"),
    ]);
    if (joinsResult.error) throw joinsResult.error;
    if (usersResult.error) throw usersResult.error;

    const participantById = new Map((usersResult.data || []).map((u) => [u.id, u]));
    const eventById = new Map(events.map((e) => [e.id, e]));
    const rows = (joinsResult.data || []).map((join) => {
      const participant = participantById.get(join.participant_id);
      const event = eventById.get(join.event_id);
      return {
        joinId: join.id,
        eventId: join.event_id,
        eventName: event?.name || "Unknown event",
        participantId: join.participant_id,
        participantName: participant?.name || "Unknown participant",
        participantPhotoUrl: participant?.photo_url || "",
        participantRole: participant?.role || "Unknown",
        shift: join.shift,
        status: join.status || "pending",
        requestedAt: join.requested_at || join.joined_at,
        decidedAt: join.decided_at || null,
      };
    });
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: mapJoinSchemaError(error, "Failed to fetch join requests.") });
  }
});

app.patch("/api/joins/:joinId/decision", async (req, res) => {
  try {
    const { joinId } = req.params;
    const { coordinatorId, decision } = req.body || {};
    if (!coordinatorId || !decision) {
      return res.status(400).json({ message: "Coordinator and decision are required." });
    }
    if (!(await hasUserRole(coordinatorId, "Coordinator"))) {
      return res.status(403).json({ message: "Only coordinator accounts can decide requests." });
    }
    if (!["approved", "declined"].includes(decision)) {
      return res.status(400).json({ message: "Invalid decision." });
    }

    const joinResult = await supabase.from("joins").select("*").eq("id", joinId).single();
    if (joinResult.error || !joinResult.data) {
      return res.status(404).json({ message: "Join request not found." });
    }

    const access = await resolveManagedEvent(coordinatorId, joinResult.data.event_id);
    if (!access.ok) return res.status(access.status).json({ message: access.message });

    const { error } = await supabase
      .from("joins")
      .update({
        status: decision,
        decided_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", joinId);
    if (error) throw error;
    return res.json({ message: decision === "approved" ? "Request approved." : "Request declined." });
  } catch (error) {
    return res
      .status(500)
      .json({ message: mapJoinSchemaError(error, "Failed to process request decision.") });
  }
});

app.patch(["/api/events/:eventId", "/api/items/:eventId"], upload.single("photo"), async (req, res) => {
  try {
    const { eventId } = req.params;
    const { name, description, region, coordinatorId } = req.body;
    if (!coordinatorId) return res.status(400).json({ message: "Coordinator is required." });
    if (!(await hasUserRole(coordinatorId, "Coordinator"))) {
      return res.status(403).json({ message: "Only coordinator accounts can edit events." });
    }

    const access = await resolveManagedEvent(coordinatorId, eventId);
    if (!access.ok) return res.status(access.status).json({ message: access.message });

    const updates = { updated_at: new Date().toISOString() };
    if (name !== undefined && String(name).trim()) updates.name = String(name).trim();
    if (description !== undefined && String(description).trim()) updates.description = String(description).trim();
    if (region !== undefined) {
      if (!ALLOWED_REGIONS.includes(region)) return res.status(400).json({ message: "Invalid region selected." });
      updates.region = region;
    }
    if (req.file) updates.photo_url = `/uploads/${req.file.filename}`;

    const { data, error } = await supabase
      .from("events")
      .update(updates)
      .eq("id", eventId)
      .select("*")
      .single();
    if (error) throw error;
    return res.json({ message: "Event updated.", event: mapEventRow(data) });
  } catch {
    return res.status(500).json({ message: "Failed to update event." });
  }
});

app.delete(["/api/events/:eventId", "/api/items/:eventId"], async (req, res) => {
  try {
    const { eventId } = req.params;
    const { coordinatorId } = req.body || {};
    if (!coordinatorId) return res.status(400).json({ message: "Coordinator is required." });
    if (!(await hasUserRole(coordinatorId, "Coordinator"))) {
      return res.status(403).json({ message: "Only coordinator accounts can delete events." });
    }

    const access = await resolveManagedEvent(coordinatorId, eventId);
    if (!access.ok) return res.status(access.status).json({ message: access.message });

    await supabase.from("joins").delete().eq("event_id", eventId);
    const { error } = await supabase.from("events").delete().eq("id", eventId);
    if (error) throw error;
    return res.json({ message: "Event deleted." });
  } catch {
    return res.status(500).json({ message: "Failed to delete event." });
  }
});

app.get("/api/participants/:participantId/joins", async (req, res) => {
  try {
    const { participantId } = req.params;
    if (!(await hasUserRole(participantId, "Participant"))) {
      return res.status(403).json({ message: "Only participant accounts can access this route." });
    }
    const [joinsResult, eventsResult] = await Promise.all([
      supabase.from("joins").select("*").eq("participant_id", participantId),
      supabase.from("events").select("id,name,region"),
    ]);
    if (joinsResult.error) throw joinsResult.error;
    if (eventsResult.error) throw eventsResult.error;

    const eventById = new Map((eventsResult.data || []).map((event) => [event.id, event]));
    const rows = (joinsResult.data || []).map((join) => ({
      id: join.id,
      eventId: join.event_id,
      participantId: join.participant_id,
      shift: join.shift,
      formAnswers: join.form_answers || null,
      status: join.status || "pending",
      joinedAt: join.joined_at,
      requestedAt: join.requested_at || join.joined_at,
      decidedAt: join.decided_at || null,
      updatedAt: join.updated_at || null,
      eventName: eventById.get(join.event_id)?.name || "Unknown event",
      eventRegion: eventById.get(join.event_id)?.region || "Unknown region",
    }));
    return res.json(rows);
  } catch {
    return res.status(500).json({ message: "Failed to fetch participant joins." });
  }
});

app.get("/api/coordinators/:coordinatorId/participants", async (req, res) => {
  try {
    const { coordinatorId } = req.params;
    if (!(await hasUserRole(coordinatorId, "Coordinator"))) {
      return res.status(403).json({ message: "Only coordinator accounts can access this route." });
    }
    const eventId = req.query.eventId;
    const events = await getManagedEventsForCoordinator(coordinatorId, eventId);
    if (!events.length) return res.json([]);

    const eventIds = events.map((event) => event.id);
    const [joinsResult, usersResult] = await Promise.all([
      supabase.from("joins").select("*").in("event_id", eventIds).eq("status", "approved"),
      supabase.from("users").select("id,name").eq("role", "Participant"),
    ]);
    if (joinsResult.error) throw joinsResult.error;
    if (usersResult.error) throw usersResult.error;

    const participantById = new Map((usersResult.data || []).map((u) => [u.id, u.name]));
    const eventById = new Map(events.map((event) => [event.id, event.name]));
    const rows = (joinsResult.data || []).map((join) => ({
      joinId: join.id,
      eventId: join.event_id,
      eventName: eventById.get(join.event_id) || "Unknown event",
      participantId: join.participant_id,
      participantName: participantById.get(join.participant_id) || "Unknown participant",
      shift: join.shift,
      formAnswers: join.form_answers || null,
    }));
    return res.json(rows);
  } catch {
    return res.status(500).json({ message: "Failed to fetch participant list." });
  }
});

app.get(["/api/items/:eventId/form", "/api/events/:eventId/form"], async (req, res) => {
  try {
    const { eventId } = req.params;
    const result = await supabase.from("event_forms").select("*").eq("event_id", eventId).maybeSingle();
    if (result.error) throw result.error;
    if (!result.data) return res.json(null);
    return res.json({
      id: result.data.id,
      eventId: result.data.event_id,
      title: result.data.title,
      isEnabled: Boolean(result.data.is_enabled),
      fields: result.data.fields || [],
      createdAt: result.data.created_at,
      updatedAt: result.data.updated_at || null,
    });
  } catch {
    return res.status(500).json({ message: "Failed to fetch event form." });
  }
});

app.post(["/api/items/:eventId/form", "/api/events/:eventId/form"], async (req, res) => {
  try {
    const { eventId } = req.params;
    const { coordinatorId, title, fields, isEnabled } = req.body || {};
    if (!coordinatorId || !title || !Array.isArray(fields)) {
      return res.status(400).json({ message: "Coordinator, title and fields are required." });
    }
    if (!(await hasUserRole(coordinatorId, "Coordinator"))) {
      return res.status(403).json({ message: "Only coordinator accounts can manage event forms." });
    }

    const access = await resolveManagedEvent(coordinatorId, eventId);
    if (!access.ok) return res.status(access.status).json({ message: access.message });

    const payload = {
      id: randomUUID(),
      event_id: eventId,
      title: String(title).trim(),
      is_enabled: Boolean(isEnabled),
      fields,
      updated_at: new Date().toISOString(),
    };
    const existing = await supabase.from("event_forms").select("id").eq("event_id", eventId).maybeSingle();
    if (existing.error) throw existing.error;

    let result;
    if (existing.data) {
      result = await supabase
        .from("event_forms")
        .update({
          title: payload.title,
          is_enabled: payload.is_enabled,
          fields: payload.fields,
          updated_at: payload.updated_at,
        })
        .eq("id", existing.data.id)
        .select("*")
        .single();
    } else {
      payload.created_at = new Date().toISOString();
      result = await supabase.from("event_forms").insert(payload).select("*").single();
    }
    if (result.error) throw result.error;
    return res.json({
      message: "Event form saved.",
      form: {
        id: result.data.id,
        eventId: result.data.event_id,
        title: result.data.title,
        isEnabled: Boolean(result.data.is_enabled),
        fields: result.data.fields || [],
        createdAt: result.data.created_at,
        updatedAt: result.data.updated_at || null,
      },
    });
  } catch {
    return res.status(500).json({ message: "Failed to save event form." });
  }
});

app.get(["/api/items/:eventId/groups", "/api/events/:eventId/groups"], async (req, res) => {
  try {
    const { eventId } = req.params;
    const groupsResult = await supabase.from("event_groups").select("*").eq("event_id", eventId);
    if (groupsResult.error) throw groupsResult.error;
    const groups = groupsResult.data || [];
    if (!groups.length) return res.json([]);

    const [membersResult, usersResult] = await Promise.all([
      supabase.from("event_group_members").select("*").in("group_id", groups.map((g) => g.id)),
      supabase.from("users").select("id,name,photo_url,role"),
    ]);
    if (membersResult.error) throw membersResult.error;
    if (usersResult.error) throw usersResult.error;

    const usersById = new Map((usersResult.data || []).map((u) => [u.id, u]));
    const membersByGroup = new Map();
    for (const member of membersResult.data || []) {
      const arr = membersByGroup.get(member.group_id) || [];
      const user = usersById.get(member.participant_id);
      arr.push({
        id: member.id,
        userId: member.participant_id,
        userName: user?.name || "Unknown member",
        userPhotoUrl: user?.photo_url || "",
        userRole: user?.role || "Unknown",
      });
      membersByGroup.set(member.group_id, arr);
    }

    return res.json(
      groups.map((group) => ({
        id: group.id,
        eventId: group.event_id,
        name: group.name,
        description: group.description || "",
        coordinatorsOnly: Boolean(group.coordinators_only),
        createdAt: group.created_at,
        updatedAt: group.updated_at || null,
        members: membersByGroup.get(group.id) || [],
      }))
    );
  } catch {
    return res.status(500).json({ message: "Failed to fetch groups." });
  }
});

app.post(["/api/items/:eventId/groups", "/api/events/:eventId/groups"], async (req, res) => {
  try {
    const { eventId } = req.params;
    const { coordinatorId, name, description } = req.body || {};
    if (!coordinatorId || !name) {
      return res.status(400).json({ message: "Coordinator and group name are required." });
    }
    if (!(await hasUserRole(coordinatorId, "Coordinator"))) {
      return res.status(403).json({ message: "Only coordinator accounts can manage groups." });
    }

    const access = await resolveManagedEvent(coordinatorId, eventId);
    if (!access.ok) return res.status(access.status).json({ message: access.message });

    const insertResult = await supabase
      .from("event_groups")
      .insert({
        id: randomUUID(),
        event_id: eventId,
        name: String(name).trim(),
        description: description ? String(description).trim() : null,
        coordinators_only: false,
        created_at: new Date().toISOString(),
      })
      .select("*")
      .single();
    if (insertResult.error) throw insertResult.error;
    return res.status(201).json({
      message: "Group created.",
      group: {
        id: insertResult.data.id,
        eventId: insertResult.data.event_id,
        name: insertResult.data.name,
        description: insertResult.data.description || "",
        coordinatorsOnly: Boolean(insertResult.data.coordinators_only),
        members: [],
      },
    });
  } catch {
    return res.status(500).json({ message: "Failed to create group." });
  }
});

app.post(["/api/groups/:groupId/members", "/api/group-items/:groupId/members"], async (req, res) => {
  try {
    const { groupId } = req.params;
    const { coordinatorId, memberUserId, participantId } = req.body || {};
    const userId = memberUserId || participantId;
    if (!coordinatorId || !userId) {
      return res.status(400).json({ message: "Coordinator and member are required." });
    }
    if (!(await hasUserRole(coordinatorId, "Coordinator"))) {
      return res.status(403).json({ message: "Only coordinator accounts can manage group members." });
    }

    const groupResult = await supabase.from("event_groups").select("*").eq("id", groupId).single();
    if (groupResult.error || !groupResult.data) return res.status(404).json({ message: "Group not found." });
    const access = await resolveManagedEvent(coordinatorId, groupResult.data.event_id);
    if (!access.ok) return res.status(access.status).json({ message: access.message });

    const userResult = await supabase.from("users").select("id,role").eq("id", userId).maybeSingle();
    if (userResult.error) throw userResult.error;
    if (!userResult.data || !["Participant", "Coordinator"].includes(userResult.data.role)) {
      return res.status(400).json({ message: "Only Participant or Coordinator can be added to group." });
    }

    const insertResult = await supabase
      .from("event_group_members")
      .insert({
        id: randomUUID(),
        group_id: groupId,
        participant_id: userId,
        created_at: new Date().toISOString(),
      })
      .select("*")
      .single();
    if (insertResult.error) throw insertResult.error;
    return res.status(201).json({ message: "Member added to group." });
  } catch {
    return res.status(500).json({ message: "Failed to add member to group." });
  }
});

app.get("/api/users/:userId/groups", async (req, res) => {
  try {
    const { userId } = req.params;
    const userResult = await supabase.from("users").select("id,role").eq("id", userId).maybeSingle();
    if (userResult.error) throw userResult.error;
    if (!userResult.data || !["Participant", "Coordinator"].includes(userResult.data.role)) {
      return res.status(403).json({ message: "Only Participant or Coordinator can access groups." });
    }

    const memberRowsResult = await supabase
      .from("event_group_members")
      .select("group_id")
      .eq("participant_id", userId);
    if (memberRowsResult.error) throw memberRowsResult.error;
    const memberGroupIds = new Set((memberRowsResult.data || []).map((row) => row.group_id));

    let managedEventIds = new Set();
    if (userResult.data.role === "Coordinator") {
      const managedEvents = await getManagedEventsForCoordinator(userId);
      managedEventIds = new Set(managedEvents.map((event) => event.id));
      if (managedEventIds.size) {
        const managedGroupsResult = await supabase
          .from("event_groups")
          .select("id")
          .in("event_id", [...managedEventIds]);
        if (managedGroupsResult.error) throw managedGroupsResult.error;
        for (const row of managedGroupsResult.data || []) {
          memberGroupIds.add(row.id);
        }
      }
    }

    if (!memberGroupIds.size) return res.json([]);

    const groupIds = [...memberGroupIds];
    const [groupsResult, membersResult] = await Promise.all([
      supabase.from("event_groups").select("*").in("id", groupIds),
      supabase.from("event_group_members").select("group_id").in("group_id", groupIds),
    ]);
    if (groupsResult.error) throw groupsResult.error;
    if (membersResult.error) throw membersResult.error;
    const groups = groupsResult.data || [];
    if (!groups.length) return res.json([]);

    const eventIds = [...new Set(groups.map((group) => group.event_id))];
    const eventsResult = await supabase.from("events").select("id,name").in("id", eventIds);
    if (eventsResult.error) throw eventsResult.error;
    const eventNameById = new Map((eventsResult.data || []).map((event) => [event.id, event.name]));

    const memberCountByGroupId = new Map();
    for (const row of membersResult.data || []) {
      memberCountByGroupId.set(row.group_id, (memberCountByGroupId.get(row.group_id) || 0) + 1);
    }

    return res.json(
      groups
        .map((group) => ({
          id: group.id,
          eventId: group.event_id,
          eventName: eventNameById.get(group.event_id) || "Unknown event",
          name: group.name,
          description: group.description || "",
          coordinatorsOnly: Boolean(group.coordinators_only),
          memberCount: memberCountByGroupId.get(group.id) || 0,
          isMember: memberGroupIds.has(group.id),
          canManageSettings: userResult.data.role === "Coordinator" && managedEventIds.has(group.event_id),
        }))
        .sort((a, b) => `${a.eventName}-${a.name}`.localeCompare(`${b.eventName}-${b.name}`))
    );
  } catch {
    return res.status(500).json({ message: "Failed to fetch user groups." });
  }
});

app.get(["/api/groups/:groupId/chat", "/api/group-items/:groupId/chat"], async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = String(req.query.userId || "");
    if (!userId) return res.status(400).json({ message: "User is required." });

    const context = await getGroupAccessContext(userId, groupId);
    if (!context.ok) return res.status(context.status).json({ message: context.message });

    const messagesResult = await supabase
      .from("event_group_messages")
      .select("*")
      .eq("group_id", groupId)
      .order("created_at", { ascending: true });
    if (messagesResult.error) throw messagesResult.error;

    const senderIds = [...new Set((messagesResult.data || []).map((row) => row.sender_id))];
    const relatedUserIds = [...new Set([...context.memberIds, ...senderIds])];
    let users = [];
    if (relatedUserIds.length) {
      const usersResult = await supabase
        .from("users")
        .select("id,name,role,photo_url")
        .in("id", relatedUserIds);
      if (usersResult.error) throw usersResult.error;
      users = usersResult.data || [];
    }
    const usersById = new Map(users.map((row) => [row.id, row]));

    const coordinatorsOnly = Boolean(context.group.coordinators_only);
    return res.json({
      group: {
        id: context.group.id,
        name: context.group.name,
        description: context.group.description || "",
        eventId: context.group.event_id,
      },
      coordinatorsOnly,
      canManageSettings: context.canManage,
      canWrite: !coordinatorsOnly || context.user.role === "Coordinator",
      members: [...context.memberIds].map((memberId) => {
        const row = usersById.get(memberId);
        return {
          userId: memberId,
          userName: row?.name || "Unknown member",
          userRole: row?.role || "Unknown",
          userPhotoUrl: row?.photo_url || "",
        };
      }),
      messages: (messagesResult.data || []).map((row) => {
        const sender = usersById.get(row.sender_id);
        return {
          id: row.id,
          groupId: row.group_id,
          senderId: row.sender_id,
          senderName: sender?.name || "Unknown",
          senderRole: sender?.role || "Unknown",
          senderPhotoUrl: sender?.photo_url || "",
          message: row.message,
          createdAt: row.created_at,
        };
      }),
    });
  } catch {
    return res.status(500).json({ message: "Failed to load group chat." });
  }
});

app.patch(["/api/groups/:groupId/chat/settings", "/api/group-items/:groupId/chat/settings"], async (req, res) => {
  try {
    const { groupId } = req.params;
    const { coordinatorId, coordinatorsOnly } = req.body || {};
    if (!coordinatorId) return res.status(400).json({ message: "Coordinator is required." });
    if (!(await hasUserRole(coordinatorId, "Coordinator"))) {
      return res.status(403).json({ message: "Only coordinator accounts can update chat settings." });
    }

    const groupResult = await supabase.from("event_groups").select("*").eq("id", groupId).maybeSingle();
    if (groupResult.error) throw groupResult.error;
    if (!groupResult.data) return res.status(404).json({ message: "Group not found." });
    const access = await resolveManagedEvent(coordinatorId, groupResult.data.event_id);
    if (!access.ok) return res.status(access.status).json({ message: access.message });

    const updateResult = await supabase
      .from("event_groups")
      .update({
        coordinators_only: Boolean(coordinatorsOnly),
        updated_at: new Date().toISOString(),
      })
      .eq("id", groupId)
      .select("*")
      .single();
    if (updateResult.error) throw updateResult.error;
    return res.json({
      message: "Chat settings updated.",
      coordinatorsOnly: Boolean(updateResult.data.coordinators_only),
    });
  } catch {
    return res.status(500).json({ message: "Failed to update chat settings." });
  }
});

app.post(["/api/groups/:groupId/chat/messages", "/api/group-items/:groupId/chat/messages"], async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId, message } = req.body || {};
    const text = String(message || "").trim();
    if (!userId || !text) return res.status(400).json({ message: "User and message are required." });
    if (text.length > 1200) return res.status(400).json({ message: "Message is too long." });

    const context = await getGroupAccessContext(userId, groupId);
    if (!context.ok) return res.status(context.status).json({ message: context.message });
    if (context.group.coordinators_only && context.user.role !== "Coordinator") {
      return res.status(403).json({ message: "Only coordinators can send messages in this chat." });
    }

    const latestResult = await supabase
      .from("event_group_messages")
      .select("id,message,created_at")
      .eq("group_id", groupId)
      .eq("sender_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (latestResult.error) throw latestResult.error;
    if (latestResult.data) {
      const createdAtMs = new Date(latestResult.data.created_at || "").getTime();
      const nowMs = Date.now();
      if (
        latestResult.data.message === text &&
        Number.isFinite(createdAtMs) &&
        nowMs - createdAtMs >= 0 &&
        nowMs - createdAtMs < 4000
      ) {
        return res.status(200).json({
          message: "Message already sent.",
          messageId: latestResult.data.id,
          deduped: true,
        });
      }
    }

    const insertResult = await supabase
      .from("event_group_messages")
      .insert({
        id: randomUUID(),
        group_id: groupId,
        sender_id: userId,
        message: text,
        created_at: new Date().toISOString(),
      })
      .select("*")
      .single();
    if (insertResult.error) throw insertResult.error;
    return res.status(201).json({ message: "Message sent.", messageId: insertResult.data.id });
  } catch {
    return res.status(500).json({ message: "Failed to send chat message." });
  }
});

app.get(["/api/events/:eventId/summary", "/api/items/:eventId/summary"], async (req, res) => {
  try {
    const { eventId } = req.params;
    const { coordinatorId } = req.query;
    if (!coordinatorId) {
      return res.status(400).json({ message: "Coordinator is required." });
    }
    if (!(await hasUserRole(coordinatorId, "Coordinator"))) {
      return res.status(403).json({ message: "Only coordinator accounts can access event summary." });
    }

    const access = await resolveManagedEvent(coordinatorId, eventId);
    if (!access.ok) return res.status(access.status).json({ message: access.message });
    const eventResult = { data: access.event };

    const joinsResult = await supabase.from("joins").select("status").eq("event_id", eventId);
    if (joinsResult.error) throw joinsResult.error;

    const stats = { pending: 0, approved: 0, declined: 0, total: 0 };
    for (const join of joinsResult.data || []) {
      const status = join.status || "pending";
      if (status in stats) stats[status] += 1;
      stats.total += 1;
    }

    return res.json({
      event: {
        id: eventResult.data.id,
        name: eventResult.data.name,
        description: eventResult.data.description,
        region: eventResult.data.region,
        photoUrl: eventResult.data.photo_url,
        coordinatorId: eventResult.data.coordinator_id,
        createdAt: eventResult.data.created_at,
        updatedAt: eventResult.data.updated_at || null,
      },
      stats,
    });
  } catch (error) {
    return res.status(500).json({ message: mapJoinSchemaError(error, "Failed to fetch event summary.") });
  }
});

app.get(
  ["/api/events/:eventId/volunteers.csv", "/api/items/:eventId/volunteers.csv"],
  async (req, res) => {
  try {
    const { eventId } = req.params;
    const { coordinatorId } = req.query;
    if (!coordinatorId) {
      return res.status(400).json({ message: "Coordinator is required." });
    }
    if (!(await hasUserRole(coordinatorId, "Coordinator"))) {
      return res.status(403).json({ message: "Only coordinator accounts can export volunteer CSV." });
    }

    const access = await resolveManagedEvent(coordinatorId, eventId);
    if (!access.ok) return res.status(access.status).json({ message: access.message });
    const eventResult = { data: access.event };

    const [joinsResult, usersResult] = await Promise.all([
      supabase.from("joins").select("*").eq("event_id", eventId).eq("status", "approved"),
      supabase.from("users").select("id,name,region").eq("role", "Participant"),
    ]);
    if (joinsResult.error) throw joinsResult.error;
    if (usersResult.error) throw usersResult.error;

    const participantById = new Map((usersResult.data || []).map((u) => [u.id, u]));
    const headers = ["Participant Name", "Region", "Shift", "Status", "Requested At", "Decided At"];
    const rows = (joinsResult.data || []).map((join) => {
      const participant = participantById.get(join.participant_id);
      return [
        csvEscape(participant?.name || "Unknown participant"),
        csvEscape(participant?.region || ""),
        csvEscape(join.shift),
        csvEscape(join.status || "approved"),
        csvEscape(join.requested_at || join.joined_at || ""),
        csvEscape(join.decided_at || ""),
      ].join(",");
    });
    const csvText = [headers.join(","), ...rows].join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=\"${eventResult.data.name.replaceAll('"', "'")}-volunteers.csv\"`
    );
    return res.status(200).send(csvText);
  } catch {
    return res.status(500).json({ message: "Failed to export volunteers csv." });
  }
  }
);

app.get("/api/users/:userId/joins", async (req, res) => {
  try {
    const { userId } = req.params;
    const userResult = await supabase.from("users").select("id,role").eq("id", userId).maybeSingle();
    if (userResult.error) throw userResult.error;
    if (!userResult.data || !["Participant", "Coordinator"].includes(userResult.data.role)) {
      return res.status(403).json({ message: "Only Participant or Coordinator can access joins." });
    }

    const [joinsResult, eventsResult] = await Promise.all([
      supabase.from("joins").select("*").eq("participant_id", userId),
      supabase.from("events").select("id,name,region"),
    ]);
    if (joinsResult.error) throw joinsResult.error;
    if (eventsResult.error) throw eventsResult.error;

    const eventById = new Map((eventsResult.data || []).map((event) => [event.id, event]));
    const rows = (joinsResult.data || []).map((join) => ({
      id: join.id,
      eventId: join.event_id,
      participantId: join.participant_id,
      shift: join.shift,
      formAnswers: join.form_answers || null,
      status: join.status || "pending",
      joinedAt: join.joined_at,
      requestedAt: join.requested_at || join.joined_at,
      decidedAt: join.decided_at || null,
      updatedAt: join.updated_at || null,
      eventName: eventById.get(join.event_id)?.name || "Unknown event",
      eventRegion: eventById.get(join.event_id)?.region || "Unknown region",
    }));
    return res.json(rows);
  } catch {
    return res.status(500).json({ message: "Failed to fetch user joins." });
  }
});

ensureStorage()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Backend listening on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize backend storage:", error);
    process.exit(1);
  });
