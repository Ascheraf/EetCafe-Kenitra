require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const xss = require('xss-clean');
const winston = require('winston');
const webPush = require('web-push');
const cors = require('cors');
const compression = require('compression');
const { v4: uuidv4 } = require('uuid');

const app = express();
const appServer = http.createServer(app);
const io = new Server(appServer);
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            imgSrc: ["'self'", 'data:', 'https:'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com'],
            connectSrc: ["'self'"],
        },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors());
app.use(compression()); // Compress all responses
app.use(bodyParser.json());
app.use(xss());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Static files with improved caching
app.use(express.static('public', {
    maxAge: '1y',
    setHeaders: (res, path) => {
        if (path.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache');
        } else if (path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg)$/)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
        }
    }
}));

// Cache external resources
app.get('/external-image/:source', async (req, res) => {
    try {
        const { source } = req.params;
        if (source === 'whatsapp') {
            res.setHeader('Cache-Control', 'public, max-age=31536000');
            res.redirect('https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg');
        } else {
            res.status(404).send('Image not found');
        }
    } catch (error) {
        res.status(500).send('Error fetching image');
    }
});

// In-memory storage for menu and orders
const menuItems = [
    {
        id: 'special1',
        name: 'Dagspecial 1',
        description: 'Wisselende dagspecial',
        price: 12.50,
        category: 'specials'
    },
    // Voeg hier meer menu items toe
];

const orders = [];

// API Endpoints
app.get('/api/menu', (req, res) => {
    res.json(menuItems);
});

app.post('/api/order', (req, res) => {
    const { items, customerInfo } = req.body;
    if (!items || !items.length || !customerInfo) {
        return res.status(400).json({ error: 'Invalid order data' });
    }

    const order = {
        id: uuidv4(),
        items,
        customerInfo,
        status: 'pending',
        createdAt: new Date()
    };

    orders.push(order);
    res.status(201).json(order);
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Start server
if (require.main === module) {
    appServer.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

module.exports = { app, appServer };