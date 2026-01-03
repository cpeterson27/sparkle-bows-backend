import React from "react";
import { Heart, ShoppingCart, Star, User } from "lucide-react";

export default function Header({
  user,
  cartItemCount,
  onShowLogin,
  onShowAccount,
  onShowCart,
}) {
  return (
    <header
      className="relative bg-white/80 backdrop-blur-sm shadow-lg border-b-4 border-pink-300 sticky top-0"
      style={{ zIndex: 10000 }}
    >
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full flex items-center justify-center shadow-lg animate-bounce">
              <Heart className="text-white w-8 h-8 fill-current" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
                Sparkle & Twirl Bows
              </h1>
              <p className="text-pink-600 text-sm italic flex items-center gap-1">
                <Star className="w-4 h-4 fill-current" />
                Handmade with love by a 7-year-old ballerina!
                <Star className="w-4 h-4 fill-current" />
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <button
                onClick={onShowAccount}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-full shadow-lg transform hover:scale-105 transition-all flex items-center gap-2"
              >
                <User className="w-5 h-5" />
                {user.name}
              </button>
            ) : (
              <button
                onClick={onShowLogin}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-full shadow-lg transform hover:scale-105 transition-all flex items-center gap-2"
              >
                <User className="w-5 h-5" />
                Login
              </button>
            )}
            <button
              onClick={onShowCart}
              className="relative bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-full shadow-lg transform hover:scale-105 transition-all"
            >
              <ShoppingCart className="w-6 h-6 inline mr-2" />
              Cart ({cartItemCount})
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs animate-bounce">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
