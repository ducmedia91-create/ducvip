
import { Component, inject, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../services/data.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-8 space-y-8 animate-fade-in max-w-7xl mx-auto">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 class="text-3xl font-extrabold text-slate-800 tracking-tight">Tổng Quan Kinh Doanh</h2>
          <p class="text-slate-500 font-medium mt-1">Hệ thống trợ lý tài chính thông minh</p>
        </div>
        <div class="text-sm bg-white/80 backdrop-blur border border-[--theme-color-100] text-[--theme-color-700] px-4 py-2 rounded-full font-bold shadow-sm flex items-center gap-2">
          <span>📅</span> {{ today | date:'fullDate' }}
        </div>
      </div>

      <!-- AI ASSISTANT PANEL -->
      <div class="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-3xl p-6 shadow-xl text-white relative overflow-hidden group">
        <div class="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:opacity-20 transition-opacity"></div>
        
        <div class="relative z-10">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
               <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl backdrop-blur-sm animate-pulse">✨</div>
               <h3 class="font-bold text-lg">Trợ Lý Phân Tích & Ra Lệnh</h3>
            </div>
          </div>

          <!-- Command Input -->
          <div class="mb-5 relative group/input">
             <input 
               [(ngModel)]="commandText" 
               (keyup.enter)="processCommand()"
               placeholder="Gõ lệnh: 'Bán 2 iphone', 'Nhập 50 ốp lưng', 'Xem doanh thu'..." 
               class="w-full bg-white/20 border border-white/30 rounded-xl px-4 py-4 text-white placeholder-white/60 focus:outline-none focus:bg-white/30 transition-all backdrop-blur-md shadow-inner font-bold text-lg"
             >
             <button (click)="processCommand()" class="absolute right-2 top-1/2 -translate-y-1/2 text-white bg-white/20 p-2 rounded-lg hover:bg-white/40 transition-colors">
               🚀
             </button>
             
             <!-- Assistant Feedback -->
             @if (assistantResponse()) {
               <div class="absolute top-full left-0 mt-2 bg-white text-[--theme-color-800] p-3 rounded-xl shadow-xl text-sm font-bold border border-white/50 animate-slide-in z-20 flex items-center gap-2">
                 <span>🤖</span> {{ assistantResponse() }}
               </div>
             }
          </div>

          <div class="bg-white/10 rounded-2xl p-5 backdrop-blur-sm border border-white/10 shadow-inner">
            <p class="text-lg font-medium leading-relaxed">{{ assistantMessage() }}</p>
            
            <div class="mt-4 flex flex-wrap gap-2">
               @if(dataService.lowStockCount() > 0) {
                 <span class="text-xs font-bold bg-red-500/90 text-white px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm cursor-pointer hover:scale-105 transition-transform" (click)="dataService.navigateTo('products', { filter: 'low-stock' })">
                    ⚠️ Cần nhập {{ dataService.lowStockCount() }} mặt hàng
                 </span>
               }
               @if(dataService.totalRevenue() > 0) {
                 <span class="text-xs font-bold bg-emerald-500/90 text-white px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm">
                    📈 Doanh thu tốt
                 </span>
               }
            </div>
          </div>
        </div>
      </div>
      
      <!-- Premium Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- Revenue Card -->
        <div (click)="dataService.navigateTo('finance')" class="group relative overflow-hidden rounded-3xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-[--theme-color-500]/30 bg-white border border-slate-100">
          <div class="relative z-10">
            <div class="flex justify-between items-start mb-4">
              <div class="p-3 bg-[--theme-color-50] text-[--theme-color-600] rounded-2xl group-hover:bg-[--theme-color-600] group-hover:text-white transition-colors">
                <span class="text-2xl">💰</span>
              </div>
              <span class="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">Doanh Thu</span>
            </div>
            <h3 class="text-3xl font-extrabold text-slate-800 tracking-tight mb-1 group-hover:text-[--theme-color-600] transition-colors">{{ dataService.totalRevenue() | number }} <span class="text-lg opacity-80">đ</span></h3>
            <p class="text-slate-400 text-xs font-bold">Tổng thu từ đơn hàng</p>
          </div>
        </div>

        <!-- Profit Card -->
        <div (click)="dataService.navigateTo('finance')" class="group relative overflow-hidden rounded-3xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-500/20 bg-white border border-slate-100">
           <div class="relative z-10 flex flex-col h-full justify-between">
             <div class="flex justify-between items-start">
               <div>
                 <p class="text-slate-500 font-bold text-sm uppercase tracking-wide">Lợi Nhuận Ròng</p>
                 <h3 class="text-3xl font-extrabold text-emerald-600 mt-2">{{ dataService.totalProfit() | number }} đ</h3>
               </div>
               <div class="p-3 bg-emerald-100 text-emerald-600 rounded-2xl group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                 <span class="text-xl">📈</span>
               </div>
             </div>
           </div>
        </div>

        <!-- Orders Card -->
        <div (click)="dataService.navigateTo('orders')" class="group relative overflow-hidden rounded-3xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-[--theme-color-500]/20 bg-white border border-slate-100">
           <div class="flex justify-between items-start">
             <div>
               <p class="text-slate-500 font-bold text-sm uppercase tracking-wide">Đơn Hàng</p>
               <h3 class="text-3xl font-extrabold text-slate-800 mt-2">{{ dataService.totalOrders() }}</h3>
             </div>
             <div class="p-3 bg-[--theme-color-50] text-[--theme-color-600] rounded-2xl group-hover:rotate-12 transition-transform">
               <span class="text-xl">🧾</span>
             </div>
           </div>
           
           <div class="mt-auto pt-4 flex items-center gap-2 text-sm text-slate-400 group-hover:text-[--theme-color-600] transition-colors font-bold">
             <span>Xem lịch sử chi tiết</span>
             <span>→</span>
           </div>
        </div>

        <!-- Stock Alert Card -->
        <div (click)="dataService.navigateTo('products', { filter: 'low-stock' })" class="group relative overflow-hidden rounded-3xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-red-500/20 bg-white border border-slate-100">
          <div class="absolute -right-4 -bottom-4 w-24 h-24 bg-red-50 rounded-full blur-xl group-hover:bg-red-100 transition-colors"></div>
          
          <div class="flex justify-between items-start relative z-10">
            <div>
              <p class="text-slate-500 font-bold text-sm uppercase tracking-wide">Cảnh Báo Kho</p>
              <h3 class="text-3xl font-extrabold mt-2 transition-colors" [class]="dataService.lowStockCount() > 0 ? 'text-red-500' : 'text-slate-800'">
                {{ dataService.lowStockCount() }}
              </h3>
            </div>
            <div class="p-3 rounded-2xl transition-all" [class]="dataService.lowStockCount() > 0 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-400'">
              <span class="text-xl">⚠️</span>
            </div>
          </div>
          
          <div class="mt-auto pt-4 relative z-10">
             <p class="text-sm font-bold" [class]="dataService.lowStockCount() > 0 ? 'text-red-500' : 'text-slate-400'">
               {{ dataService.lowStockCount() > 0 ? 'Cần nhập hàng ngay' : 'Kho hàng ổn định' }}
             </p>
          </div>
        </div>
      </div>
      
       <!-- Charts Section -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Live Revenue Chart -->
        <div class="bg-white rounded-3xl shadow-lg shadow-slate-200/50 border border-white/50 p-8 flex flex-col relative overflow-hidden">
          <div class="mb-8 relative z-10">
             <h3 class="font-bold text-xl text-slate-800">Doanh thu 7 ngày</h3>
             <p class="text-sm text-slate-500 font-medium">Biểu đồ tăng trưởng tuần này</p>
          </div>
          <div class="flex-1 flex items-end justify-between gap-3 h-64 relative z-10">
            @for (day of weeklyChartData(); track day.label) {
              <div class="flex flex-col items-center justify-end h-full w-full group relative">
                <div class="w-full rounded-t-xl relative transition-all duration-700 ease-out flex items-end justify-center overflow-hidden" [ngClass]="day.isToday ? 'bg-gradient-to-t from-[--theme-color-600] to-[--theme-color-400] shadow-lg' : 'bg-slate-100 group-hover:bg-[--theme-color-200]'" [style.height.%]="day.percent"></div>
                <div class="mt-3 text-[11px] font-bold text-slate-400">{{ day.label }}</div>
              </div>
            }
          </div>
        </div>

        <!-- Top Selling -->
        <div class="bg-white rounded-3xl shadow-lg shadow-slate-200/50 border border-white/50 overflow-hidden flex flex-col">
          <div class="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center backdrop-blur-sm">
            <h3 class="font-bold text-lg text-slate-800">🏆 Top Bán Chạy</h3>
          </div>
          <div class="flex-1 overflow-y-auto p-4 space-y-3">
            @for (prod of topProducts(); track prod.id; let i = $index) {
              <div class="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors">
                <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs">{{ i + 1 }}</div>
                <div class="flex-1 min-w-0"><p class="text-sm font-bold text-slate-800 truncate">{{ prod.name }}</p></div>
                <p class="font-bold text-[--theme-color-600]">{{ prod.qty }}</p>
              </div>
            } @empty {
                <div class="p-6 text-center text-slate-400 text-sm">Chưa có dữ liệu</div>
            }
          </div>
        </div>
        
        <!-- Recent Orders -->
        <div class="bg-white rounded-3xl shadow-lg shadow-slate-200/50 border border-white/50 overflow-hidden flex flex-col">
          <div class="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center backdrop-blur-sm">
             <h3 class="font-bold text-lg text-slate-800">Giao dịch mới</h3>
          </div>
           <div class="flex-1 overflow-y-auto p-2">
            @for (order of recentOrders(); track order.id) {
               <div class="p-3 mb-1 rounded-2xl hover:bg-slate-50 flex justify-between items-center">
                 <div>
                    <p class="font-bold text-slate-700 text-sm">{{ order.customerName }}</p>
                    <p class="text-xs text-slate-400">{{ order.date | date:'HH:mm' }}</p>
                 </div>
                 <span class="font-bold text-emerald-600 text-sm">+{{ order.totalAmount | number }}</span>
               </div>
            } @empty {
                 <div class="p-6 text-center text-slate-400 text-sm">Chưa có đơn hàng</div>
            }
           </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    .animate-slide-in { animation: slideIn 0.3s ease-out; }
    @keyframes slideIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class DashboardComponent {
  dataService = inject(DataService);
  today = new Date();
  
  commandText = '';
  assistantResponse = signal<string>('');

  recentOrders = computed(() => {
    return this.dataService.orders()
      .slice(0, 6)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

  topProducts = computed(() => {
    const map = new Map<string, {id: string, name: string, qty: number}>();
    this.dataService.orders().forEach(order => {
      order.items.forEach(item => {
        const existing = map.get(item.productId) || { id: item.productId, name: item.productName, qty: 0 };
        existing.qty += item.quantity;
        map.set(item.productId, existing);
      });
    });
    return Array.from(map.values()).sort((a, b) => b.qty - a.qty).slice(0, 5);
  });

  weeklyChartData = computed(() => {
    const days = [];
    const orders = this.dataService.orders();
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push(d);
    }
    const rawData = days.map(day => {
      const dailyTotal = orders
        .filter(o => {
          const od = new Date(o.date);
          return od.getDate() === day.getDate() && od.getMonth() === day.getMonth() && od.getFullYear() === day.getFullYear();
        })
        .reduce((sum, o) => sum + o.totalAmount, 0);
      return { date: day, value: dailyTotal, label: day.getDate() + '/' + (day.getMonth() + 1), isToday: day.getDate() === today.getDate() };
    });
    const maxVal = Math.max(...rawData.map(d => d.value), 1);
    return rawData.map(d => ({ ...d, percent: (d.value / maxVal) * 80 + 5 }));
  });

  assistantMessage = computed(() => {
    const orders = this.dataService.orders().filter(o => {
      const d = new Date(o.date);
      const today = new Date();
      return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    });
    const count = orders.length;
    const rev = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const lowStock = this.dataService.lowStockCount();
    
    const h = new Date().getHours();
    let greeting = h < 11 ? 'Chào buổi sáng' : (h < 14 ? 'Chào buổi trưa' : (h < 18 ? 'Chào buổi chiều' : 'Chào buổi tối'));

    if (count === 0) {
      if (lowStock > 3) return `${greeting}! Kho đang báo động ${lowStock} món sắp hết. Gõ "Nhập hàng" để xử lý ngay.`;
      return `${greeting}! Tôi đang chờ lệnh từ bạn. Thử gõ "Bán 1 cafe" xem sao?`;
    }
    return `${greeting}! Đã chốt ${count} đơn, doanh thu ${new Intl.NumberFormat('vi-VN').format(rev)} đ.`;
  });

  processCommand() {
    if (!this.commandText.trim()) return;
    const cmd = this.commandText.toLowerCase().trim();
    this.assistantResponse.set('');

    // Command: View Finance
    if (cmd.includes('doanh thu') || cmd.includes('tài chính') || cmd.includes('lợi nhuận')) {
        this.dataService.navigateTo('finance');
        this.assistantResponse.set('Đang mở bảng tài chính...');
        this.commandText = '';
        return;
    }

    // Command: Sell Item (e.g., "bán 2 iphone", "ban 5 op lung")
    if (cmd.startsWith('bán') || cmd.startsWith('ban')) {
        const parts = cmd.split(' ');
        const qty = parseInt(parts[1]); 
        const productName = parts.slice(2).join(' ');

        if (!isNaN(qty) && productName) {
            const product = this.dataService.products().find(p => 
                p.name.toLowerCase().includes(productName) || 
                p.category.toLowerCase().includes(productName)
            );

            if (product) {
                this.dataService.addToCart(product, qty);
                this.dataService.navigateTo('sales');
                this.assistantResponse.set(`Đã thêm ${qty} ${product.name} vào đơn hàng.`);
                this.commandText = '';
            } else {
                this.assistantResponse.set(`Không tìm thấy sản phẩm nào tên "${productName}"`);
            }
            return;
        }
    }

    // Command: Import Item (e.g., "nhập 50 iphone")
    if (cmd.startsWith('nhập') || cmd.startsWith('nhap')) {
         const parts = cmd.split(' ');
         const qty = parseInt(parts[1]); 
         const productName = parts.slice(2).join(' ');
         
         if (productName) {
            this.dataService.navigateTo('products', { searchTerm: productName });
            this.assistantResponse.set(`Đang tìm "${productName}" trong kho để nhập hàng...`);
            this.commandText = '';
            return;
         }
    }

    this.assistantResponse.set('Tôi chưa hiểu lệnh này. Thử lại nhé!');
  }
}
