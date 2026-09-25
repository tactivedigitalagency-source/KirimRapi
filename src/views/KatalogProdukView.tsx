import React, { useState } from 'react';
import { CatalogProduct, ProductItem } from '../types';

interface KatalogProdukViewProps {
  catalog: CatalogProduct[];
  onAddCatalogProduct: (product: CatalogProduct) => void;
  onUpdateCatalogProduct: (productId: string, updatedFields: Partial<CatalogProduct>) => void;
  onDeleteCatalogProduct: (productId: string) => void;
  onSelectForNewOrder: (productItem: ProductItem) => void;
  onShowToast: (title: string, desc: string, type?: 'success' | 'info' | 'warning') => void;
}

export const KatalogProdukView: React.FC<KatalogProdukViewProps> = ({
  catalog,
  onAddCatalogProduct,
  onUpdateCatalogProduct,
  onDeleteCatalogProduct,
  onSelectForNewOrder,
  onShowToast
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingProduct, setEditingProduct] = useState<CatalogProduct | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<CatalogProduct | null>(null);

  // Form State for Add / Edit
  const [formSku, setFormSku] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Fashion Muslim');
  const [formVariants, setFormVariants] = useState('S, M, L, XL');
  const [formPrice, setFormPrice] = useState(150000);
  const [formWeight, setFormWeight] = useState(500);
  const [formStock, setFormStock] = useState(100);
  const [formDescription, setFormDescription] = useState('');

  const categories = ['all', ...Array.from(new Set(catalog.map((p) => p.category)))];

  const filteredProducts = catalog.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalStock = catalog.reduce((sum, p) => sum + (p.stock || 0), 0);
  const lowStockCount = catalog.filter((p) => p.stock < 50).length;
  const avgPrice = Math.round(
    catalog.length > 0 ? catalog.reduce((sum, p) => sum + p.price, 0) / catalog.length : 0
  );

  const openAddModal = () => {
    setFormSku(`PRD-${Math.floor(100 + Math.random() * 900)}`);
    setFormName('');
    setFormCategory('Fashion Muslim');
    setFormVariants('Standar, Hitam, Navy');
    setFormPrice(120000);
    setFormWeight(400);
    setFormStock(50);
    setFormDescription('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (prod: CatalogProduct) => {
    setEditingProduct(prod);
    setFormSku(prod.sku);
    setFormName(prod.name);
    setFormCategory(prod.category);
    setFormVariants(prod.variants.join(', '));
    setFormPrice(prod.price);
    setFormWeight(prod.weightGram);
    setFormStock(prod.stock);
    setFormDescription(prod.description || '');
  };

  const handleSaveAdd = () => {
    if (!formName.trim()) {
      onShowToast('Nama Kosong', 'Nama produk wajib diisi.', 'warning');
      return;
    }
    const variantsArr = formVariants
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);

    const newProd: CatalogProduct = {
      id: `cat-${Date.now()}`,
      sku: formSku || `SKU-${Date.now()}`,
      name: formName,
      category: formCategory,
      variants: variantsArr.length > 0 ? variantsArr : ['Standar'],
      price: formPrice,
      weightGram: formWeight,
      stock: formStock,
      isActive: true,
      description: formDescription
    };

    onAddCatalogProduct(newProd);
    setIsAddModalOpen(false);
    onShowToast('Produk Ditambahkan', `"${formName}" berhasil disimpan ke katalog operasional.`);
  };

  const handleSaveEdit = () => {
    if (!editingProduct) return;
    if (!formName.trim()) {
      onShowToast('Nama Kosong', 'Nama produk wajib diisi.', 'warning');
      return;
    }

    const variantsArr = formVariants
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);

    onUpdateCatalogProduct(editingProduct.id, {
      sku: formSku,
      name: formName,
      category: formCategory,
      variants: variantsArr.length > 0 ? variantsArr : ['Standar'],
      price: formPrice,
      weightGram: formWeight,
      stock: formStock,
      description: formDescription
    });

    setEditingProduct(null);
    onShowToast('Produk Diperbarui', `Perubahan data "${formName}" berhasil disimpan.`);
  };

  return (
    <div className="flex flex-col gap-space-lg">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm border border-surface-container/60">
        <div className="flex items-center gap-space-md">
          <div className="w-12 h-12 rounded-2xl bg-primary-container text-on-primary-container flex items-center justify-center shadow-xs">
            <span className="material-symbols-outlined text-2xl font-bold">inventory</span>
          </div>
          <div>
            <div className="flex items-center gap-space-xs">
              <h1 className="font-headline-md text-headline-md text-on-surface font-extrabold tracking-tight">
                Katalog &amp; Rincian Produk
              </h1>
              <span className="px-space-xs py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-[11px] font-semibold">
                Navigasi Operasional
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Kelola master data produk toko agar CS dapat langsung memilih produk saat input pesanan
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="px-space-lg py-2.5 bg-primary hover:bg-primary/90 text-on-primary rounded-xl font-label-md text-label-md font-semibold flex items-center gap-2 cursor-pointer shadow-sm transition-all active:scale-95 shrink-0 self-start sm:self-center"
        >
          <span className="material-symbols-outlined text-xl">add_circle</span>
          <span>+ Tambah Produk Baru</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
        <div className="p-space-md bg-surface-container-lowest rounded-xl border border-surface-container-high/40 shadow-xs flex items-center gap-space-md">
          <div className="w-10 h-10 rounded-xl bg-primary-container/40 text-primary flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-xl">category</span>
          </div>
          <div>
            <span className="text-[11px] text-on-surface-variant font-medium block">Total SKU Terdaftar</span>
            <span className="text-xl font-bold text-on-surface font-tabular-data-md">{catalog.length} Produk</span>
          </div>
        </div>

        <div className="p-space-md bg-surface-container-lowest rounded-xl border border-surface-container-high/40 shadow-xs flex items-center gap-space-md">
          <div className="w-10 h-10 rounded-xl bg-secondary-container/50 text-secondary flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-xl">warehouse</span>
          </div>
          <div>
            <span className="text-[11px] text-on-surface-variant font-medium block">Total Unit Stok Fisik</span>
            <span className="text-xl font-bold text-on-surface font-tabular-data-md">{totalStock.toLocaleString('id-ID')} Pcs</span>
          </div>
        </div>

        <div className="p-space-md bg-surface-container-lowest rounded-xl border border-surface-container-high/40 shadow-xs flex items-center gap-space-md">
          <div className="w-10 h-10 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-xl">payments</span>
          </div>
          <div>
            <span className="text-[11px] text-on-surface-variant font-medium block">Rata-rata Harga Jual</span>
            <span className="text-xl font-bold text-on-surface font-tabular-data-md">Rp {avgPrice.toLocaleString('id-ID')}</span>
          </div>
        </div>

        <div className="p-space-md bg-surface-container-lowest rounded-xl border border-surface-container-high/40 shadow-xs flex items-center gap-space-md">
          <div className="w-10 h-10 rounded-xl bg-error-container/40 text-error flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-xl">warning</span>
          </div>
          <div>
            <span className="text-[11px] text-on-surface-variant font-medium block">Peringatan Stok Rendah</span>
            <span className="text-xl font-bold text-error font-tabular-data-md">{lowStockCount} SKU (&lt;50)</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-xs border border-surface-container flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-space-sm">
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-lg">
            search
          </span>
          <input
            type="text"
            placeholder="Cari produk berdasarkan nama, kode SKU, atau kategori..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-container-low rounded-xl text-body-sm text-[13px] text-on-surface border border-surface-container-high/40 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap cursor-pointer transition-colors ${
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

      {/* Product Table */}
      <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-surface-container overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-surface-container bg-surface-container-low/70 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-[11px]">
                <th className="py-space-sm px-space-md font-semibold">SKU &amp; Produk</th>
                <th className="py-space-sm px-space-md font-semibold">Kategori</th>
                <th className="py-space-sm px-space-md font-semibold">Varian Tersedia</th>
                <th className="py-space-sm px-space-md font-semibold">Harga Jual</th>
                <th className="py-space-sm px-space-md font-semibold">Berat (Gram)</th>
                <th className="py-space-sm px-space-md font-semibold">Stok Unit</th>
                <th className="py-space-sm px-space-md font-semibold text-right">Aksi Operasional</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container text-body-sm text-[12px]">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-4xl mb-2 block opacity-40">inventory_2</span>
                    Tidak ada produk ditemukan.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-container-low/40 transition-colors">
                    <td className="py-space-sm px-space-md">
                      <div className="flex items-center gap-space-sm">
                        {p.image ? (
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-10 h-10 rounded-lg object-cover border border-surface-container shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
                            <span className="material-symbols-outlined text-xl">shopping_bag</span>
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                            {p.name}
                          </span>
                          <span className="font-code-sm text-[11px] text-on-surface-variant">
                            {p.sku}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-space-sm px-space-md">
                      <span className="px-2 py-0.5 rounded font-medium bg-secondary-container/40 text-secondary text-[11px]">
                        {p.category}
                      </span>
                    </td>
                    <td className="py-space-sm px-space-md max-w-xs">
                      <div className="flex items-center gap-1 flex-wrap">
                        {p.variants.map((v) => (
                          <span
                            key={v}
                            className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface text-[10px] font-medium"
                          >
                            {v}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-space-sm px-space-md font-tabular-data-md font-bold text-primary">
                      Rp {p.price.toLocaleString('id-ID')}
                    </td>
                    <td className="py-space-sm px-space-md font-tabular-data-md text-on-surface">
                      {p.weightGram} g ({p.weightGram / 1000} kg)
                    </td>
                    <td className="py-space-sm px-space-md">
                      <span
                        className={`font-tabular-data-md font-bold ${
                          p.stock < 50 ? 'text-error font-extrabold' : 'text-on-surface'
                        }`}
                      >
                        {p.stock} pcs
                      </span>
                    </td>
                    <td className="py-space-sm px-space-md text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const item: ProductItem = {
                              id: `prod-${Date.now()}`,
                              name: p.name,
                              variant: p.variants[0] || 'Standar',
                              qty: 1,
                              price: p.price,
                              weightGram: p.weightGram
                            };
                            onSelectForNewOrder(item);
                            onShowToast('Produk Dipilih', `"${p.name}" dialihkan ke formulir input pesanan.`);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-primary-container hover:bg-primary text-on-primary-container hover:text-on-primary text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                          title="Gunakan untuk buat pesanan baru"
                        >
                          <span className="material-symbols-outlined text-sm">add_shopping_cart</span>
                          <span>+ Buat Pesanan</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(p)}
                          className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors cursor-pointer"
                          title="Edit Produk"
                        >
                          <span className="material-symbols-outlined text-base">edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setProductToDelete(p)}
                          className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/40 transition-colors cursor-pointer"
                          title="Hapus Produk dari Katalog"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {(isAddModalOpen || editingProduct) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-space-md">
          <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-space-lg shadow-2xl border border-surface-container flex flex-col gap-space-md animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-space-xs border-b border-surface-container/60">
              <div className="flex items-center gap-space-sm">
                <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-xl">
                    {isAddModalOpen ? 'add_circle' : 'edit_square'}
                  </span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                    {isAddModalOpen ? 'Tambah Produk Baru ke Katalog' : 'Edit Data Produk Katalog'}
                  </h3>
                  <span className="text-[12px] text-on-surface-variant">
                    Produk akan dapat langsung dipilih pada formulir input pesanan
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingProduct(null);
                }}
                className="p-1 rounded-lg hover:bg-surface-container text-on-surface-variant cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-space-sm">
              <div className="grid grid-cols-2 gap-space-sm">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-on-surface-variant font-medium">Kode SKU</label>
                  <input
                    type="text"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    placeholder="Contoh: GMS-MTL-01"
                    className="px-3 py-1.5 rounded-lg bg-surface-container-low text-[12px] border border-surface-container-high/40 font-code-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-on-surface-variant font-medium">Kategori</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-surface-container-low text-[12px] border border-surface-container-high/40 focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="Fashion Muslim">Fashion Muslim</option>
                    <option value="Hijab & Scarf">Hijab &amp; Scarf</option>
                    <option value="Sepatu & Sandal">Sepatu &amp; Sandal</option>
                    <option value="Skincare & Beauty">Skincare &amp; Beauty</option>
                    <option value="Pakaian Pria">Pakaian Pria</option>
                    <option value="Pakaian Wanita">Pakaian Wanita</option>
                    <option value="Aksesoris">Aksesoris</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-on-surface-variant font-medium">Nama Produk Lengkap</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Gamis Mutiara Lilac Babydoll"
                  className="px-3 py-1.5 rounded-lg bg-surface-container-low text-[12px] border border-surface-container-high/40 focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-on-surface-variant font-medium">
                  Daftar Varian / Ukuran (pisahkan dengan koma)
                </label>
                <input
                  type="text"
                  value={formVariants}
                  onChange={(e) => setFormVariants(e.target.value)}
                  placeholder="Contoh: S, M, L, XL, XXL"
                  className="px-3 py-1.5 rounded-lg bg-surface-container-low text-[12px] border border-surface-container-high/40 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-3 gap-space-sm">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-on-surface-variant font-medium">Harga Jual (Rp)</label>
                  <input
                    type="number"
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="px-3 py-1.5 rounded-lg bg-surface-container-low text-[12px] border border-surface-container-high/40 font-tabular-data-md font-bold focus:outline-none focus:ring-1 focus:ring-primary text-right"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-on-surface-variant font-medium">Berat (Gram)</label>
                  <input
                    type="number"
                    value={formWeight}
                    onChange={(e) => setFormWeight(Number(e.target.value))}
                    className="px-3 py-1.5 rounded-lg bg-surface-container-low text-[12px] border border-surface-container-high/40 font-tabular-data-md focus:outline-none focus:ring-1 focus:ring-primary text-right"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-on-surface-variant font-medium">Stok Fisik</label>
                  <input
                    type="number"
                    value={formStock}
                    onChange={(e) => setFormStock(Number(e.target.value))}
                    className="px-3 py-1.5 rounded-lg bg-surface-container-low text-[12px] border border-surface-container-high/40 font-tabular-data-md focus:outline-none focus:ring-1 focus:ring-primary text-right"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-on-surface-variant font-medium">Catatan / Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Keterangan bahan, keunggulan, atau catatan packing..."
                  className="px-3 py-1.5 rounded-lg bg-surface-container-low text-[12px] border border-surface-container-high/40 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-space-sm pt-space-xs border-t border-surface-container/60">
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingProduct(null);
                }}
                className="px-space-md py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-[12px] font-medium cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={isAddModalOpen ? handleSaveAdd : handleSaveEdit}
                className="px-space-lg py-2 rounded-lg bg-primary hover:bg-primary/90 text-on-primary text-[12px] font-bold cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">check</span>
                <span>{isAddModalOpen ? 'Simpan ke Katalog' : 'Simpan Perubahan'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-space-md">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-space-lg shadow-2xl border border-surface-container flex flex-col gap-space-md animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-space-sm text-error">
              <div className="w-10 h-10 rounded-xl bg-error-container/40 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">delete</span>
              </div>
              <div>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  Hapus Produk dari Katalog?
                </h3>
                <span className="text-[12px] text-on-surface-variant font-code-sm">
                  {productToDelete.sku} • {productToDelete.name}
                </span>
              </div>
            </div>
            <p className="text-body-sm text-[13px] text-on-surface-variant leading-relaxed">
              Produk ini akan dihapus dari katalog master toko. Produk yang sudah terinput di riwayat pesanan sebelumnya tidak akan terpengaruh.
            </p>
            <div className="flex items-center justify-end gap-space-sm pt-space-xs">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-space-md py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-[12px] font-medium cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteCatalogProduct(productToDelete.id);
                  setProductToDelete(null);
                  onShowToast('Produk Dihapus', `"${productToDelete.name}" telah dihapus dari katalog.`);
                }}
                className="px-space-md py-2 rounded-lg bg-error hover:bg-error/90 text-on-error text-[12px] font-semibold cursor-pointer shadow-sm"
              >
                Ya, Hapus Produk
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
