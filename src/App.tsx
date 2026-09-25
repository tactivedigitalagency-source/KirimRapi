import React, { useState } from 'react';
import { OrderItem, ExportHistoryItem, SystemLogItem, OrderStatus, CatalogProduct, ProductItem } from './types';
import {
  INITIAL_ORDERS,
  INITIAL_EXPORT_HISTORY,
  INITIAL_SYSTEM_LOGS,
  INITIAL_CATALOG_PRODUCTS
} from './data/initialData';
import { Sidebar, TabKey } from './components/Sidebar';
import { Header } from './components/Header';
import { Toast, ToastInfo } from './components/Toast';
import { NotificationModal } from './components/NotificationModal';
import { StoreSwitcherModal } from './components/StoreSwitcherModal';

import { DashboardView } from './views/DashboardView';
import { InputPesananView } from './views/InputPesananView';
import { KatalogProdukView } from './views/KatalogProdukView';
import { VerifikasiView } from './views/VerifikasiView';
import { EksporView } from './views/EksporView';
import { RiwayatLogView } from './views/RiwayatLogView';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabKey>('dashboard-rekap');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [orders, setOrders] = useState<OrderItem[]>(INITIAL_ORDERS);
  const [catalog, setCatalog] = useState<CatalogProduct[]>(INITIAL_CATALOG_PRODUCTS);
  const [preselectedProductForOrder, setPreselectedProductForOrder] = useState<ProductItem | null>(null);
  const [exportHistory, setExportHistory] = useState<ExportHistoryItem[]>(INITIAL_EXPORT_HISTORY);
  const [systemLogs, setSystemLogs] = useState<SystemLogItem[]>(INITIAL_SYSTEM_LOGS);

  // Search and Modals
  const [searchQuery, setSearchQuery] = useState('');
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [activeStore, setActiveStore] = useState('CS Toko Mawar');
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // Toast state
  const [toast, setToast] = useState<ToastInfo>({
    show: false,
    title: '',
    description: ''
  });

  const showToast = (title: string, description: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToast({
      show: true,
      title,
      description,
      type
    });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3500);
  };

  // Add new order
  const handleAddOrder = (newOrder: OrderItem) => {
    setOrders((prev) => [newOrder, ...prev]);

    // Add log entry
    const newLog: SystemLogItem = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('id-ID') + ' WIB',
      type: 'parser',
      title: 'Pesanan Baru Diinput via AI',
      detail: `Memetakan pesanan ${newOrder.orderNumber} untuk ${newOrder.customerName} (${newOrder.address.city}).`,
      user: 'Budi Santoso',
      badge: 'Sukses'
    };
    setSystemLogs((prev) => [newLog, ...prev]);
  };

  // Update whole order data (e.g. edit product, recipient, address)
  const handleUpdateOrder = (orderId: string, updatedFields: Partial<OrderItem>) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, ...updatedFields } : o))
    );

    const targetOrder = orders.find((o) => o.id === orderId);
    const newLog: SystemLogItem = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('id-ID') + ' WIB',
      type: 'edit',
      title: `Perubahan Data & Produk: ${targetOrder?.orderNumber || orderId}`,
      detail: `Rincian produk dan data pesanan telah diperbarui oleh CS.`,
      user: 'Budi Santoso',
      badge: 'Diperbarui'
    };
    setSystemLogs((prev) => [newLog, ...prev]);
    showToast('Pesanan Diperbarui', 'Perubahan produk dan data pesanan berhasil disimpan.');
  };

  // Delete a single order from history
  const handleDeleteOrder = (orderId: string) => {
    const target = orders.find((o) => o.id === orderId);
    setOrders((prev) => prev.filter((o) => o.id !== orderId));

    if (target) {
      const newLog: SystemLogItem = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('id-ID') + ' WIB',
        type: 'system',
        title: `Hapus Pesanan: ${target.orderNumber}`,
        detail: `Pesanan atas nama ${target.customerName} (${target.address.city}) dihapus dari riwayat input.`,
        user: 'Budi Santoso',
        badge: 'Dihapus'
      };
      setSystemLogs((prev) => [newLog, ...prev]);
    }
    showToast('Pesanan Dihapus', `Pesanan ${target?.orderNumber || orderId} berhasil dihapus dari riwayat.`);
  };

  // Clear all recent orders input
  const handleClearRecentOrders = () => {
    const totalCount = orders.length;
    setOrders([]);

    const newLog: SystemLogItem = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('id-ID') + ' WIB',
      type: 'system',
      title: 'Bersihkan Seluruh Riwayat Input',
      detail: `${totalCount} pesanan telah dibersihkan dari antrean operasional.`,
      user: 'Budi Santoso',
      badge: 'Reset Riwayat'
    };
    setSystemLogs((prev) => [newLog, ...prev]);
    showToast('Riwayat Dibersihkan', `Semua ${totalCount} data riwayat input pesanan telah berhasil dihapus.`);
  };

  // Clear system audit logs
  const handleClearLogs = () => {
    setSystemLogs([]);
    showToast('Log Dibersihkan', 'Semua riwayat log sistem telah berhasil dikosongkan.');
  };

  // Catalog management handlers
  const handleAddCatalogProduct = (newProduct: CatalogProduct) => {
    setCatalog((prev) => [newProduct, ...prev]);
    const newLog: SystemLogItem = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('id-ID') + ' WIB',
      type: 'system',
      title: `Tambah Master Produk: ${newProduct.sku}`,
      detail: `Produk "${newProduct.name}" (Rp ${newProduct.price.toLocaleString('id-ID')}) ditambahkan ke katalog.`,
      user: 'Budi Santoso',
      badge: 'Katalog'
    };
    setSystemLogs((prev) => [newLog, ...prev]);
  };

  const handleUpdateCatalogProduct = (productId: string, updatedFields: Partial<CatalogProduct>) => {
    setCatalog((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, ...updatedFields } : p))
    );
    const target = catalog.find((p) => p.id === productId);
    const newLog: SystemLogItem = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('id-ID') + ' WIB',
      type: 'edit',
      title: `Update Master Produk: ${target?.sku || productId}`,
      detail: `Informasi harga, varian, atau stok untuk "${updatedFields.name || target?.name}" diperbarui.`,
      user: 'Budi Santoso',
      badge: 'Katalog'
    };
    setSystemLogs((prev) => [newLog, ...prev]);
  };

  const handleDeleteCatalogProduct = (productId: string) => {
    const target = catalog.find((p) => p.id === productId);
    setCatalog((prev) => prev.filter((p) => p.id !== productId));
    if (target) {
      const newLog: SystemLogItem = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('id-ID') + ' WIB',
        type: 'system',
        title: `Hapus Master Produk: ${target.sku}`,
        detail: `Produk "${target.name}" dihapus dari katalog master toko.`,
        user: 'Budi Santoso',
        badge: 'Hapus SKU'
      };
      setSystemLogs((prev) => [newLog, ...prev]);
    }
  };

  const handleSelectProductForNewOrder = (productItem: ProductItem) => {
    setPreselectedProductForOrder(productItem);
    setCurrentTab('input-pesanan-ai-parser');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Update order status
  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus, note?: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            validationStatus: newStatus,
            validationTagLabel:
              newStatus === 'siap'
                ? 'Siap Kirim'
                : newStatus === 'menunggu_respon'
                ? 'Menunggu Respon'
                : newStatus === 'dikonfirmasi'
                ? 'Dikonfirmasi WA'
                : newStatus === 'dikoreksi'
                ? 'Alamat Dikoreksi'
                : newStatus === 'dibatalkan'
                ? 'Pesanan Batal'
                : o.validationTagLabel,
            validationNote: note || o.validationNote,
            waSent: newStatus === 'menunggu_respon' || newStatus === 'siap' || o.waSent
          };
        }
        return o;
      })
    );

    const targetOrder = orders.find((o) => o.id === orderId);
    if (targetOrder) {
      const newLog: SystemLogItem = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('id-ID') + ' WIB',
        type: newStatus === 'menunggu_respon' ? 'wa' : 'edit',
        title: `Pembaruan Status: ${targetOrder.orderNumber}`,
        detail: `${targetOrder.customerName} status diubah ke ${newStatus}. ${note || ''}`,
        user: 'Budi Santoso',
        badge: newStatus
      };
      setSystemLogs((prev) => [newLog, ...prev]);
    }
  };

  // Add export history item
  const handleAddExportHistory = (newItem: ExportHistoryItem) => {
    setExportHistory((prev) => [newItem, ...prev]);

    const newLog: SystemLogItem = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('id-ID') + ' WIB',
      type: 'export',
      title: `Berkas Ekspor: ${newItem.fileName}`,
      detail: `${newItem.orderCount} pesanan di-generate untuk ekspedisi ${newItem.courier}.`,
      user: 'Budi Santoso',
      badge: 'Unduhan Sukses'
    };
    setSystemLogs((prev) => [newLog, ...prev]);
  };

  const unverifiedCount = orders.filter((o) => o.validationStatus === 'perlu_review').length;

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#131b2e] flex">
      {/* Fixed Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        ordersCount={orders.length}
        unverifiedCount={unverifiedCount}
        onOpenStoreModal={() => setIsStoreModalOpen(true)}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebarCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      {/* Top Header */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onQuickInputClick={() => {
          setCurrentTab('input-pesanan-ai-parser');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onNotificationsClick={() => setIsNotificationOpen(true)}
        unreadNotificationsCount={unverifiedCount}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebarCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      {/* Main Content Area */}
      <main
        className={`flex-1 pt-20 px-space-lg pb-12 overflow-y-auto max-w-7xl mx-auto w-full transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'ml-20' : 'ml-72'
        }`}
      >
        {currentTab === 'dashboard-rekap' && (
          <DashboardView
            orders={orders}
            onNavigateToTab={(tab) => {
              setCurrentTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onQuickInputClick={() => {
              setCurrentTab('input-pesanan-ai-parser');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onShowToast={showToast}
          />
        )}

        {currentTab === 'input-pesanan-ai-parser' && (
          <InputPesananView
            orders={orders}
            catalog={catalog}
            preselectedProduct={preselectedProductForOrder}
            onClearPreselectedProduct={() => setPreselectedProductForOrder(null)}
            onAddOrder={handleAddOrder}
            onUpdateOrder={handleUpdateOrder}
            onDeleteOrder={handleDeleteOrder}
            onClearRecentOrders={handleClearRecentOrders}
            onShowToast={showToast}
            onNavigateToTab={(tab) => {
              setCurrentTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {currentTab === 'katalog-produk' && (
          <KatalogProdukView
            catalog={catalog}
            onAddCatalogProduct={handleAddCatalogProduct}
            onUpdateCatalogProduct={handleUpdateCatalogProduct}
            onDeleteCatalogProduct={handleDeleteCatalogProduct}
            onSelectForNewOrder={handleSelectProductForNewOrder}
            onShowToast={showToast}
          />
        )}

        {currentTab === 'verifikasi-pengiriman' && (
          <VerifikasiView
            orders={orders}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onShowToast={showToast}
          />
        )}

        {currentTab === 'ekspor-agregator' && (
          <EksporView
            orders={orders}
            exportHistory={exportHistory}
            onAddExportHistory={handleAddExportHistory}
            onShowToast={showToast}
          />
        )}

        {currentTab === 'riwayat-log' && (
          <RiwayatLogView
            logs={systemLogs}
            onClearLogs={handleClearLogs}
            onShowToast={showToast}
          />
        )}
      </main>

      {/* Modals & Popovers */}
      <NotificationModal
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        onNavigateToVerification={() => {
          setCurrentTab('verifikasi-pengiriman');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      <StoreSwitcherModal
        isOpen={isStoreModalOpen}
        onClose={() => setIsStoreModalOpen(false)}
        activeStore={activeStore}
        onSelectStore={(store) => {
          setActiveStore(store);
          showToast('Toko Berganti', `Sekarang mengelola data operasional ${store}.`);
        }}
      />

      {/* Toast Feedback */}
      <Toast toast={toast} onClose={() => setToast((prev) => ({ ...prev, show: false }))} />
    </div>
  );
}
