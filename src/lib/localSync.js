import Database from "@tauri-apps/plugin-sql";
import { supabase } from "@/lib/supabaseClient";

let dbPromise;
function getDB() {
  if (!dbPromise) dbPromise = Database.load("sqlite:lounge-local.db");
  return dbPromise;
}

async function getPendingDeletes(db) {
  const row = await db.select(`SELECT value FROM sync_meta WHERE key = 'pending_deletes'`);
  return row[0]?.value ? JSON.parse(row[0].value) : [];
}
async function setPendingDeletes(db, list) {
  await db.execute(
    `INSERT OR REPLACE INTO sync_meta (key, value) VALUES ('pending_deletes', ?)`,
    [JSON.stringify(list)]
  );
}

// Pull fresh data from Supabase into the local cache (call on app start + periodically)
export async function pullFromCloud() {
  const db = await getDB();
  const { data: stations } = await supabase.from("stations").select("*");
  const { data: tiers } = await supabase.from("pricing_tiers").select("*");
  const { data: bookings } = await supabase.from("bookings").select("*").order("created_at", { ascending: false }).limit(500);

  if (stations) {
    for (const s of stations) {
      const existing = await db.select(`SELECT dirty FROM stations WHERE id = ?`, [s.id]);
      if (existing[0]?.dirty) continue; // don't overwrite a local change not yet pushed
      await db.execute(
        `INSERT OR REPLACE INTO stations (id, name, category, level, description, status, dirty) VALUES (?, ?, ?, ?, ?, ?, 0)`,
        [s.id, s.name, s.category, s.level, s.description, s.status]
      );
    }
  }
  if (tiers) {
    for (const t of tiers) {
      await db.execute(
        `INSERT OR REPLACE INTO pricing_tiers (id, station_category, label, price, duration_minutes) VALUES (?, ?, ?, ?, ?)`,
        [t.id, t.station_category, t.label, t.price, t.duration_minutes]
      );
    }
  }
  if (bookings) {
    for (const b of bookings) {
      const existing = await db.select(`SELECT dirty FROM bookings WHERE id = ?`, [b.id]);
      if (existing[0]?.dirty) continue; // don't overwrite a local booking not yet pushed
      await db.execute(
        `INSERT OR REPLACE INTO bookings (id, station_id, user_id, full_name, contact_method, contact_value, booking_date, start_time, end_time, mode, quantity, total_due, status, reservation_code, created_at, dirty)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        [b.id, b.station_id, b.user_id, b.full_name, b.contact_method, b.contact_value, b.booking_date, b.start_time, b.end_time, b.mode, b.quantity, b.total_due, b.status, b.reservation_code, b.created_at]
      );
    }
  }
}

// Push anything created/changed/deleted offline up to Supabase (call whenever connection is detected)
export async function pushToCloud() {
  const db = await getDB();

  const dirtyBookings = await db.select(`SELECT * FROM bookings WHERE dirty = 1`);
  for (const b of dirtyBookings) {
    const { error } = await supabase.from("bookings").upsert({
      id: b.id, station_id: b.station_id, user_id: b.user_id, full_name: b.full_name,
      contact_method: b.contact_method, contact_value: b.contact_value, booking_date: b.booking_date,
      start_time: b.start_time, end_time: b.end_time, mode: b.mode, quantity: b.quantity,
      total_due: b.total_due, status: b.status, reservation_code: b.reservation_code,
    });
    if (!error) await db.execute(`UPDATE bookings SET dirty = 0 WHERE id = ?`, [b.id]);
  }

  const dirtyStations = await db.select(`SELECT * FROM stations WHERE dirty = 1`);
  for (const s of dirtyStations) {
    const { error } = await supabase.from("stations").update({ status: s.status }).eq("id", s.id);
    if (!error) await db.execute(`UPDATE stations SET dirty = 0 WHERE id = ?`, [s.id]);
  }

  const pending = await getPendingDeletes(db);
  if (pending.length) {
    const stillPending = [];
    for (const id of pending) {
      const { error } = await supabase.from("bookings").delete().eq("id", id);
      if (error) stillPending.push(id);
    }
    await setPendingDeletes(db, stillPending);
  }
}

// Create a booking locally first — works with or without internet
export async function createLocalBooking(booking) {
  const db = await getDB();
  const id = booking.id || crypto.randomUUID();
  await db.execute(
    `INSERT INTO bookings (id, station_id, user_id, full_name, contact_method, contact_value, booking_date, start_time, end_time, mode, quantity, total_due, status, reservation_code, created_at, dirty)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [id, booking.station_id, booking.user_id || null, booking.full_name, booking.contact_method, booking.contact_value,
     booking.booking_date, booking.start_time, booking.end_time, booking.mode, booking.quantity, booking.total_due,
     booking.status || "Pending", booking.reservation_code, new Date().toISOString()]
  );
  pushToCloud().catch(() => {}); // try immediately in case we're actually online
  return id;
}

// Delete a booking locally and remember to delete it in Supabase once back online
export async function deleteLocalBooking(id) {
  const db = await getDB();
  await db.execute(`DELETE FROM bookings WHERE id = ?`, [id]);
  const pending = await getPendingDeletes(db);
  if (!pending.includes(id)) {
    pending.push(id);
    await setPendingDeletes(db, pending);
  }
  pushToCloud().catch(() => {});
}

// Update a station's status locally (e.g. Occupied/Available), marked for sync
export async function updateLocalStationStatus(id, status) {
  const db = await getDB();
  await db.execute(`UPDATE stations SET status = ?, dirty = 1 WHERE id = ?`, [status, id]);
  pushToCloud().catch(() => {});
}

export async function getLocalBookingsByDate(date) {
  const db = await getDB();
  return db.select(`SELECT * FROM bookings WHERE booking_date = ? ORDER BY start_time ASC`, [date]);
}

export async function getLocalStations() {
  const db = await getDB();
  return db.select(`SELECT * FROM stations`);
}

export async function getLocalPricingTiers() {
  const db = await getDB();
  return db.select(`SELECT * FROM pricing_tiers`);
}
