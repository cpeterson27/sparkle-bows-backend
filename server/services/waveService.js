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
    const lineItems = items.map((item) => ({
      productId: null,
      description: item.name,
      unitPrice: item.price,
      quantity: item.quantity,
    }));

    const variables = {
      input: {
        businessId: process.env.WAVE_BUSINESS_ID,
        customerId: customerId || null,
        invoiceDate: new Date().toISOString().split('T')[0],
        items: lineItems,
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