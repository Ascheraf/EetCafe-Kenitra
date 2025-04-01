const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Stripe = require('stripe');
const app = express();

// Configure Stripe
const stripe = Stripe('sk_test_51R8rYsQtcxXeIxZwnrHL24TFaznuWAEETiOhLtEzJzdj2KtGuDSkwPsWCFFbqyo4Qy9m7CNpfpOyUV4RzM0KBnay00Ycg4ThJt'); // Secret Key

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/eetcafe', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
// Voor MongoDB Atlas, gebruik de volgende URI:
// mongoose.connect('mongodb+srv://achraffarissi:Bromfiets60@eetcafekenitra.3slqeak.mongodb.net/?retryWrites=true&w=majority&appName=EetcafeKenitra', {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
// });

mongoose.connection.on('connected', () => console.log('Verbonden met MongoDB'));
mongoose.connection.on('error', err => console.error('MongoDB-verbinding mislukt:', err));

// Define Order Schema
const orderSchema = new mongoose.Schema({
    name: String,
    phone: String,
    address: String,
    items: Array,
    totalPrice: Number,
    paymentStatus: { type: String, default: 'pending' },
    createdAt: { type: Date, default: Date.now },
});

const Order = mongoose.model('Order', orderSchema);

app.use(bodyParser.json());

// API Endpoint: Nieuwe bestelling plaatsen
app.post('/api/order', async (req, res) => {
    try {
        const { name, phone, address, items, totalPrice, paymentIntentId } = req.body;

        // Verifieer betaling via Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        if (paymentIntent.status !== 'succeeded') {
            return res.status(400).json({ message: 'Betaling niet geslaagd.' });
        }

        // Sla bestelling op in de database
        const newOrder = new Order({ name, phone, address, items, totalPrice, paymentStatus: 'paid' });
        await newOrder.save();

        res.status(201).json({ message: 'Bestelling succesvol geplaatst!', orderId: newOrder._id });
    } catch (error) {
        console.error('Fout bij het plaatsen van bestelling:', error);
        res.status(500).json({ message: 'Er is een fout opgetreden.' });
    }
});

// API Endpoint: Betaling starten
app.post('/api/payment', async (req, res) => {
    try {
        const { amount } = req.body;

        // Maak een Stripe Payment Intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Bedrag in centen
            currency: 'eur',
            payment_method_types: ['card'],
        });

        res.status(201).json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        console.error('Fout bij het starten van betaling:', error);
        res.status(500).json({ message: 'Er is een fout opgetreden.' });
    }
});

app.listen(3000, () => {
    console.log('Server draait op http://localhost:3000');
});
