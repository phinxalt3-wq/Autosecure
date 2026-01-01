const { db, queryParams } = require("../../../db/database");

db.serialize(() => {
    db.run(
        `CREATE TABLE IF NOT EXISTS secure_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            email TEXT,
            sec_email TEXT,
            password TEXT,
            recovery_code TEXT,
            context TEXT,
            payload TEXT,
            status_uuid TEXT,
            created_at INTEGER NOT NULL
        )`
    );

    db.run(`ALTER TABLE secure_logs ADD COLUMN status_uuid TEXT`, err => {
        if (err && !/duplicate column name/.test(err.message)) {
            console.error("[secureLogStore] Failed to add status_uuid column:", err.message);
        }
    });
});

async function saveSecureLog({ userId, email, secEmail, password, recoveryCode, context = null, payload = null, statusUuid = null }) {
    try {
        const createdAt = Date.now();
        const serialized = payload ? JSON.stringify(payload).slice(0, 2000) : null;
        await queryParams(
            `INSERT INTO secure_logs (user_id, email, sec_email, password, recovery_code, context, payload, status_uuid, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, email, secEmail, password, recoveryCode, context, serialized, statusUuid, createdAt],
            "run"
        );
    } catch (error) {
        console.error("[secureLogStore] Failed to save secure log:", error.message);
    }
}

async function fetchSecureLogs(userId, email = null, limit = 1) {
    const params = [userId];
    let query = `SELECT * FROM secure_logs WHERE user_id = ?`;

    if (email) {
        query += ` AND email = ?`;
        params.push(email);
    }

    query += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(limit);

    return queryParams(query, params);
}

module.exports = {
    saveSecureLog,
    fetchSecureLogs
};

