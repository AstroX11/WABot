import { Module } from '..';

Module(
	{
		pattern: 'ping',
		public: true,
		isGroup: false,
		dontAddCommandList: true
	},
	async message => {
		const start = Date.now();
		await message.reply('Pong!');
		const end = Date.now();
		return message.edit(`Pong! \`${end - start}ms\``);
	}
);
