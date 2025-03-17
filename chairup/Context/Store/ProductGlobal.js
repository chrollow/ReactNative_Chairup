import React, { createContext, useReducer } from "react";
import productReducer from "../Reducers/Product.reducer";

// Sample product data
const initialProducts = [
  {
    id: '1',
    name: 'Modern Office Chair',
    price: 199.99,
    image: 'https://picsum.photos/id/1/200/200',
    description: 'Ergonomic design with lumbar support for all-day comfort. Features adjustable height, 360-degree swivel, and premium cushioning for optimal support. The breathable mesh back provides ventilation for extended use.',
    rating: 4.5,
    numReviews: 87,
    countInStock: 15,
    category: 'Office'
  },
  {
    id: '2',
    name: 'Classic Wooden Chair',
    price: 149.99,
    image: 'https://picsum.photos/id/2/200/200',
    description: 'Timeless wooden design that fits any decor. Handcrafted from sustainable oak with a natural finish. The carefully contoured seat and backrest provide surprising comfort for a solid wood chair.',
    rating: 4.0,
    numReviews: 62,
    countInStock: 8,
    category: 'Dining'
  },
  {
    id: '3',
    name: 'Lounge Chair',
    price: 299.99,
    image: 'https://picsum.photos/id/3/200/200',
    description: 'Perfect for relaxation with premium cushioning. This luxurious lounge chair features plush cushions and a reclining mechanism for ultimate comfort. Ideal for living rooms or reading nooks.',
    rating: 4.8,
    numReviews: 124,
    countInStock: 5,
    category: 'Living Room'
  },
  {
    id: '4',
    name: 'Dining Chair Set',
    price: 399.99,
    image: 'https://picsum.photos/id/4/200/200',
    description: 'Set of 4 elegant dining chairs with sturdy construction. These chairs feature a modern design with faux leather upholstery that is easy to clean. The metal frames provide exceptional stability.',
    rating: 4.2,
    numReviews: 45,
    countInStock: 3,
    category: 'Dining'
  },
  {
    id: '5',
    name: 'Outdoor Patio Chair',
    price: 179.99,
    image: 'https://picsum.photos/id/5/200/200',
    description: 'Weather-resistant chair perfect for your garden or patio. Made from high-quality synthetic wicker with a powder-coated aluminum frame that won\'t rust. Includes a water-resistant cushion.',
    rating: 4.3,
    numReviews: 52,
    countInStock: 20,
    category: 'Outdoor'
  },
  {
    id: '6',
    name: 'Ergonomic Gaming Chair',
    price: 249.99,
    image: 'https://picsum.photos/id/6/200/200',
    description: 'Designed for gamers with adjustable features for maximum comfort during long sessions. Features include 4D armrests, adjustable lumbar support, and a reclining function up to 150 degrees.',
    rating: 4.7,
    numReviews: 98,
    countInStock: 12,
    category: 'Office'
  },
];

export const ProductContext = createContext();

const ProductProvider = ({ children }) => {
  const [stateProducts, dispatch] = useReducer(productReducer, { 
    products: initialProducts,
    cart: []
  });

  return (
    <ProductContext.Provider value={{ stateProducts, dispatch }}>
      {children}
    </ProductContext.Provider>
  );
};

export default ProductProvider;