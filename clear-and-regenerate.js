// Script to clear existing submissions and regenerate with correct logic
const API_BASE = 'https://cloudflare-booth-puzzle.lusostreams.workers.dev';
const CONFERENCE_ID = 'new-5-clue-test';

async function clearAndRegenerate() {
    console.log('Clearing existing submissions...');
    
    // Get all submissions to clear them
    const debugResponse = await fetch(`${API_BASE}/api/debug-submissions?conference=${CONFERENCE_ID}`);
    const existingSubmissions = await debugResponse.json();
    
    console.log(`Found ${existingSubmissions.length} existing submissions to clear`);
    
    // Clear submissions by creating a new conference with same name
    const response = await fetch(`${API_BASE}/api/conferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'New 5-Clue Test',
            id: CONFERENCE_ID + '-cleared'
        })
    });
    
    if (response.ok) {
        console.log('Created new cleared conference');
        
        // Now regenerate data for the cleared conference
        await generateSubmissions(CONFERENCE_ID + '-cleared');
    } else {
        console.log('Proceeding with regeneration on existing conference...');
        await generateSubmissions(CONFERENCE_ID);
    }
}

async function generateSubmissions(conferenceId) {
    console.log(`Generating submissions for ${conferenceId}...`);
    
    // Get conference data
    const response = await fetch(`${API_BASE}/api/conferences`);
    const conferences = await response.json();
    const conference = conferences.find(c => c.id === conferenceId);
    
    if (!conference) {
        console.error('Conference not found!');
        return;
    }
    
    const correctAnswer = conference.puzzle.solution.join('');
    console.log(`Correct answer: ${correctAnswer}`);
    
    // Generate names (reusing from original script)
    const firstNames = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn', 'Blake', 'Sage', 'Cameron', 'Drew', 'Emery', 'Finley', 'Harper', 'Hayden', 'Indigo', 'Jaden', 'Kai', 'Lane', 'Logan', 'Marley', 'Nova', 'Ocean', 'Parker', 'Reese', 'River', 'Rowan', 'Skyler', 'Tatum'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Crypto', 'Hacker', 'Security', 'Cipher', 'Binary', 'Digital', 'Quantum', 'Neural', 'Cloud', 'Edge'];
    
    function getRandomName() {
        const first = firstNames[Math.floor(Math.random() * firstNames.length)];
        const last = lastNames[Math.floor(Math.random() * lastNames.length)];
        return `${first} ${last}`;
    }
    
    function getRandomEmail(name) {
        const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'protonmail.com'];
        const cleanName = name.toLowerCase().replace(' ', '.');
        const domain = domains[Math.floor(Math.random() * domains.length)];
        return `${cleanName}@${domain}`;
    }
    
    function getRandomWrongAnswer() {
        const digits = [];
        while (digits.length < 3) {
            const digit = Math.floor(Math.random() * 10);
            if (!digits.includes(digit)) {
                digits.push(digit);
            }
        }
        return digits.join('');
    }
    
    const totalSubmissions = 68;
    const correctSubmissions = Math.floor(totalSubmissions * 0.8); // 54
    const incorrectSubmissions = totalSubmissions - correctSubmissions; // 14
    
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
    
    // Shuffle submissions
    for (let i = submissions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [submissions[i], submissions[j]] = [submissions[j], submissions[i]];
    }
    
    console.log(`Submitting ${submissions.length} new submissions...`);
    
    // Submit each one
    for (let i = 0; i < submissions.length; i++) {
        const submission = submissions[i];
        console.log(`Submitting ${i + 1}/${submissions.length}: ${submission.name} - ${submission.answer}`);
        
        try {
            const response = await fetch(`${API_BASE}/api/test-submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conference: conferenceId,
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
        
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    console.log('Regeneration completed!');
    
    // Verify the results
    const verifyResponse = await fetch(`${API_BASE}/api/debug-submissions?conference=${conferenceId}`);
    const newSubmissions = await verifyResponse.json();
    const correctCount = newSubmissions.filter(s => s.correct === true).length;
    console.log(`Verification: ${correctCount} correct out of ${newSubmissions.length} total submissions`);
}

clearAndRegenerate().catch(console.error);
