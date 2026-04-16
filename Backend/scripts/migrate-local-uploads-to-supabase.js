const fs = require("fs/promises");
const path = require("path");
const dotenv = require("dotenv");
const { createClient } = require("@supabase/supabase-js");

dotenv.config({ path: path.resolve(process.cwd(), "..", ".env.local") });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  "";
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "ngo-assets";
const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");

function contentTypeForFile(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  return "image/jpeg";
}

function fileNameFromLegacyPhotoPath(photoUrl) {
  const value = String(photoUrl || "");
  if (!value.startsWith("/uploads/")) return "";
  return value.slice("/uploads/".length);
}

async function migrateTablePhotos({
  supabase,
  tableName,
  idColumn,
  labelColumn,
  photoColumn,
  storagePrefix,
}) {
  const selectQuery = `${idColumn},${labelColumn},${photoColumn}`;
  const rowsResult = await supabase.from(tableName).select(selectQuery);
  if (rowsResult.error) throw rowsResult.error;
  const rows = rowsResult.data || [];
  const legacyRows = rows.filter((row) => String(row[photoColumn] || "").startsWith("/uploads/"));
  if (!legacyRows.length) {
    console.log(`[${tableName}] No legacy /uploads photo paths found.`);
    return { migrated: 0, skipped: 0, failed: 0 };
  }

  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of legacyRows) {
    const rowId = row[idColumn];
    const rowLabel = String(row[labelColumn] || rowId);
    const localFileName = fileNameFromLegacyPhotoPath(row[photoColumn]);
    const localPath = path.join(UPLOADS_DIR, localFileName);

    let fileBuffer;
    try {
      fileBuffer = await fs.readFile(localPath);
    } catch {
      console.warn(`[${tableName}] SKIP ${rowLabel} (${rowId}): local file missing -> ${localFileName}`);
      skipped += 1;
      continue;
    }

    const targetPath = `${storagePrefix}/${Date.now()}-${rowId}${path.extname(localFileName) || ".jpg"}`;
    const uploadResult = await supabase.storage.from(BUCKET).upload(targetPath, fileBuffer, {
      contentType: contentTypeForFile(localFileName),
      upsert: true,
    });
    if (uploadResult.error) {
      console.warn(`[${tableName}] FAIL ${rowLabel} (${rowId}): upload failed -> ${uploadResult.error.message}`);
      failed += 1;
      continue;
    }

    const { data: publicUrlResult } = supabase.storage.from(BUCKET).getPublicUrl(targetPath);
    const publicUrl = publicUrlResult.publicUrl;
    const updateResult = await supabase
      .from(tableName)
      .update({ [photoColumn]: publicUrl, updated_at: new Date().toISOString() })
      .eq(idColumn, rowId);
    if (updateResult.error) {
      console.warn(`[${tableName}] FAIL ${rowLabel} (${rowId}): DB update failed -> ${updateResult.error.message}`);
      failed += 1;
      continue;
    }

    migrated += 1;
    console.log(`[${tableName}] OK ${rowLabel} (${rowId}) -> ${publicUrl}`);
  }

  return { migrated, skipped, failed };
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Missing SUPABASE_URL or Supabase key in ../.env.local");
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const usersSummary = await migrateTablePhotos({
    supabase,
    tableName: "users",
    idColumn: "id",
    labelColumn: "name",
    photoColumn: "photo_url",
    storagePrefix: "migrated-users",
  });

  const eventsSummary = await migrateTablePhotos({
    supabase,
    tableName: "events",
    idColumn: "id",
    labelColumn: "name",
    photoColumn: "photo_url",
    storagePrefix: "migrated-events",
  });

  console.log(
    `Done. users: migrated=${usersSummary.migrated}, skipped=${usersSummary.skipped}, failed=${usersSummary.failed}; events: migrated=${eventsSummary.migrated}, skipped=${eventsSummary.skipped}, failed=${eventsSummary.failed}`
  );
}

main().catch((error) => {
  console.error("Migration failed:", error.message || error);
  process.exit(1);
});
