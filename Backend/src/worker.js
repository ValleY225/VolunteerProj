import { createClient } from "@supabase/supabase-js";

const ALLOWED_ROLES = ["Participant", "Coordinator"];
const ALLOWED_REGIONS = ["Almaty", "Astana"];
const ALLOWED_SHIFTS = ["Morning", "Afternoon", "Night"];
const ALLOWED_JOIN_STATUSES = ["pending", "approved", "declined"];
const LEGACY_DEFAULT_PASSWORD = "12345678";

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
  };
}

function json(data, status = 200, origin = "*") {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(origin),
    },
  });
}

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

async function hashPassword(password) {
  const data = new TextEncoder().encode(String(password));
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
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

async function hasUserRole(supabase, userId, expectedRole) {
  const result = await supabase.from("users").select("id,role").eq("id", userId).maybeSingle();
  if (result.error) {
    const message = String(result.error.message || "");
    if (message.toLowerCase().includes("invalid input syntax for type uuid")) return false;
    throw result.error;
  }
  return result.data?.role === expectedRole;
}

async function getManagedEventsForCoordinator(supabase, coordinatorId, eventId = null) {
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

async function resolveManagedEvent(supabase, coordinatorId, eventId) {
  if (!(await hasUserRole(supabase, coordinatorId, "Coordinator"))) {
    return { ok: false, status: 403, message: "Only coordinator accounts can access this route." };
  }

  const eventResult = await supabase.from("events").select("*").eq("id", eventId).maybeSingle();
  if (eventResult.error) throw eventResult.error;
  if (!eventResult.data) return { ok: false, status: 404, message: "Event not found." };
  if (eventResult.data.coordinator_id === String(coordinatorId)) return { ok: true, event: eventResult.data };

  const joinResult = await supabase
    .from("joins")
    .select("id")
    .eq("event_id", eventId)
    .eq("participant_id", coordinatorId)
    .eq("status", "approved")
    .maybeSingle();
  if (joinResult.error) throw joinResult.error;
  if (joinResult.data) return { ok: true, event: eventResult.data };

  return {
    ok: false,
    status: 403,
    message: "You can manage only events you created or joined as approved coordinator.",
  };
}

async function getGroupAccessContext(supabase, userId, groupId) {
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
    const access = await resolveManagedEvent(supabase, userId, groupResult.data.event_id);
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

async function uploadImageToSupabaseStorage(supabase, bucket, file) {
  const ext = file.name?.split(".").pop()?.toLowerCase() || "jpg";
  const filePath = `uploads/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(filePath, file, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}

export default {
  async fetch(request, env) {
    const origin = env.CORS_ORIGIN || "*";
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    const bucket = env.SUPABASE_STORAGE_BUCKET || "ngo-assets";
    const url = new URL(request.url);
    const pathname = url.pathname;

    try {
      if (request.method === "GET" && pathname === "/api/health") {
        const { error } = await supabase.from("users").select("id").limit(1);
        if (error) return json({ ok: false, message: error.message }, 500, origin);
        return json({ ok: true }, 200, origin);
      }

      if (request.method === "GET" && pathname === "/api/users") {
        let query = supabase.from("users").select("*");
        const role = url.searchParams.get("role");
        if (role) query = query.eq("role", role);
        const { data, error } = await query.order("created_at", { ascending: false });
        if (error) throw error;
        return json((data || []).map(mapUserRow), 200, origin);
      }

      if (request.method === "GET" && pathname === "/api/users/short") {
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
        return json(
          (data || []).map((row) => ({
            id: row.id,
            name: row.name,
            email: row.email || legacyEmailMap.get(row.id) || null,
            role: row.role,
            region: row.region,
            birthDate: row.birth_date,
            photoUrl: row.photo_url,
          })),
          200,
          origin
        );
      }

      if (request.method === "POST" && pathname === "/api/register") {
        const formData = await request.formData();
        const name = formData.get("name");
        const email = formData.get("email");
        const password = formData.get("password");
        const region = formData.get("region");
        const birthDate = formData.get("birthDate");
        const role = formData.get("role");
        const photo = formData.get("photo");

        if (!name || !email || !password || !region || !birthDate || !role) {
          return json({ message: "All fields are required." }, 400, origin);
        }
        if (!(photo instanceof File)) {
          return json({ message: "Photo is required." }, 400, origin);
        }
        if (!ALLOWED_ROLES.includes(String(role))) {
          return json({ message: "Invalid role selected." }, 400, origin);
        }
        if (!ALLOWED_REGIONS.includes(String(region))) {
          return json({ message: "Invalid region selected." }, 400, origin);
        }
        if (String(password).length < 8) {
          return json({ message: "Password must be at least 8 characters." }, 400, origin);
        }

        const emailValue = String(email).trim().toLowerCase();
        const existingEmail = await supabase.from("users").select("id").eq("email", emailValue).maybeSingle();
        if (existingEmail.error) throw existingEmail.error;
        if (existingEmail.data) {
          return json({ message: "Email already registered." }, 400, origin);
        }

        const photoUrl = await uploadImageToSupabaseStorage(supabase, bucket, photo);
        const insert = {
          id: crypto.randomUUID(),
          name: String(name).trim(),
          email: emailValue,
          password_hash: await hashPassword(password),
          region: String(region),
          birth_date: String(birthDate),
          role: String(role),
          photo_url: photoUrl,
          created_at: new Date().toISOString(),
        };
        const { data, error } = await supabase.from("users").insert(insert).select("*").single();
        if (error) throw error;
        return json({ message: "Registration completed.", user: mapUserRow(data) }, 201, origin);
      }

      if (request.method === "POST" && pathname === "/api/login") {
        const body = await request.json();
        const { email, password } = body;
        if (!email || !password) {
          return json({ message: "Email and password are required." }, 400, origin);
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

        if (!found) return json({ message: "Invalid email or password." }, 401, origin);
        const expectedHash = String(found.password_hash || "").trim() || (await hashPassword(LEGACY_DEFAULT_PASSWORD));
        if (expectedHash !== (await hashPassword(password))) {
          return json({ message: "Invalid email or password." }, 401, origin);
        }
        return json({ message: "Login successful.", user: mapUserRow(found, fallbackEmail) }, 200, origin);
      }

      if (request.method === "PATCH" && pathname.startsWith("/api/users/")) {
        const userId = pathname.split("/").pop();
        const formData = await request.formData();
        const updates = { updated_at: new Date().toISOString() };
        const name = formData.get("name");
        const region = formData.get("region");
        const birthDate = formData.get("birthDate");
        const photo = formData.get("photo");

        if (name && String(name).trim()) updates.name = String(name).trim();
        if (region) {
          if (!ALLOWED_REGIONS.includes(String(region))) {
            return json({ message: "Invalid region selected." }, 400, origin);
          }
          updates.region = String(region);
        }
        if (birthDate && String(birthDate).trim()) updates.birth_date = String(birthDate);
        if (photo instanceof File && photo.size > 0) {
          updates.photo_url = await uploadImageToSupabaseStorage(supabase, bucket, photo);
        }

        const { data, error } = await supabase
          .from("users")
          .update(updates)
          .eq("id", userId)
          .select("*")
          .single();
        if (error) throw error;
        return json({ message: "Profile updated.", user: mapUserRow(data) }, 200, origin);
      }

      if (request.method === "GET" && (pathname === "/api/events" || pathname === "/api/items")) {
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
        return json(result, 200, origin);
      }

      if (request.method === "POST" && (pathname === "/api/events" || pathname === "/api/items")) {
        const formData = await request.formData();
        const name = formData.get("name");
        const description = formData.get("description");
        const region = formData.get("region");
        const coordinatorId = formData.get("coordinatorId");
        const photo = formData.get("photo");

        if (!name || !description || !region || !coordinatorId) {
          return json({ message: "All event fields are required." }, 400, origin);
        }
        if (!(photo instanceof File)) {
          return json({ message: "Event photo is required." }, 400, origin);
        }
        if (!ALLOWED_REGIONS.includes(String(region))) {
          return json({ message: "Invalid region selected." }, 400, origin);
        }

        const coordinatorResult = await supabase
          .from("users")
          .select("id,name,role")
          .eq("id", coordinatorId)
          .single();
        if (coordinatorResult.error || coordinatorResult.data?.role !== "Coordinator") {
          return json({ message: "Coordinator account is invalid." }, 400, origin);
        }

        const photoUrl = await uploadImageToSupabaseStorage(supabase, bucket, photo);
        const insert = {
          id: crypto.randomUUID(),
          name: String(name).trim(),
          description: String(description).trim(),
          region: String(region),
          photo_url: photoUrl,
          coordinator_id: String(coordinatorId),
          created_at: new Date().toISOString(),
        };
        const { data, error } = await supabase.from("events").insert(insert).select("*").single();
        if (error) throw error;
        return json(
          { message: "Event created successfully.", event: mapEventRow(data, coordinatorResult.data.name) },
          201,
          origin
        );
      }

      if (request.method === "POST" && /^\/api\/(?:events|items)\/[^/]+\/join$/.test(pathname)) {
        const eventId = pathname.split("/")[3];
        const body = await request.json();
        const { participantId, shift, formAnswers } = body;
        if (!participantId || !shift) {
          return json({ message: "Participant and shift are required." }, 400, origin);
        }
        if (!ALLOWED_SHIFTS.includes(String(shift))) {
          return json({ message: "Invalid shift selected." }, 400, origin);
        }

        const [eventResult, userResult] = await Promise.all([
          supabase.from("events").select("id").eq("id", eventId).single(),
          supabase.from("users").select("id,role").eq("id", participantId).single(),
        ]);
        if (eventResult.error || !eventResult.data) return json({ message: "Event not found." }, 404, origin);
        if (userResult.error || !["Participant", "Coordinator"].includes(userResult.data?.role)) {
          return json({ message: "Only Participant or Coordinator can join events." }, 400, origin);
        }

        const existingResult = await supabase
          .from("joins")
          .select("id")
          .eq("event_id", eventId)
          .eq("participant_id", participantId)
          .maybeSingle();
        if (existingResult.error) throw existingResult.error;

        if (existingResult.data) {
          const { error } = await supabase
            .from("joins")
            .update({
              shift: String(shift),
              form_answers: formAnswers || null,
              status: "pending",
              requested_at: new Date().toISOString(),
              decided_at: null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingResult.data.id);
          if (error) throw error;
          return json({ message: "Join request updated and sent for review." }, 200, origin);
        }

        const { error } = await supabase.from("joins").insert({
          id: crypto.randomUUID(),
          event_id: eventId,
          participant_id: String(participantId),
          shift: String(shift),
          form_answers: formAnswers || null,
          status: "pending",
          joined_at: new Date().toISOString(),
          requested_at: new Date().toISOString(),
        });
        if (error) throw error;
        return json({ message: "Join request sent. Waiting for coordinator decision." }, 200, origin);
      }

      if (request.method === "PATCH" && /^\/api\/(?:events|items)\/[^/]+$/.test(pathname)) {
        const eventId = pathname.split("/").pop();
        const formData = await request.formData();
        const coordinatorId = formData.get("coordinatorId");
        if (!coordinatorId) return json({ message: "Coordinator is required." }, 400, origin);
        if (!(await hasUserRole(supabase, coordinatorId, "Coordinator"))) {
          return json({ message: "Only coordinator accounts can edit events." }, 403, origin);
        }

        const access = await resolveManagedEvent(supabase, coordinatorId, eventId);
        if (!access.ok) return json({ message: access.message }, access.status, origin);

        const updates = { updated_at: new Date().toISOString() };
        const name = formData.get("name");
        const description = formData.get("description");
        const region = formData.get("region");
        const photo = formData.get("photo");
        if (name && String(name).trim()) updates.name = String(name).trim();
        if (description && String(description).trim()) updates.description = String(description).trim();
        if (region) {
          if (!ALLOWED_REGIONS.includes(String(region))) {
            return json({ message: "Invalid region selected." }, 400, origin);
          }
          updates.region = String(region);
        }
        if (photo instanceof File && photo.size > 0) {
          updates.photo_url = await uploadImageToSupabaseStorage(supabase, bucket, photo);
        }

        const { data, error } = await supabase
          .from("events")
          .update(updates)
          .eq("id", eventId)
          .select("*")
          .single();
        if (error) throw error;
        return json({ message: "Event updated.", event: mapEventRow(data) }, 200, origin);
      }

      if (request.method === "DELETE" && /^\/api\/(?:events|items)\/[^/]+$/.test(pathname)) {
        const eventId = pathname.split("/").pop();
        const body = await request.json();
        const coordinatorId = body.coordinatorId;
        if (!coordinatorId) return json({ message: "Coordinator is required." }, 400, origin);
        if (!(await hasUserRole(supabase, coordinatorId, "Coordinator"))) {
          return json({ message: "Only coordinator accounts can delete events." }, 403, origin);
        }

        const access = await resolveManagedEvent(supabase, coordinatorId, eventId);
        if (!access.ok) return json({ message: access.message }, access.status, origin);

        await supabase.from("joins").delete().eq("event_id", eventId);
        const { error } = await supabase.from("events").delete().eq("id", eventId);
        if (error) throw error;
        return json({ message: "Event deleted." }, 200, origin);
      }

      if (request.method === "GET" && /^\/api\/participants\/[^/]+\/joins$/.test(pathname)) {
        const participantId = pathname.split("/")[3];
        if (!(await hasUserRole(supabase, participantId, "Participant"))) {
          return json({ message: "Only participant accounts can access this route." }, 403, origin);
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
        return json(rows, 200, origin);
      }

      if (request.method === "GET" && /^\/api\/users\/[^/]+\/joins$/.test(pathname)) {
        const userId = pathname.split("/")[3];
        const userResult = await supabase.from("users").select("id,role").eq("id", userId).maybeSingle();
        if (userResult.error) throw userResult.error;
        if (!userResult.data || !["Participant", "Coordinator"].includes(userResult.data.role)) {
          return json({ message: "Only Participant or Coordinator can access joins." }, 403, origin);
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
        return json(rows, 200, origin);
      }

      if (request.method === "GET" && /^\/api\/coordinators\/[^/]+\/participants$/.test(pathname)) {
        const coordinatorId = pathname.split("/")[3];
        if (!(await hasUserRole(supabase, coordinatorId, "Coordinator"))) {
          return json({ message: "Only coordinator accounts can access this route." }, 403, origin);
        }
        const eventId = url.searchParams.get("eventId");
        const events = await getManagedEventsForCoordinator(supabase, coordinatorId, eventId);
        if (!events.length) return json([], 200, origin);

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
        return json(rows, 200, origin);
      }

      if (request.method === "GET" && /^\/api\/coordinators\/[^/]+\/join-requests$/.test(pathname)) {
        const coordinatorId = pathname.split("/")[3];
        if (!(await hasUserRole(supabase, coordinatorId, "Coordinator"))) {
          return json({ message: "Only coordinator accounts can access this route." }, 403, origin);
        }
        const status = url.searchParams.get("status");
        const eventId = url.searchParams.get("eventId");
        const events = await getManagedEventsForCoordinator(supabase, coordinatorId, eventId);
        if (!events.length) return json([], 200, origin);

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
        return json(rows, 200, origin);
      }

      if (request.method === "GET" && /^\/api\/(?:events|items)\/[^/]+\/summary$/.test(pathname)) {
        const eventId = pathname.split("/")[3];
        const coordinatorId = url.searchParams.get("coordinatorId");
        if (!coordinatorId) return json({ message: "Coordinator is required." }, 400, origin);
        if (!(await hasUserRole(supabase, coordinatorId, "Coordinator"))) {
          return json({ message: "Only coordinator accounts can access event summary." }, 403, origin);
        }

        const access = await resolveManagedEvent(supabase, coordinatorId, eventId);
        if (!access.ok) return json({ message: access.message }, access.status, origin);
        const eventResult = { data: access.event };

        const joinsResult = await supabase.from("joins").select("status").eq("event_id", eventId);
        if (joinsResult.error) throw joinsResult.error;
        const stats = { pending: 0, approved: 0, declined: 0, total: 0 };
        for (const join of joinsResult.data || []) {
          const status = join.status || "pending";
          if (status in stats) stats[status] += 1;
          stats.total += 1;
        }

        return json(
          {
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
          },
          200,
          origin
        );
      }

      if (request.method === "GET" && /^\/api\/(?:events|items)\/[^/]+\/form$/.test(pathname)) {
        const eventId = pathname.split("/")[3];
        const result = await supabase.from("event_forms").select("*").eq("event_id", eventId).maybeSingle();
        if (result.error) throw result.error;
        if (!result.data) return json(null, 200, origin);
        return json(
          {
            id: result.data.id,
            eventId: result.data.event_id,
            title: result.data.title,
            isEnabled: Boolean(result.data.is_enabled),
            fields: result.data.fields || [],
            createdAt: result.data.created_at,
            updatedAt: result.data.updated_at || null,
          },
          200,
          origin
        );
      }

      if (request.method === "POST" && /^\/api\/(?:events|items)\/[^/]+\/form$/.test(pathname)) {
        const eventId = pathname.split("/")[3];
        const body = await request.json();
        const { coordinatorId, title, fields, isEnabled } = body || {};
        if (!coordinatorId || !title || !Array.isArray(fields)) {
          return json({ message: "Coordinator, title and fields are required." }, 400, origin);
        }
        if (!(await hasUserRole(supabase, coordinatorId, "Coordinator"))) {
          return json({ message: "Only coordinator accounts can manage event forms." }, 403, origin);
        }

        const access = await resolveManagedEvent(supabase, coordinatorId, eventId);
        if (!access.ok) return json({ message: access.message }, access.status, origin);

        const existing = await supabase.from("event_forms").select("id").eq("event_id", eventId).maybeSingle();
        if (existing.error) throw existing.error;

        let result;
        if (existing.data) {
          result = await supabase
            .from("event_forms")
            .update({
              title: String(title).trim(),
              is_enabled: Boolean(isEnabled),
              fields,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.data.id)
            .select("*")
            .single();
        } else {
          result = await supabase
            .from("event_forms")
            .insert({
              id: crypto.randomUUID(),
              event_id: eventId,
              title: String(title).trim(),
              is_enabled: Boolean(isEnabled),
              fields,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select("*")
            .single();
        }
        if (result.error) throw result.error;
        return json(
          {
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
          },
          200,
          origin
        );
      }

      if (request.method === "GET" && /^\/api\/(?:events|items)\/[^/]+\/groups$/.test(pathname)) {
        const eventId = pathname.split("/")[3];
        const groupsResult = await supabase.from("event_groups").select("*").eq("event_id", eventId);
        if (groupsResult.error) throw groupsResult.error;
        const groups = groupsResult.data || [];
        if (!groups.length) return json([], 200, origin);

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

        return json(
          groups.map((group) => ({
            id: group.id,
            eventId: group.event_id,
            name: group.name,
            description: group.description || "",
            coordinatorsOnly: Boolean(group.coordinators_only),
            createdAt: group.created_at,
            updatedAt: group.updated_at || null,
            members: membersByGroup.get(group.id) || [],
          })),
          200,
          origin
        );
      }

      if (request.method === "POST" && /^\/api\/(?:events|items)\/[^/]+\/groups$/.test(pathname)) {
        const eventId = pathname.split("/")[3];
        const body = await request.json();
        const { coordinatorId, name, description } = body || {};
        if (!coordinatorId || !name) {
          return json({ message: "Coordinator and group name are required." }, 400, origin);
        }
        if (!(await hasUserRole(supabase, coordinatorId, "Coordinator"))) {
          return json({ message: "Only coordinator accounts can manage groups." }, 403, origin);
        }

        const access = await resolveManagedEvent(supabase, coordinatorId, eventId);
        if (!access.ok) return json({ message: access.message }, access.status, origin);

        const insertResult = await supabase
          .from("event_groups")
          .insert({
            id: crypto.randomUUID(),
            event_id: eventId,
            name: String(name).trim(),
            description: description ? String(description).trim() : null,
            coordinators_only: false,
            created_at: new Date().toISOString(),
          })
          .select("*")
          .single();
        if (insertResult.error) throw insertResult.error;
        return json(
          {
            message: "Group created.",
            group: {
              id: insertResult.data.id,
              eventId: insertResult.data.event_id,
              name: insertResult.data.name,
              description: insertResult.data.description || "",
              coordinatorsOnly: Boolean(insertResult.data.coordinators_only),
              members: [],
            },
          },
          201,
          origin
        );
      }

      if (request.method === "POST" && /^\/api\/(?:groups|group-items)\/[^/]+\/members$/.test(pathname)) {
        const groupId = pathname.split("/")[3];
        const body = await request.json();
        const { coordinatorId, memberUserId, participantId } = body || {};
        const userId = memberUserId || participantId;
        if (!coordinatorId || !userId) {
          return json({ message: "Coordinator and member are required." }, 400, origin);
        }
        if (!(await hasUserRole(supabase, coordinatorId, "Coordinator"))) {
          return json({ message: "Only coordinator accounts can manage group members." }, 403, origin);
        }

        const groupResult = await supabase.from("event_groups").select("*").eq("id", groupId).single();
        if (groupResult.error || !groupResult.data) return json({ message: "Group not found." }, 404, origin);
        const access = await resolveManagedEvent(supabase, coordinatorId, groupResult.data.event_id);
        if (!access.ok) return json({ message: access.message }, access.status, origin);

        const userResult = await supabase.from("users").select("id,role").eq("id", userId).maybeSingle();
        if (userResult.error) throw userResult.error;
        if (!userResult.data || !["Participant", "Coordinator"].includes(userResult.data.role)) {
          return json({ message: "Only Participant or Coordinator can be added to group." }, 400, origin);
        }

        const insertResult = await supabase
          .from("event_group_members")
          .insert({
            id: crypto.randomUUID(),
            group_id: groupId,
            participant_id: String(userId),
            created_at: new Date().toISOString(),
          })
          .select("*")
          .single();
        if (insertResult.error) throw insertResult.error;
        return json({ message: "Member added to group." }, 201, origin);
      }

      if (request.method === "GET" && /^\/api\/users\/[^/]+\/groups$/.test(pathname)) {
        const userId = pathname.split("/")[3];
        const userResult = await supabase.from("users").select("id,role").eq("id", userId).maybeSingle();
        if (userResult.error) throw userResult.error;
        if (!userResult.data || !["Participant", "Coordinator"].includes(userResult.data.role)) {
          return json({ message: "Only Participant or Coordinator can access groups." }, 403, origin);
        }

        const memberRowsResult = await supabase
          .from("event_group_members")
          .select("group_id")
          .eq("participant_id", userId);
        if (memberRowsResult.error) throw memberRowsResult.error;
        const memberGroupIds = new Set((memberRowsResult.data || []).map((row) => row.group_id));

        let managedEventIds = new Set();
        if (userResult.data.role === "Coordinator") {
          const managedEvents = await getManagedEventsForCoordinator(supabase, userId);
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

        if (!memberGroupIds.size) return json([], 200, origin);

        const groupIds = [...memberGroupIds];
        const [groupsResult, membersResult] = await Promise.all([
          supabase.from("event_groups").select("*").in("id", groupIds),
          supabase.from("event_group_members").select("group_id").in("group_id", groupIds),
        ]);
        if (groupsResult.error) throw groupsResult.error;
        if (membersResult.error) throw membersResult.error;
        const groups = groupsResult.data || [];
        if (!groups.length) return json([], 200, origin);

        const eventIds = [...new Set(groups.map((group) => group.event_id))];
        const eventsResult = await supabase.from("events").select("id,name").in("id", eventIds);
        if (eventsResult.error) throw eventsResult.error;
        const eventNameById = new Map((eventsResult.data || []).map((event) => [event.id, event.name]));

        const memberCountByGroupId = new Map();
        for (const row of membersResult.data || []) {
          memberCountByGroupId.set(row.group_id, (memberCountByGroupId.get(row.group_id) || 0) + 1);
        }

        return json(
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
            .sort((a, b) => `${a.eventName}-${a.name}`.localeCompare(`${b.eventName}-${b.name}`)),
          200,
          origin
        );
      }

      if (request.method === "GET" && /^\/api\/(?:groups|group-items)\/[^/]+\/chat$/.test(pathname)) {
        const groupId = pathname.split("/")[3];
        const userId = String(url.searchParams.get("userId") || "");
        if (!userId) return json({ message: "User is required." }, 400, origin);

        const context = await getGroupAccessContext(supabase, userId, groupId);
        if (!context.ok) return json({ message: context.message }, context.status, origin);

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
        return json(
          {
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
          },
          200,
          origin
        );
      }

      if (request.method === "PATCH" && /^\/api\/(?:groups|group-items)\/[^/]+\/chat\/settings$/.test(pathname)) {
        const groupId = pathname.split("/")[3];
        const body = await request.json();
        const { coordinatorId, coordinatorsOnly } = body || {};
        if (!coordinatorId) return json({ message: "Coordinator is required." }, 400, origin);
        if (!(await hasUserRole(supabase, coordinatorId, "Coordinator"))) {
          return json({ message: "Only coordinator accounts can update chat settings." }, 403, origin);
        }

        const groupResult = await supabase.from("event_groups").select("*").eq("id", groupId).maybeSingle();
        if (groupResult.error) throw groupResult.error;
        if (!groupResult.data) return json({ message: "Group not found." }, 404, origin);
        const access = await resolveManagedEvent(supabase, coordinatorId, groupResult.data.event_id);
        if (!access.ok) return json({ message: access.message }, access.status, origin);

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
        return json(
          {
            message: "Chat settings updated.",
            coordinatorsOnly: Boolean(updateResult.data.coordinators_only),
          },
          200,
          origin
        );
      }

      if (request.method === "POST" && /^\/api\/(?:groups|group-items)\/[^/]+\/chat\/messages$/.test(pathname)) {
        const groupId = pathname.split("/")[3];
        const body = await request.json();
        const { userId, message } = body || {};
        const text = String(message || "").trim();
        if (!userId || !text) return json({ message: "User and message are required." }, 400, origin);
        if (text.length > 1200) return json({ message: "Message is too long." }, 400, origin);

        const context = await getGroupAccessContext(supabase, userId, groupId);
        if (!context.ok) return json({ message: context.message }, context.status, origin);
        if (context.group.coordinators_only && context.user.role !== "Coordinator") {
          return json({ message: "Only coordinators can send messages in this chat." }, 403, origin);
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
            return json(
              {
                message: "Message already sent.",
                messageId: latestResult.data.id,
                deduped: true,
              },
              200,
              origin
            );
          }
        }

        const insertResult = await supabase
          .from("event_group_messages")
          .insert({
            id: crypto.randomUUID(),
            group_id: groupId,
            sender_id: userId,
            message: text,
            created_at: new Date().toISOString(),
          })
          .select("*")
          .single();
        if (insertResult.error) throw insertResult.error;
        return json({ message: "Message sent.", messageId: insertResult.data.id }, 201, origin);
      }

      if (request.method === "PATCH" && /^\/api\/joins\/[^/]+\/decision$/.test(pathname)) {
        const joinId = pathname.split("/")[3];
        const body = await request.json();
        const { coordinatorId, decision } = body || {};
        if (!coordinatorId || !decision) {
          return json({ message: "Coordinator and decision are required." }, 400, origin);
        }
        if (!(await hasUserRole(supabase, coordinatorId, "Coordinator"))) {
          return json({ message: "Only coordinator accounts can decide requests." }, 403, origin);
        }
        if (!["approved", "declined"].includes(String(decision))) {
          return json({ message: "Invalid decision." }, 400, origin);
        }

        const joinResult = await supabase.from("joins").select("*").eq("id", joinId).single();
        if (joinResult.error || !joinResult.data) {
          return json({ message: "Join request not found." }, 404, origin);
        }

        const access = await resolveManagedEvent(supabase, coordinatorId, joinResult.data.event_id);
        if (!access.ok) return json({ message: access.message }, access.status, origin);

        const { error } = await supabase
          .from("joins")
          .update({
            status: String(decision),
            decided_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", joinId);
        if (error) throw error;
        return json(
          { message: decision === "approved" ? "Request approved." : "Request declined." },
          200,
          origin
        );
      }

      if (request.method === "GET" && /^\/api\/(?:events|items)\/[^/]+\/volunteers\.csv$/.test(pathname)) {
        const eventId = pathname.split("/")[3];
        const coordinatorId = url.searchParams.get("coordinatorId");
        if (!coordinatorId) return json({ message: "Coordinator is required." }, 400, origin);
        if (!(await hasUserRole(supabase, coordinatorId, "Coordinator"))) {
          return json({ message: "Only coordinator accounts can export volunteer CSV." }, 403, origin);
        }

        const access = await resolveManagedEvent(supabase, coordinatorId, eventId);
        if (!access.ok) return json({ message: access.message }, access.status, origin);
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
        return new Response(csvText, {
          status: 200,
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename=\"${String(eventResult.data.name).replaceAll('"', "'")}-volunteers.csv\"`,
            ...corsHeaders(origin),
          },
        });
      }

      return json({ message: "Not found." }, 404, origin);
    } catch (error) {
      return json(
        { message: mapJoinSchemaError(error, error?.message || "Internal server error.") },
        500,
        origin
      );
    }
  },
};
