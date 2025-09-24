export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      if (path === '/' || path === '/puzzle') {
        // Check if we should display winner wheel instead
        const conferenceId = url.searchParams.get('conference');
        if (conferenceId) {
          const displayMode = await env.PUZZLE_KV.get('display-mode:' + conferenceId);
          if (displayMode === 'winner') {
            return handleWinnerWheel(url, env);
          }
        }
        return handlePuzzleDisplay(url, env);
      } else if (path === '/admin') {
        return handleAdminUI(env);
      } else if (path === '/winner') {
        return handleWinnerWheel(url, env);
      } else if (path === '/submit') {
        return handleSubmitForm(url, env);
      } else if (url.pathname === '/api/submit') {
        return handleAPI(request, env, corsHeaders);
      }

      if (url.pathname === '/api/finish-contest') {
        return handleFinishContest(request, env);
      }

      if (url.pathname === '/api/end-contest') {
        return handleEndContest(request, env);
      }
      
      if (path.startsWith('/api/')) {
        return handleAPI(request, env, corsHeaders);
      } else {
        return new Response('Not Found', { status: 404 });
      }
    } catch (error) {
      console.error('Worker error:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  }
};

function generatePuzzle() {
  // Generate solution with unique digits
  const solution = [];
  while (solution.length < 3) {
    const digit = Math.floor(Math.random() * 10);
    if (!solution.includes(digit)) {
      solution.push(digit);
    }
  }

  const availableDigits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter(d => !solution.includes(d));

  // Generate clue 1: One number correct but wrongly placed
  let clue1;
  do {
    clue1 = [];
    const solutionDigit = solution[Math.floor(Math.random() * 3)];
    let wrongPos;
    do {
      wrongPos = Math.floor(Math.random() * 3);
    } while (solution[wrongPos] === solutionDigit);
    clue1[wrongPos] = solutionDigit;
    
    // Fill other positions with non-solution digits
    for (let i = 0; i < 3; i++) {
      if (i !== wrongPos) {
        clue1[i] = availableDigits[Math.floor(Math.random() * availableDigits.length)];
      }
    }
  } while (clue1.some((num, idx) => num === solution[idx]) ||
           clue1.filter(num => solution.includes(num)).length !== 1);

  // Generate clue 2: One number correct but wrongly placed
  let clue2;
  do {
    clue2 = [];
    const solutionDigit = solution[Math.floor(Math.random() * 3)];
    let wrongPos;
    do {
      wrongPos = Math.floor(Math.random() * 3);
    } while (solution[wrongPos] === solutionDigit);
    clue2[wrongPos] = solutionDigit;
    
    // Fill other positions with non-solution digits
    for (let i = 0; i < 3; i++) {
      if (i !== wrongPos) {
        clue2[i] = availableDigits[Math.floor(Math.random() * availableDigits.length)];
      }
    }
  } while (clue2.some((num, idx) => num === solution[idx]) ||
           clue2.filter(num => solution.includes(num)).length !== 1 ||
           JSON.stringify(clue2) === JSON.stringify(clue1));

  // Generate clue 3: Two numbers correct and well placed
  let clue3;
  do {
    clue3 = [];
    const positions = [0, 1, 2];
    const selectedPositions = [];
    
    // Select 2 random positions
    for (let i = 0; i < 2; i++) {
      const posIndex = Math.floor(Math.random() * positions.length);
      selectedPositions.push(positions.splice(posIndex, 1)[0]);
    }
    
    // Place solution digits in correct positions
    selectedPositions.forEach(pos => {
      clue3[pos] = solution[pos];
    });
    
    // Fill remaining position with non-solution digit
    for (let i = 0; i < 3; i++) {
      if (clue3[i] === undefined) {
        clue3[i] = availableDigits[Math.floor(Math.random() * availableDigits.length)];
      }
    }
  } while (clue3.filter((num, idx) => num === solution[idx]).length !== 2 ||
           clue3.filter(num => solution.includes(num)).length !== 2);

  // Generate clue 4: Two numbers correct but wrongly placed
  let clue4;
  do {
    clue4 = [];
    const solutionDigits = [...solution];
    const usedPositions = [];
    
    // Place two solution digits in wrong positions
    for (let i = 0; i < 2; i++) {
      const digitIndex = Math.floor(Math.random() * solutionDigits.length);
      const digit = solutionDigits.splice(digitIndex, 1)[0];
      let pos;
      do {
        pos = Math.floor(Math.random() * 3);
      } while (usedPositions.includes(pos) || solution[pos] === digit);
      clue4[pos] = digit;
      usedPositions.push(pos);
    }
    
    // Fill remaining position with non-solution digit
    for (let i = 0; i < 3; i++) {
      if (clue4[i] === undefined) {
        clue4[i] = availableDigits[Math.floor(Math.random() * availableDigits.length)];
      }
    }
  } while (clue4.some((num, idx) => num === solution[idx]) ||
           clue4.filter(num => solution.includes(num)).length !== 2);

  // Generate clue 5: Nothing is correct
  let clue5;
  do {
    clue5 = [];
    for (let i = 0; i < 3; i++) {
      clue5[i] = availableDigits[Math.floor(Math.random() * availableDigits.length)];
    }
  } while (clue5.some(num => solution.includes(num)));

  return {
    solution,
    clues: [
      { numbers: clue1, hint: "One number is correct but wrongly placed" },
      { numbers: clue2, hint: "One number is correct but wrongly placed" },
      { numbers: clue3, hint: "Two numbers are correct and well placed" },
      { numbers: clue4, hint: "Two numbers are correct but wrongly placed" },
      { numbers: clue5, hint: "Nothing is correct" }
    ]
  };
}

async function handlePuzzleDisplay(url, env) {
  const conferenceId = url.searchParams.get('conference') || 'default';
  
  // Check if display should show winner wheel instead
  const displayMode = await env.PUZZLE_KV.get('display-mode:' + conferenceId);
  if (displayMode === 'winner') {
    return handleWinnerWheel(url, env);
  }
  
  let conference = await env.PUZZLE_KV.get('conference:' + conferenceId);
  if (!conference) {
    const defaultPuzzle = generatePuzzle();
    conference = {
      id: conferenceId,
      name: conferenceId === 'default' ? 'Default Conference' : conferenceId,
      puzzle: defaultPuzzle,
      active: true,
      created: new Date().toISOString()
    };
    await env.PUZZLE_KV.put('conference:' + conferenceId, JSON.stringify(conference));
  } else {
    conference = JSON.parse(conference);
  }

  const clueRows = conference.puzzle.clues.map(clue => {
    const numberBoxes = clue.numbers.map(num => '<div class="number-box">' + num + '</div>').join('');
    return '<div class="clue-row"><div class="number-boxes">' + numberBoxes + '</div><div class="clue-text">' + clue.hint + '</div></div>';
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Crack the Code - Cloudflare Booth Puzzle</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Arial', sans-serif;
            background: linear-gradient(135deg, #ff6b35, #f7931e);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 20px;
            overflow-y: auto;
        }

        .puzzle-container {
            background: white;
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            max-width: 500px;
            width: 100%;
            text-align: center;
            margin: 10px 0;
            min-height: fit-content;
        }

        /* 9:16 Portrait Layout (Default) - Optimized for 1080p and 4K */
        @media screen and (orientation: portrait) {
            body {
                padding: 1vh 2vw;
            }
            
            .puzzle-container {
                max-width: 96vw;
                width: 100%;
                padding: 1.5vh 3vw;
                margin: 0;
                max-height: 98vh;
                overflow-y: auto;
            }
            
            .header {
                margin-bottom: 1.5vh;
                padding: 1.5vh;
            }
            
            .header h1 {
                font-size: clamp(1.2rem, 3vw, 1.6rem);
                margin-bottom: 0.3vh;
                line-height: 1.1;
            }
            
            .header .subtitle {
                font-size: clamp(1.8rem, 5vw, 2.4rem);
                font-weight: bold;
                margin-top: 0.5vh;
            }
            
            .clue-row {
                margin: 2vh 0;
                padding: 3vh 2vw;
                flex-direction: row;
                text-align: left;
                align-items: center;
                min-height: 10vh;
            }
            
            .number-boxes {
                margin-right: 3vw;
                margin-bottom: 0;
                justify-content: flex-start;
                flex-shrink: 0;
            }
            
            .number-box {
                width: clamp(60px, 12vw, 80px);
                height: clamp(60px, 12vw, 80px);
                font-size: clamp(1.8rem, 5vw, 2.8rem);
            }
            
            .clue-text {
                text-align: left;
                font-size: clamp(1.8rem, 5.2vw, 2.6rem);
                flex: 1;
                line-height: 1.2;
                font-weight: 500;
            }
            
            .solution-section {
                margin: 1.5vh 0;
                padding: 1.5vh;
            }
            
            .solution-box {
                width: clamp(55px, 14vw, 80px);
                height: clamp(55px, 14vw, 80px);
                font-size: clamp(2rem, 6vw, 3.2rem);
            }
            
            .qr-section {
                margin-top: 1.5vh;
                padding: 1.5vh;
            }
            
            .qr-section h3 {
                font-size: clamp(1rem, 3vw, 1.3rem);
                margin-bottom: 1vh;
            }
            
            .qr-code {
                width: clamp(160px, 32vw, 220px);
                height: clamp(160px, 32vw, 220px);
                margin: 1vh auto;
            }
            
            .qr-section p {
                font-size: clamp(0.9rem, 2.5vw, 1.1rem);
                margin-top: 1vh;
            }
            
            .footer {
                margin-top: 2vh;
                padding: 2.5vh 2vw;
                font-size: clamp(1.2rem, 3vw, 1.6rem);
                min-height: 8vh;
            }
            
            .footer img {
                height: clamp(35px, 8vw, 55px);
            }
        }

        /* 16:9 Landscape Layout - Desktop/Laptop browsers */
        @media screen and (orientation: landscape) and (min-aspect-ratio: 16/9) {
            body {
                padding: 20px;
                display: flex;
                justify-content: center;
                align-items: flex-start;
                min-height: 100vh;
            }
            
            .puzzle-container {
                display: grid;
                grid-template-columns: 1fr 350px;
                gap: 40px;
                max-width: 1400px;
                width: 100%;
                padding: 20px;
                align-items: start;
            }
            
            .puzzle-content {
                display: flex;
                flex-direction: column;
            }
            
            .header {
                padding: 25px;
                margin-bottom: 30px;
            }
            
            .header h1 {
                font-size: 1.8em;
                margin-bottom: 8px;
            }
            
            .header .subtitle {
                font-size: 2.6em;
            }
            
            .clue-row {
                margin: 20px 0;
                padding: 20px;
                min-height: 80px;
            }
            
            .number-box {
                width: 60px;
                height: 60px;
                font-size: 2em;
                margin: 6px;
            }
            
            .clue-text {
                font-size: 1.3em;
                line-height: 1.3;
            }
            
            .solution-section {
                padding: 25px;
                margin: 30px 0;
            }
            
            .solution-box {
                width: 70px;
                height: 70px;
                font-size: 2.4em;
            }
            
            .side-panel {
                display: flex;
                flex-direction: column;
                gap: 20px;
                position: sticky;
                top: 20px;
            }
            
            .qr-section {
                margin: 0;
                padding: 25px;
                background: white;
                border-radius: 15px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            
            .qr-section h3 {
                font-size: 1.2em;
                margin-bottom: 15px;
            }
            
            .qr-code {
                width: 200px;
                height: 200px;
            }
            
            .qr-section p {
                font-size: 0.95em;
                margin-top: 15px;
            }
            
            .footer {
                grid-column: 1 / -1;
                padding: 25px;
                margin-top: 30px;
                font-size: 1.3em;
            }
            
            .footer img {
                height: 40px;
            }
        }

        .header {
            background: linear-gradient(135deg, #ff6b35, #f7931e);
            color: white;
            padding: 15px;
            border-radius: 15px;
            margin-bottom: 20px;
            position: relative;
            overflow: hidden;
        }

        .header h1 {
            font-size: 1.8em;
            font-weight: bold;
            margin-bottom: 5px;
            line-height: 1.1;
        }

        .header .subtitle {
            font-size: 2.8em;
            opacity: 1;
            font-weight: bold;
            margin-top: 5px;
        }

        .clue-row {
            display: flex;
            align-items: center;
            margin: 25px 0;
            padding: 20px 15px;
            border-radius: 10px;
            background: #f8f9fa;
            min-height: 90px;
        }

        .clue-row:nth-child(1) { border-left: 5px solid #6c5ce7; }
        .clue-row:nth-child(2) { border-left: 5px solid #a29bfe; }
        .clue-row:nth-child(3) { border-left: 5px solid #00b894; }
        .clue-row:nth-child(4) { border-left: 5px solid #00cec9; }
        .clue-row:nth-child(5) { border-left: 5px solid #e17055; }

        .number-boxes {
            display: flex;
            gap: 10px;
            margin-right: 20px;
        }

        .number-box {
            width: 70px;
            height: 70px;
            background: white;
            color: #2d3436;
            font-size: 2.2em;
            font-weight: bold;
            margin: 8px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid #ddd;
        }

        .clue-row:nth-child(1) .number-box { color: #6c5ce7; border-color: #6c5ce7; }
        .clue-row:nth-child(2) .number-box { color: #a29bfe; border-color: #a29bfe; }
        .clue-row:nth-child(3) .number-box { color: #00b894; border-color: #00b894; }
        .clue-row:nth-child(4) .number-box { color: #00cec9; border-color: #00cec9; }
        .clue-row:nth-child(5) .number-box { color: #e17055; border-color: #e17055; }

        .clue-text {
            flex: 1;
            text-align: left;
            font-size: 1.4em;
            color: #2d3436;
            font-weight: 500;
            line-height: 1.2;
        }

        .solution-section {
            margin: 20px 0;
            padding: 15px;
            background: linear-gradient(135deg, #ff6b35, #f7931e);
            border-radius: 15px;
            color: white;
        }

        .solution-boxes {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin: 20px 0;
        }

        .solution-box {
            width: 80px;
            height: 80px;
            background: rgba(255,255,255,0.2);
            border: 3px solid white;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 3em;
            font-weight: bold;
            color: white;
        }

        .qr-section {
            margin-top: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 10px;
            border: 2px dashed #ddd;
        }

        .qr-code {
            width: 200px;
            height: 200px;
            margin: 20px auto;
            background: white;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid #ddd;
        }

        .footer {
            background: linear-gradient(135deg, #ff6b35, #f7931e);
            color: white;
            padding: 25px 20px;
            border-radius: 15px;
            margin-top: 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 1.4em;
            font-weight: bold;
            min-height: 60px;
        }

        .footer img {
            height: 45px;
            width: auto;
        }
    </style>
</head>
<body>
    <div class="puzzle-container">
        <div class="puzzle-content">
            <div class="header">
                <h1>Crack the code to</h1>
                <div class="subtitle">Hack the prize!</div>
            </div>

            ${clueRows}

            <div class="solution-section">
                <div class="solution-boxes">
                    <div class="solution-box">?</div>
                    <div class="solution-box">?</div>
                    <div class="solution-box">?</div>
                </div>
            </div>
        </div>

        <div class="side-panel">
            <div class="qr-section">
                <h3>Scan to Submit Your Answer</h3>
                <div class="qr-code">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url.origin + '/submit?conference=' + conferenceId)}" alt="QR Code" />
                </div>
            </div>
        </div>

        <div class="footer">
            <span>#EverywhereSecurity</span>
            <img src="https://imagedelivery.net/LDaKen7vOKX42km4kZ-43A/21c30227-7801-44fe-6149-121c5044a100/thumbnail" alt="Cloudflare" />
        </div>
    </div>

    <script>
        const submitUrl = window.location.origin + '/submit?conference=${conferenceId}';
        console.log('Submit URL:', submitUrl);
        
        // Generate QR code using API service
        function generateQR() {
            console.log('Generating QR code using API service...');
            const qrImage = document.getElementById('qr-image');
            if (qrImage) {
                // Use QR Server API - reliable and fast
                const qrApiUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(submitUrl);
                qrImage.src = qrApiUrl;
                qrImage.onload = function() {
                    console.log('QR Code loaded successfully');
                };
                qrImage.onerror = function() {
                    console.error('QR Code API failed, showing fallback');
                    document.getElementById('qrcode').innerHTML = '<p>QR Code unavailable. <a href="' + submitUrl + '" target="_blank">Click here to submit</a></p>';
                };
            } else {
                console.error('QR image element not found');
            }
        }
        
        // Generate QR code immediately
        generateQR();
    </script>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' }
  });
}

async function handleAPI(request, env, corsHeaders) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  if (path === '/api/conferences' && method === 'GET') {
    const keys = await env.PUZZLE_KV.list({ prefix: 'conference:' });
    const conferences = [];
    
    for (const key of keys.keys) {
      const data = await env.PUZZLE_KV.get(key.name);
      if (data) {
        conferences.push(JSON.parse(data));
      }
    }
    
    return new Response(JSON.stringify(conferences), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (path === '/api/conferences' && method === 'POST') {
    try {
      const body = await request.json();
      const conferenceId = body.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/--+/g, '-');
      const puzzle = generatePuzzle();
      
      const conference = {
        id: conferenceId,
        name: body.name,
        puzzle,
        active: true,
        created: new Date().toISOString()
      };
      
      await env.PUZZLE_KV.put('conference:' + conferenceId, JSON.stringify(conference));
      
      return new Response(JSON.stringify(conference), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error creating conference:', error);
      return new Response('Error creating conference: ' + error.message, { 
        status: 500, 
        headers: corsHeaders 
      });
    }
  }

  if (path.match(/^\/api\/conferences\/([^\/]+)\/reshuffle$/) && method === 'POST') {
    const conferenceId = path.match(/^\/api\/conferences\/([^\/]+)\/reshuffle$/)[1];
    const conference = await env.PUZZLE_KV.get('conference:' + conferenceId);
    
    if (!conference) {
      return new Response('Conference not found', { status: 404, headers: corsHeaders });
    }
    
    const conferenceData = JSON.parse(conference);
    conferenceData.puzzle = generatePuzzle();
    
    await env.PUZZLE_KV.put('conference:' + conferenceId, JSON.stringify(conferenceData));
    
    return new Response(JSON.stringify(conferenceData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (path.match(/^\/api\/conferences\/([^\/]+)\/finish$/) && method === 'POST') {
    const conferenceId = path.match(/^\/api\/conferences\/([^\/]+)\/finish$/)[1];
    const conference = await env.PUZZLE_KV.get('conference:' + conferenceId);
    
    if (!conference) {
      return new Response('Conference not found', { status: 404, headers: corsHeaders });
    }
    
    const conferenceData = JSON.parse(conference);
    conferenceData.active = false;
    
    await env.PUZZLE_KV.put('conference:' + conferenceId, JSON.stringify(conferenceData));
    
    return new Response(JSON.stringify(conferenceData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (path === '/api/submit' && method === 'POST') {
    const body = await request.json();
    const { conferenceId, answer, name, email, turnstileToken } = body;
    
    // Verify Turnstile token
    if (!turnstileToken) {
      return new Response('Turnstile verification required', { status: 400, headers: corsHeaders });
    }
    
    const turnstileResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: env.TURNSTILE_SECRET_KEY,
        response: turnstileToken
      })
    });
    
    const turnstileResult = await turnstileResponse.json();
    if (!turnstileResult.success) {
      return new Response('Turnstile verification failed', { status: 400, headers: corsHeaders });
    }
    
    const conference = await env.PUZZLE_KV.get('conference:' + conferenceId);
    if (!conference) {
      return new Response('Conference not found', { status: 404, headers: corsHeaders });
    }
    
    const conferenceData = JSON.parse(conference);
    if (!conferenceData.active) {
      return new Response('Contest has ended', { status: 400, headers: corsHeaders });
    }
    
    const isCorrect = JSON.stringify(answer) === JSON.stringify(conferenceData.puzzle.solution);
    
    const submission = {
      id: crypto.randomUUID(),
      conferenceId,
      answer,
      name,
      email,
      correct: isCorrect,
      timestamp: new Date().toISOString()
    };
    
    await env.PUZZLE_KV.put('submission:' + submission.id, JSON.stringify(submission));
    
    return new Response(JSON.stringify({ success: true, correct: isCorrect }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (path.match(/^\/api\/conferences\/([^\/]+)\/switch-to-winner$/) && method === 'POST') {
    const conferenceId = path.match(/^\/api\/conferences\/([^\/]+)\/switch-to-winner$/)[1];
    await env.PUZZLE_KV.put('display-mode:' + conferenceId, 'winner');
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (path.match(/^\/api\/conferences\/([^\/]+)\/switch-to-puzzle$/) && method === 'POST') {
    const conferenceId = path.match(/^\/api\/conferences\/([^\/]+)\/switch-to-puzzle$/)[1];
    await env.PUZZLE_KV.delete('display-mode:' + conferenceId);
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (path.match(/^\/api\/conferences\/([^\/]+)\/display-mode$/) && method === 'GET') {
    const conferenceId = path.match(/^\/api\/conferences\/([^\/]+)\/display-mode$/)[1];
    const mode = await env.PUZZLE_KV.get('display-mode:' + conferenceId);
    return new Response(JSON.stringify({ mode: mode || 'puzzle' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (path.match(/^\/api\/conferences\/([^\/]+)\/submission-count$/) && method === 'GET') {
    const conferenceId = path.match(/^\/api\/conferences\/([^\/]+)\/submission-count$/)[1];
    const keys = await env.PUZZLE_KV.list({ prefix: 'submission:' });
    let count = 0;
    
    for (const key of keys.keys) {
      const data = await env.PUZZLE_KV.get(key.name);
      if (data) {
        const submission = JSON.parse(data);
        if (submission.conferenceId === conferenceId) {
          count++;
        }
      }
    }
    
    return new Response(JSON.stringify({ count }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (path.match(/^\/api\/conferences\/([^\/]+)\/reopen$/) && method === 'POST') {
    const conferenceId = path.match(/^\/api\/conferences\/([^\/]+)\/reopen$/)[1];
    
    let conference = await env.PUZZLE_KV.get('conference:' + conferenceId);
    if (!conference) {
      return new Response('Conference not found', { status: 404, headers: corsHeaders });
    }
    
    conference = JSON.parse(conference);
    
    // Reopen the contest
    conference.active = true;
    conference.winner = null;
    delete conference.ended;
    conference.reopened = new Date().toISOString();
    
    await env.PUZZLE_KV.put('conference:' + conferenceId, JSON.stringify(conference));
    
    // Clear any display mode
    await env.PUZZLE_KV.delete('display-mode:' + conferenceId);
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (path === '/api/submissions' && method === 'GET') {
    const conferenceId = url.searchParams.get('conference');
    if (!conferenceId) {
      return new Response('Conference ID required', { status: 400, headers: corsHeaders });
    }

    const keys = await env.PUZZLE_KV.list({ prefix: 'submission:' });
    const submissions = [];
    
    for (const key of keys.keys) {
      const data = await env.PUZZLE_KV.get(key.name);
      if (data) {
        const submission = JSON.parse(data);
        if (submission.conferenceId === conferenceId) {
          submissions.push(submission);
        }
      }
    }
    
    submissions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    const html = `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<title>Submissions - ${conferenceId}</title>
<style>
  body { font-family: Arial, sans-serif; margin: 20px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
  th { background-color: #f2f2f2; }
  .correct { background-color: #d4edda; }
  .incorrect { background-color: #f8d7da; }
</style>
</head><body>
<h1>Submissions for ${conferenceId}</h1>
<table>
  <tr><th>Time</th><th>Name</th><th>Email</th><th>Answer</th><th>Correct</th></tr>
  ${submissions.map(sub => 
    `<tr class="${sub.correct ? 'correct' : 'incorrect'}">
      <td>${new Date(sub.timestamp).toLocaleString()}</td>
      <td>${sub.name}</td>
      <td>${sub.email}</td>
      <td>${sub.answer.join('')}</td>
      <td>${sub.correct ? '✅' : '❌'}</td>
    </tr>`
  ).join('')}
</table>
</body></html>`;
    
    return new Response(html, {
      headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  return new Response('API endpoint not found', { status: 404, headers: corsHeaders });
}

async function handleAdminUI(env) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cloudflare Booth Puzzle - Admin</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #2d3436, #636e72);
            min-height: 100vh;
            padding: 20px;
        }
        .admin-container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid #f1f2f6;
        }
        .header h1 {
            color: #2d3436;
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        .section {
            margin: 30px 0;
            padding: 25px;
            background: #f8f9fa;
            border-radius: 10px;
            border-left: 5px solid #ff6b35;
        }
        .section h2 {
            color: #2d3436;
            margin-bottom: 20px;
            font-size: 1.5em;
        }
        .form-group {
            margin: 15px 0;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
            color: #2d3436;
        }
        input, button {
            width: 100%;
            padding: 12px;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-size: 1em;
            margin-bottom: 10px;
        }
        button {
            background: linear-gradient(135deg, #ff6b35, #f7931e);
            color: white;
            border: none;
            cursor: pointer;
            font-weight: bold;
            transition: transform 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            line-height: 1.2;
        }
        button:hover {
            transform: translateY(-2px);
        }
        .btn-secondary {
            background: linear-gradient(135deg, #636e72, #2d3436);
        }
        .btn-danger {
            background: linear-gradient(135deg, #e17055, #d63031);
        }
        .conference-list {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        .conference-card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            border: 2px solid #ddd;
            position: relative;
        }
        .conference-card.active {
            border-color: #00b894;
            background: #f0fff4;
        }
        .conference-card.inactive {
            border-color: #e17055;
            background: #fff5f5;
        }
        .status-badge {
            position: absolute;
            top: 10px;
            right: 10px;
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 0.8em;
            font-weight: bold;
        }
        .status-active {
            background: #00b894;
            color: white;
        }
        .status-inactive {
            background: #e17055;
            color: white;
        }
        .button-group {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 15px;
        }
        .button-group button {
            flex: 1;
            min-width: 80px;
            font-size: 0.85em;
            padding: 8px 12px;
        }
        .current-puzzle {
            background: #e8f4f8;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
        }
        .solution-display {
            background: #ff6b35;
            color: white;
            padding: 10px;
            border-radius: 5px;
            text-align: center;
            font-weight: bold;
            font-size: 1.2em;
        }
    </style>
</head>
<body>
    <div class="admin-container">
        <div class="header">
            <h1>🔧 Cloudflare Booth Puzzle Admin</h1>
            <p>Manage conferences, puzzles, and winners</p>
        </div>

        <div class="section">
            <h2>Create New Conference</h2>
            <div class="form-group">
                <label for="newConferenceName">Conference Name:</label>
                <input type="text" id="newConferenceName" placeholder="e.g., RSA Conference 2024">
            </div>
            <button onclick="createConference()">+ Create Conference</button>
        </div>

        <div class="section">
            <h2>Active Conferences</h2>
            <div id="conferencesList" class="conference-list">
                Loading conferences...
            </div>
        </div>

        <div class="section">
            <h2>Conference History</h2>
            <div id="historyList" class="conference-list">
                Loading history...
            </div>
        </div>
    </div>

    <script>
        let conferences = [];

        async function loadConferences() {
            try {
                console.log('Loading conferences...');
                const response = await fetch('/api/conferences');
                console.log('Response status:', response.status);
                
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error('HTTP ' + response.status + ': ' + errorText);
                }
                
                conferences = await response.json();
                console.log('Loaded conferences:', conferences);
                await renderConferences();
            } catch (error) {
                console.error('Error loading conferences:', error);
                document.getElementById('conferencesList').innerHTML = '<p>Error loading conferences: ' + error.message + '</p>';
                document.getElementById('historyList').innerHTML = '<p>Error loading history: ' + error.message + '</p>';
            }
        }

        async function renderConferences() {
            const activeConferences = conferences.filter(conf => conf.active);
            const inactiveConferences = conferences.filter(conf => !conf.active);
            
            // Render active conferences
            const activeContainer = document.getElementById('conferencesList');
            if (activeConferences.length === 0) {
                activeContainer.innerHTML = '<p>No active conferences found. Create your first conference above.</p>';
            } else {
                const activeCards = await Promise.all(activeConferences.map(conf => renderConferenceCard(conf, true)));
                activeContainer.innerHTML = activeCards.join('');
            }
            
            // Render conference history
            const historyContainer = document.getElementById('historyList');
            if (inactiveConferences.length === 0) {
                historyContainer.innerHTML = '<p>No finished conferences yet.</p>';
            } else {
                // Sort inactive conferences by ended date (most recent first)
                const sortedInactiveConferences = inactiveConferences.sort((a, b) => {
                    const dateA = new Date(a.ended || a.created);
                    const dateB = new Date(b.ended || b.created);
                    return dateB - dateA; // Most recent first
                });
                const historyCards = await Promise.all(sortedInactiveConferences.map(conf => renderConferenceCard(conf, false)));
                historyContainer.innerHTML = historyCards.join('');
            }
        }

        async function renderConferenceCard(conf, isActive) {
            const clueItems = conf.puzzle.clues.map(clue => 
                '<div><strong>' + clue.numbers.join('') + '</strong><br><small>' + clue.hint + '</small></div>'
            ).join('');
            
            const winnerInfo = conf.winner ? 
                '<div style="background: #00b894; color: white; padding: 10px; border-radius: 5px; margin: 10px 0;">' +
                    '<strong>🏆 Winner: ' + conf.winner.name + '</strong><br>' +
                    '<small>' + conf.winner.email + '</small>' +
                '</div>' : '';
            
            // Get submission count for this conference by counting KV keys
            let submissionCount = 0;
            try {
                const response = await fetch('/api/conferences/' + conf.id + '/submission-count');
                if (response.ok) {
                    const data = await response.json();
                    submissionCount = data.count;
                }
            } catch (e) {
                // Ignore errors, default to 0
            }
            
            // Check current display mode for active conferences
            let displayMode = null;
            if (isActive) {
                try {
                    const response = await fetch('/api/conferences/' + conf.id + '/display-mode');
                    if (response.ok) {
                        const data = await response.json();
                        displayMode = data.mode;
                    }
                } catch (e) {
                    // Ignore errors, default to null
                }
            }
            
            return '<div class="conference-card ' + (conf.active ? 'active' : 'inactive') + '">' +
                '<div class="status-badge ' + (conf.active ? 'status-active' : 'status-inactive') + '">' +
                    (conf.active ? 'ACTIVE' : 'FINISHED') +
                '</div>' +
                '<h3>' + conf.name + '</h3>' +
                '<p><strong>ID:</strong> ' + conf.id + '</p>' +
                '<p><strong>Created:</strong> ' + new Date(conf.created).toLocaleDateString() + '</p>' +
                '<p><strong>Submissions:</strong> ' + submissionCount + '</p>' +
                (displayMode === 'winner' ? '<p><strong>Current View:</strong> Winner Wheel</p>' : '') +
                winnerInfo +
                '<div class="current-puzzle">' +
                    '<h4>Solution:</h4>' +
                    '<div class="solution-display">' +
                        conf.puzzle.solution.join(' - ') +
                    '</div>' +
                    '<div style="margin: 10px 0;">' + clueItems + '</div>' +
                '</div>' +
                '<div class="button-group">' +
                    '<button data-action="viewPuzzle" data-conference="' + conf.id + '" class="btn-secondary action-btn">View Puzzle</button>' +
                    (isActive ? 
                        '<button data-action="reshufflePuzzle" data-conference="' + conf.id + '" class="action-btn">Reshuffle</button>' +
                        '<button data-action="finishContest" data-conference="' + conf.id + '" class="btn-danger action-btn">Finish Contest</button>' +
                        (displayMode === 'winner' ? 
                            '<button data-action="switchToPuzzle" data-conference="' + conf.id + '" class="btn-secondary action-btn">Back to Puzzle Screen</button>' :
                            '<button data-action="switchToWinner" data-conference="' + conf.id + '" class="btn-secondary action-btn">Spin the Wheel!</button>'
                        )
                        :
                        '<button data-action="showWinnerWheel" data-conference="' + conf.id + '" class="btn-secondary action-btn">Winner Wheel</button>' +
                        '<button data-action="viewSubmissions" data-conference="' + conf.id + '" class="btn-secondary action-btn">View<br>Submissions</button>' +
                        '<button data-action="reopenContest" data-conference="' + conf.id + '" class="action-btn">Reopen Contest</button>'
                    ) +
                '</div>' +
            '</div>';
        }

        async function createConference() {
            const name = document.getElementById('newConferenceName').value.trim();
            if (!name) {
                alert('Please enter a conference name');
                return;
            }

            try {
                const response = await fetch('/api/conferences', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name })
                });

                if (response.ok) {
                    document.getElementById('newConferenceName').value = '';
                    loadConferences();
                    alert('Conference created successfully!');
                } else {
                    const errorText = await response.text();
                    console.error('Server error:', errorText);
                    alert('Error creating conference: ' + errorText);
                }
            } catch (error) {
                console.error('Error creating conference:', error);
                alert('Network error creating conference: ' + error.message);
            }
        }

        async function reshufflePuzzle(conferenceId) {
            if (!confirm('Are you sure you want to reshuffle this puzzle? This will generate a new solution.')) {
                return;
            }

            try {
                const response = await fetch('/api/conferences/' + conferenceId + '/reshuffle', {
                    method: 'POST'
                });

                if (response.ok) {
                    loadConferences();
                } else {
                    alert('Error reshuffling puzzle');
                }
            } catch (error) {
                console.error('Error reshuffling puzzle:', error);
                alert('Error reshuffling puzzle');
            }
        }

        async function finishContest(conferenceId) {
            if (!confirm('Are you sure you want to finish this contest? Attendees will no longer be able to submit answers.')) {
                return;
            }

            try {
                const response = await fetch('/api/conferences/' + conferenceId + '/finish', {
                    method: 'POST'
                });

                if (response.ok) {
                    loadConferences();
                } else {
                    alert('Error finishing contest');
                }
            } catch (error) {
                console.error('Error finishing contest:', error);
                alert('Error finishing contest');
            }
        }

        function viewPuzzle(conferenceId) {
            window.open('/puzzle?conference=' + conferenceId, '_blank');
        }

        function showWinnerWheel(conferenceId) {
            window.open('/winner?conference=' + conferenceId, '_blank');
        }

        function switchToWinner(conferenceId) {
            if (confirm('This will switch the puzzle display to the winner wheel. Continue?')) {
                // Store the switch state in KV
                fetch('/api/conferences/' + conferenceId + '/switch-to-winner', {
                    method: 'POST'
                }).then(() => {
                    alert('Puzzle display switched to winner wheel!');
                    location.reload(); // Refresh to update button states
                });
            }
        }

        function switchToPuzzle(conferenceId) {
            if (confirm('This will switch back to the puzzle display. Continue?')) {
                // Remove the switch state from KV
                fetch('/api/conferences/' + conferenceId + '/switch-to-puzzle', {
                    method: 'POST'
                }).then(() => {
                    alert('Display switched back to puzzle screen!');
                    location.reload(); // Refresh to update button states
                });
            }
        }

        function viewSubmissions(conferenceId) {
            window.open('/api/submissions?conference=' + conferenceId, '_blank');
        }

        function reopenContest(conferenceId) {
            if (confirm('This will reopen the contest and clear the winner. The contest will become active again. Continue?')) {
                fetch('/api/conferences/' + conferenceId + '/reopen', {
                    method: 'POST'
                }).then(response => {
                    if (response.ok) {
                        alert('Contest has been reopened successfully!');
                        location.reload(); // Refresh to update the UI
                    } else {
                        alert('Failed to reopen contest. Please try again.');
                    }
                }).catch(error => {
                    console.error('Error reopening contest:', error);
                    alert('Error reopening contest. Please try again.');
                });
            }
        }

        // Initialize the page with timeout to ensure DOM is ready
        console.log('Script loaded, document.readyState:', document.readyState);
        
        function initializePage() {
            console.log('Initializing page, calling loadConferences...');
            try {
                loadConferences();
            } catch (error) {
                console.error('Error in initializePage:', error);
                document.getElementById('conferencesList').innerHTML = 'Error loading conferences: ' + error.message;
                document.getElementById('historyList').innerHTML = 'Error loading history: ' + error.message;
            }
        }
        
        // Force immediate execution
        console.log('Forcing immediate execution...');
        initializePage();
        
        // Multiple approaches to ensure the function runs
        if (document.readyState === 'loading') {
            console.log('Adding DOMContentLoaded listener...');
            document.addEventListener('DOMContentLoaded', function() {
                console.log('DOMContentLoaded fired');
                initializePage();
            });
        } else {
            console.log('DOM already loaded, calling again...');
            setTimeout(initializePage, 50);
        }
        
        // Aggressive fallbacks
        setTimeout(function() {
            console.log('Timeout fallback 1 (100ms)');
            initializePage();
        }, 100);
        
        setTimeout(function() {
            console.log('Timeout fallback 2 (500ms)');
            initializePage();
        }, 500);
        
        setTimeout(function() {
            console.log('Timeout fallback 3 (1000ms)');
            initializePage();
        }, 1000);

        // Add event delegation for action buttons
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('action-btn')) {
                const action = e.target.getAttribute('data-action');
                const conferenceId = e.target.getAttribute('data-conference');
                
                console.log('Button clicked:', action, conferenceId);
                
                switch(action) {
                    case 'viewPuzzle':
                        viewPuzzle(conferenceId);
                        break;
                    case 'reshufflePuzzle':
                        reshufflePuzzle(conferenceId);
                        break;
                    case 'finishContest':
                        finishContest(conferenceId);
                        break;
                    case 'switchToWinner':
                        switchToWinner(conferenceId);
                        break;
                    case 'switchToPuzzle':
                        switchToPuzzle(conferenceId);
                        break;
                    case 'showWinnerWheel':
                        showWinnerWheel(conferenceId);
                        break;
                    case 'viewSubmissions':
                        viewSubmissions(conferenceId);
                        break;
                    case 'reopenContest':
                        reopenContest(conferenceId);
                        break;
                }
            }
        });
    </script>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' }
  });
}

async function handleSubmitForm(url, env) {
  const conferenceId = url.searchParams.get('conference') || 'default';
  
  const conference = await env.PUZZLE_KV.get('conference:' + conferenceId);
  if (!conference) {
    return new Response('Conference not found', { status: 404 });
  }

  const conferenceData = JSON.parse(conference);
  if (!conferenceData.active) {
    return new Response('Contest has ended', { status: 400 });
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Submit Your Answer - Cloudflare Booth</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #ff6b35, #f7931e);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .submit-container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            max-width: 500px;
            width: 100%;
            text-align: center;
        }

        .header {
            margin-bottom: 30px;
        }

        .header h1 {
            color: #2d3436;
            font-size: 2.2em;
            margin-bottom: 10px;
        }

        .header p {
            color: #636e72;
            font-size: 1.1em;
        }

        .form-group {
            margin: 20px 0;
            text-align: left;
        }

        label {
            display: block;
            margin-bottom: 8px;
            font-weight: bold;
            color: #2d3436;
        }

        input {
            width: 100%;
            padding: 15px;
            border: 2px solid #ddd;
            border-radius: 10px;
            font-size: 1.1em;
            transition: border-color 0.3s;
        }

        input:focus {
            outline: none;
            border-color: #ff6b35;
        }

        .answer-inputs {
            display: flex;
            gap: 15px;
            justify-content: center;
        }

        .answer-input {
            width: 80px;
            height: 80px;
            text-align: center;
            font-size: 2em;
            font-weight: bold;
            border: 3px solid #ff6b35;
        }

        .submit-btn {
            background: linear-gradient(135deg, #ff6b35, #f7931e);
            color: white;
            border: none;
            padding: 15px 40px;
            border-radius: 25px;
            font-size: 1.2em;
            font-weight: bold;
            cursor: pointer;
            transition: transform 0.2s;
            margin-top: 20px;
        }

        .submit-btn:hover {
            transform: translateY(-2px);
        }

        .success-message {
            background: #00b894;
            color: white;
            padding: 20px;
            border-radius: 10px;
            margin-top: 20px;
            display: none;
        }

        .error-message {
            background: #e17055;
            color: white;
            padding: 20px;
            border-radius: 10px;
            margin-top: 20px;
            display: none;
        }
    </style>
</head>
<body>
    <div class="submit-container">
        <div class="header">
            <h1>🎯 Submit Your Answer</h1>
            <p>Enter your solution to the puzzle and your details to enter the raffle!</p>
        </div>

        <form id="submitForm">
            <div class="form-group">
                <label>Your Answer (3 digits):</label>
                <div class="answer-inputs">
                    <input type="number" class="answer-input" min="0" max="9" maxlength="1" id="digit1" required>
                    <input type="number" class="answer-input" min="0" max="9" maxlength="1" id="digit2" required>
                    <input type="number" class="answer-input" min="0" max="9" maxlength="1" id="digit3" required>
                </div>
            </div>

            <div class="form-group">
                <label for="name">Your Name:</label>
                <input type="text" id="name" required placeholder="Enter your full name">
            </div>

            <div class="form-group">
                <label for="email">Your Email:</label>
                <input type="email" id="email" required placeholder="Enter your email address">
            </div>

            <div class="form-group" style="display: flex; justify-content: center;">
                <div class="cf-turnstile" data-sitekey="${env.TURNSTILE_SITE_KEY}" data-callback="onTurnstileSuccess"></div>
            </div>

            <button type="submit" class="submit-btn" id="submitBtn" disabled>🚀 Submit Answer</button>
        </form>

        <div id="successMessage" class="success-message">
            <h3>✅ Submission Successful!</h3>
            <p>Your answer has been recorded. Good luck in the raffle!</p>
        </div>

        <div id="errorMessage" class="error-message">
            <h3>❌ Submission Failed</h3>
            <p id="errorText">Please try again.</p>
        </div>
    </div>

    <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
    <script>
        let turnstileToken = null;

        // Turnstile callback function
        function onTurnstileSuccess(token) {
            turnstileToken = token;
            document.getElementById('submitBtn').disabled = false;
            document.getElementById('submitBtn').style.opacity = '1';
        }

        // Initially disable submit button
        document.getElementById('submitBtn').style.opacity = '0.5';

        document.querySelectorAll('.answer-input').forEach((input, index) => {
            input.addEventListener('input', function() {
                if (this.value.length === 1 && index < 2) {
                    document.querySelectorAll('.answer-input')[index + 1].focus();
                }
            });
        });

        document.getElementById('submitForm').addEventListener('submit', async function(e) {
            e.preventDefault();

            const digit1 = document.getElementById('digit1').value;
            const digit2 = document.getElementById('digit2').value;
            const digit3 = document.getElementById('digit3').value;
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;

            if (!digit1 || !digit2 || !digit3 || !name || !email) {
                showError('Please fill in all fields');
                return;
            }

            if (!turnstileToken) {
                showError('Please complete the security verification');
                return;
            }

            const answer = [parseInt(digit1), parseInt(digit2), parseInt(digit3)];

            try {
                const response = await fetch('/api/submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        conferenceId: '${conferenceId}',
                        answer,
                        name,
                        email,
                        turnstileToken
                    })
                });

                if (response.ok) {
                    showSuccess();
                    document.getElementById('submitForm').style.display = 'none';
                } else {
                    const error = await response.text();
                    showError(error);
                }
            } catch (error) {
                console.error('Submission error:', error);
                showError('Network error. Please try again.');
            }
        });

        function showSuccess() {
            document.getElementById('successMessage').style.display = 'block';
            document.getElementById('errorMessage').style.display = 'none';
        }

        function showError(message) {
            document.getElementById('errorText').textContent = message;
            document.getElementById('errorMessage').style.display = 'block';
            document.getElementById('successMessage').style.display = 'none';
        }
    </script>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' }
  });
}

async function handleWinnerWheel(url, env) {
  const conferenceId = url.searchParams.get('conference') || 'default';
  
  const conference = await env.PUZZLE_KV.get('conference:' + conferenceId);
  if (!conference) {
    return new Response('Conference not found', { status: 404 });
  }

  const conferenceData = JSON.parse(conference);
  
  // Get correct submissions
  const keys = await env.PUZZLE_KV.list({ prefix: 'submission:' });
  const correctSubmissions = [];
  
  for (const key of keys.keys) {
    const data = await env.PUZZLE_KV.get(key.name);
    if (data) {
      const submission = JSON.parse(data);
      if (submission.conferenceId === conferenceId && submission.correct) {
        correctSubmissions.push(submission);
      }
    }
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Winner Selection - ${conferenceData.name}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #2d3436, #636e72);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        /* 9:16 Portrait Layout (Default) */
        @media screen and (orientation: portrait) {
            .wheel-container {
                max-width: 90vw;
                padding: 20px;
            }
            
            .wheel {
                width: 300px;
                height: 300px;
            }
            
            .header h1 {
                font-size: 2em;
            }
            
            .spin-btn {
                padding: 12px 30px;
                font-size: 1em;
            }
        }

        /* 16:9 Landscape Layout */
        @media screen and (orientation: landscape) and (min-aspect-ratio: 16/9) {
            .wheel-container {
                max-width: 90vw;
                display: flex;
                flex-direction: row;
                gap: 40px;
                align-items: center;
            }
            
            .wheel-section {
                flex: 1;
            }
            
            .info-section {
                flex: 1;
                text-align: left;
            }
        }

        .wheel-container {
            background: white;
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            max-width: 700px;
            width: 100%;
            text-align: center;
        }

        .header {
            margin-bottom: 30px;
        }

        .header h1 {
            color: #2d3436;
            font-size: 2.5em;
            margin-bottom: 10px;
        }

        .wheel {
            width: 350px;
            height: 350px;
            border-radius: 50%;
            border: 8px solid #ff6b35;
            margin: 20px auto;
            position: relative;
            transition: transform 3s cubic-bezier(0.25, 0.1, 0.25, 1);
        }

        .wheel-segment {
            position: absolute;
            width: 50%;
            height: 50%;
            transform-origin: 100% 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: white;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
        }

        .wheel-pointer {
            position: absolute;
            top: -20px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 20px solid transparent;
            border-right: 20px solid transparent;
            border-top: 40px solid #ff6b35;
            z-index: 10;
        }

        .spin-btn {
            background: linear-gradient(135deg, #ff6b35, #f7931e);
            color: white;
            border: none;
            padding: 20px 40px;
            border-radius: 25px;
            font-size: 1.5em;
            font-weight: bold;
            cursor: pointer;
            transition: transform 0.2s;
            margin: 20px;
        }

        .spin-btn:hover {
            transform: translateY(-2px);
        }

        .spin-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .winner-display {
            background: linear-gradient(135deg, #00b894, #00cec9);
            color: white;
            padding: 30px;
            border-radius: 15px;
            margin: 30px 0;
            font-size: 2em;
            font-weight: bold;
            display: none;
        }

        .end-contest-btn {
            background: linear-gradient(135deg, #e17055, #d63031);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 25px;
            font-size: 1.2em;
            font-weight: bold;
            cursor: pointer;
            transition: transform 0.2s;
            margin: 20px;
            display: none;
        }

        .end-contest-btn:hover {
            transform: translateY(-2px);
        }

        .participants {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
        }

        .participants h3 {
            color: #2d3436;
            margin-bottom: 15px;
        }

        .participant-list {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 10px;
        }

        .participant {
            background: white;
            padding: 10px;
            border-radius: 5px;
            border-left: 3px solid #ff6b35;
        }
    </style>
</head>
<body>
    <div class="wheel-container">
        <div class="wheel-section">
            <div class="header">
                <h1>🎉 Winner Selection</h1>
                <p>${conferenceData.name}</p>
            </div>

            ${correctSubmissions.length > 0 ? `
                <div class="wheel-pointer"></div>
                <div class="wheel" id="wheel">
                    <!-- Wheel segments will be generated by JavaScript -->
                </div>

                <button class="spin-btn" id="spinBtn" onclick="spinWheel()">🎲 SPIN THE WHEEL!</button>

                <div class="winner-display" id="winnerDisplay">
                    <div id="winnerText"></div>
                </div>

                <button class="end-contest-btn" id="endContestBtn" onclick="endContest()">🏆 END CONTEST & SAVE WINNER</button>
            ` : `
                <div style="background: #e17055; color: white; padding: 30px; border-radius: 15px; margin: 30px 0;">
                    <h3>No Correct Submissions Yet</h3>
                    <p>Wait for attendees to solve the puzzle correctly before selecting a winner.</p>
                </div>
            `}
        </div>

        <div class="info-section">
            <div class="participants">
                <h3>Correct Submissions (${correctSubmissions.length})</h3>
                <div class="participant-list">
                    ${correctSubmissions.map(sub => 
                        '<div class="participant"><strong>' + sub.name + '</strong><br><small>' + sub.email + '</small></div>'
                    ).join('')}
                </div>
            </div>
        </div>
    </div>

    <script>
        const participants = ${JSON.stringify(correctSubmissions)};
        let isSpinning = false;

        function createWheel() {
            if (participants.length === 0) return;

            const wheel = document.getElementById('wheel');
            const segmentAngle = 360 / participants.length;
            const colors = ['#ff6b35', '#f7931e', '#00b894', '#00cec9', '#6c5ce7', '#a29bfe', '#e17055', '#fd79a8'];

            participants.forEach((participant, index) => {
                const segment = document.createElement('div');
                segment.className = 'wheel-segment';
                segment.style.backgroundColor = colors[index % colors.length];
                segment.style.transform = 'rotate(' + (index * segmentAngle) + 'deg) skewY(' + (90 - segmentAngle) + 'deg)';
                segment.innerHTML = '<span style="transform: skewY(' + (segmentAngle - 90) + 'deg) rotate(' + (segmentAngle / 2) + 'deg);">' + participant.name.split(' ')[0] + '</span>';
                wheel.appendChild(segment);
            });
        }

        let selectedWinner = null;

        function spinWheel() {
            if (isSpinning || participants.length === 0) return;

            isSpinning = true;
            document.getElementById('spinBtn').disabled = true;
            document.getElementById('winnerDisplay').style.display = 'none';
            document.getElementById('endContestBtn').style.display = 'none';

            const wheel = document.getElementById('wheel');
            const spins = 5 + Math.random() * 5; // 5-10 full rotations
            const finalAngle = Math.random() * 360;
            const totalRotation = spins * 360 + finalAngle;

            wheel.style.transform = 'rotate(' + totalRotation + 'deg)';

            setTimeout(() => {
                const segmentAngle = 360 / participants.length;
                const winnerIndex = Math.floor(((360 - (finalAngle % 360)) / segmentAngle)) % participants.length;
                const winner = participants[winnerIndex];
                selectedWinner = winner;

                document.getElementById('winnerText').innerHTML = 
                    '🏆 WINNER: ' + winner.name + '<br><small>' + winner.email + '</small>';
                document.getElementById('winnerDisplay').style.display = 'block';
                document.getElementById('endContestBtn').style.display = 'inline-block';

                isSpinning = false;
                document.getElementById('spinBtn').disabled = false;
                document.getElementById('spinBtn').textContent = '🎲 SPIN AGAIN!';
            }, 3000);
        }

        async function endContest() {
            if (!selectedWinner) {
                alert('Please spin the wheel first to select a winner!');
                return;
            }

            if (!confirm('Are you sure you want to end this contest and save ' + selectedWinner.name + ' as the winner?')) {
                return;
            }

            try {
                const response = await fetch('/api/end-contest', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        conferenceId: '${conferenceId}',
                        winner: selectedWinner
                    })
                });

                if (response.ok) {
                    alert('Contest ended successfully! ' + selectedWinner.name + ' has been saved as the winner.');
                    window.location.href = '/admin';
                } else {
                    alert('Error ending contest. Please try again.');
                }
            } catch (error) {
                alert('Error ending contest. Please try again.');
            }
        }

        // Initialize wheel on page load
        if (participants.length > 0) {
            createWheel();
        }
    </script>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' }
  });
}

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
