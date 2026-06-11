/**
 * Simple Express Server for SmashLabs
 * Handles static files and authentication APIs
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const fsPromises = fs.promises;
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;
const EVENT_SIGNATURES_FILE = path.join(__dirname, 'data', 'event-signatures.json');
const EVENTS_FILE = path.join(__dirname, 'data', 'events.json');
const SUPABASE_EVENTS_TABLE = 'smashlab_events';
const SUPABASE_EVENT_SIGNATURES_TABLE = 'smashlab_event_signature_entries';
const SUPABASE_LEGACY_EVENT_SIGNATURES_TABLE = 'smashlab_event_signatures';
const supabasePersistence = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY ?
    createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY) :
    null;

// Middleware
app.use(cors());
// Increase JSON body limit so waiver payloads carrying a base64 PNG signature
// image (often 100-500KB) are accepted. Default Express limit is only 100KB.
// Also large enough for admin GETs that aggregate dozens of signatures.
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve photos directory with proper MIME types
app.use('/photos', express.static(path.join(__dirname, 'photos'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.MOV') || filePath.endsWith('.mov')) {
            res.setHeader('Content-Type', 'video/quicktime');
        } else if (filePath.endsWith('.mp4')) {
            res.setHeader('Content-Type', 'video/mp4');
        } else if (filePath.endsWith('.avif')) {
            res.setHeader('Content-Type', 'image/avif');
        }
    }
}));

// Set correct MIME types for JavaScript modules
app.use(express.static(__dirname, {
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
        }
    }
}));

// API Routes - Import the handlers
const registerHandler = require('./api/register').handler;
const loginHandler = require('./api/login').handler;
const sendVerificationHandler = require('./api/send-verification');
const calendarAPI = require('./api/calendar');

// Wrapper to convert Netlify function to Express middleware
function netlifyToExpress(handler) {
    return async(req, res) => {
        const event = {
            httpMethod: req.method,
            headers: req.headers,
            body: JSON.stringify(req.body),
            path: req.path
        };

        const context = {};

        try {
            const result = await handler(event, context);
            res.status(result.statusCode);

            if (result.headers) {
                Object.keys(result.headers).forEach(key => {
                    res.set(key, result.headers[key]);
                });
            }

            res.send(result.body);
        } catch (error) {
            console.error('API Error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    };
}

// Direct Express middleware for send-verification (not Netlify format)
app.post('/api/send-verification', sendVerificationHandler);

// Calendar API routes
app.get('/api/calendar/check-availability', calendarAPI.checkAvailability);
app.post('/api/calendar/create-booking', calendarAPI.createBooking);
app.get('/api/calendar/bookings', calendarAPI.getBookingsByDate);
app.get('/api/calendar/bookings/:bookingId', calendarAPI.getBookingById);
app.put('/api/calendar/bookings/:bookingId', calendarAPI.updateBooking);
app.delete('/api/calendar/bookings/:bookingId', calendarAPI.cancelBooking);
app.get('/api/calendar/stats', calendarAPI.getDashboardStats);

// Register routes
app.post('/api/register', netlifyToExpress(registerHandler));
app.post('/api/login', netlifyToExpress(loginHandler));

// Event waiver short-link / preview endpoint — handles /e and /api/e
const eventPreviewHandler = require('./api/e');
app.get('/e', eventPreviewHandler);
app.get('/api/e', eventPreviewHandler);

async function ensureEventSignaturesStore() {
    await fsPromises.mkdir(path.dirname(EVENT_SIGNATURES_FILE), { recursive: true });
    try {
        await fsPromises.access(EVENT_SIGNATURES_FILE);
    } catch {
        await fsPromises.writeFile(EVENT_SIGNATURES_FILE, '{}', 'utf8');
    }
}

function hasSupabasePersistence() {
    return Boolean(supabasePersistence);
}

function logPersistenceFallback(kind, error) {
    console.warn(`Supabase ${kind} store unavailable, falling back to local file storage. Deploys may reset this data.`, error && (error.message || error));
}

function buildSignatureRow(eventId, signature, meta = {}) {
    const sanitized = sanitizeSignaturePayload(signature || {});
    return {
        signature_id: sanitized.signatureId || ('SIG-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8)),
        event_id: String(eventId || '').trim(),
        payload: {
            ...sanitized,
            eventId: String(eventId || '').trim(),
            eventTitle: String(meta.eventTitle || '').trim(),
            participants: Number(meta.participants) || 0
        },
        created_at: sanitized.signedAt || new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
}

function aggregateSignatureRows(rows) {
    const store = {};
    const sortedRows = Array.isArray(rows) ? rows.slice().sort((a, b) => new Date(a.created_at || a.updated_at || 0) - new Date(b.created_at || b.updated_at || 0)) : [];

    for (const row of sortedRows) {
        const payload = row && row.payload && typeof row.payload === 'object' ? row.payload : {};
        const eventId = String(row.event_id || payload.eventId || '').trim();
        if (!eventId) continue;

        if (!store[eventId]) {
            store[eventId] = {
                eventId,
                eventTitle: String(payload.eventTitle || '').trim(),
                participants: Number(payload.participants) || 0,
                updatedAt: row.updated_at || payload.updatedAt || '',
                signatures: []
            };
        }

        const signature = sanitizeSignaturePayload({
            ...payload,
            signatureId: row.signature_id || payload.signatureId,
            signedAt: row.created_at || payload.signedAt || row.updated_at || payload.updatedAt
        });

        store[eventId].eventTitle = String(payload.eventTitle || store[eventId].eventTitle || '').trim();
        store[eventId].participants = Number(payload.participants) || store[eventId].participants || 0;
        store[eventId].updatedAt = row.updated_at || payload.updatedAt || store[eventId].updatedAt || '';
        store[eventId].signatures.push(signature);
    }

    return store;
}

function aggregateLegacySignatureRows(rows) {
    const store = {};
    for (const row of Array.isArray(rows) ? rows : []) {
        const payload = row && row.payload && typeof row.payload === 'object' ? row.payload : {};
        const eventId = String(row.event_id || payload.eventId || '').trim();
        if (!eventId) continue;

        const signatures = Array.isArray(payload.signatures) ? payload.signatures.map((sig) => sanitizeSignaturePayload(sig)) : [];
        store[eventId] = {
            eventId,
            eventTitle: String(payload.eventTitle || '').trim(),
            participants: Number(payload.participants) || 0,
            updatedAt: payload.updatedAt || row.updated_at || '',
            signatures
        };
    }
    return store;
}

async function readEventSignaturesStore(eventId = null) {
    if (hasSupabasePersistence()) {
        // When a specific event is requested, only fetch that event's rows.
        // Loading every signature (with its heavy base64 image) for all events
        // just to read one event was the cause of multi-second load times.
        let query = supabasePersistence
            .from(SUPABASE_EVENT_SIGNATURES_TABLE)
            .select('event_id, signature_id, payload, created_at, updated_at')
            .order('created_at', { ascending: true });
        if (eventId) query = query.eq('event_id', eventId);
        const { data, error } = await query;

        if (!error) {
            const store = aggregateSignatureRows(data || []);
            if (Object.keys(store).length) return store;

            let legacyQuery = supabasePersistence
                .from(SUPABASE_LEGACY_EVENT_SIGNATURES_TABLE)
                .select('event_id, payload, updated_at');
            if (eventId) legacyQuery = legacyQuery.eq('event_id', eventId);
            const legacy = await legacyQuery;

            if (!legacy.error) {
                return aggregateLegacySignatureRows(legacy.data || []);
            }
        }

        logPersistenceFallback('signatures', error);
    }

    await ensureEventSignaturesStore();
    const raw = await fsPromises.readFile(EVENT_SIGNATURES_FILE, 'utf8');
    try {
        return JSON.parse(raw || '{}');
    } catch {
        return {};
    }
}

async function writeEventSignaturesStore(store) {
    if (hasSupabasePersistence()) {
        const rows = [];
        for (const [eventId, rawRecord] of Object.entries(store || {})) {
            const record = rawRecord || {};
            const signatures = Array.isArray(record.signatures) ? record.signatures : [];
            for (const signature of signatures) {
                rows.push(buildSignatureRow(eventId, signature, {
                    eventTitle: record.eventTitle,
                    participants: record.participants
                }));
            }
        }

        const { data: existingRows, error: existingError } = await supabasePersistence
            .from(SUPABASE_EVENT_SIGNATURES_TABLE)
            .select('signature_id');

        if (!existingError) {
            if (rows.length) {
                const { error: upsertError } = await supabasePersistence
                    .from(SUPABASE_EVENT_SIGNATURES_TABLE)
                    .upsert(rows, { onConflict: 'signature_id' });
                if (!upsertError) return;
                logPersistenceFallback('signatures', upsertError);
            } else {
                return;
            }
        } else {
            logPersistenceFallback('signatures', existingError);
        }
    }

    await ensureEventSignaturesStore();
    await fsPromises.writeFile(EVENT_SIGNATURES_FILE, JSON.stringify(store, null, 2), 'utf8');
}

function normalizeEventPayload(payload) {
    const safe = payload || {};
    return {
        id: String(safe.id || '').trim(),
        title: String(safe.title || '').trim(),
        datetime: String(safe.datetime || '').trim(),
        responsible: String(safe.responsible || '').trim(),
        phone: String(safe.phone || '').trim(),
        participants: Number(safe.participants) || 0,
        type: String(safe.type || '').trim(),
        notes: String(safe.notes || '').trim(),
        status: safe.status === 'closed' ? 'closed' : 'active',
        createdAt: safe.createdAt || new Date().toISOString(),
        closedAt: safe.closedAt || ''
    };
}

function mergeEventRecord(existing, incoming) {
    const normalized = normalizeEventPayload({...existing, ...incoming });
    return {
        ...existing,
        ...normalized,
        id: existing.id || normalized.id,
        createdAt: existing.createdAt || normalized.createdAt,
        closedAt: normalized.status === 'closed' ? (normalized.closedAt || existing.closedAt || new Date().toISOString()) : ''
    };
}

function sortEventsDescending(events) {
    return [...events].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

function sanitizeSignaturePayload(payload) {
    const safe = payload || {};
    const emergency = safe.emergencyContact || {};
    const additionalChildren = Array.isArray(safe.additionalChildren) ?
        safe.additionalChildren
        .filter((c) => c && (c.name || c.id))
        .map((c) => ({ name: String(c.name || '').trim(), id: String(c.id || '').trim() })) : [];

    return {
        signatureId: safe.signatureId || ('SIG-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8)),
        participantName: String(safe.participantName || safe.fullName || '').trim(),
        fullName: String(safe.fullName || '').trim(),
        idNumber: String(safe.idNumber || '').trim(),
        dateOfBirth: String(safe.dateOfBirth || '').trim(),
        city: String(safe.city || '').trim(),
        street: String(safe.street || '').trim(),
        address: String(safe.address || '').trim(),
        phone: String(safe.phone || '').trim(),
        email: String(safe.email || '').trim(),
        emergencyContact: {
            name: String(emergency.name || '').trim(),
            phone: String(emergency.phone || '').trim(),
            relation: String(emergency.relation || '').trim()
        },
        isMinor: Boolean(safe.isMinor),
        guardianName: String(safe.guardianName || '').trim(),
        guardianId: String(safe.guardianId || '').trim(),
        guardianDob: String(safe.guardianDob || '').trim(),
        additionalChildren,
        waiverAgreed: Boolean(safe.waiverAgreed),
        emergencyContactConsent: Boolean(safe.emergencyContactConsent),
        signature: typeof safe.signature === 'string' ? safe.signature : '',
        signedAt: safe.signedAt || new Date().toISOString(),
        signatureDate: String(safe.signatureDate || '').trim(),
        signatureTime: String(safe.signatureTime || '').trim()
    };
}

function signatureIdentityKey(s) {
    if (!s) return '';
    if (s.signatureId) return 's:' + s.signatureId;
    return [
        (s.fullName || '').trim().toLowerCase(),
        (s.idNumber || '').trim(),
        (s.signedAt || '').slice(0, 19)
    ].join('|');
}

function signatureDedupKey(s) {
    if (!s) return '';
    const idNumber = String(s.idNumber || '').trim();
    if (idNumber) return 'id:' + idNumber;

    const name = String(s.fullName || s.participantName || '').trim().toLowerCase();
    const phone = String(s.phone || '').replace(/\D/g, '');
    const dob = String(s.dateOfBirth || '').trim();
    if (name || phone || dob) return ['n', name, phone, dob].join('|');

    return signatureIdentityKey(s);
}

function dedupeSignatures(signatures) {
    const list = Array.isArray(signatures) ? signatures : [];
    const seen = new Set();
    const result = [];

    for (const raw of list) {
        const sig = sanitizeSignaturePayload(raw);
        const key = signatureDedupKey(sig) || ('fallback:' + signatureIdentityKey(sig));
        if (seen.has(key)) continue;
        seen.add(key);
        result.push(sig);
    }

    return result;
}

function normalizeEventRecord(payload) {
    const safe = payload || {};
    return {
        id: String(safe.id || safe.eventId || '').trim() || ('EVT-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8).toUpperCase()),
        title: String(safe.title || '').trim(),
        datetime: String(safe.datetime || '').trim(),
        responsible: String(safe.responsible || '').trim(),
        phone: String(safe.phone || '').trim(),
        participants: Number(safe.participants) || 0,
        type: String(safe.type || 'other').trim(),
        notes: String(safe.notes || '').trim(),
        status: String(safe.status || 'active').trim(),
        createdAt: safe.createdAt || new Date().toISOString(),
        updatedAt: safe.updatedAt || new Date().toISOString(),
        closedAt: safe.closedAt || '',
        signatures: Array.isArray(safe.signatures) ? safe.signatures.map(sanitizeSignaturePayload) : []
    };
}

function eventIdentityKey(event) {
    return String(event && (event.id || event.eventId) || '').trim();
}

async function ensureEventsStore() {
    await fsPromises.mkdir(path.dirname(EVENTS_FILE), { recursive: true });
    try {
        await fsPromises.access(EVENTS_FILE);
    } catch {
        await fsPromises.writeFile(EVENTS_FILE, '[]', 'utf8');
    }
}

async function readEventsStore() {
    if (hasSupabasePersistence()) {
        const { data, error } = await supabasePersistence
            .from(SUPABASE_EVENTS_TABLE)
            .select('event_id, payload, created_at, updated_at')
            .order('updated_at', { ascending: false });

        if (!error) {
            return (data || []).map((row) => {
                const payload = row && row.payload && typeof row.payload === 'object' ? row.payload : {};
                return normalizeEventRecord({
                    ...payload,
                    id: row.event_id || payload.id,
                    createdAt: payload.createdAt || row.created_at,
                    updatedAt: payload.updatedAt || row.updated_at
                });
            });
        }

        logPersistenceFallback('events', error);
    }

    await ensureEventsStore();
    const raw = await fsPromises.readFile(EVENTS_FILE, 'utf8');
    try {
        const parsed = JSON.parse(raw || '[]');
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

async function writeEventsStore(events) {
    if (hasSupabasePersistence()) {
        const normalizedEvents = (Array.isArray(events) ? events : []).map((event) => normalizeEventRecord(event));
        const rows = normalizedEvents.map((event) => ({
            event_id: event.id,
            payload: event,
            updated_at: new Date().toISOString()
        })).filter((row) => row.event_id);

        const { data: existingRows, error: existingError } = await supabasePersistence
            .from(SUPABASE_EVENTS_TABLE)
            .select('event_id');

        if (!existingError) {
            if (rows.length) {
                const { error: upsertError } = await supabasePersistence
                    .from(SUPABASE_EVENTS_TABLE)
                    .upsert(rows, { onConflict: 'event_id' });
                if (!upsertError) {
                    const nextIds = new Set(rows.map((row) => row.event_id));
                    const removedIds = (existingRows || [])
                        .map((row) => row.event_id)
                        .filter((eventId) => !nextIds.has(eventId));

                    if (removedIds.length) {
                        await supabasePersistence
                            .from(SUPABASE_EVENTS_TABLE)
                            .delete()
                            .in('event_id', removedIds);
                    }
                    return;
                }
                logPersistenceFallback('events', upsertError);
            } else {
                const existingIds = (existingRows || []).map((row) => row.event_id);
                if (existingIds.length) {
                    const { error: deleteError } = await supabasePersistence
                        .from(SUPABASE_EVENTS_TABLE)
                        .delete()
                        .in('event_id', existingIds);
                    if (!deleteError) return;
                    logPersistenceFallback('events', deleteError);
                } else {
                    return;
                }
            }
        } else {
            logPersistenceFallback('events', existingError);
        }
    }

    await ensureEventsStore();
    await fsPromises.writeFile(EVENTS_FILE, JSON.stringify(events, null, 2), 'utf8');
}

async function upsertEventRecord(payload) {
    const record = normalizeEventRecord(payload);
    const events = await readEventsStore();
    const index = events.findIndex((e) => eventIdentityKey(e) === record.id);
    if (index >= 0) {
        events[index] = {...events[index], ...record, id: record.id };
    } else {
        events.unshift(record);
    }
    await writeEventsStore(events);
    return record;
}

async function deleteEventRecord(eventId) {
    const id = String(eventId || '').trim();
    const events = await readEventsStore();
    const next = events.filter((e) => eventIdentityKey(e) !== id);
    await writeEventsStore(next);
    return next;
}

async function appendSignatureToEventRecord(eventId, signature, meta = {}) {
    const id = String(eventId || '').trim();
    if (!id) return null;

    const events = await readEventsStore();
    const index = events.findIndex((e) => eventIdentityKey(e) === id);
    const record = index >= 0 ? events[index] : {
        id,
        title: meta.eventTitle || '',
        participants: meta.participants || 0,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        signatures: []
    };

    record.signatures = Array.isArray(record.signatures) ? record.signatures : [];
    record.signatures.push(signature);
    record.title = meta.eventTitle || record.title || '';
    record.participants = meta.participants || record.participants || 0;
    record.updatedAt = new Date().toISOString();

    if (index >= 0) {
        events[index] = record;
    } else {
        events.unshift(record);
    }

    await writeEventsStore(events);
    return record;
}

app.get('/api/events/:eventId/signatures', async(req, res) => {
    try {
        const { eventId } = req.params;
        const store = await readEventSignaturesStore(eventId);
        const record = store[eventId] || { eventId, signatures: [] };
        const rawSignatures = Array.isArray(record.signatures) ? record.signatures : [];
        const signatures = dedupeSignatures(rawSignatures);
        if (signatures.length !== rawSignatures.length) {
            record.signatures = signatures;
            record.updatedAt = new Date().toISOString();
            store[eventId] = record;
            await writeEventSignaturesStore(store);
        }
        const lastSignature = signatures.length ? signatures[signatures.length - 1] : null;

        // Light/summary mode: omit the heavy base64 `signature` image so the admin
        // events list can load fast. The image is fetched on demand per signer.
        const summary = req.query && (req.query.summary === '1' || req.query.summary === 'true' || req.query.light === '1');
        const outSignatures = summary ?
            signatures.map((s) => ({...s, signature: '', hasSignature: Boolean(s.signature) })) :
            signatures;

        res.json({
            eventId,
            eventTitle: record.eventTitle || '',
            participants: record.participants || 0,
            signatures: outSignatures,
            signedCount: signatures.length,
            lastSignerName: lastSignature ? lastSignature.fullName || '' : '',
            lastSignedAt: lastSignature ? lastSignature.signedAt || '' : ''
        });
    } catch (error) {
        console.error('Failed loading event signatures:', error);
        res.status(500).json({ error: 'Failed to load event signatures' });
    }
});

// Fetch a single signature (including its base64 image) on demand. Used by the
// admin panel to lazy-load the signature image only when a signer is opened.
app.get('/api/events/:eventId/signatures/:signatureId', async(req, res) => {
    try {
        const { eventId, signatureId } = req.params;
        const store = await readEventSignaturesStore(eventId);
        const record = store[eventId] || { eventId, signatures: [] };
        const signatures = Array.isArray(record.signatures) ? record.signatures : [];
        const signature = signatures.find((s) => s && s.signatureId === signatureId) || null;
        if (!signature) {
            return res.status(404).json({ error: 'Signature not found' });
        }
        res.json({ eventId, signature });
    } catch (error) {
        console.error('Failed loading single signature:', error);
        res.status(500).json({ error: 'Failed to load signature' });
    }
});

app.get('/api/events', async(req, res) => {
    try {
        const events = await readEventsStore();
        res.json(sortEventsDescending(events));
    } catch (error) {
        console.error('Failed loading events:', error);
        res.status(500).json({ error: 'Failed loading events' });
    }
});

app.get('/api/events/:eventId', async(req, res) => {
    try {
        const { eventId } = req.params;
        const events = await readEventsStore();
        const event = events.find((e) => e.id === eventId);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        res.json(event);
    } catch (error) {
        console.error('Failed loading event:', error);
        res.status(500).json({ error: 'Failed loading event' });
    }
});

app.post('/api/events', async(req, res) => {
    try {
        const payload = normalizeEventPayload(req.body && req.body.event ? req.body.event : req.body);
        const events = await readEventsStore();
        const id = payload.id || Math.random().toString(36).substring(2, 10).toUpperCase();
        const incoming = {...payload, id };
        const idx = events.findIndex((e) => e.id === id);
        const saved = idx >= 0 ? mergeEventRecord(events[idx], incoming) : mergeEventRecord({ id, createdAt: incoming.createdAt }, incoming);

        if (idx >= 0) {
            events[idx] = saved;
        } else {
            events.unshift(saved);
        }

        await writeEventsStore(events);
        res.json({ success: true, event: saved });
    } catch (error) {
        console.error('Failed saving event:', error);
        res.status(500).json({ error: 'Failed saving event' });
    }
});

app.put('/api/events/:eventId', async(req, res) => {
    try {
        const { eventId } = req.params;
        const events = await readEventsStore();
        const idx = events.findIndex((e) => e.id === eventId);
        if (idx < 0) {
            return res.status(404).json({ error: 'Event not found' });
        }

        const updated = mergeEventRecord(events[idx], {...req.body, id: eventId });
        events[idx] = updated;
        await writeEventsStore(events);
        res.json({ success: true, event: updated });
    } catch (error) {
        console.error('Failed updating event:', error);
        res.status(500).json({ error: 'Failed updating event' });
    }
});

app.delete('/api/events/:eventId', async(req, res) => {
    try {
        const { eventId } = req.params;
        const events = await readEventsStore();
        const filtered = events.filter((e) => e.id !== eventId);
        await writeEventsStore(filtered);

        // Cascade: also delete all signatures for this event so they don't
        // linger in the database wasting space.
        if (hasSupabasePersistence()) {
            const sigDelete = await supabasePersistence
                .from(SUPABASE_EVENT_SIGNATURES_TABLE)
                .delete()
                .eq('event_id', eventId);
            if (sigDelete.error) {
                logPersistenceFallback('signatures', sigDelete.error);
            }

            const legacyDelete = await supabasePersistence
                .from(SUPABASE_LEGACY_EVENT_SIGNATURES_TABLE)
                .delete()
                .eq('event_id', eventId);
            if (legacyDelete.error) {
                logPersistenceFallback('signatures', legacyDelete.error);
            }
        }

        // Also remove from the file-fallback store.
        try {
            const sigStore = await readEventSignaturesStore(eventId);
            if (sigStore && sigStore[eventId]) {
                delete sigStore[eventId];
                await writeEventSignaturesStore(sigStore);
            }
        } catch (cleanupError) {
            console.warn('Failed cleaning up local signature store on delete:', cleanupError);
        }

        res.json({ success: true, eventId });
    } catch (error) {
        console.error('Failed deleting event:', error);
        res.status(500).json({ error: 'Failed deleting event' });
    }
});

app.post('/api/events/import', async(req, res) => {
    try {
        const incomingRaw = Array.isArray(req.body && req.body.events) ? req.body.events : [];
        if (!incomingRaw.length) {
            return res.json({ success: true, imported: 0, skipped: 0 });
        }

        const incoming = incomingRaw.map(normalizeEventPayload).filter((e) => e.id && e.title);
        const events = await readEventsStore();
        const byId = new Map(events.map((e) => [e.id, e]));
        let imported = 0;
        let skipped = 0;

        for (const event of incoming) {
            const existing = byId.get(event.id);
            if (existing) {
                byId.set(event.id, mergeEventRecord(existing, event));
                skipped++;
            } else {
                byId.set(event.id, event);
                imported++;
            }
        }

        const merged = sortEventsDescending(Array.from(byId.values()));
        await writeEventsStore(merged);
        res.json({ success: true, imported, skipped, total: merged.length });
    } catch (error) {
        console.error('Failed importing events:', error);
        res.status(500).json({ error: 'Failed importing events' });
    }
});

app.post('/api/events/:eventId/signatures', async(req, res) => {
    try {
        const { eventId } = req.params;
        const payload = req.body && req.body.signature ? req.body.signature : req.body;
        const signature = sanitizeSignaturePayload(payload || {});

        if (!signature.fullName) {
            return res.status(400).json({ error: 'fullName is required' });
        }

        const store = await readEventSignaturesStore(eventId);
        const existing = store[eventId] || { eventId, signatures: [] };
        const eventTitle = (req.body && req.body.eventTitle) || existing.eventTitle || '';
        const participants = (req.body && Number(req.body.participants)) || existing.participants || 0;

        existing.eventId = eventId;
        existing.eventTitle = eventTitle;
        existing.participants = participants;
        existing.updatedAt = new Date().toISOString();
        existing.signatures = dedupeSignatures(existing.signatures);

        const incomingKey = signatureDedupKey(signature);
        const existingIdx = existing.signatures.findIndex((s) => signatureDedupKey(s) === incomingKey);
        const replaced = existingIdx >= 0;

        // Re-use the existing signatureId when the same person re-signs, so the
        // Supabase row is updated in place instead of creating a duplicate row.
        if (replaced) {
            const prior = existing.signatures[existingIdx] || {};
            if (prior.signatureId) {
                signature.signatureId = prior.signatureId;
            }
        }

        const row = buildSignatureRow(eventId, signature, { eventTitle, participants });
        let supabaseSaved = false;

        if (hasSupabasePersistence()) {
            const { error: upsertError } = await supabasePersistence
                .from(SUPABASE_EVENT_SIGNATURES_TABLE)
                .upsert([row], { onConflict: 'signature_id' });
            if (upsertError) {
                logPersistenceFallback('signatures', upsertError);
            } else {
                supabaseSaved = true;
            }
        }

        if (replaced) {
            existing.signatures[existingIdx] = signature;
        } else {
            existing.signatures.push(signature);
        }

        store[eventId] = existing;

        // If Supabase already stored the new row, skip the full-store rewrite
        // (which would re-upload every signature on every POST). Only the file
        // fallback needs the full snapshot.
        if (!supabaseSaved) {
            await writeEventSignaturesStore(store);
        }

        const lastSignature = existing.signatures[existing.signatures.length - 1] || null;
        res.json({
            success: true,
            replaced,
            duplicate: false,
            eventId,
            signedCount: existing.signatures.length,
            lastSignerName: lastSignature ? lastSignature.fullName || '' : '',
            lastSignedAt: lastSignature ? lastSignature.signedAt || '' : ''
        });
    } catch (error) {
        console.error('Failed saving event signature:', error);
        res.status(500).json({ error: 'Failed saving event signature' });
    }
});

// Bulk import of historic signatures (one-time migration from localStorage).
// Deduplicates by participant identity so the same person is not imported twice.
app.post('/api/events/:eventId/signatures/import', async(req, res) => {
    try {
        const { eventId } = req.params;
        const incomingRaw = Array.isArray(req.body && req.body.signatures) ? req.body.signatures : [];
        if (!incomingRaw.length) {
            return res.json({ success: true, eventId, imported: 0, skipped: 0 });
        }

        const incoming = incomingRaw.map(sanitizeSignaturePayload).filter((s) => s.fullName);

        const store = await readEventSignaturesStore(eventId);
        const existing = store[eventId] || { eventId, signatures: [] };
        existing.eventId = eventId;
        existing.eventTitle = (req.body && req.body.eventTitle) || existing.eventTitle || '';
        existing.participants = (req.body && Number(req.body.participants)) || existing.participants || 0;
        existing.signatures = dedupeSignatures(existing.signatures);

        const existingKeys = new Set(existing.signatures.map(signatureDedupKey));
        let imported = 0;
        let skipped = 0;
        for (const sig of incoming) {
            const key = signatureDedupKey(sig);
            if (existingKeys.has(key)) {
                skipped++;
                continue;
            }
            existing.signatures.push(sig);
            existingKeys.add(key);
            imported++;
        }

        existing.updatedAt = new Date().toISOString();
        store[eventId] = existing;
        await writeEventSignaturesStore(store);

        res.json({
            success: true,
            eventId,
            imported,
            skipped,
            signedCount: existing.signatures.length
        });
    } catch (error) {
        console.error('Failed importing event signatures:', error);
        res.status(500).json({ error: 'Failed importing event signatures' });
    }
});

// Verifone payment routes
const verifoneCheckoutHandler = require('./api/verifone-checkout').handler;
const verifoneWebhookHandler = require('./api/verifone-webhook').handler;
app.post('/api/verifone-checkout', netlifyToExpress(verifoneCheckoutHandler));
app.post('/api/verifone-webhook', netlifyToExpress(verifoneWebhookHandler));

// Admin login endpoint
app.post('/api/admin/login', async(req, res) => {
    const { email, password } = req.body;
    const bcrypt = require('bcrypt');

    // Hardcoded admin credentials (primary method)
    const ADMIN_EMAIL = 'idan@smashlab.com';
    const ADMIN_PASSWORD = 'smash123'; // Change this in production!

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        res.json({
            success: true,
            token: 'admin-token-' + Date.now(),
            user: {
                email: email,
                name: 'Idan',
                is_admin: true
            }
        });
    } else {
        // Check if user exists in Supabase and has is_admin flag
        try {
            const { createClient } = require('@supabase/supabase-js');
            const supabase = createClient(
                process.env.SUPABASE_URL,
                process.env.SUPABASE_SERVICE_KEY
            );

            const { data: user, error } = await supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .eq('is_admin', true)
                .single();

            if (user && await bcrypt.compare(password, user.password_hash)) {
                res.json({
                    success: true,
                    token: 'admin-token-' + Date.now(),
                    user: {
                        email: user.email,
                        name: user.name,
                        is_admin: true
                    }
                });
            } else {
                res.status(401).json({ error: 'Invalid admin credentials' });
            }
        } catch (err) {
            console.error('Supabase admin check failed:', err);
            res.status(401).json({ error: 'Invalid admin credentials' });
        }
    }
});

// Customer login endpoint with bcrypt verification
app.post('/api/customer/login', async(req, res) => {
    const { email, password } = req.body;
    const bcrypt = require('bcrypt');

    try {
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY
        );

        // Find user by email
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !user) {
            return res.status(401).json({
                error: 'Invalid email or password',
                code: 'INVALID_CREDENTIALS'
            });
        }

        // Verify password with bcrypt
        const passwordMatch = await bcrypt.compare(password, user.password_hash);

        if (!passwordMatch) {
            return res.status(401).json({
                error: 'Invalid email or password',
                code: 'INVALID_CREDENTIALS'
            });
        }

        // Check if verified
        if (!user.verified) {
            return res.status(403).json({
                error: 'Email not verified',
                code: 'NOT_VERIFIED',
                email: user.email
            });
        }

        // Success - return user without password
        res.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                is_admin: user.is_admin || false,
                verified: user.verified
            }
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Customer registration endpoint with bcrypt password hashing
app.post('/api/customer/register', async(req, res) => {
    const { name, email, password, verificationCode, codeExpiry } = req.body;
    const bcrypt = require('bcrypt');

    try {
        // Validate input
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY
        );

        // Check if user exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('email')
            .eq('email', email)
            .single();

        if (existingUser) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        // Hash password with bcrypt (10 salt rounds)
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user (unverified - requires email verification)
        const { data: user, error } = await supabase
            .from('users')
            .insert([{
                name: name,
                email: email,
                password_hash: passwordHash,
                verified: false,
                is_admin: false
            }])
            .select()
            .single();

        if (error) {
            console.error('User creation error:', error);
            return res.status(500).json({ error: 'Failed to create user' });
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                verified: user.verified
            }
        });

    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Serve index.html for root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════╗
║            SmashLabs Server Running! 🚀           ║
╚════════════════════════════════════════════════════╝

  🌐 Local:    http://localhost:${PORT}
  📝 Login:    http://localhost:${PORT}/login.html
  🏠 Home:     http://localhost:${PORT}/index.html

  API Endpoints:
  ✓ POST /api/register          - User registration
  ✓ POST /api/login             - User authentication
  ✓ POST /api/send-verification - Email verification

  Press Ctrl+C to stop the server
  `);
});

module.exports = app;