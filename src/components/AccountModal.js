import React from 'react';
import { Package, LogOut } from 'lucide-react';

export default function AccountModal({ user, orders, onClose, onLogout }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" style={{ zIndex: 100000 }}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-8 border-4 border-pink-300">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-pink-600">My Account</h2>
          <button onClick={onClose} className="text-gray-500 text-2xl">×</button>
        </div>
        
        <div className="bg-pink-50 rounded-2xl p-6 mb-6">
          <h3 className="font-bold text-pink-600 mb-2">Account Info</h3>
          <p className="text-gray-700"><strong>Name:</strong> {user.name}</p>
          <p className="text-gray-700"><strong>Email:</strong> {user.email}</p>
          {user.address && (
            <p className="text-gray-700"><strong>Address:</strong> {user.address}, {user.city}, {user.state} {user.zipCode}</p>
          )}
        </div>
        
        <h3 className="font-bold text-pink-600 mb-4 flex items-center gap-2">
          <Package className="w-5 h-5" />
          Order History
        </h3>
        
        {orders.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No orders yet! Time to get some sparkly bows! ✨</p>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-purple-50 rounded-xl p-4 border-2 border-purple-200">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-purple-600">Order #{order.id}</p>
                    <p className="text-sm text-gray-600">{order.date}</p>
                  </div>
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                    {order.status}
                  </span>
                </div>
                <div className="space-y-1">
                  {order.items.map((item, idx) => (
                    <p key={idx} className="text-gray-700 text-sm">
                      {item.quantity}x {item.name} - ${item.price}
                    </p>
                  ))}
                </div>
                <p className="font-bold text-purple-600 mt-2">Total: ${order.total}</p>
              </div>
            ))}
          </div>
        )}
        
        <button
          onClick={onLogout}
          className="w-full bg-gray-200 text-gray-700 font-bold py-3 rounded-full mt-6 hover:bg-gray-300 transition-all flex items-center justify-center gap-2"
        >
          <LogOut className="w-5 h-5" />
          Log Out
        </button>
      </div>
    </div>
  );
}