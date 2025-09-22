// src/components/ProductGrid.tsx
import ProductCard from "./ProductCard";
import type { Product } from "./ProductCard";
import "./ProductGrid.css";

type Props = {
  products: Product[];
  onIncrease: (id: number) => void;
  onDecrease: (id: number) => void;
  className?: string
  categoryId: number;
};

export default function ProductGrid({ products, onIncrease, onDecrease, categoryId }: Props) {
  return (
    <main className="product-grid">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onIncrease={onIncrease}
          onDecrease={onDecrease}
          categoryId={categoryId}
        />
      ))}
    </main>
  );
}
