// Script to generate test submissions for the booth puzzle
const API_BASE = 'https://cloudflare-booth-puzzle.lusostreams.workers.dev';
const CONFERENCE_ID = 'new-5-clue-test';

// First, let's get the conference data to find the correct solution
async function getConferenceData() {
    const response = await fetch(`${API_BASE}/api/conferences`);
    const conferences = await response.json();
    const conference = conferences.find(c => c.id === CONFERENCE_ID);
    return conference;
}

// Generate random names with international diversity
const firstNames = [
    // English/Western names
    'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn', 'Blake', 'Sage',
    'Cameron', 'Drew', 'Emery', 'Finley', 'Harper', 'Hayden', 'Indigo', 'Jaden', 'Kai', 'Lane',
    'Logan', 'Marley', 'Nova', 'Ocean', 'Parker', 'Reese', 'River', 'Rowan', 'Skyler', 'Tatum',
    'Phoenix', 'Raven', 'Storm', 'Winter', 'Echo', 'Blaze', 'Zion', 'Atlas', 'Orion',
    'Luna', 'Aria', 'Zara', 'Maya', 'Nora', 'Ella', 'Ava', 'Mia', 'Zoe', 'Eva',
    'Leo', 'Max', 'Sam', 'Ben', 'Dan', 'Tom', 'Joe', 'Jim', 'Rob', 'Tim',
    'Amy', 'Sue', 'Kim', 'Jen', 'Liz', 'Ann', 'Joy', 'May',
    // Chinese names
    'Wei', 'Li', 'Ming', 'Xin', 'Jing', 'Yun', 'Hao', 'Mei', 'Lin', 'Jun',
    'Xiao', 'Chen', 'Yang', 'Ling', 'Fang', 'Qing', 'Hui', 'Ping', 'Rui', 'Shan',
    // Korean names
    'Min', 'Ji', 'Soo', 'Hye', 'Jin', 'Kyung', 'Young', 'Seung', 'Hyun', 'Eun',
    'Jae', 'Sang', 'Woo', 'Hoon', 'Sun', 'Yeon', 'Bin', 'Ho', 'Kyu', 'Dong',
    // Spanish names
    'Carlos', 'Maria', 'Jose', 'Ana', 'Luis', 'Carmen', 'Miguel', 'Isabel', 'Diego', 'Sofia',
    'Pablo', 'Elena', 'Javier', 'Lucia', 'Rafael', 'Cristina', 'Fernando', 'Beatriz', 'Sergio', 'Natalia',
    // Portuguese names
    'João', 'Ana', 'Pedro', 'Maria', 'Carlos', 'Fernanda', 'Paulo', 'Juliana', 'Ricardo', 'Camila',
    'Bruno', 'Larissa', 'Felipe', 'Gabriela', 'Rodrigo', 'Mariana', 'Thiago', 'Rafaela', 'Lucas', 'Bianca',
    // Turkish names
    'Ahmet', 'Ayşe', 'Mehmet', 'Fatma', 'Ali', 'Emine', 'Mustafa', 'Hatice', 'Hüseyin', 'Zeynep',
    'İbrahim', 'Şule', 'Ömer', 'Sevgi', 'Yusuf', 'Derya', 'Emre', 'Cansu', 'Burak', 'Elif',
    // Arabic names
    'Ahmed', 'Fatima', 'Mohammed', 'Aisha', 'Omar', 'Khadija', 'Ali', 'Maryam', 'Hassan', 'Zainab',
    'Yusuf', 'Amina', 'Khalid', 'Layla', 'Samir', 'Nour', 'Tariq', 'Hala', 'Rashid', 'Salma'
];

const lastNames = [
    // English/Western surnames
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
    'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
    'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
    'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
    'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
    // Chinese surnames
    'Wang', 'Li', 'Zhang', 'Liu', 'Chen', 'Yang', 'Huang', 'Zhao', 'Wu', 'Zhou',
    'Xu', 'Sun', 'Ma', 'Zhu', 'Hu', 'Guo', 'He', 'Lin', 'Luo', 'Gao',
    // Korean surnames
    'Kim', 'Lee', 'Park', 'Choi', 'Jung', 'Kang', 'Cho', 'Yoon', 'Jang', 'Lim',
    'Han', 'Oh', 'Seo', 'Shin', 'Kwon', 'Hwang', 'Ahn', 'Song', 'Yoo', 'Hong',
    // Spanish surnames
    'González', 'Rodríguez', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Martín', 'Jiménez',
    'Ruiz', 'Hernández', 'Díaz', 'Moreno', 'Muñoz', 'Álvarez', 'Romero', 'Alonso', 'Gutiérrez', 'Navarro',
    // Portuguese surnames
    'Silva', 'Santos', 'Ferreira', 'Pereira', 'Oliveira', 'Souza', 'Rodrigues', 'Almeida', 'Lima', 'Gonçalves',
    'Gomes', 'Ribeiro', 'Carvalho', 'Barbosa', 'Martins', 'Rocha', 'Reis', 'Alves', 'Moreira', 'Fernandes',
    // Turkish surnames
    'Yılmaz', 'Kaya', 'Demir', 'Şahin', 'Çelik', 'Yıldız', 'Yıldırım', 'Öztürk', 'Aydin', 'Özkan',
    'Kaplan', 'Doğan', 'Vural', 'Aslan', 'Çetin', 'Kara', 'Koç', 'Kurt', 'Özdemir', 'Erdoğan',
    // Arabic surnames
    'Al-Ahmad', 'Al-Mohammed', 'Al-Ali', 'Al-Hassan', 'Al-Hussein', 'Al-Omar', 'Al-Khalil', 'Al-Rashid', 'Al-Saeed', 'Al-Nasser',
    'Mahmoud', 'Ibrahim', 'Abdallah', 'Khalil', 'Mansour', 'Farah', 'Khoury', 'Habib', 'Saleh', 'Qasemi',
    // Tech-themed surnames
    'Crypto', 'Hacker', 'Security', 'Cipher', 'Binary', 'Digital', 'Quantum', 'Neural', 'Cloud', 'Edge'
];

function getRandomName() {
    const first = firstNames[Math.floor(Math.random() * firstNames.length)];
    const last = lastNames[Math.floor(Math.random() * lastNames.length)];
    return `${first} ${last}`;
}

function getRandomEmail(name) {
    const domains = [
        'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'protonmail.com', 
        'company.com', 'tech.io', 'cyber.net', 'security.org', 'conference.com',
        // International domains
        '163.com', 'qq.com', 'sina.com', // Chinese
        'naver.com', 'daum.net', 'gmail.com', // Korean  
        'yandex.com', 'mail.ru', 'hotmail.com', // Turkish/Russian
        'terra.com.br', 'uol.com.br', 'globo.com', // Portuguese/Brazilian
        'correo.es', 'telefonica.net', 'yahoo.es' // Spanish
    ];
    const cleanName = name.toLowerCase()
        .replace(/[áàâãä]/g, 'a')
        .replace(/[éèêë]/g, 'e')
        .replace(/[íìîï]/g, 'i')
        .replace(/[óòôõö]/g, 'o')
        .replace(/[úùûü]/g, 'u')
        .replace(/[ç]/g, 'c')
        .replace(/[ñ]/g, 'n')
        .replace(/[ğ]/g, 'g')
        .replace(/[ş]/g, 's')
        .replace(/[ı]/g, 'i')
        .replace(/[ö]/g, 'o')
        .replace(/[ü]/g, 'u')
        .replace(/[ç]/g, 'c')
        .replace(/ /g, '.');
    const domain = domains[Math.floor(Math.random() * domains.length)];
    const number = Math.floor(Math.random() * 999);
    return `${cleanName}${Math.random() > 0.7 ? number : ''}@${domain}`;
}

function getRandomWrongAnswer() {
    // Generate a random 3-digit answer that's not the correct one
    const digits = [];
    while (digits.length < 3) {
        const digit = Math.floor(Math.random() * 10);
        if (!digits.includes(digit)) {
            digits.push(digit);
        }
    }
    return digits.join('');
}

async function generateSubmissions() {
    console.log('Getting conference data...');
    const conference = await getConferenceData();
    
    if (!conference) {
        console.error('Conference not found!');
        return;
    }
    
    const correctAnswer = conference.puzzle.solution.join('');
    console.log(`Correct answer: ${correctAnswer}`);
    
    const totalSubmissions = 68;
    const correctSubmissions = Math.floor(totalSubmissions * 0.8); // 80% correct = 54
    const incorrectSubmissions = totalSubmissions - correctSubmissions; // 14
    
    console.log(`Generating ${correctSubmissions} correct and ${incorrectSubmissions} incorrect submissions...`);
    
    const submissions = [];
    
    // Generate correct submissions
    for (let i = 0; i < correctSubmissions; i++) {
        const name = getRandomName();
        submissions.push({
            name: name,
            email: getRandomEmail(name),
            answer: correctAnswer
        });
    }
    
    // Generate incorrect submissions
    for (let i = 0; i < incorrectSubmissions; i++) {
        const name = getRandomName();
        submissions.push({
            name: name,
            email: getRandomEmail(name),
            answer: getRandomWrongAnswer()
        });
    }
    
    // Shuffle the submissions
    for (let i = submissions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [submissions[i], submissions[j]] = [submissions[j], submissions[i]];
    }
    
    console.log('Submitting data...');
    
    // Submit each one
    for (let i = 0; i < submissions.length; i++) {
        const submission = submissions[i];
        console.log(`Submitting ${i + 1}/${submissions.length}: ${submission.name} - ${submission.answer}`);
        
        try {
            const response = await fetch(`${API_BASE}/api/test-submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    conference: CONFERENCE_ID,
                    name: submission.name,
                    email: submission.email,
                    answer: submission.answer
                })
            });
            
            const result = await response.json();
            if (!result.success) {
                console.error(`Failed to submit for ${submission.name}`);
            }
        } catch (error) {
            console.error(`Error submitting for ${submission.name}:`, error);
        }
        
        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('All submissions completed!');
}

// Run the script
generateSubmissions().catch(console.error);
