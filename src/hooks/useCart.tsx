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

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }
    return [];
  });

  async function addProduct(productId: number) {
    try {
      const updateCart = [...cart];
      const productExists = updateCart.find(product => product.id === productId);

      const stock = await api.get(`stock/${productId}`);

      const stockAmount = stock.data.amount;
      const currentAmount = productExists ? productExists.amount : 0;
      const amount = currentAmount + 1;

      if(amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
      if(productExists){
        productExists.amount = amount;
      }else{
        const product = await api.get(`products/${productId}`);

        const newProduct = {
          ...product.data,
          amount: 1
        }
        updateCart.push(newProduct);
      }
      setCart(updateCart);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateCart));
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  function removeProduct(productId: number) {
    try {
      const updateCart = [...cart];
      const findAndDelete = updateCart.findIndex(product => product.id === productId);

      if(findAndDelete === -1){
        return toast.error('Erro na remoção do produto');
      }

      updateCart.splice(findAndDelete,1);

      setCart(updateCart);

       localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateCart))
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  async function updateProductAmount({
    productId,
    amount,
  }: UpdateProductAmount) {
    try {
      const updateCart = [...cart];
      const productIndex = updateCart.findIndex(product => product.id=== productId);

        const stock = await api.get(`stock/${productId}`);
        if(amount < 1){
          return toast.error('Erro na alteração de quantidade do produto');
        }
        if(stock.data.amount >= amount){  

          updateCart[productIndex].amount = amount;

          setCart(updateCart);
  
         await localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateCart));
        }else{
          return toast.error('Quantidade solicitada fora de estoque')
        }
      } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
