const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs/promises");
const { existsSync } = require("fs");
const { randomUUID } = require("crypto");

const app = express();
const PORT = 4000;
const ROOT_DIR = path.join(__dirname, "..");
const USERS_FILE = path.join(ROOT_DIR, "data", "users.json");
const EVENTS_FILE = path.join(ROOT_DIR, "data", "events.json");
const JOINS_FILE = path.join(ROOT_DIR, "data", "joins.json");
const UPLOADS_DIR = path.join(ROOT_DIR, "uploads");

const ALLOWED_ROLES = ["Participant", "Coordinator"];
const ALLOWED_REGIONS = ["Almaty", "Astana"];
const ALLOWED_SHIFTS = ["Morning", "Afternoon", "Night"];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
    cb(null, `${Date.now()}-${randomUUID()}${ext}`);
  },
});

const upload = multer({ storage });

async function ensureStorage() {
  await fs.mkdir(path.dirname(USERS_FILE), { recursive: true });
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  if (!existsSync(USERS_FILE)) {
    await fs.writeFile(USERS_FILE, "[]", "utf8");
  }
  if (!existsSync(EVENTS_FILE)) {
    await fs.writeFile(EVENTS_FILE, "[]", "utf8");
  }
  if (!existsSync(JOINS_FILE)) {
    await fs.writeFile(JOINS_FILE, "[]", "utf8");
  }
}

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

async function writeJson(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

async function readUsers() {
  return readJson(USERS_FILE);
}

async function writeUsers(users) {
  return writeJson(USERS_FILE, users);
}

async function readEvents() {
  return readJson(EVENTS_FILE);
}

async function writeEvents(events) {
  return writeJson(EVENTS_FILE, events);
}

async function readJoins() {
  return readJson(JOINS_FILE);
}

async function writeJoins(joins) {
  return writeJson(JOINS_FILE, joins);
}

function normalizeName(name) {
  return String(name || "").trim().toLowerCase();
}

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(UPLOADS_DIR));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/users", async (req, res) => {
  try {
    const users = await readUsers();
    const role = req.query.role;
    if (!role) {
      return res.json(users);
    }
    const filteredUsers = users.filter((user) => user.role === role);
    return res.json(filteredUsers);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch users." });
  }
});

app.get("/api/users/short", async (_req, res) => {
  try {
    const users = await readUsers();
    const shortUsers = users.map((user) => ({
      id: user.id,
      name: user.name,
      role: user.role,
      region: user.region,
      birthDate: user.birthDate,
      photoUrl: user.photoUrl,
    }));
    return res.json(shortUsers);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch quick users." });
  }
});

app.post("/api/register", upload.single("photo"), async (req, res) => {
  try {
    const { name, region, birthDate, role } = req.body;

    if (!name || !region || !birthDate || !role) {
      return res.status(400).json({ message: "All fields are required." });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Photo is required." });
    }

    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ message: "Invalid role selected." });
    }

    if (!ALLOWED_REGIONS.includes(region)) {
      return res.status(400).json({ message: "Invalid region selected." });
    }

    const users = await readUsers();
    const newUser = {
      id: randomUUID(),
      name: name.trim(),
      region,
      birthDate,
      role,
      photoUrl: `/uploads/${req.file.filename}`,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    await writeUsers(users);

    return res.status(201).json({
      message: "Registration completed.",
      user: newUser,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to register user." });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { name, birthDate, role } = req.body;

    if (!name || !birthDate || !role) {
      return res.status(400).json({ message: "Name, birth date and role are required." });
    }

    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ message: "Invalid role selected." });
    }

    const users = await readUsers();
    const user = users.find(
      (item) =>
        normalizeName(item.name) === normalizeName(name) &&
        item.birthDate === birthDate &&
        item.role === role
    );

    if (!user) {
      return res.status(401).json({ message: "User not found. Please register first." });
    }

    return res.json({
      message: "Login successful.",
      user,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to login." });
  }
});

app.patch("/api/users/:userId", upload.single("photo"), async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, region, birthDate } = req.body;
    const users = await readUsers();
    const user = users.find((item) => item.id === userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (name !== undefined && String(name).trim()) {
      user.name = String(name).trim();
    }

    if (region !== undefined) {
      if (!ALLOWED_REGIONS.includes(region)) {
        return res.status(400).json({ message: "Invalid region selected." });
      }
      user.region = region;
    }

    if (birthDate !== undefined && String(birthDate).trim()) {
      user.birthDate = birthDate;
    }

    if (req.file) {
      user.photoUrl = `/uploads/${req.file.filename}`;
    }

    user.updatedAt = new Date().toISOString();
    await writeUsers(users);

    return res.json({ message: "Profile updated.", user });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update profile." });
  }
});

app.get("/api/events", async (_req, res) => {
  try {
    const [events, users] = await Promise.all([readEvents(), readUsers()]);
    const coordinatorById = new Map(
      users.filter((u) => u.role === "Coordinator").map((u) => [u.id, u])
    );

    const result = events.map((event) => ({
      ...event,
      coordinatorName: coordinatorById.get(event.coordinatorId)?.name || "Unknown Coordinator",
    }));

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch events." });
  }
});

app.post("/api/events", upload.single("photo"), async (req, res) => {
  try {
    const { name, description, region, coordinatorId } = req.body;

    if (!name || !description || !region || !coordinatorId) {
      return res.status(400).json({ message: "All event fields are required." });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Event photo is required." });
    }

    if (!ALLOWED_REGIONS.includes(region)) {
      return res.status(400).json({ message: "Invalid region selected." });
    }

    const users = await readUsers();
    const coordinator = users.find((u) => u.id === coordinatorId && u.role === "Coordinator");
    if (!coordinator) {
      return res.status(400).json({ message: "Coordinator account is invalid." });
    }

    const events = await readEvents();
    const newEvent = {
      id: randomUUID(),
      name: String(name).trim(),
      description: String(description).trim(),
      region,
      photoUrl: `/uploads/${req.file.filename}`,
      coordinatorId,
      createdAt: new Date().toISOString(),
    };

    events.push(newEvent);
    await writeEvents(events);

    return res.status(201).json({
      message: "Event created successfully.",
      event: {
        ...newEvent,
        coordinatorName: coordinator.name,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create event." });
  }
});

app.post("/api/events/:eventId/join", async (req, res) => {
  try {
    const { eventId } = req.params;
    const { participantId, shift } = req.body;

    if (!participantId || !shift) {
      return res.status(400).json({ message: "Participant and shift are required." });
    }

    if (!ALLOWED_SHIFTS.includes(shift)) {
      return res.status(400).json({ message: "Invalid shift selected." });
    }

    const [events, users, joins] = await Promise.all([readEvents(), readUsers(), readJoins()]);
    const event = events.find((item) => item.id === eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    const participant = users.find((u) => u.id === participantId && u.role === "Participant");
    if (!participant) {
      return res.status(400).json({ message: "Participant account is invalid." });
    }

    const existingJoin = joins.find((item) => item.eventId === eventId && item.participantId === participantId);
    if (existingJoin) {
      existingJoin.shift = shift;
      existingJoin.updatedAt = new Date().toISOString();
    } else {
      joins.push({
        id: randomUUID(),
        eventId,
        participantId,
        shift,
        joinedAt: new Date().toISOString(),
      });
    }

    await writeJoins(joins);
    return res.json({ message: existingJoin ? "Shift updated." : "Joined event successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Failed to join event." });
  }
});

app.patch("/api/events/:eventId", upload.single("photo"), async (req, res) => {
  try {
    const { eventId } = req.params;
    const { name, description, region, coordinatorId } = req.body;
    if (!coordinatorId) {
      return res.status(400).json({ message: "Coordinator is required." });
    }

    const events = await readEvents();
    const event = events.find((item) => item.id === eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    if (event.coordinatorId !== coordinatorId) {
      return res.status(403).json({ message: "You can edit only your own events." });
    }

    if (name !== undefined && String(name).trim()) {
      event.name = String(name).trim();
    }

    if (description !== undefined && String(description).trim()) {
      event.description = String(description).trim();
    }

    if (region !== undefined) {
      if (!ALLOWED_REGIONS.includes(region)) {
        return res.status(400).json({ message: "Invalid region selected." });
      }
      event.region = region;
    }

    if (req.file) {
      event.photoUrl = `/uploads/${req.file.filename}`;
    }

    event.updatedAt = new Date().toISOString();
    await writeEvents(events);

    return res.json({ message: "Event updated.", event });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update event." });
  }
});

app.delete("/api/events/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;
    const { coordinatorId } = req.body || {};

    if (!coordinatorId) {
      return res.status(400).json({ message: "Coordinator is required." });
    }

    const events = await readEvents();
    const eventIndex = events.findIndex((item) => item.id === eventId);
    if (eventIndex < 0) {
      return res.status(404).json({ message: "Event not found." });
    }

    if (events[eventIndex].coordinatorId !== coordinatorId) {
      return res.status(403).json({ message: "You can delete only your own events." });
    }

    events.splice(eventIndex, 1);
    await writeEvents(events);

    const joins = await readJoins();
    const filteredJoins = joins.filter((join) => join.eventId !== eventId);
    await writeJoins(filteredJoins);

    return res.json({ message: "Event deleted." });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete event." });
  }
});

app.get("/api/participants/:participantId/joins", async (req, res) => {
  try {
    const { participantId } = req.params;
    const [joins, events] = await Promise.all([readJoins(), readEvents()]);
    const eventById = new Map(events.map((event) => [event.id, event]));

    const result = joins
      .filter((join) => join.participantId === participantId)
      .map((join) => {
        const event = eventById.get(join.eventId);
        return {
          ...join,
          eventName: event?.name || "Unknown event",
          eventRegion: event?.region || "Unknown region",
        };
      });

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch participant joins." });
  }
});

app.get("/api/coordinators/:coordinatorId/participants", async (req, res) => {
  try {
    const { coordinatorId } = req.params;
    const [events, joins, users] = await Promise.all([readEvents(), readJoins(), readUsers()]);

    const coordinatorEvents = events.filter((event) => event.coordinatorId === coordinatorId);
    const coordinatorEventIds = new Set(coordinatorEvents.map((event) => event.id));
    const participantById = new Map(
      users.filter((u) => u.role === "Participant").map((u) => [u.id, u])
    );
    const eventById = new Map(coordinatorEvents.map((event) => [event.id, event]));

    const rows = joins
      .filter((join) => coordinatorEventIds.has(join.eventId))
      .map((join) => ({
        joinId: join.id,
        eventId: join.eventId,
        eventName: eventById.get(join.eventId)?.name || "Unknown event",
        participantId: join.participantId,
        participantName: participantById.get(join.participantId)?.name || "Unknown participant",
        shift: join.shift,
      }));

    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch participant list." });
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
