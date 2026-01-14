import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject,
    getMetadata,
    UploadMetadata,
} from 'firebase/storage';
import { storage } from './config';
import { APP_CONFIG } from '../constants';
import { generateId } from '../utils/helpers';
import type { AttachmentMeta } from '@/types';
import { Timestamp } from 'firebase/firestore';

/**
 * Get storage path for task attachment
 */
function getAttachmentPath(orgId: string, taskId: string, fileName: string): string {
    return `orgs/${orgId}/tasks/${taskId}/attachments/${fileName}`;
}

/**
 * Upload file to Firebase Storage
 */
export async function uploadAttachment(
    orgId: string,
    taskId: string,
    file: File,
    uploadedBy: string
): Promise<AttachmentMeta> {
    // Validate file size
    if (file.size > APP_CONFIG.maxFileSize) {
        throw new Error(`File size exceeds maximum of ${APP_CONFIG.maxFileSize / (1024 * 1024)}MB`);
    }

    const attachmentId = generateId();
    const fileName = `${attachmentId}_${file.name}`;
    const storagePath = getAttachmentPath(orgId, taskId, fileName);

    const storageRef = ref(storage, storagePath);

    const metadata: UploadMetadata = {
        contentType: file.type,
        customMetadata: {
            originalName: file.name,
            uploadedBy,
            taskId,
            orgId,
        },
    };

    await uploadBytes(storageRef, file, metadata);

    const attachmentMeta: AttachmentMeta = {
        id: attachmentId,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        storagePath,
        uploadedBy,
        uploadedAt: Timestamp.now(),
    };

    return attachmentMeta;
}

/**
 * Get download URL for attachment
 */
export async function getAttachmentUrl(storagePath: string): Promise<string> {
    const storageRef = ref(storage, storagePath);
    return getDownloadURL(storageRef);
}

/**
 * Delete attachment from storage
 */
export async function deleteAttachment(storagePath: string): Promise<void> {
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
}

/**
 * Get attachment metadata
 */
export async function getAttachmentMetadata(storagePath: string) {
    const storageRef = ref(storage, storagePath);
    return getMetadata(storageRef);
}

/**
 * Download attachment as blob
 */
export async function downloadAttachment(storagePath: string): Promise<Blob> {
    const url = await getAttachmentUrl(storagePath);
    const response = await fetch(url);
    return response.blob();
}

export { storage };
