import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);
const STORAGE_NAME = '@RocketShoes:cart';

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem(STORAGE_NAME);

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const item = cart.find(({ id }) => id === productId);

      if (item) {
        const amount = !item.amount ? 1 : item.amount + 1;
        updateProductAmount({ productId, amount });
      } else {
        const { data } = await api.get(`products/${productId}`);
        const updatedCart = [...cart, { ...data, amount: 1 }];

        setCart(updatedCart);
        localStorage.setItem(STORAGE_NAME, JSON.stringify(updatedCart));

        console.log(updatedCart);
      }
    } catch {
      // TODO
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const updatedCart = cart.filter(({ id }) => id !== productId);
      setCart(updatedCart);
      localStorage.setItem(STORAGE_NAME, JSON.stringify(updatedCart));
    } catch {
      // TODO
    }
  };

  const updateProductAmount = async ({ productId, amount }: UpdateProductAmount) => {
    try {
      const updatedCart = cart.map((item) => {
        if (item.id === productId) item.amount = amount;

        return item;
      });

      setCart(updatedCart);
      localStorage.setItem(STORAGE_NAME, JSON.stringify(updatedCart));

      console.log(updatedCart);
    } catch {
      // TODO
    }
  };

  return (
    <CartContext.Provider value={{ cart, addProduct, removeProduct, updateProductAmount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
