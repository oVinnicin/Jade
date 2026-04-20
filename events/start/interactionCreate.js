const { Events, Collection, PermissionsBitField, MessageFlags } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (interaction.isAutocomplete()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.autocomplete(interaction);
            } catch (error) {
                console.error('Erro no Autocomplete:', error);
            }
            return;
        }

        if (!interaction.isCommand() && !interaction.isContextMenuCommand()) return;

        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) return;

        const { cooldowns } = interaction.client;

        if (!cooldowns.has(command.data.name)) {
            cooldowns.set(command.data.name, new Collection());
        }

        const now = Date.now();
        const timestamps = cooldowns.get(command.data.name);
        const defaultCooldownDuration = 0;
        const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 60 * 1000;

        if (timestamps.has(interaction.user.id)) {

            const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

            if (now < expirationTime) {
                const expiredTimestamp = Math.round(expirationTime / 1000);
                return interaction.reply({ content: `Por favor espere, você está em cooldown para \`${command.data.name}\`. Você poderá usar denovo <t:${expiredTimestamp}:R>.`, flags: MessageFlags.Ephemeral });
            }
        }

        timestamps.set(interaction.user.id, now);
        setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

        try {
            await command.execute(interaction, interaction.client);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Ocorreu um erro ao executar o comando.', flags: MessageFlags.Ephemeral });
        }
    }
}