import React, { useState } from 'react';
import { CatalogProduct, ProductItem } from '../types';

interface ProductPickerModalProps {
  isOpen: boolean;
  catalog: CatalogProduct[];
  onClose: () => void;
  onSelectProduct: (productItem: ProductItem) => void;
  onNavigateToCatalog?: () => void;
}

export const ProductPickerModal: React.FC<ProductPickerModalProps> = ({
  isOpen,
  catalog,
  onClose,
  onSelectProduct,
  onNavigateToCatalog
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  if (!isOpen) return null;

  const categories = ['all', ...Array.from(new Set(catalog.map((p) => p.category)))];

  const filteredCatalog = catalog.filter((prod) => {
    const matchesSearch =
      prod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prod.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prod.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || prod.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getVariant = (prod: CatalogProduct) => {
    return selectedVariants[prod.id] || prod.variants[0] || 'Standar';
  };

  const getQty = (prod: CatalogProduct) => {
    return quantities[prod.id] || 1;
  };

  const setVariant = (prodId: string, variant: string) => {
    setSelectedVariants((prev) => ({ ...prev, [prodId]: variant }));
  };

  const setQty = (prodId: string, qty: number) => {
    setQuantities((prev) => ({ ...prev, [prodId]: Math.max(1, qty) }));
  };

  const handlePick = (prod: CatalogProduct) => {
    const variant = getVariant(prod);
    const qty = getQty(prod);
    const item: ProductItem = {
      id: `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: prod.name,
      variant: variant,
      qty: qty,
      price: prod.price,
      weightGram: prod.weightGram
    };
    onSelectProduct(item);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-space-md">
      <div className="bg-surface-container-lowest rounded-2xl max-w-3xl w-full p-space-lg shadow-2xl border border-surface-container flex flex-col gap-space-md max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-space-xs border-b border-surface-container/60">
          <div className="flex items-center gap-space-sm">
            <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-2xl">category</span>
            </div>
            <div className="flex flex-col">
              <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                Pilih Produk dari Katalog Toko
              </h2>
              <span className="text-[12px] text-on-surface-variant">
                Klik produk untuk langsung dimasukkan ke rincian pesanan operasional
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Search & Categories */}
        <div className="flex flex-col gap-space-xs">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-lg">
              search
            </span>
            <input
              type="text"
              placeholder="Cari berdasarkan nama produk, varian, atau SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface-container-low rounded-xl text-body-sm text-[13px] text-on-surface border border-surface-container-high/40 focus:outline-none focus:ring-1 focus:ring-primary"
              autoFocus
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                  selectedCategory === cat
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container-low hover:bg-surface-container text-on-surface-variant'
                }`}
              >
                {cat === 'all' ? 'Semua Kategori' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {filteredCatalog.length === 0 ? (
            <div className="py-12 text-center text-on-surface-variant flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-4xl opacity-40">inventory_2</span>
              <p className="text-body-sm text-[13px]">Tidak ada produk yang cocok dengan pencarian "{searchTerm}".</p>
            </div>
          ) : (
            filteredCatalog.map((prod) => {
              const currentVariant = getVariant(prod);
              const currentQty = getQty(prod);

              return (
                <div
                  key={prod.id}
                  className="p-space-sm rounded-xl bg-surface-container-lowest hover:bg-surface-container-low/40 border border-surface-container-high/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-sm transition-colors shadow-xs"
                >
                  {/* Info */}
                  <div className="flex items-start gap-space-sm flex-1 min-w-0">
                    {prod.image ? (
                      <img
                        src={prod.image}
                        alt={prod.name}
                        className="w-12 h-12 rounded-lg object-cover border border-surface-container shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
                        <span className="material-symbols-outlined text-2xl">shopping_bag</span>
                      </div>
                    )}
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-headline-sm text-[13px] font-bold text-on-surface truncate">
                          {prod.name}
                        </span>
                        <span className="font-code-sm text-[10px] text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded">
                          {prod.sku}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-secondary-container/40 text-secondary">
                          {prod.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-on-surface-variant mt-1">
                        <span className="font-bold text-primary font-tabular-data-md text-[13px]">
                          Rp {prod.price.toLocaleString('id-ID')}
                        </span>
                        <span>• Berat: {prod.weightGram}g</span>
                        <span>• Stok: <strong className={prod.stock < 50 ? 'text-error' : 'text-on-surface'}>{prod.stock} unit</strong></span>
                      </div>

                      {/* Variant selector chips */}
                      <div className="flex items-center gap-1 mt-2 flex-wrap">
                        <span className="text-[10px] text-on-surface-variant uppercase font-medium mr-1">Varian:</span>
                        {prod.variants.map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setVariant(prod.id, v)}
                            className={`px-2 py-0.5 rounded text-[11px] font-medium border cursor-pointer transition-colors ${
                              currentVariant === v
                                ? 'bg-primary-container text-on-primary-container border-primary font-bold shadow-xs'
                                : 'bg-surface-container-lowest text-on-surface border-surface-container-high hover:bg-surface-container'
                            }`}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions: Qty & Pick Button */}
                  <div className="flex items-center gap-space-sm shrink-0 self-end sm:self-center w-full sm:w-auto justify-between sm:justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-surface-container">
                    <div className="flex items-center bg-surface-container-low rounded-lg border border-surface-container-high/40 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setQty(prod.id, currentQty - 1)}
                        className="px-2 py-1 text-on-surface-variant hover:bg-surface-container text-xs cursor-pointer font-bold"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-[12px] font-bold text-on-surface">
                        {currentQty}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQty(prod.id, currentQty + 1)}
                        className="px-2 py-1 text-on-surface-variant hover:bg-surface-container text-xs cursor-pointer font-bold"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handlePick(prod)}
                      className="px-space-md py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-on-primary font-label-md text-[12px] font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95"
                    >
                      <span className="material-symbols-outlined text-base">add</span>
                      <span>Pilih Produk</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-space-xs border-t border-surface-container/60">
          {onNavigateToCatalog ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateToCatalog();
              }}
              className="text-[12px] text-primary hover:underline flex items-center gap-1 font-semibold cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">open_in_new</span>
              <span>Buka &amp; Kelola Katalog di Navigasi Operasional</span>
            </button>
          ) : (
            <div></div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-space-md py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-[12px] font-medium cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
