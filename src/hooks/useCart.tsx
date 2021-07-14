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
        const hasStock = await hasStockQuantity(productId, 1);
        if (!hasStock) return;

        const { data } = await api.get(`products/${productId}`);
        const updatedCart = [...cart, { ...data, amount: 1 }];

        setCart(updatedCart);
        localStorage.setItem(STORAGE_NAME, JSON.stringify(updatedCart));
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const updatedCart = cart.filter(({ id }) => id !== productId);
      setCart(updatedCart);
      localStorage.setItem(STORAGE_NAME, JSON.stringify(updatedCart));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({ productId, amount }: UpdateProductAmount) => {
    const hasStock = await hasStockQuantity(productId, amount);
    if (!hasStock) return;

    try {
      const updatedCart = cart.map((item) => {
        if (item.id === productId) item.amount = amount;

        return item;
      });

      setCart(updatedCart);
      localStorage.setItem(STORAGE_NAME, JSON.stringify(updatedCart));
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  const hasStockQuantity = async (productId: number, amount: number) => {
    const { data } = await api.get(`stock/${productId}`);
    const hasStock = amount <= data.amount;
    if (!hasStock) toast.error('Quantidade solicitada fora de estoque');

    return hasStock;
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
