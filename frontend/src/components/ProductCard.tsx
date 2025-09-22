// src/components/ProductCard.tsx
import "./ProductCard.css"

export type Product = {
  id: number;
  name: string;
  quantity: number;
  image_url?: string;
  price: number;
  unit: string;
};

type Props = {
  className?: string;
  product: Product;
  onIncrease: (id: number) => void;
  onDecrease: (id: number) => void;
  categoryId: number;
};

export default function ProductCard({ product, onIncrease, onDecrease, categoryId }: Props) {
  return (
    <div className="product-card">
      <div className="product-image">
        {product.image_url ? (
          <img
            src={`https://api.zhaoplatforme.com${product.image_url}`}
            alt={product.name}
          />
        ) : (
          <div className="placeholder">📦</div>
        )}
      </div>

      <div className="product-footer">
        <p className="product-name">
          {product.name} {product.unit ? `(${product.unit})` : ""}
        </p>
        <div
            className="qty-pill"
            role="group"
            aria-label={`Quantité de ${product.name}`}
        >
          <button
              type="button"
              className="qty-btn"
              onClick={() => onDecrease(product.id)}
              disabled={product.quantity === 0}
              aria-label={`Réduire la quantité de ${product.name}`}
          >
            −
          </button>

          <span className="qty-number">{product.quantity}</span>

          <button
              type="button"
              className="qty-btn"
              onClick={() => onIncrease(product.id)}
              aria-label={`Augmenter la quantité de ${product.name}`}
          >
            +
          </button>
        </div>
      </div>

      {categoryId === 4 && (
          <p className="product-price">
          {typeof product.price === "number" && !isNaN(product.price)
            ? `${product.price.toFixed(2)} €`
            : "—"}
        </p>
      )}
    </div>
  );
}

