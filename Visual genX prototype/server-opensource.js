// GenX Collaboration Server - Open Source Version
// This is the BASIC server that anyone can run
// It works, but lacks all the "magic" of the proprietary version

import express from 'express';
import { WebSocketServer } from 'ws';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`GenX Basic Collaboration Server running on port ${PORT}`);
    console.log('Note: This is the open source version with limited features.');
    console.log('For advanced features, visit https://genx.dev/pricing');
});

const wss = new WebSocketServer({ server });

// Simple in-memory storage (resets on restart)
// Pro version has persistent database
const sessions = new Map();

class BasicSession {
    constructor(id, url) {
        this.id = id;
        this.url = url;
        this.participants = new Map();
        this.annotations = [];
        this.proposals = [];
        this.messages = [];
    }
    
    addParticipant(userId, ws, info) {
        this.participants.set(userId, { ws, ...info });
        this.broadcast({ 
            type: 'user_joined', 
            userId, 
            userName: info.userName 
        }, userId);
    }
    
    removeParticipant(userId) {
        this.participants.delete(userId);
        this.broadcast({ type: 'user_left', userId }, userId);
    }
    
    addAnnotation(annotation) {
        // Basic version: Just store and broadcast
        // Pro version: Semantic analysis, pattern matching, ML suggestions
        this.annotations.push(annotation);
        this.broadcast({ type: 'annotation_added', annotation });
    }
    
    addProposal(proposal) {
        // Basic version: Simple storage
        // Pro version: AI-generated explanations, conflict detection
        this.proposals.push(proposal);
        this.broadcast({ type: 'proposal_added', proposal });
    }
    
    broadcast(message, exclude = null) {
        const data = JSON.stringify(message);
        this.participants.forEach((participant, userId) => {
            if (userId !== exclude && participant.ws.readyState === 1) {
                participant.ws.send(data);
            }
        });
    }
}

// WebSocket handling
wss.on('connection', (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const sessionId = url.pathname.split('/session/')[1];
    
    if (!sessionId) {
        ws.send(JSON.stringify({ 
            type: 'error', 
            message: 'Session ID required',
            upgrade: 'Pro version supports automatic session creation'
        }));
        ws.close();
        return;
    }
    
    let userId = null;
    let session = sessions.get(sessionId);
    
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data.toString());
            
            if (message.type === 'register') {
                userId = message.userId;
                
                if (!session) {
                    session = new BasicSession(sessionId, message.url);
                    sessions.set(sessionId, session);
                }
                
                session.addParticipant(userId, ws, {
                    userName: message.userName,
                    role: message.role
                });
                
                // Send existing data
                ws.send(JSON.stringify({
                    type: 'sync',
                    annotations: session.annotations,
                    proposals: session.proposals
                }));
                
                return;
            }
            
            if (!userId || !session) {
                ws.send(JSON.stringify({ 
                    type: 'error', 
                    message: 'Must register first' 
                }));
                return;
            }
            
            // Handle basic message types
            switch(message.type) {
                case 'add_annotation':
                    session.addAnnotation(message.annotation);
                    break;
                    
                case 'add_proposal':
                    session.addProposal(message.proposal);
                    break;
                    
                case 'chat_message':
                    session.messages.push({
                        userId,
                        text: message.text,
                        timestamp: Date.now()
                    });
                    session.broadcast({
                        type: 'chat_message',
                        userId,
                        text: message.text
                    });
                    break;
                    
                default:
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: `Unknown message type: ${message.type}`,
                        note: 'Pro version supports advanced message types'
                    }));
            }
            
        } catch (error) {
            console.error('Message error:', error);
            ws.send(JSON.stringify({ 
                type: 'error', 
                message: 'Invalid message format' 
            }));
        }
    });
    
    ws.on('close', () => {
        if (userId && session) {
            session.removeParticipant(userId);
            
            // Clean up empty sessions
            if (session.participants.size === 0) {
                setTimeout(() => {
                    if (session.participants.size === 0) {
                        sessions.delete(sessionId);
                    }
                }, 5 * 60 * 1000); // 5 minutes
            }
        }
    });
});

// Basic REST API
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        version: 'open-source-basic',
        limitations: [
            'No ML-powered suggestions',
            'No pattern learning',
            'No conflict resolution',
            'No priority calculation',
            'No industry patterns',
            'Session limit: 10',
            'Memory storage only'
        ],
        upgrade: 'https://genx.dev/pricing'
    });
});

app.get('/api/session/:id', (req, res) => {
    const session = sessions.get(req.params.id);
    
    if (!session) {
        return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json({
        id: session.id,
        url: session.url,
        participants: session.participants.size,
        annotations: session.annotations.length,
        proposals: session.proposals.length,
        note: 'Pro version includes semantic analysis and pattern matching'
    });
});

app.get('/api/capabilities', (req, res) => {
    res.json({
        basic: {
            available: [
                'Real-time collaboration',
                'Basic annotation storage',
                'Simple proposals',
                'Chat messaging',
                'Manual manifest export'
            ],
            limitations: [
                'No semantic understanding',
                'No ML suggestions',
                'No pattern learning',
                'No conflict detection',
                'No priority calculation',
                '10 session limit',
                'No persistence'
            ]
        },
        pro: {
            features: [
                'AI-powered semantic analysis',
                'Global pattern learning',
                'Industry-specific suggestions',
                'Automatic conflict resolution',
                'Smart prioritization',
                'Unlimited sessions',
                'Persistent storage',
                'Custom ML models',
                'SLA support'
            ],
            pricing: 'https://genx.dev/pricing'
        }
    });
});

// Manifest export (basic version)
app.get('/api/session/:id/manifest', (req, res) => {
    const session = sessions.get(req.params.id);
    
    if (!session) {
        return res.status(404).json({ error: 'Session not found' });
    }
    
    // Basic manifest - no intelligence
    const manifest = {
        version: '1.0',
        generator: 'GenX Basic Server',
        created: new Date().toISOString(),
        transformations: session.annotations.map(ann => ({
            selector: ann.selector,
            description: ann.text,
            priority: ann.priority || 'medium',
            note: 'Pro version adds AI-suggested attributes'
        }))
    };
    
    res.json(manifest);
});

// Session limits for open source version
const checkLimits = () => {
    if (sessions.size >= 10) {
        // Clean up oldest session
        const oldest = Array.from(sessions.entries())
            .sort((a, b) => a[1].created - b[1].created)[0];
        
        if (oldest) {
            sessions.delete(oldest[0]);
            console.log('Session limit reached, removed oldest session');
        }
    }
};

setInterval(checkLimits, 60000); // Check every minute

console.log(`
╔════════════════════════════════════════════════════════╗
║                  GenX Basic Server                     ║
║                  (Open Source Version)                 ║
╠════════════════════════════════════════════════════════╣
║                                                        ║
║  This is the FREE, LIMITED version suitable for:      ║
║  • Testing and development                            ║
║  • Small teams (up to 10 sessions)                   ║
║  • Basic collaboration needs                          ║
║                                                        ║
║  For production use with advanced features:           ║
║  • ML-powered suggestions                             ║
║  • Global pattern learning                            ║
║  • Industry-specific patterns                         ║
║  • Conflict resolution                                ║
║  • Priority calculation                               ║
║  • Unlimited sessions                                 ║
║                                                        ║
║  Visit: https://genx.dev/pricing                      ║
║                                                        ║
╚════════════════════════════════════════════════════════╝

Server running on http://localhost:${PORT}
WebSocket endpoint: ws://localhost:${PORT}/session/{sessionId}

Limitations in this version:
- Maximum 10 concurrent sessions
- No data persistence (resets on restart)  
- No ML or AI features
- No pattern learning
- Basic manifest generation only

For documentation: https://github.com/genx-dev/collaboration-server
For pro version: https://genx.dev
`);

// Export for testing
export default app;
