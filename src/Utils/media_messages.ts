import { writeFile } from 'fs/promises';
import { downloadMediaMessage, getContentType, WAProto } from 'baileys';
import { FileTypeFromBuffer } from 'xstro-utils';

// Vaild media message types
type MediaMessageType =
	| 'imageMessage'
	| 'documentMessage'
	| 'audioMessage'
	| 'videoMessage'
	| 'stickerMessage';

// Define the message property path type
type MessagePropertyPath = string;

/**
 * Checks if a message is a media message and returns a boolean
 * @param message - Full Message Object
 * @returns True if the message is a media message, false otherwise
 */
export function isMediaMessage(message: { message: WAProto.IMessage }): boolean {
	const messageType = getContentType(message.message);
	const media: MediaMessageType[] = [
		'imageMessage',
		'documentMessage',
		'audioMessage',
		'videoMessage',
		'stickerMessage'
	];
	return media.includes(messageType as MediaMessageType);
}

/**
 * Takes An Message Object and Edits a Property
 * @param message - Full Message Object
 * @param propertyPath - Property Path to Edit using dot notation
 * @param value - New Value to Replace the Property
 * @returns New Message Object
 */
export function editMessageProptery<T extends WAProto.IWebMessageInfo, V>(
	message: T,
	propertyPath: MessagePropertyPath,
	value: V
): T {
	if (!message || typeof message !== 'object') {
		throw new Error('Message must be an object');
	}
	if (typeof propertyPath !== 'string') {
		throw new Error('Property path must be a string using dot notation');
	}
	const result: T = JSON.parse(JSON.stringify(message));

	const keys = propertyPath.split('.');
	let current: any = result;

	for (let i = 0; i < keys.length - 1; i++) {
		const key = keys[i];
		if (key === '__proto__' || key === 'constructor') {
			throw new Error('Prototype pollution attempt detected');
		}
		if (!(key in current)) {
			throw new Error(`"${propertyPath}" does not exist in message`);
		}
		current = current[key];
	}
	const finalKey = keys[keys.length - 1];
	current[finalKey] = value;

	return result;
}

/**
 * Takes A Media Message and Downloads it
 * @param message - Media Message Object
 * @param asSaveFile - If true, the message will be downloaded as a file
 * @returns Buffer of the Media Message or Path to the Media Message
 */
export async function downloadMessage(
	message: WAProto.IWebMessageInfo,
	asSaveFile: boolean = false
): Promise<Buffer | void> {
	if (!message || !isMediaMessage(message)) {
		throw new Error('Message must be a media message');
	}

	const media = await downloadMediaMessage(
		{
			key: message.key,
			message: message.message
		},
		'buffer',
		{},
		{
			logger: console
		}
	);

	if (!(media instanceof Buffer)) {
		throw new Error('Failed to download media as buffer');
	}

	if (asSaveFile) {
		const ext = await FileTypeFromBuffer(media);
		if (!ext) {
			throw new Error('Could not determine file type from buffer');
		}
		return await writeFile(`${message.key.id}.${ext}`, media);
	}

	return media;
}
