require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Stripe = require('stripe');
const http = require('http');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const winston = require('winston');
const webPush = require('web-push');
const cors = require('cors');
const compression = require('compression');
const { v4: uuidv4 } = require('uuid');

const app = express();
const appServer = http.createServer(app);
const io = new Server(appServer);
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Update Winston logger configuration to exclude the `query` property
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json({
            replacer: (key, value) => {
                try {
                    // Exclude the `query` property entirely
                    if (key === 'query') {
                        return undefined;
                    }
                    // Avoid modifying objects with getters or non-extensible objects
                    if (value && typeof value === 'object' && !Object.isExtensible(value)) {
                        return { ...value }; // Create a shallow copy to avoid issues
                    }
                    return value;
                } catch (error) {
                    return undefined; // Fallback in case of unexpected issues
                }
            },
        })
    ),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.Console({ format: winston.format.simple() })
    ]
});

// Configure Stripe
if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not set.');
}
const stripe = Stripe(process.env.STRIPE_SECRET_KEY); // Use environment variable

// Connect to MongoDB
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/eetcafe';
mongoose.connect(mongoUri, {
    // Removed useNewUrlParser and useUnifiedTopology as they are deprecated
});
mongoose.connection.on('connected', () => console.log('Verbonden met MongoDB'));
mongoose.connection.on('error', err => console.error('MongoDB-verbinding mislukt:', err));

// Define Order Schema
const orderSchema = new mongoose.Schema({
    name: String,
    phone: String,
    address: String,
    email: String,
    items: Array,
    totalPrice: Number,
    paymentStatus: { type: String, default: 'pending' },
    createdAt: { type: Date, default: Date.now },
    deliveryOption: { type: String, enum: ['delivery', 'pickup'], required: true },
});
const Order = mongoose.model('Order', orderSchema);

// Define Discount Schema
const discountSchema = new mongoose.Schema({
    code: String,
    discountPercentage: Number,
    expirationDate: Date,
    isActive: { type: Boolean, default: true },
});

const Discount = mongoose.model('Discount', discountSchema);

// Define Inventory Schema
const inventorySchema = new mongoose.Schema({
    itemName: String,
    stock: Number,
    price: Number,
});

const Inventory = mongoose.model('Inventory', inventorySchema);

// Define Feedback Schema
const feedbackSchema = new mongoose.Schema({
    name: String,
    email: String,
    rating: Number,
    comments: String,
    createdAt: { type: Date, default: Date.now },
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

// In-memory database (for simplicity)
const menu = [
    { id: '1', name: 'Kenitra Classic', price: 6.5 },
    { id: '2', name: 'Homestyle Crispy Chicken', price: 6.5 },
    { id: '3', name: 'Cheesy Deluxe', price: 7.5 },
    { id: '4', name: 'Bacon Lover', price: 8.5 },
    { id: '5', name: 'Bleu Royale', price: 8.5 },
    { id: '6', name: 'Double Trouble', price: 10.5 },
];
const orders = [];

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
app.use(compression()); // Compress all responses
app.use(xss());
app.use(mongoSanitize());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Static files with caching
app.use(express.static('public', {
    maxAge: '1d',
    setHeaders: (res, path) => {
        if (path.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache');
        }
    }
}));

// Validate items array
const validateItems = (items) => {
    if (!Array.isArray(items) || items.length === 0) {
        return false;
    }
    return items.every(item => item.name && item.price && item.quantity > 0);
};

// Configure VAPID keys
const vapidKeys = {
    publicKey: process.env.VAPID_PUBLIC_KEY,
    privateKey: process.env.VAPID_PRIVATE_KEY,
};
webPush.setVapidDetails('mailto:admin@eetcafekenitra.nl', vapidKeys.publicKey, vapidKeys.privateKey);

// In-memory storage for subscriptions (replace with a database in production)
const subscriptions = [];

// Wrap API endpoints with error logging
const wrapAsync = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
        logger.error({
            message: error.message,
            method: req.method,
            url: req.url,
            ip: req.ip,
        });
        console.error(`[DEBUG] Error in ${req.method} ${req.url}:`, error);
        next(error);
    });
};

// Routes
// Fetch menu items
app.get('/api/menu', wrapAsync(async (req, res) => {
    try {
        console.log('[DEBUG] Fetching menu items');
        res.status(200).json(menu);
    } catch (error) {
        logger.error({ message: error.message, method: req.method, url: req.url, ip: req.ip });
        res.status(500).json({ message: 'Failed to fetch menu items.' });
    }
}));

// Submit an order
app.post('/api/order', wrapAsync(async (req, res) => {
    try {
        console.log('[DEBUG] Incoming order request:', req.body);
        const { name, address, phone, items, total } = req.body;

        if (!name || !address || !phone || !items || !total) {
            return res.status(400).json({ message: 'Invalid order data' });
        }

        const newOrder = {
            id: uuidv4(),
            name,
            address,
            phone,
            items,
            total,
            status: 'Pending',
            createdAt: new Date(),
        };

        orders.push(newOrder);
        console.log('[DEBUG] Order successfully created:', newOrder);
        res.status(201).json({ message: 'Order placed successfully', orderId: newOrder.id });
    } catch (error) {
        logger.error({ message: error.message, method: req.method, url: req.url, ip: req.ip });
        res.status(500).json({ message: 'Failed to place order.' });
    }
}));

// API Endpoint: Nieuwe bestelling plaatsen
app.post('/api/order', wrapAsync(async (req, res) => {
    console.log('[DEBUG] Incoming order request:', req.body);
    const { name, phone, address, email, items, totalPrice, paymentIntentId, discountCode, deliveryOption } = req.body;

    // Validate required fields
    if (!name || !phone || !email || !items || !totalPrice || !paymentIntentId || !deliveryOption) {
        return res.status(400).json({ message: 'Alle velden zijn verplicht.' });
    }

    if (deliveryOption === 'delivery' && !address) {
        return res.status(400).json({ message: 'Adres is verplicht voor bezorging.' });
    }

    // Validate items array
    if (!validateItems(items)) {
        return res.status(400).json({ message: 'Ongeldige items in bestelling.' });
    }

    // Check inventory
    for (const item of items) {
        const inventoryItem = await Inventory.findOne({ itemName: item.name });
        if (!inventoryItem || inventoryItem.stock < item.quantity) {
            return res.status(400).json({ message: `Item ${item.name} is niet op voorraad.` });
        }
    }

    // Deduct stock
    for (const item of items) {
        await Inventory.updateOne(
            { itemName: item.name },
            { $inc: { stock: -item.quantity } }
        );
    }

    // Apply discount if provided
    let finalPrice = totalPrice;
    if (discountCode) {
        const discount = await Discount.findOne({ code: discountCode, isActive: true, expirationDate: { $gte: new Date() } });
        if (discount) {
            finalPrice = totalPrice - (totalPrice * discount.discountPercentage) / 100;
        }
    }

    // Verifieer betaling via Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ message: 'Betaling niet geslaagd.' });
    }

    // Sla bestelling op in de database
    const newOrder = new Order({
        name,
        phone,
        address: deliveryOption === 'pickup' ? null : address,
        email,
        items,
        totalPrice: finalPrice,
        paymentStatus: 'paid',
        deliveryOption,
    });
    await newOrder.save();

    console.log('[DEBUG] Order successfully created:', newOrder);
    res.status(201).json({ message: 'Bestelling succesvol geplaatst!', orderId: newOrder._id });
}));

// API Endpoint: Validate Discount Code
app.post('/api/validate-discount', wrapAsync(async (req, res) => {
    try {
        console.log('[DEBUG] Validating discount code:', req.body);
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ message: 'Discount code is required.' });
        }

        const discount = await Discount.findOne({ code, isActive: true, expirationDate: { $gte: new Date() } });

        if (!discount) {
            return res.status(404).json({ message: 'Invalid or expired discount code.' });
        }

        console.log('[DEBUG] Valid discount code:', discount);
        res.status(200).json({ discountPercentage: discount.discountPercentage });
    } catch (error) {
        logger.error({ message: error.message, method: req.method, url: req.url, ip: req.ip });
        res.status(500).json({ message: 'Failed to validate discount code.' });
    }
}));

// API Endpoint: Betaling starten
app.post('/api/payment', wrapAsync(async (req, res) => {
    console.log('[DEBUG] Incoming payment request:', req.body);
    const { amount } = req.body;

    // Validate amount
    if (!amount || amount <= 0) {
        return res.status(400).json({ message: 'Ongeldig bedrag.' });
    }

    // Maak een Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Bedrag in centen
        currency: 'eur',
        payment_method_types: ['card'],
    });

    console.log('[DEBUG] Payment intent created:', paymentIntent);
    res.status(201).json({ clientSecret: paymentIntent.client_secret });
}));

// API Endpoint: Haal ordergeschiedenis op
app.get('/api/orders', wrapAsync(async (req, res) => {
    console.log('[DEBUG] Fetching orders for userId:', req.query.userId);
    const { userId } = req.query; // Assume userId is passed in query params
    if (!userId) {
        return res.status(400).json({ message: 'Gebruikers-ID is verplicht.' });
    }

    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    console.log('[DEBUG] Orders retrieved:', orders);
    res.status(200).json(orders);
}));

// API Endpoint: Annuleer bestelling
app.post('/api/order/:id/cancel', wrapAsync(async (req, res) => {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) {
        return res.status(404).json({ message: 'Bestelling niet gevonden.' });
    }

    if (order.paymentStatus === 'paid') {
        return res.status(400).json({ message: 'Betaalde bestellingen kunnen niet worden geannuleerd.' });
    }

    order.paymentStatus = 'canceled';
    await order.save();

    console.log(`[DEBUG] Order canceled:`, order);
    notifyOrderStatus(order._id, 'canceled');
    res.status(200).json({ message: 'Bestelling geannuleerd.' });
}));

// API Endpoint: Admin dashboard - Bekijk alle bestellingen
app.get('/api/admin/orders', wrapAsync(async (req, res) => {
    const orders = await Order.find().sort({ createdAt: -1 });
    console.log(`[DEBUG] Retrieved all orders:`, orders);
    res.status(200).json(orders);
}));

// API Endpoint: Update Order Status
app.post('/api/admin/order/:id/status', wrapAsync(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ message: 'Status is verplicht.' });
    }

    const order = await Order.findById(id);

    if (!order) {
        return res.status(404).json({ message: 'Bestelling niet gevonden.' });
    }

    order.paymentStatus = status;
    await order.save();

    console.log(`[DEBUG] Order status updated:`, order);
    // Notify clients of the status update
    notifyOrderStatus(order._id, status);

    res.status(200).json({ message: 'Bestellingstatus bijgewerkt.' });
}));

// API Endpoint: Check Inventory
app.get('/api/inventory', wrapAsync(async (req, res) => {
    const inventory = await Inventory.find();
    console.log(`[DEBUG] Retrieved inventory:`, inventory);
    res.status(200).json(inventory);
}));

// API Endpoint: Submit Feedback
app.post('/api/feedback', wrapAsync(async (req, res) => {
    const { name, email, rating, comments } = req.body;

    if (!name || !email || !rating || !comments) {
        return res.status(400).json({ message: 'Alle velden zijn verplicht.' });
    }

    const newFeedback = new Feedback({ name, email, rating, comments });
    await newFeedback.save();

    console.log(`[DEBUG] Feedback submitted:`, newFeedback);
    res.status(201).json({ message: 'Feedback succesvol verzonden.' });
}));

// API Endpoint: Get Feedback (Admin Only)
app.get('/api/admin/feedback', wrapAsync(async (req, res) => {
    const feedback = await Feedback.find().sort({ createdAt: -1 });
    console.log(`[DEBUG] Retrieved feedback:`, feedback);
    res.status(200).json(feedback);
}));

// API Endpoint: Subscribe to Push Notifications
app.post('/api/subscribe', wrapAsync((req, res) => {
    const subscription = req.body;

    if (!subscription || !subscription.endpoint) {
        console.error('[DEBUG] Invalid push subscription data:', subscription);
        return res.status(400).json({ message: 'Ongeldige push-abonnementgegevens.' });
    }

    subscriptions.push(subscription);
    console.log('[DEBUG] Push subscription added successfully:', subscription);
    res.status(201).json({ message: 'Push-abonnement succesvol opgeslagen.' });
}));

// API Endpoint: Get Order by ID
app.get('/api/order/:id', wrapAsync(async (req, res) => {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) {
        return res.status(404).json({ message: 'Bestelling niet gevonden.' });
    }

    console.log(`[DEBUG] Retrieved order by ID ${id}:`, order);
    res.status(200).json(order);
}));

// Function to send push notifications
const sendPushNotification = (title, body, url) => {
    subscriptions.forEach((subscription) => {
        const payload = JSON.stringify({ title, body, url });
        webPush.sendNotification(subscription, payload).catch((error) => {
            console.error('Error sending push notification:', error);
        });
    });
};

// Example usage: Notify users of order updates
app.post('/api/notify-order-update', wrapAsync((req, res) => {
    const { orderId, status } = req.body;

    if (!orderId || !status) {
        return res.status(400).json({ message: 'Order ID and status are required.' });
    }

    const title = 'Bestelling Update';
    const body = `Uw bestelling #${orderId} is bijgewerkt naar status: ${status}.`;
    const url = '/order-history';

    console.log(`[DEBUG] Sending push notification for order update:`, { orderId, status });
    sendPushNotification(title, body, url);
    res.status(200).json({ message: 'Push notification sent.' });
}));

// WebSocket setup
io.on('connection', (socket) => {
    console.log('Een gebruiker is verbonden.');

    socket.on('disconnect', () => {
        console.log('Een gebruiker is losgekoppeld.');
    });
});

// Notify clients of order status updates
const notifyOrderStatus = (orderId, status) => {
    io.emit('orderStatusUpdate', { orderId, status });
};

// Middleware for logging errors
app.use((err, req, res, next) => {
    logger.error({
        message: err.message,
        method: req.method,
        url: req.url,
        ip: req.ip,
    });
    res.status(500).json({ message: 'Er is een fout opgetreden.' });
});

// Replace `app.listen` with conditional `appServer.listen`
if (process.env.NODE_ENV !== 'test') {
    appServer.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
} 

module.exports = { app, appServer }; // Export the app and server for testing