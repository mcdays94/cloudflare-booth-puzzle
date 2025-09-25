#!/usr/bin/env node

const CONFERENCE_ID = 'london-cybersecurity-summit-2025';
const CORRECT_SOLUTION = [0, 8, 2];
const TOTAL_SUBMISSIONS = 186;
const CORRECT_PERCENTAGE = 0.9; // 90%
const BASE_URL = 'https://cloudflare-booth-puzzle.lusostreams.workers.dev';

// Calculate counts
const correctCount = Math.floor(TOTAL_SUBMISSIONS * CORRECT_PERCENTAGE);
const incorrectCount = TOTAL_SUBMISSIONS - correctCount;

console.log(`Generating ${TOTAL_SUBMISSIONS} submissions:`);
console.log(`- Correct: ${correctCount} (${Math.round(correctCount/TOTAL_SUBMISSIONS*100)}%)`);
console.log(`- Incorrect: ${incorrectCount} (${Math.round(incorrectCount/TOTAL_SUBMISSIONS*100)}%)`);

// Generate random names and emails
const firstNames = [
    'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn', 'Sage', 'River',
    'Blake', 'Cameron', 'Drew', 'Emery', 'Finley', 'Gray', 'Harper', 'Indigo', 'Jude', 'Kai',
    'Lane', 'Micah', 'Nova', 'Ocean', 'Parker', 'Reese', 'Skyler', 'Tatum', 'Vale', 'Wren',
    'Zion', 'Ari', 'Bay', 'Cedar', 'Dove', 'Echo', 'Fox', 'Glen', 'Haven', 'Iris',
    'James', 'Sarah', 'Michael', 'Emma', 'David', 'Olivia', 'John', 'Sophia', 'Robert', 'Isabella',
    'William', 'Charlotte', 'Richard', 'Amelia', 'Joseph', 'Mia', 'Thomas', 'Harper', 'Christopher', 'Evelyn'
];

const lastNames = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
    'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
    'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
    'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
    'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'
];

const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'company.com', 'tech.org', 'security.net'];

function generateRandomName() {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    return `${firstName} ${lastName}`;
}

function generateRandomEmail(name) {
    const cleanName = name.toLowerCase().replace(/\s+/g, '.');
    const domain = domains[Math.floor(Math.random() * domains.length)];
    const randomNum = Math.floor(Math.random() * 999);
    return `${cleanName}${randomNum}@${domain}`;
}

function generateIncorrectAnswer() {
    // Generate a random 3-digit answer that's not the correct solution
    let answer;
    do {
        answer = [
            Math.floor(Math.random() * 10),
            Math.floor(Math.random() * 10),
            Math.floor(Math.random() * 10)
        ];
    } while (JSON.stringify(answer) === JSON.stringify(CORRECT_SOLUTION));
    
    return answer;
}

async function submitAnswer(name, email, answer) {
    const response = await fetch(`${BASE_URL}/api/test-submit`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            conference: CONFERENCE_ID,
            name: name,
            email: email,
            answer: answer
        })
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
}

async function generateSubmissions() {
    const submissions = [];
    
    // Generate correct submissions
    for (let i = 0; i < correctCount; i++) {
        const name = generateRandomName();
        const email = generateRandomEmail(name);
        submissions.push({
            name,
            email,
            answer: CORRECT_SOLUTION,
            expected: true
        });
    }
    
    // Generate incorrect submissions
    for (let i = 0; i < incorrectCount; i++) {
        const name = generateRandomName();
        const email = generateRandomEmail(name);
        submissions.push({
            name,
            email,
            answer: generateIncorrectAnswer(),
            expected: false
        });
    }
    
    // Shuffle the submissions to randomize the order
    for (let i = submissions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [submissions[i], submissions[j]] = [submissions[j], submissions[i]];
    }
    
    return submissions;
}

async function main() {
    try {
        console.log('Generating submissions...');
        const submissions = await generateSubmissions();
        
        console.log('Submitting answers...');
        let successCount = 0;
        let correctSubmitted = 0;
        let incorrectSubmitted = 0;
        
        for (let i = 0; i < submissions.length; i++) {
            const submission = submissions[i];
            
            try {
                const result = await submitAnswer(submission.name, submission.email, submission.answer);
                
                if (result.success) {
                    successCount++;
                    if (result.correct) {
                        correctSubmitted++;
                    } else {
                        incorrectSubmitted++;
                    }
                    
                    // Progress indicator
                    if ((i + 1) % 20 === 0 || i === submissions.length - 1) {
                        console.log(`Progress: ${i + 1}/${submissions.length} submissions completed`);
                    }
                } else {
                    console.error(`Failed to submit for ${submission.name}: ${result.error || 'Unknown error'}`);
                }
                
                // Small delay to avoid overwhelming the server
                await new Promise(resolve => setTimeout(resolve, 50));
                
            } catch (error) {
                console.error(`Error submitting for ${submission.name}:`, error.message);
            }
        }
        
        console.log('\n=== SUBMISSION SUMMARY ===');
        console.log(`Total submissions attempted: ${submissions.length}`);
        console.log(`Successful submissions: ${successCount}`);
        console.log(`Correct answers submitted: ${correctSubmitted}`);
        console.log(`Incorrect answers submitted: ${incorrectSubmitted}`);
        console.log(`Actual correct percentage: ${Math.round(correctSubmitted/successCount*100)}%`);
        
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main();
