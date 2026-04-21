const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags, ButtonBuilder, ButtonStyle, ActionRowBuilder, ContainerBuilder, SectionBuilder, ThumbnailBuilder, TextDisplayBuilder } = require("discord.js");
const fs = require('fs');
const path = require('path');

module.exports = {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName("quiz")
        .setDescription("Gerenciamento do sistema de quizes")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub =>
            sub.setName("iniciar")
                .setDescription("Inicia um quiz de personalidade")
                .addStringOption(option =>
                    option.setName('tema')
                        .setDescription('O tema do quiz')
                        .setRequired(true)
                        .setAutocomplete(true)))
        .addSubcommand(sub =>
            sub.setName("listar")
                .setDescription("Lista todos os quizes carregados"))
        .addSubcommand(sub =>
            sub.setName("upload")
                .setDescription("Adiciona um novo arquivo de quiz")
                .addAttachmentOption(opt =>
                    opt.setName("arquivo")
                        .setDescription("O arquivo .js")
                        .setRequired(true)))
        .addSubcommand(sub =>
            sub.setName("deletar")
                .setDescription("Apaga um quiz permanentemente")
                .addStringOption(opt =>
                    opt.setName("tema")
                        .setDescription("'O tema do quiz")
                        .setRequired(true)
                        .setAutocomplete(true))),

    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        const quizes = interaction.client.quizes;

        const filtered = quizes.filter(quiz =>
            quiz.name.toLowerCase().includes(focusedValue.toLowerCase()) ||
            quiz.id.toLowerCase().includes(focusedValue.toLowerCase())
        );

        await interaction.respond(
            filtered.first(25).map(quiz => ({ name: quiz.name, value: quiz.id }))
        );
    },

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const quizes = interaction.client.quizes;

        // --- INICIAR ---
        if (subcommand === "iniciar") {
            const theme = interaction.options.getString('tema');
            const quiz = interaction.client.quizes.get(theme);

            if (!quiz) {
                return interaction.reply({
                    content: `Quiz "${theme}" não encontrado.`,
                    flags: [MessageFlags.Ephemeral]
                });
            }

            const initialPoints = Object.values(quiz.roles)
                .map(r => `${r.short}0`)
                .join('');

            const thumbnail = quiz.thumbnail ? quiz.thumbnail : 'https://i.imgur.com/wA1w4BZ.png';

            const introComponent = [
                new ContainerBuilder()
                    .setAccentColor(parseInt(quiz.color.replace('#', ''), 16))
                    .addSectionComponents(
                        new SectionBuilder()
                            .setThumbnailAccessory(
                                new ThumbnailBuilder()
                                    .setURL(thumbnail)
                            )
                            .addTextDisplayComponents(
                                new TextDisplayBuilder()
                                    .setContent(
                                        `## ${quiz.name}\n` +
                                        `${quiz.description}\n\n` +
                                        `**Você pode ganhar os seguintes cargos nesse quiz:**\n` +
                                        Object.values(quiz.roles).map(r => `• <@&${r.id}>`).join('\n') +
                                        `\n\n-# Clique no botão abaixo para começar o quiz e descobrir!`
                                    )
                            )
                    ),
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`quiz_${theme}_start_${initialPoints}`)
                            .setStyle(ButtonStyle.Success)
                            .setLabel("Começar Quiz")
                            .setEmoji("📝")
                    )
            ]

            await interaction.channel.send({
                components: introComponent,
                flags: MessageFlags.IsComponentsV2
            });

            return await interaction.reply({
                content: "Quiz enviado com sucesso!",
                flags: [MessageFlags.Ephemeral]
            });
        }
        // --- LISTAR ---
        if (subcommand === "listar") {
            if (quizes.size === 0) return interaction.reply({ content: "Nenhum quiz carregado.", flags: [MessageFlags.Ephemeral] });

            const components = [
                new ContainerBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            `## 📂 Quizzes Carregados\n` +
                            `${quizes.map(q => `- **${q.name}** (ID: \`${q.id}\`)`).join('\n')}` +
                            `\n\n-# **${quizes.size}** quiz(zes) carregado(s)`
                        ),
                    ),
            ];

            return await interaction.reply({ components: components, flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral] });
        }

        // --- UPLOAD ---
        if (subcommand === "upload") {
            const attachment = interaction.options.getAttachment('arquivo');
            if (!attachment.name.endsWith('.js')) {
                return interaction.reply({ content: "❌ Envie um arquivo `.js`.", flags: [MessageFlags.Ephemeral] });
            }

            const savePath = path.resolve(__dirname, '../../quizzes', attachment.name);

            try {
                const response = await fetch(attachment.url);
                const content = await response.text();
                fs.writeFileSync(savePath, content);

                if (require.cache[require.resolve(savePath)]) delete require.cache[require.resolve(savePath)];

                const testQuiz = require(savePath);
                if (!testQuiz.id || !testQuiz.questions || !testQuiz.roles) {
                    throw new Error("O arquivo não segue o template: faltam as propriedades 'id', 'questions' ou 'roles'.");
                }

                quizes.set(testQuiz.id, testQuiz);
                return await interaction.reply({ content: `✅ Quiz \`${testQuiz.name}\` carregado!`, flags: [MessageFlags.Ephemeral] });

            } catch (err) {
                if (fs.existsSync(savePath)) fs.unlinkSync(savePath);
                return interaction.reply({ content: `❌ Erro no arquivo: ${err.message}`, flags: [MessageFlags.Ephemeral] });
            }
        }

        // --- DELETAR ---
        if (subcommand === "deletar") {
            const quizId = interaction.options.getString('id');
            const quiz = quizes.get(quizId);

            if (!quiz) return interaction.reply({ content: "❌ Quiz não encontrado.", flags: [MessageFlags.Ephemeral] });

            const filePath = path.resolve(__dirname, '../../quizzes', `${quizId}.js`);

            try {
                quizes.delete(quizId);
                if (require.cache[require.resolve(filePath)]) delete require.cache[require.resolve(filePath)];
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

                return await interaction.reply({ content: `✅ Quiz **${quizId}** removido com sucesso.`, flags: [MessageFlags.Ephemeral] });
            } catch (err) {
                return interaction.reply({ content: "❌ Erro ao deletar arquivo.", flags: [MessageFlags.Ephemeral] });
            }
        }
    }
};
