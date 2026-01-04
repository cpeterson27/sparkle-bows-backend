import React, { useState } from 'react';

export default function LoginModal({ onClose, onLogin }) {
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // For now, just pass the form data as logged-in user
    onLogin(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" style={{ zIndex: 100000 }}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 border-4 border-pink-300 relative z-10">
        <h2 className="text-3xl font-bold text-pink-600 mb-6 text-center">
          {isSignup ? 'Create Account' : 'Welcome Back!'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <input
              type="text"
              placeholder="Your Name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-3 rounded-full border-2 border-pink-200 focus:border-pink-500 outline-none"
              required
            />
          )}
          
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="w-full px-4 py-3 rounded-full border-2 border-pink-200 focus:border-pink-500 outline-none"
            required
          />
          
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            className="w-full px-4 py-3 rounded-full border-2 border-pink-200 focus:border-pink-500 outline-none"
            required
          />
          
          {isSignup && (
            <>
              <input
                type="text"
                placeholder="Street Address"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full px-4 py-3 rounded-full border-2 border-pink-200 focus:border-pink-500 outline-none"
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="City"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  className="px-4 py-3 rounded-full border-2 border-pink-200 focus:border-pink-500 outline-none"
                />
                <input
                  type="text"
                  placeholder="State"
                  value={formData.state}
                  onChange={(e) => setFormData({...formData, state: e.target.value})}
                  className="px-4 py-3 rounded-full border-2 border-pink-200 focus:border-pink-500 outline-none"
                />
                <input
                  type="text"
                  placeholder="Zip"
                  value={formData.zipCode}
                  onChange={(e) => setFormData({...formData, zipCode: e.target.value})}
                  className="px-4 py-3 rounded-full border-2 border-pink-200 focus:border-pink-500 outline-none"
                />
              </div>
            </>
          )}
          
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-3 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
          >
            {isSignup ? 'Sign Up' : 'Log In'}
          </button>
        </form>
        
        <button
          onClick={() => setIsSignup(!isSignup)}
          className="w-full text-pink-600 font-bold mt-4"
        >
          {isSignup ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
        </button>
        
        <button
          onClick={onClose}
          className="w-full text-gray-500 mt-2"
        >
          Continue as Guest
        </button>
      </div>
    </div>
  );
}