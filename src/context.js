import React, { useState, useEffect } from "react";
import { v4 } from "uuid";
import { phoneDataApi } from "./apis/PhoneDataApi";

const ProductContext = React.createContext();

const ProductProvider = ({ children }) => {
  const cartArray = JSON.parse(localStorage.getItem("cart"));

  const [state, setState] = useState({
    products: [],
    filteredProducts: [],
    search: "",
    detailProduct: null,
    modalAppear: false,
    modalProduct: "",
    loading: true,
    cart: !cartArray ? [] : cartArray,
    cartSubTotal: 0,
    cartTax: 0,
    cartTotal: 0,
  });

  /**set the cart of the user by the and persist the amount of total */

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(state.cart));
    addTotalToCart();

    setProducts();
  }, [state.cart]);

  /*set the filter search beforehand,thats avoid null problems*/

  useEffect(() => {
    const filteredSearch = state.products.filter((product) => {
      return product.title.toLowerCase().includes(state.search.toLowerCase());
    });

    setState((state) => ({ ...state, filteredProducts: filteredSearch }));
  }, [state.search, state.products]);

  /**
   * Products
   * Handlers
   */

  /**Fetch the products from API */

  const setProducts = async () => {
    let tempProducts = [];

    try {
      const storeProducts = await phoneDataApi.get(
        "/api/products/read_all.php"
      );

      storeProducts.data.data.forEach((item) => {
        const singleItem = { ...item };

        tempProducts = [...tempProducts, singleItem];
      });
    } catch (error) {
      console.log(error);
    }

    setState((state) => ({ ...state, products: tempProducts }));
  };

  const getProduct = (id) => {
    const product = state.products.find((item) => item.id === id);
    return product;
  };

  const checkProductInCart = (id) => {
    return state.cart.some((item) => {
      return item.id === id;
    });
  };

  /**
   * Search
   * Filter Handlers
   */

  const setInputSearch = (e) => {
    const inputText = e.target.value;
    setState((state) => ({ ...state, search: inputText }));
  };

  const cleanFilteredSearch = () => {
    setState((state) => ({ ...state, search: "" }));
  };

  /**
   * Detail Pages
   * Handlers
   */

  //Fetch specific product base on the url params

  const handleDetail = async (id) => {
    try {
      const storeProduct = await phoneDataApi.get(
        `/api/products/read_single.php/?id=${id}`
      );
      setState((state) => ({
        ...state,
        detailProduct: storeProduct.data.data,
        loading: false,
      }));
    } catch (error) {
      console.log(error);
    }
  };

  const cleanHandleDetail = () => {
    setState((state) => ({
      ...state,
      detailProduct: null,
      loading: true,
    }));
  };

  /**
   * Modal Cart
   * Handlers
   */

  const openModal = (id) => {
    const product = getProduct(id);

    setState((state) => ({
      ...state,
      modalAppear: true,
      modalProduct: product,
    }));
  };

  const closeModal = () => {
    setState((state) => ({
      ...state,
      modalAppear: false,
    }));
  };

  /**
   * Cart
   * Handlers
   */

  const addToCart = (id) => {
    const product = getProduct(id);
    product["total"] = product.price;

    setState((state) => ({
      ...state,
      cart: [...state.cart, product],
    }));
  };

  const updateCart = () => {
    let tempCart = [...state.cart];

    setState((state) => ({
      ...state,
      cart: [...tempCart],
    }));
  };

  const removeItemToCart = (id) => {
    let tempProducts = [...state.products];
    let tempCart = [...state.cart];

    tempCart = tempCart.filter((item) => item.id !== id);

    setState((state) => ({
      ...state,
      cart: [...tempCart],
      products: [...tempProducts],
    }));
  };

  const clearCart = () => {
    setState((state) => ({
      ...state,
      cart: [],
    }));
  };

  const addTotalToCart = () => {
    let subTotal = 0;

    for (let item of state.cart) {
      subTotal += item.total;
    }

    //only for test in adamsApi remove the tax sum!

    const tempTax = subTotal * 0.1;
    const tax = parseFloat(tempTax.toFixed(2));
    const total = subTotal;

    setState((state) => ({
      ...state,
      cartSubTotal: subTotal,
      cartTax: tax,
      cartTotal: total,
    }));
  };

  /*
   *IMPLEMENT OF ADAMS PAY APP
   **/

  /*send cart to server to process pay*/
  const checkCart = async (cart, cartTotal) => {
    const form = new FormData();

    form.set("debtId", `debt${v4()}`);
    form.set("checkCart", JSON.stringify(cart));
    form.set("checkTotal", cartTotal);

    try {
      const response = await phoneDataApi.post(
        "/api/check-cart/index.php",
        form
      );
      console.log(response);

      //in case fail the checkout
      if (!response || response.data.error || !response.data.url) {
        alert("Unexpected error happens,try later.");
        return;
      }

      window.location.replace(response.data.url);
      localStorage.removeItem("cart");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <ProductContext.Provider
      value={{
        ...state,
        checkProductInCart,
        setInputSearch,
        cleanFilteredSearch,
        handleDetail,
        cleanHandleDetail,
        openModal,
        closeModal,
        addToCart,
        updateCart,
        removeItemToCart,
        clearCart,
        checkCart,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

export { ProductProvider, ProductContext };
