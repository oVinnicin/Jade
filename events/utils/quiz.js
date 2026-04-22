const { Events, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, roleMention, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isButton()) return;
        if (!interaction.customId.startsWith('quiz_')) return;

        const [prefix, theme, currentIndexStr, scoreString, lastChoice] = interaction.customId.split('_');
        const quiz = interaction.client.quizes.get(theme);
        
        if (!quiz) return interaction.reply({ 
            content: "Quiz não encontrado.", 
            flags: [MessageFlags.Ephemeral] 
        });

        const formatQuestionText = (index, questionObj) => {
            const optionsText = questionObj.options
                .map(o => `**${o.label})** ${o.text}`)
                .join('\n');
            return `### Pergunta ${index + 1}/${quiz.questions.length}\n\n${questionObj.text}\n\n${optionsText}`;
        };

        const accentColor = parseInt(quiz.color.replace('#', ''), 16);

        // --- LÓGICA DE INÍCIO (START) ---
        if (currentIndexStr === 'start') {
            const q = quiz.questions[0];

            const container = new ContainerBuilder()
                .setAccentColor(accentColor)
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`## ${quiz.name}`)
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(formatQuestionText(0, q))
                )
                .addSeparatorComponents(
                    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`-# Escolha a opção que mais combina com você para continuar.`)
                );

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
                components: [container, row],
                flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
            });
        }

        // --- PROCESSAMENTO DE PONTOS ---
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

        // --- PRÓXIMA PERGUNTA ---
        if (nextIndex < quiz.questions.length) {
            const q = quiz.questions[nextIndex];

            const container = new ContainerBuilder()
                .setAccentColor(accentColor)
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`# ${quiz.name}`)
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(formatQuestionText(nextIndex, q))
                )
                .addSeparatorComponents(
                    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`-# Escolha a opção que mais combina com você para continuar.`)
                );

            const row = new ActionRowBuilder().addComponents(
                q.options.map(o => {
                    const charData = quiz.roles[o.pointsTo];
                    return new ButtonBuilder()
                        .setCustomId(`quiz_${theme}_${nextIndex}_${newScoreString}_${charData.short}`)
                        .setLabel(o.label)
                        .setStyle(ButtonStyle.Secondary);
                })
            );

            return await interaction.update({ components: [container, row] });

        } else {
            // --- FINALIZAÇÃO (RESULTADO) ---
            const maxScore = Math.max(...Object.values(scores));
            const winners = Object.keys(scores).filter(key => scores[key] === maxScore);
            const winnerShort = winners.sort(() => Math.random() - 0.5)[0];
            
            const winnerKey = Object.keys(quiz.roles).find(k => quiz.roles[k].short === winnerShort);
            const winnerData = quiz.roles[winnerKey];

            const endComponent = new ContainerBuilder()
                .setAccentColor(accentColor)
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        '# Quiz Completo!\n'+
                        `Parabéns! Você concluiu o quiz e ganhou o cargo...`
                    )
                )
                .addSeparatorComponents(
                    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `## ${roleMention(winnerData.id)}\n`+
                        `${winnerData.description}\n\n`
                    )
                )
                .addSeparatorComponents(
                    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`-# Compartilhe seu resultado com seus amigos!`)
                );

            await interaction.update({ components: [endComponent] });

            // Gerenciamento de Cargos
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
