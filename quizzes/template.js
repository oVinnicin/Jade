module.exports = {
    // Coloque o nome do arquivo como o id.
    id: "template",
    name: "Nome do Quiz",
    description: "Descrição que aparece no início.",
    color: "#cfcece",
    thumbnail: "",

    roles: {
        a: { name: "Personagem 1", id: "1495766061851611286", short: "a", description: "Descrição para a personagem 1" },
        b: { name: "Personagem 2", id: "1495766069711867905", short: "b", description: "Descrição para a personagem 2" },
        c: { name: "Personagem 3", id: "1495766073679806647", short: "c", description: "Descrição para a personagem 3" },
        d: { name: "Personagem 4", id: "1495766077186248704", short: "d", description: "Descrição para a personagem 4" },
        e: { name: "Personagem 5", id: "1495766454233075792", short: "e", description: "Descrição para a personagem 5" }
    },

    questions: [
        {
            text: "Pergunta número 1",
            options: [
                { label: "A", text: "Resposta para Personagem 1", pointsTo: "a" },
                { label: "B", text: "Resposta para Personagem 2", pointsTo: "b" },
                { label: "C", text: "Resposta para Personagem 3", pointsTo: "c" },
                { label: "D", text: "Resposta para Personagem 4", pointsTo: "d" },
                { label: "E", text: "Resposta para Personagem 5", pointsTo: "e" }
            ]
        },
        {
            text: "Pergunta número 2",
            options: [
                { label: "A", text: "Resposta para Personagem 1", pointsTo: "a" },
                { label: "B", text: "Resposta para Personagem 2", pointsTo: "b" },
                { label: "C", text: "Resposta para Personagem 3", pointsTo: "c" },
                { label: "D", text: "Resposta para Personagem 4", pointsTo: "d" },
                { label: "E", text: "Resposta para Personagem 5", pointsTo: "e" }
            ]
        },
        {
            text: "Pergunta número 3",
            options: [
                { label: "A", text: "Resposta para Personagem 1", pointsTo: "a" },
                { label: "B", text: "Resposta para Personagem 2", pointsTo: "b" },
                { label: "C", text: "Resposta para Personagem 3", pointsTo: "c" },
                { label: "D", text: "Resposta para Personagem 4", pointsTo: "d" },
                { label: "E", text: "Resposta para Personagem 5", pointsTo: "e" }
            ]
        },
        {
            text: "Pergunta número 4",
            options: [
                { label: "A", text: "Resposta para Personagem 1", pointsTo: "a" },
                { label: "B", text: "Resposta para Personagem 2", pointsTo: "b" },
                { label: "C", text: "Resposta para Personagem 3", pointsTo: "c" },
                { label: "D", text: "Resposta para Personagem 4", pointsTo: "d" },
                { label: "E", text: "Resposta para Personagem 5", pointsTo: "e" }
            ]
        },
        {
            text: "Pergunta número 5",
            options: [
                { label: "A", text: "Resposta para Personagem 1", pointsTo: "a" },
                { label: "B", text: "Resposta para Personagem 2", pointsTo: "b" },
                { label: "C", text: "Resposta para Personagem 3", pointsTo: "c" },
                { label: "D", text: "Resposta para Personagem 4", pointsTo: "d" },
                { label: "E", text: "Resposta para Personagem 5", pointsTo: "e" }
            ]
        }
        // Adicione quantas perguntas quiser seguindo o bloco acima
    ]
};