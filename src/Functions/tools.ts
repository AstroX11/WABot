import { jidNormalizedUser } from 'baileys';
import { getBuffer } from 'xstro-utils';

/**
 * Formats bytes into human readable string
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
	if (!+bytes) return '0 Bytes';
	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Converts seconds to human readable duration string
 */
export function runtime(seconds: number): string {
	seconds = Number(seconds);
	const d = Math.floor(seconds / (3600 * 24));
	const h = Math.floor((seconds % (3600 * 24)) / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	const s = Math.floor(seconds % 60);
	const dDisplay = d > 0 ? d + (d === 1 ? ' d ' : ' d ') : '';
	const hDisplay = h > 0 ? h + (h === 1 ? ' h ' : ' h ') : '';
	const mDisplay = m > 0 ? m + (m === 1 ? ' m ' : ' m ') : '';
	const sDisplay = s > 0 ? s + (s === 1 ? ' s' : ' s') : '';
	return dDisplay + hDisplay + mDisplay + sDisplay;
}

/**
 * Returns the floor value of a number
 */
export const getFloor = (number: number): number => {
	return Math.floor(number);
};

/**
 * Returns a random element from an array
 */
export const getRandom = <T>(array: T[]): T | undefined => {
	if (array.length === 0) return undefined;
	const randomIndex = Math.floor(Math.random() * array.length);
	return array[randomIndex];
};

/**
 * Converts a phone number to WhatsApp JID format
 */
export const toJid = (num: string | number): string => {
	if (!num) throw new Error('Number is required');
	let normalizedNum = num.toString();
	normalizedNum = normalizedNum.replace(/:\d+/, '');
	normalizedNum = normalizedNum.replace(/\D/g, '');
	return jidNormalizedUser(`${normalizedNum}@s.whatsapp.net`);
};

/**
 * Fetches and saves a file from URL with retry mechanism
 */
export async function getFileAndSave(url: string): Promise<Buffer | false> {
	let attempts = 0;
	let data: Buffer | undefined;

	while (attempts < 3) {
		try {
			data = await getBuffer(url);
			if (!data) throw new Error('Failed to get buffer');
			return data;
		} catch {
			attempts++;
			if (attempts === 3) return false;
		}
	}
	return false;
}

/**
 * Extracts the first URL from a string
 */
export const extractUrl = (str: string): string | false => {
	const match = str.match(/https?:\/\/[^\s]+/);
	return match ? match[0] : false;
};

/**
 * Validates if a string is a valid URL
 */
export function isUrl(string: string): boolean {
	if (typeof string !== 'string') return false;

	try {
		const url = new URL(string);
		return url.protocol === 'http:' || url.protocol === 'https:';
	} catch (error) {
		return false;
	}
}

type TimeFormat = `${number}:${string}`;

/**
 * Converts 12-hour time format to 24-hour format
 */
export const convertTo24Hour = (timeStr: string): TimeFormat | null => {
	const timeRegex = /^(0?[1-9]|1[0-2]):([0-5][0-9])(am|pm)$/i;
	const match = timeStr.toLowerCase().match(timeRegex);
	if (!match) return null;
	let [, hours, minutes, period] = match;
	let numHours = parseInt(hours);
	if (period === 'pm' && numHours !== 12) numHours += 12;
	else if (period === 'am' && numHours === 12) numHours = 0;
	return `${String(numHours).padStart(2, '0')}:${minutes}` as TimeFormat;
};

/**
 * Converts 24-hour time format to 12-hour format
 */
export const convertTo12Hour = (timeStr: TimeFormat): string => {
	const [hours, minutes] = timeStr.split(':');
	let period = 'AM';
	let hour = parseInt(hours);
	if (hour >= 12) {
		period = 'PM';
		if (hour > 12) hour -= 12;
	}
	if (hour === 0) hour = 12;
	return `${hour}:${minutes}${period}`;
};

/**
 * Formats timestamp to 12-hour time format
 */
export const formatTime = (timestamp: number): string => {
	const date = new Date(timestamp);
	let hours = date.getHours();
	const minutes = date.getMinutes();
	const ampm = hours >= 12 ? 'pm' : 'am';
	hours = hours % 12 || 12; // Convert 0 to 12 for 12-hour format
	const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
	return `${hours}:${formattedMinutes}${ampm}`;
};
