
import { Injectable, signal, computed, effect } from '@angular/core';

export interface Product {
  id: string;
  name: string;
  price: number;
  importPrice: number;
  stock: number;
  category: string;
  image?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  totalSpent: number; 
  debt: number;       
  lastVisit: string;
  notes?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Order {
  id: string;
  date: string;
  items: OrderItem[];
  subTotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  customerId?: string; 
  customerName: string;
  cashReceived: number;
  changeReturned: number;
  isDebt?: boolean; 
}

export interface Transaction {
  id: string;
  date: string;
  type: 'IN' | 'OUT'; 
  category: string; 
  amount: number;
  note: string;
  refId?: string; 
}

export interface ShopConfig {
  shopName: string;
  address: string;
  phone: string;
  footerMessage: string;
  printerWidth: '58mm' | '80mm';
  taxRate: number; 
  qrCodeImage?: string;
  themeId: string;
}

export interface GithubConfig {
  enabled: boolean;
  token: string;
  owner: string;
  repo: string;
  path: string;
  lastSync?: string;
}

export interface NavParams {
  filter?: 'low-stock' | 'all';
  orderId?: string;
  searchTerm?: string;
  customerId?: string;
  action?: 'restock' | 'sell'; 
}

// DEFINING 8 THEMES
export const APP_THEMES = [
  { id: 'indigo', name: 'Mặc Định (Indigo)', colors: { 50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc', 400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca', 800: '#3730a3', 900: '#312e81', 950: '#1e1b4b' } },
  { id: 'rose', name: 'Hồng Phấn (Rose)', colors: { 50: '#fff1f2', 100: '#ffe4e6', 200: '#fecdd3', 300: '#fda4af', 400: '#fb7185', 500: '#f43f5e', 600: '#e11d48', 700: '#be123c', 800: '#9f1239', 900: '#881337', 950: '#4c0519' } },
  { id: 'emerald', name: 'Xanh Ngọc (Emerald)', colors: { 50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7', 400: '#34d399', 500: '#10b981', 600: '#059669', 700: '#047857', 800: '#065f46', 900: '#064e3b', 950: '#022c22' } },
  { id: 'amber', name: 'Vàng Kim (Amber)', colors: { 50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d', 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309', 800: '#92400e', 900: '#78350f', 950: '#451a03' } },
  { id: 'sky', name: 'Biển Xanh (Sky)', colors: { 50: '#f0f9ff', 100: '#e0f2fe', 200: '#bae6fd', 300: '#7dd3fc', 400: '#38bdf8', 500: '#0ea5e9', 600: '#0284c7', 700: '#0369a1', 800: '#075985', 900: '#0c4a6e', 950: '#082f49' } },
  { id: 'purple', name: 'Tím Mộng Mơ (Purple)', colors: { 50: '#faf5ff', 100: '#f3e8ff', 200: '#e9d5ff', 300: '#d8b4fe', 400: '#c084fc', 500: '#a855f7', 600: '#9333ea', 700: '#7e22ce', 800: '#6b21a8', 900: '#581c87', 950: '#3b0764' } },
  { id: 'teal', name: 'Xanh Cổ Vịt (Teal)', colors: { 50: '#f0fdfa', 100: '#ccfbf1', 200: '#99f6e4', 300: '#5eead4', 400: '#2dd4bf', 500: '#14b8a6', 600: '#0d9488', 700: '#0f766e', 800: '#115e59', 900: '#134e4a', 950: '#042f2e' } },
  { id: 'slate', name: 'Đen Sang Trọng (Slate)', colors: { 50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155', 800: '#1e293b', 900: '#0f172a', 950: '#020617' } },
];

@Injectable({
  providedIn: 'root'
})
export class DataService {
  activeTab = signal<string>('dashboard');
  navParams = signal<NavParams | null>(null);

  products = signal<Product[]>([]);
  customers = signal<Customer[]>([]); 
  orders = signal<Order[]>([]);
  transactions = signal<Transaction[]>([]); 
  
  // GLOBAL CART STATE
  cart = signal<OrderItem[]>([]);
  
  shopConfig = signal<ShopConfig>({
    shopName: 'Cửa Hàng Của Tôi',
    address: '123 Đường ABC, Quận XYZ',
    phone: '0901234567',
    footerMessage: 'Xin cảm ơn & Hẹn gặp lại!',
    printerWidth: '80mm',
    taxRate: 0,
    qrCodeImage: '',
    themeId: 'indigo'
  });
  
  githubConfig = signal<GithubConfig>({ enabled: false, token: '', owner: '', repo: '', path: 'fin_assistant_data.json' });

  private fileHandle: any = null;
  isFileConnected = signal<boolean>(false);
  lastSaveTime = signal<Date | null>(null);
  
  private syncTimer: any;
  
  totalRevenue = computed(() => this.orders().reduce((acc, order) => acc + order.totalAmount, 0));
  totalProfit = computed(() => {
    const totalIncome = this.transactions().filter(t => t.type === 'IN').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = this.transactions().filter(t => t.type === 'OUT').reduce((sum, t) => sum + t.amount, 0);
    return totalIncome - totalExpense;
  });
  currentCash = computed(() => {
    const income = this.transactions().filter(t => t.type === 'IN').reduce((sum, t) => sum + t.amount, 0);
    const expense = this.transactions().filter(t => t.type === 'OUT').reduce((sum, t) => sum + t.amount, 0);
    return income - expense;
  });
  totalOrders = computed(() => this.orders().length);
  lowStockCount = computed(() => this.products().filter(p => p.stock < 5).length);
  
  constructor() {
    this.loadData();
    
    effect(() => {
        this.saveToLocalStorage();
        this.requestFileSave();
    });

    effect(() => {
       this.applyTheme(this.shopConfig().themeId);
    });

    window.addEventListener('storage', (event) => {
      if (event.key === 'pitc_products' && event.newValue) this.products.set(JSON.parse(event.newValue));
      if (event.key === 'pitc_customers' && event.newValue) this.customers.set(JSON.parse(event.newValue));
      if (event.key === 'pitc_orders' && event.newValue) this.orders.set(JSON.parse(event.newValue));
      if (event.key === 'pitc_transactions' && event.newValue) this.transactions.set(JSON.parse(event.newValue));
      if (event.key === 'pitc_shop' && event.newValue) this.shopConfig.set(JSON.parse(event.newValue));
      if (event.key === 'pitc_github' && event.newValue) this.githubConfig.set(JSON.parse(event.newValue));
    });
  }

  applyTheme(themeId: string) {
    const theme = APP_THEMES.find(t => t.id === themeId) || APP_THEMES[0];
    const root = document.documentElement;
    Object.entries(theme.colors).forEach(([level, color]) => {
      root.style.setProperty(`--theme-color-${level}`, color);
    });
  }

  navigateTo(tab: string, params?: NavParams) {
    this.activeTab.set(tab);
    if (params) {
      this.navParams.set(params);
    }
  }

  // CART LOGIC
  addToCart(product: Product, quantity: number = 1) {
    if (product.stock <= 0) return;
    const existing = this.cart().find(i => i.productId === product.id);
    const currentQtyInCart = existing ? existing.quantity : 0;
    
    if (currentQtyInCart + quantity > product.stock) {
        alert(`Kho chỉ còn ${product.stock} sản phẩm "${product.name}"`);
        return;
    }

    if (existing) {
      this.cart.update(items => items.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + quantity, total: (i.quantity + quantity) * i.price } : i));
    } else {
      this.cart.update(items => [...items, { productId: product.id, productName: product.name, quantity: quantity, price: product.price, total: product.price * quantity }]);
    }
  }
  
  clearCart() {
    this.cart.set([]);
  }

  removeFromCart(id: string) {
    this.cart.update(items => items.filter(i => i.productId !== id));
  }
  // END CART LOGIC

  private saveToLocalStorage() {
    localStorage.setItem('pitc_products', JSON.stringify(this.products()));
    localStorage.setItem('pitc_customers', JSON.stringify(this.customers())); 
    localStorage.setItem('pitc_orders', JSON.stringify(this.orders()));
    localStorage.setItem('pitc_transactions', JSON.stringify(this.transactions()));
    localStorage.setItem('pitc_shop', JSON.stringify(this.shopConfig()));
    localStorage.setItem('pitc_github', JSON.stringify(this.githubConfig()));
  }

  // GITHUB STORAGE LOGIC
  updateGithubConfig(config: GithubConfig) {
      this.githubConfig.set(config);
  }

  private utf8_to_b64(str: string) {
    return window.btoa(unescape(encodeURIComponent(str)));
  }

  private b64_to_utf8(str: string) {
    return decodeURIComponent(escape(window.atob(str)));
  }

  async syncToGithub(): Promise<{success: boolean, message: string}> {
      const config = this.githubConfig();
      if (!config.enabled || !config.token || !config.owner || !config.repo) {
          return { success: false, message: 'Chưa cấu hình GitHub đầy đủ.' };
      }

      const content = {
          products: this.products(),
          customers: this.customers(),
          orders: this.orders(),
          transactions: this.transactions(),
          shop: this.shopConfig(),
          updatedAt: new Date().toISOString()
      };

      const fileUrl = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${config.path}`;
      
      try {
          // 1. Get current SHA (if file exists)
          let sha = '';
          try {
              const getRes = await fetch(fileUrl, {
                  headers: { 'Authorization': `Bearer ${config.token}`, 'Accept': 'application/vnd.github+json' }
              });
              if (getRes.ok) {
                  const data = await getRes.json();
                  sha = data.sha;
              }
          } catch(e) {}

          // 2. Upload/Update file
          const putRes = await fetch(fileUrl, {
              method: 'PUT',
              headers: { 
                  'Authorization': `Bearer ${config.token}`, 
                  'Content-Type': 'application/json',
                  'Accept': 'application/vnd.github+json'
              },
              body: JSON.stringify({
                  message: `FinAssistant Auto-Sync ${new Date().toLocaleDateString()}`,
                  content: this.utf8_to_b64(JSON.stringify(content, null, 2)),
                  sha: sha || undefined
              })
          });

          if (putRes.ok) {
              this.updateGithubConfig({ ...config, lastSync: new Date().toISOString() });
              return { success: true, message: 'Đã lưu lên GitHub thành công!' };
          } else {
              const err = await putRes.json();
              return { success: false, message: `Lỗi GitHub: ${err.message}` };
          }
      } catch (error: any) {
          return { success: false, message: `Lỗi kết nối: ${error.message}` };
      }
  }

  async pullFromGithub(): Promise<{success: boolean, message: string}> {
      const config = this.githubConfig();
      if (!config.enabled || !config.token || !config.owner || !config.repo) {
          return { success: false, message: 'Chưa cấu hình GitHub đầy đủ.' };
      }

      const fileUrl = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${config.path}`;

      try {
          const res = await fetch(fileUrl, {
              headers: { 'Authorization': `Bearer ${config.token}`, 'Accept': 'application/vnd.github+json' }
          });
          
          if (res.ok) {
              const data = await res.json();
              const contentStr = this.b64_to_utf8(data.content);
              const content = JSON.parse(contentStr);

              if (content.products) this.products.set(content.products);
              if (content.customers) this.customers.set(content.customers);
              if (content.orders) this.orders.set(content.orders);
              if (content.transactions) this.transactions.set(content.transactions);
              if (content.shop) this.shopConfig.set(content.shop);
              
              this.updateGithubConfig({ ...config, lastSync: new Date().toISOString() });
              return { success: true, message: 'Đã tải dữ liệu từ GitHub thành công!' };
          } else {
               return { success: false, message: 'Không tìm thấy file dữ liệu trên Repo.' };
          }
      } catch (error: any) {
          return { success: false, message: `Lỗi tải về: ${error.message}` };
      }
  }

  async connectToFile() {
    try {
      // @ts-ignore
      const [handle] = await window.showOpenFilePicker({
        types: [{ description: 'FinAssistant Data File', accept: { 'application/json': ['.json'] } }],
        multiple: false
      });
      this.fileHandle = handle;
      await this.loadFromFileSystem();
      this.isFileConnected.set(true);
      return true;
    } catch (err) { return false; }
  }

  async createNewFile() {
    try {
      // @ts-ignore
      const handle = await window.showSaveFilePicker({
        suggestedName: `FinAssistant_Data_${new Date().toISOString().slice(0,10)}.json`,
        types: [{ description: 'FinAssistant Data File', accept: { 'application/json': ['.json'] } }],
      });
      this.fileHandle = handle;
      this.isFileConnected.set(true);
      await this.saveToFileSystem();
      return true;
    } catch (err) { return false; }
  }

  private async loadFromFileSystem() {
    if (!this.fileHandle) return;
    const file = await this.fileHandle.getFile();
    const text = await file.text();
    try {
      const data = JSON.parse(text);
      if (data.products) this.products.set(data.products);
      if (data.customers) this.customers.set(data.customers); 
      if (data.orders) this.orders.set(data.orders);
      if (data.transactions) this.transactions.set(data.transactions);
      if (data.shop) this.shopConfig.set(data.shop);
      this.saveToLocalStorage();
    } catch (e) { alert('File lỗi!'); }
  }

  private saveTimeout: any;
  private requestFileSave() {
    if (!this.fileHandle) return;
    clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => { this.saveToFileSystem(); }, 2000);
  }

  private async saveToFileSystem() {
    if (!this.fileHandle) return;
    const data = {
      products: this.products(),
      customers: this.customers(),
      orders: this.orders(),
      transactions: this.transactions(),
      shop: this.shopConfig(),
      lastModified: new Date().toISOString()
    };
    try {
      const writable = await this.fileHandle.createWritable();
      await writable.write(JSON.stringify(data, null, 2));
      await writable.close();
      this.lastSaveTime.set(new Date());
    } catch (err) { this.isFileConnected.set(false); }
  }

  private loadData() {
    const products = localStorage.getItem('pitc_products');
    const customers = localStorage.getItem('pitc_customers');
    const orders = localStorage.getItem('pitc_orders');
    const transactions = localStorage.getItem('pitc_transactions');
    const shop = localStorage.getItem('pitc_shop');
    const github = localStorage.getItem('pitc_github');

    if (products) this.products.set(JSON.parse(products));
    else this.initDemoProducts();

    if (customers) this.customers.set(JSON.parse(customers)); 
    else this.initDemoCustomers();

    if (orders) this.orders.set(JSON.parse(orders));
    if (transactions) this.transactions.set(JSON.parse(transactions));
    if (shop) this.shopConfig.set(JSON.parse(shop));
    if (github) this.githubConfig.set(JSON.parse(github));
  }

  private initDemoProducts() {
    this.products.set([
      { id: 'SP001', name: 'iPhone 15 Pro Max', price: 34990000, importPrice: 31000000, stock: 8, category: 'Điện thoại', image: 'https://picsum.photos/id/1/200/200' },
      { id: 'SP002', name: 'MacBook Air M2', price: 26500000, importPrice: 24000000, stock: 3, category: 'Laptop', image: 'https://picsum.photos/id/2/200/200' },
    ]);
  }

  private initDemoCustomers() {
    this.customers.set([
      { id: 'KH001', name: 'Nguyễn Văn A', phone: '0909123456', address: 'Hà Nội', totalSpent: 45000000, debt: 0, lastVisit: new Date().toISOString() },
      { id: 'KH002', name: 'Trần Thị B', phone: '0988777666', address: 'HCM', totalSpent: 1200000, debt: 500000, lastVisit: new Date().toISOString() },
    ]);
  }

  addProduct(product: Omit<Product, 'id'>) {
    const newProduct: Product = { ...product, id: 'SP' + Date.now().toString().slice(-6), image: product.image || `https://picsum.photos/seed/${Date.now()}/200/200` };
    this.products.update(prev => [newProduct, ...prev]);
    return newProduct;
  }
  updateProduct(id: string, data: Partial<Product>) { this.products.update(prev => prev.map(p => p.id === id ? { ...p, ...data } : p)); }
  deleteProduct(id: string) { this.products.update(prev => prev.filter(p => p.id !== id)); }

  addCustomer(data: Omit<Customer, 'id' | 'totalSpent' | 'debt' | 'lastVisit'>) {
    const newCust: Customer = {
      id: 'KH' + Date.now().toString().slice(-6),
      ...data,
      totalSpent: 0,
      debt: 0,
      lastVisit: new Date().toISOString()
    };
    this.customers.update(prev => [newCust, ...prev]);
    return newCust;
  }
  updateCustomer(id: string, data: Partial<Customer>) {
    this.customers.update(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  }
  deleteCustomer(id: string) { this.customers.update(prev => prev.filter(c => c.id !== id)); }

  createOrder(orderData: { 
    customerName: string, 
    customerId?: string, 
    items: OrderItem[], 
    cashReceived: number, 
    subTotal: number, 
    discount: number, 
    tax: number,
    totalAmount: number,
    isDebt?: boolean
  }) {
    const orderId = 'HD' + Date.now().toString().slice(-6);
    const newOrder: Order = {
      id: orderId,
      date: new Date().toISOString(),
      ...orderData,
      changeReturned: orderData.isDebt ? 0 : (orderData.cashReceived - orderData.totalAmount)
    };

    this.products.update(allProducts => {
      return allProducts.map(p => {
        const item = orderData.items.find(i => i.productId === p.id);
        return item ? { ...p, stock: p.stock - item.quantity } : p;
      });
    });

    this.orders.update(prev => [newOrder, ...prev]);

    if (orderData.isDebt) {
       if (orderData.customerId) {
         this.updateCustomer(orderData.customerId, {
           lastVisit: new Date().toISOString(),
           debt: (this.customers().find(c => c.id === orderData.customerId)?.debt || 0) + orderData.totalAmount,
           totalSpent: (this.customers().find(c => c.id === orderData.customerId)?.totalSpent || 0) + orderData.totalAmount
         });
       }
    } else {
       this.addTransaction({
         type: 'IN',
         category: 'Doanh thu bán hàng',
         amount: newOrder.totalAmount,
         note: `Thu tiền #${newOrder.id} - ${newOrder.customerName}`,
         refId: newOrder.id
       });

       if (orderData.customerId) {
          const cust = this.customers().find(c => c.id === orderData.customerId);
          if (cust) {
            this.updateCustomer(cust.id, {
              lastVisit: new Date().toISOString(),
              totalSpent: cust.totalSpent + newOrder.totalAmount
            });
          }
       }
    }
    return newOrder;
  }

  deleteOrder(orderId: string) {
    const order = this.orders().find(o => o.id === orderId);
    if (!order) return;

    this.products.update(products => products.map(p => {
      const item = order.items.find(i => i.productId === p.id);
      return item ? { ...p, stock: p.stock + item.quantity } : p;
    }));

    this.transactions.update(trans => trans.filter(t => t.refId !== orderId));

    if (order.customerId) {
      const cust = this.customers().find(c => c.id === order.customerId);
      if (cust) {
        if (order.isDebt) {
           this.updateCustomer(cust.id, { 
             debt: Math.max(0, cust.debt - order.totalAmount),
             totalSpent: Math.max(0, cust.totalSpent - order.totalAmount)
           });
        } else {
           this.updateCustomer(cust.id, { 
             totalSpent: Math.max(0, cust.totalSpent - order.totalAmount)
           });
        }
      }
    }
    this.orders.update(orders => orders.filter(o => o.id !== orderId));
  }

  addTransaction(data: Omit<Transaction, 'id' | 'date'>) {
    const newTrans: Transaction = { id: 'TC' + Date.now().toString().slice(-7), date: new Date().toISOString(), ...data };
    this.transactions.update(prev => [newTrans, ...prev]);
  }
  deleteTransaction(id: string) { this.transactions.update(prev => prev.filter(t => t.id !== id)); }

  updateShopConfig(config: ShopConfig) { this.shopConfig.set(config); }
}
