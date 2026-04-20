const fs = require('node:fs');
const path = require('node:path');
const { Events, Client, Collection, GatewayIntentBits, IntentsBitField, Intents, roleMention } = require('discord.js');
const dotenv = require('dotenv')

//const sequelize = require('./database');
//const { Tags, WhitelistRoles } = require('./schemas/user')

dotenv.config()
const { TOKEN, CLIENT_ID, GUILD_ID } = process.env

const client = new Client({
	autoReconnect: true,
	retryLimit: Infinity,
	fetchAllMembers: false,
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildVoiceStates,
		IntentsBitField.Flags.Guilds,
		IntentsBitField.Flags.GuildPresences,
		IntentsBitField.Flags.GuildMembers,
		IntentsBitField.Flags.DirectMessages
	]
});

// Cria uma nova coleção para armazenar os comandos
client.commands = new Collection();
client.cooldowns = new Collection();
client.quizes = new Collection();

// Caminho para as pastas
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

const eventsPath = path.join(__dirname, 'events');
const eventFolders = fs.readdirSync(eventsPath);

const quizesPath = path.join(__dirname, 'quizzes');

// Função para carregar comandos
function loadCommands() {
	for (const folder of commandFolders) {
		const commandsPath = path.join(foldersPath, folder);
		if (!fs.statSync(commandsPath).isDirectory()) continue;

		const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

		for (const file of commandFiles) {
			const filePath = path.join(commandsPath, file);
			const command = require(filePath);
			if ('data' in command && 'execute' in command) {
				client.commands.set(command.data.name, command);
			} else {
				console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
			}
		}
	}
}
loadCommands();

// Função para carregar eventos
function loadEvents() {
	for (const folder of eventFolders) {
		const folderPath = path.join(eventsPath, folder);
		if (!fs.statSync(folderPath).isDirectory()) continue;

		const eventFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));

		for (const file of eventFiles) {
			const filePath = path.join(folderPath, file);
			const event = require(filePath);
			if (event.once) {
				client.once(event.name, (...args) => event.execute(...args));
			} else {
				client.on(event.name, (...args) => event.execute(...args));
			}
		}
	}
}
loadEvents();

function loadQuizes() {
	client.quizes.clear();
	const quizesFiles = fs.readdirSync(quizesPath).filter(file => file.endsWith('.js'));

	for (const file of quizesFiles) {
		const filePath = path.join(quizesPath, file);
		delete require.cache[require.resolve(filePath)];
		const quiz = require(filePath);
		client.quizes.set(quiz.id, quiz);
	}

}

loadQuizes();

(async () => {
	client.login(TOKEN);
})();

module.exports = {loadQuizes}
