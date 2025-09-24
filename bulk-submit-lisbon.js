// Bulk submit the generated Lisbon submissions
const fs = require('fs');

const submissions = JSON.parse(fs.readFileSync('lisbon-submissions.json', 'utf8'));

async function submitBulk() {
    const baseUrl = 'https://cloudflare-booth-puzzle.lusostreams.workers.dev';
    
    console.log(`Submitting ${submissions.length} submissions...`);
    
    for (let i = 0; i < submissions.length; i++) {
        const submission = submissions[i];
        
        try {
            const response = await fetch(`${baseUrl}/api/test-submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conference: submission.conferenceId,
                    name: submission.name,
                    email: submission.email,
                    answer: submission.answer
                })
            });
            
            if (response.ok) {
                console.log(`✅ ${i + 1}/${submissions.length}: ${submission.name} (${submission.correct ? 'correct' : 'incorrect'})`);
            } else {
                console.log(`❌ ${i + 1}/${submissions.length}: Failed for ${submission.name}`);
            }
            
            // Small delay to avoid overwhelming the server
            await new Promise(resolve => setTimeout(resolve, 50));
            
        } catch (error) {
            console.log(`❌ ${i + 1}/${submissions.length}: Error for ${submission.name}: ${error.message}`);
        }
    }
    
    console.log('Bulk submission completed!');
}

submitBulk();
