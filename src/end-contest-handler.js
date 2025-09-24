async function handleEndContest(request, env) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { conferenceId, winner } = await request.json();
    
    // Get the conference
    let conference = await env.PUZZLE_KV.get('conference:' + conferenceId);
    if (!conference) {
      return new Response('Conference not found', { status: 404 });
    }
    
    conference = JSON.parse(conference);
    
    // Set the winner and mark as inactive
    conference.winner = winner;
    conference.active = false;
    conference.ended = new Date().toISOString();
    
    // Save the updated conference
    await env.PUZZLE_KV.put('conference:' + conferenceId, JSON.stringify(conference));
    
    // Clear the display mode
    await env.PUZZLE_KV.delete('display-mode:' + conferenceId);
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error ending contest:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
