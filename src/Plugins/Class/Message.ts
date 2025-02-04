import { detectType, getBuffer, getMimeType } from 'xstro-utils';
import { downloadMessage } from '../../Utils';
import { isUrl, toJid } from '../../Functions';
import { LANG } from '../../Extensions';

interface MessageKey {
	id: string;
	remoteJid: string;
	fromMe: boolean;
}

interface QuotedMessage {
	key: MessageKey;
	sender: string;
	mtype: string;
	body: string;
	type: string;
	message: any;
	isStatus: boolean;
	sudo: boolean;
	isban: boolean;
	viewonce: boolean;
}

interface MessageData {
	key: MessageKey;
	isAdmin: boolean;
	isBotAdmin: boolean;
	isGroup: boolean;
	pushName: string;
	message: any;
	prefix: string;
	sender: string;
	type: string;
	user: any;
	sudo: boolean;
	isban: boolean;
	mode: string;
	messageTimestamp: number;
	body?: string;
	mention?: string[];
	quoted?: QuotedMessage;
}

interface ReplyMessageType {
	id: string;
	fromMe: boolean;
	sender: string;
	key: MessageKey;
	bot: boolean;
	mtype: string;
	sudo: boolean;
	isban: boolean;
	message: object;
	text: string;
	status: boolean;
	image: boolean;
	video: boolean;
	audio: boolean;
	sticker: boolean;
	document: boolean;
	viewonce: boolean;
}

interface MessageOptions {
	jid?: string;
	type?: string;
	mentions?: string[];
	quoted?: any;
	key?: MessageKey;
	[key: string]: any;
}

class Message {
	private client: any;
	private data: MessageData;
	public key: MessageKey;
	public id: string;
	public jid: string;
	public isAdmin: boolean;
	public isBotAdmin: boolean;
	public isGroup: boolean;
	public fromMe: boolean;
	public pushName: string;
	public message: any;
	public prefix: string;
	public sender: string;
	public mtype: string;
	public user: any;
	public sudo: boolean;
	public isban: boolean;
	public mode: string;
	public timestamp: number;
	public text: string;
	public bot: boolean;
	public mention: string[] | undefined;
	public quoted: QuotedMessage | undefined;
	public reply_message: ReplyMessageType | null;

	constructor(client: any, data: MessageData) {
		Object.defineProperties(this, {
			client: { value: client, writable: true, configurable: true },
			data: { value: data, writable: true, configurable: true }
		});
		if (data) this._events(data);
	}

	private _events(data: MessageData): void {
		this.data = data;
		this.key = data.key;
		this.id = data.key.id;
		this.jid = data.key.remoteJid;
		this.isAdmin = data.isAdmin;
		this.isBotAdmin = data.isBotAdmin;
		this.isGroup = data.isGroup;
		this.fromMe = data.key.fromMe;
		this.pushName = data.pushName;
		this.message = data.message;
		this.prefix = data.prefix;
		this.sender = data.sender;
		this.mtype = data.type;
		this.user = data.user;
		this.sudo = data.sudo;
		this.isban = data.isban;
		this.mode = data.mode;
		this.timestamp = data.messageTimestamp;
		this.text = data.body || '';
		this.bot = /^(BAE5|3EB0)/.test(data.key.id);
		this.mention = data.mention;
		this.quoted = data.quoted;

		if (data.quoted) {
			const quoted = data.quoted;
			this.reply_message = {
				id: quoted.key.id,
				fromMe: quoted.key.fromMe,
				sender: quoted.sender,
				key: quoted.key,
				bot: /^(BAE5|3EB0)/.test(quoted.key.id),
				mtype: quoted.mtype,
				sudo: quoted.sudo,
				isban: quoted.isban,
				message: quoted.message,
				text: quoted.body,
				status: quoted.isStatus,
				image: quoted.type === 'imageMessage',
				video: quoted.type === 'videoMessage',
				audio: quoted.type === 'audioMessage',
				sticker: quoted.type === 'stickerMessage',
				document: quoted.type === 'documentMessage',
				viewonce: quoted.viewonce
			};
		} else {
			this.reply_message = null;
		}
	}

	async getAdmin(): Promise<boolean> {
		if (!this.isAdmin) {
			await this.send(LANG.ISADMIN);
			return false;
		}
		if (!this.isBotAdmin) {
			await this.send(LANG.ISBOTADMIN);
			return false;
		}
		return true;
	}

	async getJid(match?: string): Promise<string | false> {
		return this.isGroup
			? match
				? toJid(match)
				: this.reply_message?.sender
				? this.reply_message.sender
				: this.mention?.[0]
				? this.mention[0]
				: false
			: match
			? toJid(match)
			: this.reply_message?.sender
			? this.reply_message.sender
			: this.jid
			? this.jid
			: false;
	}

	async reply(text: string): Promise<Message> {
		return new Message(
			this.client,
			await this.client.sendMessage(this.jid, {
				text: `\`\`\`${text.trim().toString()}\`\`\``,
				contextInfo: {
					externalAdReply: {
						title: this.pushName,
						body: LANG.BOT_NAME,
						mediaType: 1,
						thumbnailUrl: LANG.THUMBNAIL,
						sourceUrl: LANG.REPO_URL,
						showAdAttribution: true
					}
				}
			})
		);
	}

	async edit(content: string): Promise<Message> {
		const msg = await this.client.sendMessage(this.jid, {
			text: content,
			edit: this.data?.quoted?.key || this.key
		});
		return new Message(this.client, msg);
	}

	async react(emoji: string, opts: MessageOptions = {}): Promise<Message> {
		const msg = await this.client.sendMessage(this.jid, {
			react: { text: emoji, key: opts.key || this.key }
		});
		return new Message(this.client, msg);
	}

	async delete(): Promise<Message> {
		const msg = await this.client.sendMessage(this.jid, {
			delete: this.reply_message?.key || this.key
		});
		return new Message(this.client, msg);
	}

	async send(content: any, opts: MessageOptions = {}): Promise<Message> {
		const jid = opts.jid || this.jid;
		const type = opts.type || (await detectType(content));
		const mentions = opts.mentions || this.mention;
		const msg = await this.client.sendMessage(jid, {
			[type]: content,
			contextInfo: { mentionedJid: mentions, ...opts },
			...opts
		});
		return new Message(this.client, msg);
	}

	async sendFile(
		file: Buffer | string,
		fileName?: string,
		caption?: string,
		opts: MessageOptions = {}
	): Promise<Message> {
		try {
			if (!file) throw new Error('No file provided');
			let buffer: Buffer;
			if (typeof file === 'string' && isUrl(file)) {
				buffer = await getBuffer(file);
			} else if (Buffer.isBuffer(file)) {
				buffer = file;
			} else {
				throw new Error('File must be a buffer or a valid URL');
			}
			const mime = await getMimeType(buffer);
			if (!mime) throw new Error('Unable to detect mime type');
			const message = {
				document: buffer,
				mimetype: mime,
				fileName: fileName || 'χѕтяσ м∂',
				caption: caption || '',
				...opts
			};
			return new Message(
				this.client,
				await this.client.sendMessage(this.jid, message, {
					quoted: opts.quoted,
					...opts
				})
			);
		} catch (error) {
			throw new Error(
				`Error sending file: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	async sendFromUrl(url: string, opts: MessageOptions = {}): Promise<Message> {
		if (!isUrl(url)) throw new Error('Invalid URL');
		try {
			const buffer = await getBuffer(url);
			const content = await detectType(buffer);
			if (!content) throw new Error('Unsupported Content');
			return new Message(
				this.client,
				await this.client.sendMessage(
					this.jid,
					{ [opts.type || content]: buffer, ...opts },
					{ ...opts }
				)
			);
		} catch (error) {
			throw new Error(
				`Error sending message: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	async forward(jid: string, message: any, opts: MessageOptions = {}): Promise<Message> {
		if (!jid || !message) throw new Error('No jid or message provided');
		return new Message(
			this.client,
			await this.client.sendMessage(
				jid,
				{ forward: message, contextInfo: { ...opts }, ...opts },
				{ ...opts }
			)
		);
	}

	async download(file: boolean = false): Promise<any> {
		return await downloadMessage(this.data?.quoted || this.data?.message, file);
	}
}

export default Message;
