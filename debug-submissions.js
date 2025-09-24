// Debug script to check submission data
const API_BASE = 'https://cloudflare-booth-puzzle.lusostreams.workers.dev';
const CONFERENCE_ID = 'new-5-clue-test';

async function debugSubmissions() {
    try {
        // Get all submissions for the conference
        const response = await fetch(`${API_BASE}/api/conferences`);
        const conferences = await response.json();
        const conference = conferences.find(c => c.id === CONFERENCE_ID);
        
        console.log('Conference data:', JSON.stringify(conference, null, 2));
        console.log('Solution:', conference.puzzle.solution);
        
        // Try to access submissions via a test endpoint
        const testResponse = await fetch(`${API_BASE}/api/debug-submissions?conference=${CONFERENCE_ID}`);
        if (testResponse.ok) {
            const submissions = await testResponse.json();
            console.log('Found submissions:', submissions.length);
            console.log('Sample submission:', submissions[0]);
            
            const correctCount = submissions.filter(s => s.correct === true).length;
            console.log('Correct submissions:', correctCount);
        } else {
            console.log('Debug endpoint not available');
        }
        
    } catch (error) {
        console.error('Error:', error);
    }
}

debugSubmissions();
