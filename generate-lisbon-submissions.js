// Generate 193 test submissions for lisbon-tech-2025 conference
// 89% correct (172 correct, 21 incorrect)
// Correct answer: 978

const submissions = [];
const correctAnswer = [9, 7, 8];
const names = [
    'Ana Silva', 'João Santos', 'Maria Oliveira', 'Pedro Costa', 'Sofia Ferreira',
    'Miguel Rodrigues', 'Catarina Pereira', 'Rui Martins', 'Inês Carvalho', 'Tiago Almeida',
    'Beatriz Sousa', 'André Gomes', 'Mariana Ribeiro', 'Nuno Fernandes', 'Rita Lopes',
    'Carlos Mendes', 'Joana Pinto', 'Bruno Dias', 'Patrícia Rocha', 'Diogo Correia',
    'Francisca Moreira', 'Gonçalo Teixeira', 'Leonor Cardoso', 'Henrique Neves', 'Marta Reis',
    'Ricardo Barbosa', 'Vera Monteiro', 'Filipe Castro', 'Cristina Machado', 'Vasco Cunha',
    'Susana Araújo', 'Paulo Vieira', 'Helena Coelho', 'Luís Baptista', 'Carla Fonseca',
    'Daniel Marques', 'Teresa Antunes', 'Sérgio Guerreiro', 'Mónica Simões', 'Fábio Leite'
];

const domains = ['gmail.com', 'hotmail.com', 'outlook.com', 'sapo.pt', 'iol.pt', 'tecnico.ulisboa.pt', 'ist.utl.pt'];

// Generate wrong answers (avoiding the correct one)
function generateWrongAnswer() {
    let answer;
    do {
        answer = [
            Math.floor(Math.random() * 10),
            Math.floor(Math.random() * 10),
            Math.floor(Math.random() * 10)
        ];
    } while (JSON.stringify(answer) === JSON.stringify(correctAnswer));
    return answer;
}

// Generate 172 correct submissions
for (let i = 0; i < 172; i++) {
    const name = names[Math.floor(Math.random() * names.length)];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    const email = `${name.toLowerCase().replace(' ', '.')}${Math.floor(Math.random() * 999)}@${domain}`;
    
    submissions.push({
        conferenceId: 'lisbon-tech-2025',
        answer: correctAnswer,
        name: name,
        email: email,
        correct: true
    });
}

// Generate 21 incorrect submissions
for (let i = 0; i < 21; i++) {
    const name = names[Math.floor(Math.random() * names.length)];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    const email = `${name.toLowerCase().replace(' ', '.')}${Math.floor(Math.random() * 999)}@${domain}`;
    
    submissions.push({
        conferenceId: 'lisbon-tech-2025',
        answer: generateWrongAnswer(),
        name: name,
        email: email,
        correct: false
    });
}

// Shuffle submissions
for (let i = submissions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [submissions[i], submissions[j]] = [submissions[j], submissions[i]];
}

// Output as JSON for bulk submission
console.log(JSON.stringify(submissions, null, 2));
