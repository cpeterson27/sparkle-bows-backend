const API_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://sparkle-bows-backend.onrender.com'
    : 'http://localhost:3001');

export default API_URL;