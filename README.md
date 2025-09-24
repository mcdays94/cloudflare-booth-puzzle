# Cloudflare Booth Puzzle System

> **⚠️ Vibe Coding Experiment Disclaimer**  
> This project is a vibe coding experiment - built for fun, exploration, and learning. The code, architecture, documentation (including this README), and features were developed in an experimental, iterative manner. While functional, this should be considered a proof-of-concept rather than production-ready enterprise software. Use at your own discretion! 🚀

A comprehensive Cloudflare Workers application for managing interactive puzzles at cybersecurity conferences. This system replaces traditional cardboard puzzles with a digital solution that includes puzzle display, attendee submission, and winner selection.

## Features

### 🧩 Puzzle Display
- Beautiful, responsive puzzle interface matching Cloudflare branding
- QR code generation for easy mobile access
- Real-time puzzle updates and reshuffling
- Supports multiple conferences simultaneously

### 👨‍💼 Admin Interface
- Conference management (create, activate, finish)
- Puzzle reshuffling with new solutions
- Real-time monitoring of submissions
- Winner wheel for raffle selection

### 📱 Mobile Submission
- Mobile-optimized submission form
- Auto-advancing digit inputs
- Real-time validation and feedback
- Secure data storage in Cloudflare KV

### 🎡 Winner Selection
- Animated spinning wheel interface
- Automatic filtering of correct submissions
- Visual participant display
- Randomized winner selection

## Architecture

- **Frontend**: Vanilla HTML/CSS/JavaScript with modern responsive design
- **Backend**: Cloudflare Workers with KV storage
- **Puzzle Logic**: Hardcoded algorithm generating valid number sequence puzzles
- **Storage**: Cloudflare KV for conferences, submissions, and state management

## Setup Instructions

### Prerequisites
- Node.js and npm installed
- Cloudflare account with Workers enabled
- Wrangler CLI installed (`npm install -g wrangler`)

### 1. Clone and Setup
```bash
git clone <your-repo>
cd cloudflare-booth-puzzle
npm install -g wrangler
```

### 2. Configure Cloudflare KV
```bash
# Create KV namespace for production
wrangler kv:namespace create "PUZZLE_KV"

# Create KV namespace for preview/development
wrangler kv:namespace create "PUZZLE_KV" --preview
```

### 3. Update wrangler.toml
Replace the KV namespace IDs in `wrangler.toml` with your actual namespace IDs:

```toml
[[kv_namespaces]]
binding = "PUZZLE_KV"
id = "your_production_kv_namespace_id"
preview_id = "your_preview_kv_namespace_id"
```

### 4. Deploy
```bash
# Deploy to production
wrangler deploy

# Or deploy to preview
wrangler dev
```

## Usage Guide

### For Conference Setup
1. Access the admin interface at `https://your-worker.your-subdomain.workers.dev/admin`
2. Create a new conference with a descriptive name
3. Note the conference ID generated
4. Display the puzzle on your booth monitor: `https://your-worker.your-subdomain.workers.dev/puzzle?conference=your-conference-id`

### For Attendees
1. Scan the QR code displayed on the puzzle screen
2. Enter the 3-digit solution
3. Provide name and email for raffle entry
4. Submit and receive confirmation

### For Prize Drawing
1. In the admin interface, click "Finish Contest" to stop new submissions
2. Click "Winner Wheel" to open the selection interface
3. Click "SPIN THE WHEEL!" to randomly select a winner
4. The winner's name and email will be displayed

## API Endpoints

### Public Endpoints
- `GET /` - Puzzle display (default conference)
- `GET /puzzle?conference=ID` - Puzzle display for specific conference
- `GET /submit?conference=ID` - Submission form for specific conference
- `GET /winner?conference=ID` - Winner wheel for specific conference

### Admin Endpoints
- `GET /admin` - Admin interface
- `GET /api/conferences` - List all conferences
- `POST /api/conferences` - Create new conference
- `POST /api/conferences/{id}/reshuffle` - Generate new puzzle
- `POST /api/conferences/{id}/finish` - End contest
- `POST /api/submit` - Submit puzzle answer

## Puzzle Logic

The system generates number sequence puzzles with the following clue types:
1. **All correct, one correctly placed**: All digits are in the solution but only one is in the right position
2. **Two correct, wrongly placed**: Two digits are in the solution but both are in wrong positions
3. **One correct, well placed**: One digit is correct and in the right position
4. **One correct, wrongly placed**: One digit is in the solution but in the wrong position

Each puzzle has a unique 3-digit solution that can be determined by analyzing all clues.

## Data Storage

### Conference Data Structure
```json
{
  "id": "conference-id",
  "name": "Conference Name",
  "puzzle": {
    "solution": [1, 2, 3],
    "clues": [
      {
        "numbers": [5, 7, 9],
        "hint": "All are correct but only one is placed correctly"
      }
    ]
  },
  "active": true,
  "created": "2024-01-01T00:00:00.000Z"
}
```

### Submission Data Structure
```json
{
  "id": "submission-uuid",
  "conferenceId": "conference-id",
  "answer": [1, 2, 3],
  "name": "Attendee Name",
  "email": "attendee@example.com",
  "correct": true,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Security Considerations

- No authentication required for puzzle viewing (public display)
- Admin interface has no built-in authentication (add Cloudflare Access if needed)
- All submissions are stored with timestamps for audit trails
- CORS enabled for API endpoints
- Input validation on all form submissions

## Customization

### Styling
- Modify CSS variables in the HTML templates to match your branding
- Update colors, fonts, and layout in the embedded styles
- Replace Cloudflare logo and branding as needed

### Puzzle Generation
- Modify the `generatePuzzle()` function to change puzzle complexity
- Add new clue types or modify existing hint text
- Integrate with Workers AI for dynamic puzzle generation

### Features
- Add email notifications for winners
- Integrate with external CRM systems
- Add analytics and reporting
- Implement multi-language support

## Troubleshooting

### Common Issues
1. **KV Namespace Errors**: Ensure KV namespace IDs are correctly configured
2. **CORS Issues**: Check that CORS headers are properly set for your domain
3. **QR Code Not Loading**: Verify the QR code library CDN is accessible
4. **Puzzle Not Generating**: Check browser console for JavaScript errors

### Debugging
- Use `wrangler tail` to view real-time logs
- Check the Cloudflare dashboard for error rates and performance metrics
- Use browser developer tools to debug frontend issues

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License. See LICENSE file for details.

## Support

For issues and questions:
- Check the troubleshooting section above
- Review Cloudflare Workers documentation
- Open an issue in the repository
- Contact the development team

---

Built with ❤️ for the cybersecurity community using Cloudflare Workers.
