'use client';

import { firebaseConfig } from '../constants';

/**
 * Fallback Firestore REST API client for when SDK fails (e.g., "client is offline" on Vercel)
 * Uses Firebase Firestore REST API directly
 */

interface FirestoreDocument {
    name: string;
    fields: Record<string, FirestoreValue>;
    createTime: string;
    updateTime: string;
}

interface FirestoreValue {
    stringValue?: string;
    integerValue?: string;
    booleanValue?: boolean;
    mapValue?: { fields: Record<string, FirestoreValue> };
    arrayValue?: { values?: FirestoreValue[] };
    timestampValue?: string;
    nullValue?: null;
}

/**
 * Convert Firestore REST API value to JavaScript value
 */
function parseFirestoreValue(value: FirestoreValue): unknown {
    if ('stringValue' in value) return value.stringValue;
    if ('integerValue' in value) return parseInt(value.integerValue!, 10);
    if ('booleanValue' in value) return value.booleanValue;
    if ('nullValue' in value) return null;
    if ('timestampValue' in value) return new Date(value.timestampValue!);
    if ('arrayValue' in value) {
        return value.arrayValue?.values?.map(parseFirestoreValue) || [];
    }
    if ('mapValue' in value) {
        const result: Record<string, unknown> = {};
        const fields = value.mapValue?.fields || {};
        for (const [key, val] of Object.entries(fields)) {
            result[key] = parseFirestoreValue(val);
        }
        return result;
    }
    return null;
}

/**
 * Parse Firestore document to plain object
 */
function parseFirestoreDocument(doc: FirestoreDocument): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(doc.fields || {})) {
        result[key] = parseFirestoreValue(value);
    }
    // Extract document ID from name
    const pathParts = doc.name.split('/');
    result.id = pathParts[pathParts.length - 1];
    return result;
}

/**
 * Get a document from Firestore using REST API
 */
export async function getDocumentViaRest(
    collectionPath: string,
    documentId: string,
    idToken: string
): Promise<Record<string, unknown> | null> {
    const { projectId } = firebaseConfig;
    if (!projectId) {
        throw new Error('Firebase projectId is not configured');
    }

    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionPath}/${documentId}`;

    console.log('Firestore REST API request:', url);

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json',
            },
        });

        if (response.status === 404) {
            console.log('Document not found via REST API');
            return null;
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Firestore REST API error:', response.status, errorText);
            throw new Error(`Firestore REST API error: ${response.status} - ${errorText}`);
        }

        const doc = await response.json() as FirestoreDocument;
        console.log('Firestore REST API success:', doc);
        return parseFirestoreDocument(doc);
    } catch (error) {
        console.error('Firestore REST API fetch error:', error);
        throw error;
    }
}

/**
 * Create or update a document using REST API
 */
export async function setDocumentViaRest(
    collectionPath: string,
    documentId: string,
    data: Record<string, unknown>,
    idToken: string
): Promise<Record<string, unknown>> {
    const { projectId } = firebaseConfig;
    if (!projectId) {
        throw new Error('Firebase projectId is not configured');
    }

    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionPath}/${documentId}`;

    // Convert data to Firestore format
    const fields = toFirestoreFields(data);

    console.log('Firestore REST API PATCH request:', url);

    const response = await fetch(url, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fields }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Firestore REST API set error:', response.status, errorText);
        throw new Error(`Firestore REST API error: ${response.status} - ${errorText}`);
    }

    const doc = await response.json() as FirestoreDocument;
    return parseFirestoreDocument(doc);
}

/**
 * Convert JavaScript value to Firestore value
 */
function toFirestoreValue(value: unknown): FirestoreValue {
    if (value === null || value === undefined) {
        return { nullValue: null };
    }
    if (typeof value === 'string') {
        return { stringValue: value };
    }
    if (typeof value === 'number') {
        return { integerValue: String(Math.floor(value)) };
    }
    if (typeof value === 'boolean') {
        return { booleanValue: value };
    }
    if (value instanceof Date) {
        return { timestampValue: value.toISOString() };
    }
    if (Array.isArray(value)) {
        return { arrayValue: { values: value.map(toFirestoreValue) } };
    }
    if (typeof value === 'object') {
        return { mapValue: { fields: toFirestoreFields(value as Record<string, unknown>) } };
    }
    return { stringValue: String(value) };
}

/**
 * Convert JavaScript object to Firestore fields
 */
function toFirestoreFields(obj: Record<string, unknown>): Record<string, FirestoreValue> {
    const fields: Record<string, FirestoreValue> = {};
    for (const [key, value] of Object.entries(obj)) {
        if (key !== 'id') { // Don't include 'id' as it's the document ID
            fields[key] = toFirestoreValue(value);
        }
    }
    return fields;
}
