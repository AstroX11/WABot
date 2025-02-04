import * as path from 'path';
import * as fs from 'fs';

interface LanguageData {
	[key: string]: string;
}

function loadLanguageData(): LanguageData {
	const dir = path.join(__dirname, 'json', 'en.json');
	try {
		return JSON.parse(fs.readFileSync(dir, 'utf8'));
	} catch (error) {
		console.error('Error reading JSON file:', error);
		return {};
	}
}

const data: LanguageData = loadLanguageData();

const LANG = new Proxy<LanguageData>(data, {
	get: (target: LanguageData, prop: string): string | null => {
		return target[prop] || null;
	}
});

export { LANG };
