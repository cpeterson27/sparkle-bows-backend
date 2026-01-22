const axios = require('axios');

const WAVE_API_URL = 'https://gql.waveapps.com/graphql/public';
const WAVE_API_TOKEN = process.env.WAVE_API_TOKEN;

class WaveService {
  constructor() {
    this.client = axios.create({
      baseURL: WAVE_API_URL,
      headers: {
        'Authorization': `Bearer ${WAVE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });
  }

  // Create an invoice in Wave
  async createInvoice({ customerId, items, total, customerEmail, customerName }) {
    const mutation = `
      mutation CreateInvoice($input: InvoiceCreateInput!) {
        invoiceCreate(input: $input) {
          didSucceed
          inputErrors {
            code
            message
            path
          }
          invoice {
            id
            invoiceNumber
            total {
              value
              currency {
                code
              }
            }
            pdfUrl
          }
        }
      }
    `;

    // Map your cart items to Wave line items
    const lineItems = items.map((item, index) => ({
      productId: null, // Wave product ID (optional)
      description: item.name,
      unitPrice: item.price,
      quantity: item.quantity,
      // taxes: [], // Add if you have tax configuration
    }));

    const variables = {
      input: {
        businessId: process.env.WAVE_BUSINESS_ID, // Your Wave business ID
        customerId: customerId || null, // Wave customer ID (optional)
        invoiceDate: new Date().toISOString().split('T')[0],
        items: lineItems,
        // Optional: Add customer details if no customerId
        customer: customerId ? null : {
          name: customerName,
          email: customerEmail,
        },
      },
    };

    try {
      const response = await this.client.post('', {
        query: mutation,
        variables,
      });

      if (response.data.errors) {
        throw new Error(JSON.stringify(response.data.errors));
      }

      const result = response.data.data.invoiceCreate;
      
      if (!result.didSucceed) {
        throw new Error(JSON.stringify(result.inputErrors));
      }

      return result.invoice;
    } catch (error) {
      console.error('Wave API Error:', error);
      throw error;
    }
  }

  // Optional: Get or create a customer
  async getOrCreateCustomer(email, name) {
    const query = `
      query GetCustomer($businessId: ID!, $email: Email!) {
        business(id: $businessId) {
          customers(email: $email) {
            edges {
              node {
                id
                name
                email
              }
            }
          }
        }
      }
    `;

    try {
      const response = await this.client.post('', {
        query,
        variables: {
          businessId: process.env.WAVE_BUSINESS_ID,
          email,
        },
      });

      const customers = response.data.data.business.customers.edges;
      
      if (customers.length > 0) {
        return customers[0].node.id;
      }

      // Create customer if not found
      return await this.createCustomer(email, name);
    } catch (error) {
      console.error('Wave API Error:', error);
      throw error;
    }
  }

  async createCustomer(email, name) {
    const mutation = `
      mutation CreateCustomer($input: CustomerCreateInput!) {
        customerCreate(input: $input) {
          didSucceed
          customer {
            id
            name
            email
          }
        }
      }
    `;

    const response = await this.client.post('', {
      query: mutation,
      variables: {
        input: {
          businessId: process.env.WAVE_BUSINESS_ID,
          name,
          email,
        },
      },
    });

    return response.data.data.customerCreate.customer.id;
  }
}

module.exports = new WaveService();

// =====================================================
// 3. UPDATE YOUR STRIPE WEBHOOK OR SUCCESS HANDLER
// File: backend/routes/stripe.js (or wherever you handle successful payments)
// =====================================================

const waveService = require('../services/waveService');

// After successful Stripe payment:
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle successful payment
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;

    // Get order details from your database
    const order = await Order.findOne({ stripePaymentIntentId: paymentIntent.id });

    if (order) {
      try {
        // Create invoice in Wave
        const invoice = await waveService.createInvoice({
          customerId: null, // Or get from your user system
          items: order.items,
          total: order.total,
          customerEmail: order.customerEmail,
          customerName: order.customerName,
        });

        // Save Wave invoice ID to your order
        order.waveInvoiceId = invoice.id;
        order.waveInvoiceNumber = invoice.invoiceNumber;
        order.waveInvoicePdfUrl = invoice.pdfUrl;
        await order.save();

        console.log('Wave invoice created:', invoice.invoiceNumber);
      } catch (error) {
        console.error('Failed to create Wave invoice:', error);
        // Don't fail the whole transaction if Wave fails
      }
    }
  }

  res.json({ received: true });
});