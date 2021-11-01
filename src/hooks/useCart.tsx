import axios from 'axios';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
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
  products: Product[];
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

  const [products, setProducts] = useState<Product[]>([]);



  useEffect(() => {
    async function loadProducts() {
      await axios.get('http://localhost:3333/products').then(response => {
          setProducts([...products, response.data]);
      })
    }

    loadProducts();
    
  }, []);


  const addProduct = async (productId: number) => {
    
    try {

      // verificar e o produto já está no carrinho
      const indexProduct = cart?.findIndex(e => e.id === productId);
      
      if(indexProduct != -1){

        const newCart = cart;

        newCart[indexProduct].amount++;

        setCart(newCart);

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      }

      // verificar se o produto existe no estoque 
      const inStock: any = await axios.get(`http://localhost:3333/stock/${productId}`).then(response => {
        setProducts([...products, response.data]);
        return response.data;
      })



      if(inStock.amount < 1) {
        toast.error("Estoque esgotado!")
      }

      const item = {
        id: productId,
        amount: 1
      }

      const product = await axios.get(`http://localhost:3333/products/${productId}`).then(res => res.data);

      console.log(product);
      
      setCart([...cart, {
          amount: 1,
          id: productId,
          image: product.image,
          price: product.price,
          title: product.title
      }])

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));


    } catch(err) {
      toast(`Falaha ao adicionar item! ${err}`);
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // localStorage.removeItem('@RocketShoes:cart')
      
    } catch(err) {
      toast("Falaha ao remover item!");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {

      // verificar e o produto já está no carrinho
      const indexProduct = cart.findIndex(e => e.id === productId);

      if(amount < 1){
        return
      }

      if(indexProduct != -1){

        const newCart = cart;

        newCart[indexProduct].amount++;

        setCart(newCart);

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      }

    } catch(err) {
      toast("Falaha ao adicionar item!");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, products, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {

  const context = useContext(CartContext);

  return context;
}
