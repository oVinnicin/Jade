const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, roleMention } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isButton()) return;
        if (!interaction.customId.startsWith('quiz_')) return;

        const [prefix, theme, currentIndexStr, scoreString, lastChoice] = interaction.customId.split('_');
        const quiz = interaction.client.quizes.get(theme);
        if (!quiz) return interaction.reply({ content: "Quiz não encontrado.", flags: [MessageFlags.Ephemeral] });

        const formatQuizDescription = (index, questionObj) => {
            const optionsText = questionObj.options
                .map(o => `**${o.label})** ${o.text}`)
                .join('\n');
            return `**Pergunta ${index + 1}/${quiz.questions.length}**\n\n${questionObj.text}\n\n${optionsText}`;
        };

        // --- START QUIZ ---
        if (currentIndexStr === 'start') {
            const q = quiz.questions[0];

            const embed = new EmbedBuilder()
                .setColor(quiz.color)
                .setTitle(`${quiz.name}`)
                .setDescription(formatQuizDescription(0, q));

            const row = new ActionRowBuilder().addComponents(
                q.options.map(o => {
                    const charData = quiz.roles[o.pointsTo];
                    return new ButtonBuilder()
                        .setCustomId(`quiz_${theme}_0_${scoreString}_${charData.short}`)
                        .setLabel(o.label)
                        .setStyle(ButtonStyle.Secondary);
                })
            );

            return await interaction.reply({
                embeds: [embed],
                components: [row],
                flags: [MessageFlags.Ephemeral]
            });
        }

        // --- POINTS ---
        const currentIndex = parseInt(currentIndexStr);
        let scores = {};
        const scoreParts = scoreString.match(/[a-z]\d+/g);

        scoreParts.forEach(part => {
            const charShort = part[0];
            let points = parseInt(part.slice(1));
            if (charShort === lastChoice) points++;
            scores[charShort] = points;
        });

        const newScoreString = Object.entries(scores).map(([k, v]) => `${k}${v}`).join('');
        const nextIndex = currentIndex + 1;

        // --- NEXT QUESTION ---
        if (nextIndex < quiz.questions.length) {
            const q = quiz.questions[nextIndex];

            const embed = new EmbedBuilder()
                .setColor(quiz.color)
                .setTitle(`${quiz.name}`)
                .setDescription(formatQuizDescription(nextIndex, q));

            const row = new ActionRowBuilder().addComponents(
                q.options.map(o => {
                    const charData = quiz.roles[o.pointsTo];
                    return new ButtonBuilder()
                        .setCustomId(`quiz_${theme}_${nextIndex}_${newScoreString}_${charData.short}`)
                        .setLabel(o.label)
                        .setStyle(ButtonStyle.Secondary);
                })
            );

            await interaction.update({ embeds: [embed], components: [row] });

        } else {
            // --- END ---
            const maxScore = Math.max(...Object.values(scores));
            const winners = Object.keys(scores).filter(key => scores[key] === maxScore);
            const winnerShort = winners.sort(() => Math.random() - 0.5)[0];
            
            //const winnerShort = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);

            const winnerKey = Object.keys(quiz.roles).find(k => quiz.roles[k].short === winnerShort);
            const winnerData = quiz.roles[winnerKey];

            const endEmbed = new EmbedBuilder()
                .setColor(quiz.color)
                .setDescription(
                    `# Quiz Completo!\n` +
                    `🎉 Parabéns! Você concluiu o quiz e ganhou o cargo ${roleMention(winnerData.id)}!\n\n` +
                    `${winnerData.description}\n\n` +
                    `-# Compartilhe seu resultado com seus amigos!`
                )

            await interaction.update({ embeds: [endEmbed], components: [] });

            try {
                const allQuizRoles = Object.values(quiz.roles).map(r => r.id);

                await interaction.member.roles.remove(allQuizRoles).catch(() => null);

                const role = interaction.guild.roles.cache.get(winnerData.id);
                if (role) {
                    await interaction.member.roles.add(role);
                }
            } catch (e) {
                console.error("Erro ao gerenciar cargos do quiz:", e);
            }
        }
    },
};