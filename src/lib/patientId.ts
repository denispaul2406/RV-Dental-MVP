/**
 * Patient ID format: P-YYYY-NNNN (year + 4-digit sequence).
 * Used for display and linking; Firestore doc ID remains the primary key.
 */

const YEAR = new Date().getFullYear();
const PREFIX = `P-${YEAR}-`;

export function getNextPatientId(existingPatients: { patientId?: string }[]): string {
    const existing = existingPatients
        .map((p) => p.patientId)
        .filter((id): id is string => typeof id === "string" && id.startsWith(PREFIX));
    const sequences = existing
        .map((id) => parseInt(id.replace(PREFIX, ""), 10))
        .filter((n) => !Number.isNaN(n));
    const maxSeq = sequences.length ? Math.max(...sequences) : 0;
    const nextSeq = maxSeq + 1;
    return `${PREFIX}${String(nextSeq).padStart(4, "0")}`;
}

export function getNextPatientIdsForMigration(
    patientsWithoutId: { id: string; createdAt: { toMillis: () => number } }[],
    existingPatientIds: string[]
): string[] {
    const sequences = existingPatientIds
        .filter((id) => id.startsWith(PREFIX))
        .map((id) => parseInt(id.replace(PREFIX, ""), 10))
        .filter((n) => !Number.isNaN(n));
    let nextSeq = sequences.length ? Math.max(...sequences) + 1 : 1;
    const sorted = [...patientsWithoutId].sort(
        (a, b) => (a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0)
    );
    return sorted.map(() => `${PREFIX}${String(nextSeq++).padStart(4, "0")}`);
}
