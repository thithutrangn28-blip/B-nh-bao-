import { getDB, SNAPSHOT_STORE, KIKOKO_STORY_STORE_NAME } from './db';

const MAX_SNAPSHOTS = 10;

export async function createSnapshot(novelId: string, data: any) {
    try {
        const db = await getDB();
        const snapshot = {
            novelId,
            timestamp: Date.now(),
            data: JSON.stringify(data), 
            version: 1
        };
        await db.add(SNAPSHOT_STORE, snapshot);
        await rotateSnapshots(novelId);
    } catch (error) {
        console.error('Snapshot failed:', error);
    }
}

async function rotateSnapshots(novelId: string) {
    try {
        const db = await getDB();
        const tx = db.transaction(SNAPSHOT_STORE, 'readwrite');
        const store = tx.objectStore(SNAPSHOT_STORE);
        const snapshots = await store.index('novelId').getAll(novelId);
        
        if (snapshots.length > MAX_SNAPSHOTS) {
            snapshots.sort((a, b) => a.timestamp - b.timestamp);
            const toDelete = snapshots.slice(0, snapshots.length - MAX_SNAPSHOTS);
            for (const s of toDelete) {
                await store.delete(s.id);
            }
        }
        await tx.done;
    } catch (error) {
        console.error('Rotation failed:', error);
    }
}

export async function getSnapshots(novelId: string) {
    const db = await getDB();
    const snapshots = await db.getAllFromIndex(SNAPSHOT_STORE, 'novelId', novelId);
    return snapshots.sort((a, b) => b.timestamp - a.timestamp);
}

export async function deleteSnapshot(snapshotId: number) {
    const db = await getDB();
    await db.delete(SNAPSHOT_STORE, snapshotId);
}

export async function restoreSnapshot(snapshotId: number) {
    const db = await getDB();
    const snapshot = await db.get(SNAPSHOT_STORE, snapshotId);
    if (!snapshot) throw new Error('Snapshot not found');
    return JSON.parse(snapshot.data);
}

export async function getStorageHealth(novelId: string) {
    const db = await getDB();
    const snapshots = await db.getAllFromIndex(SNAPSHOT_STORE, 'novelId', novelId);
    const story = await db.get(KIKOKO_STORY_STORE_NAME, novelId);
    
    // Approximate size
    const estimatedSize = story ? JSON.stringify(story).length : 0;
    
    return {
        snapshotsCount: snapshots.length,
        lastSnapshot: snapshots.length > 0 ? snapshots[snapshots.length - 1].timestamp : null,
        estimatedSize
    };
}
