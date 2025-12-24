
import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService, Order } from '../services/data.service';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-8 space-y-6 animate-fade-in max-w-7xl mx-auto h-full flex flex-col">
      <div class="flex flex-col xl:flex-row justify-between items-start xl:items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100 gap-4">
        <div>
          <h2 class="text-2xl font-bold text-slate-800">Lịch Sử Giao Dịch</h2>
          <p class="text-slate-500 text-sm">Quản lý và tra cứu đơn hàng</p>
        </div>
        
        <div class="flex flex-col md:flex-row gap-4 w-full xl:w-auto">
          <!-- Date Filter -->
          <div class="flex gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
             <input type="date" [(ngModel)]="startDate" class="bg-transparent border-none text-sm text-slate-600 focus:ring-0">
             <span class="text-slate-400 self-center">→</span>
             <input type="date" [(ngModel)]="endDate" class="bg-transparent border-none text-sm text-slate-600 focus:ring-0">
          </div>

          <!-- Search -->
          <div class="relative flex-1 md:w-64">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input 
              [(ngModel)]="searchText" 
              placeholder="Tìm mã đơn, tên khách..." 
              class="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[--theme-color-500] w-full transition-all"
            >
          </div>
        </div>
      </div>

      <!-- Orders List -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex-1 flex flex-col">
        <div class="overflow-x-auto flex-1">
          <table class="w-full text-left">
            <thead class="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-wider sticky top-0 z-10">
              <tr>
                <th class="px-6 py-4">Mã HĐ</th>
                <th class="px-6 py-4">Thời gian</th>
                <th class="px-6 py-4">Khách hàng</th>
                <th class="px-6 py-4 text-center">Số lượng</th>
                <th class="px-6 py-4 text-right">Tổng tiền</th>
                <th class="px-6 py-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (order of filteredOrders(); track order.id) {
                <tr class="hover:bg-[--theme-color-50]/30 transition-colors group" [class.bg-[--theme-color-50]]="selectedOrder?.id === order.id">
                  <td class="px-6 py-4 font-mono text-slate-500 group-hover:text-[--theme-color-600] font-bold">{{ order.id }}</td>
                  <td class="px-6 py-4 text-slate-600 text-sm">
                    <div>{{ order.date | date:'dd/MM/yyyy' }}</div>
                    <div class="text-xs text-slate-400">{{ order.date | date:'HH:mm' }}</div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="font-bold text-slate-700">{{ order.customerName }}</div>
                  </td>
                  <td class="px-6 py-4 text-center text-slate-600">
                    {{ order.items.length }} món
                  </td>
                  <td class="px-6 py-4 text-right font-bold text-[--theme-color-600]">
                    {{ order.totalAmount | number }} đ
                  </td>
                  <td class="px-6 py-4 text-center">
                    <div class="flex items-center justify-center gap-2">
                        <button (click)="viewOrder(order)" class="text-[--theme-color-600] hover:bg-[--theme-color-100] px-3 py-1.5 rounded-lg text-sm font-bold transition-colors">
                        Chi tiết
                        </button>
                        <button (click)="quickPrint(order)" class="text-slate-500 hover:bg-slate-100 hover:text-[--theme-color-600] px-3 py-1.5 rounded-lg text-sm font-bold transition-colors" title="In hóa đơn">
                        🖨️
                        </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="px-6 py-20 text-center text-slate-400 flex flex-col items-center">
                    <span class="text-4xl mb-2">📭</span>
                    <span>Không tìm thấy đơn hàng nào trong khoảng thời gian này</span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Order Detail Modal -->
    @if (selectedOrder) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 no-print">
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" (click)="closeModal()"></div>
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10 animate-scale-in flex flex-col max-h-[90vh]">
          
          <div class="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <div>
              <h3 class="font-bold text-lg text-slate-800">Chi Tiết Đơn Hàng</h3>
              <p class="text-xs text-slate-500 font-mono">{{ selectedOrder?.id }}</p>
            </div>
            <button (click)="closeModal()" class="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-600">&times;</button>
          </div>
          
          <div class="p-6 overflow-y-auto bg-slate-50/30">
            <!-- Order Meta -->
            <div class="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div class="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                <p class="text-slate-400 text-xs uppercase">Thời gian</p>
                <p class="font-bold text-slate-700">{{ selectedOrder?.date | date:'dd/MM/yyyy HH:mm' }}</p>
              </div>
              <div class="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                <p class="text-slate-400 text-xs uppercase">Khách hàng</p>
                <p class="font-bold text-slate-700">{{ selectedOrder?.customerName }}</p>
              </div>
            </div>

            <!-- Items -->
            <div class="space-y-3 mb-6">
              <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Danh sách sản phẩm</p>
              @for (item of selectedOrder?.items; track item.productId) {
                <div class="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                  <div>
                    <p class="font-bold text-slate-800 text-sm">{{ item.productName }}</p>
                    <p class="text-xs text-slate-500">{{ item.price | number }} x {{ item.quantity }}</p>
                  </div>
                  <p class="font-bold text-[--theme-color-600]">{{ item.total | number }}</p>
                </div>
              }
            </div>

            <!-- Summary -->
            <div class="space-y-2 border-t border-dashed border-slate-300 pt-4 text-sm">
              <div class="flex justify-between text-slate-500">
                <span>Tổng tiền hàng</span>
                <span>{{ selectedOrder?.totalAmount | number }} đ</span>
              </div>
              <div class="flex justify-between text-slate-500">
                <span>Khách đưa</span>
                <span>{{ selectedOrder?.cashReceived | number }} đ</span>
              </div>
              <div class="flex justify-between text-emerald-600 font-bold text-lg">
                <span>Tiền thừa</span>
                <span>{{ selectedOrder?.changeReturned | number }} đ</span>
              </div>
            </div>
          </div>

          <div class="px-6 py-4 bg-white border-t border-slate-100 flex gap-3">
             <button (click)="deleteOrder()" class="px-4 py-3 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors border border-red-100">
              Hủy Đơn & Hoàn Tiền
            </button>
            
            <button (click)="printOrder()" class="flex-1 px-4 py-3 bg-[--theme-color-600] text-white rounded-xl font-bold hover:bg-[--theme-color-700] shadow-lg shadow-[--theme-color-200] transition-all active:scale-95 flex items-center justify-center gap-2">
              <span>🖨️</span> In Hóa Đơn
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Printable Area for History -->
    @if (selectedOrder) {
      <div id="printable-area" class="hidden">
        <div class="receipt-header">
            <div style="font-size: 32px; margin-bottom: 5px;">🛍️</div>
            <div class="receipt-title">{{ dataService.shopConfig().shopName }}</div>
            <div class="receipt-info">{{ dataService.shopConfig().address }}</div>
            <div class="receipt-info">Hotline: <b>{{ dataService.shopConfig().phone }}</b></div>
        </div>
        
        <div class="receipt-divider"></div>
        
        <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
           <span>Số: #{{ selectedOrder?.id }}</span>
           <span>{{ selectedOrder?.date | date:'dd/MM/yy HH:mm' }}</span>
        </div>
        <div style="font-size: 12px; margin-bottom: 8px;">
           Khách: <span class="receipt-bold">{{ selectedOrder?.customerName }}</span>
           <span style="float: right;">(Sao y bản chính)</span>
        </div>

        <div class="receipt-divider"></div>

        <table class="receipt-table">
            <thead>
                <tr>
                    <th style="width: 40%;">Tên SP</th>
                    <th style="width: 15%; text-align: center;">SL</th>
                    <th style="width: 20%; text-align: right;">ĐG</th>
                    <th style="width: 25%; text-align: right;">Thành tiền</th>
                </tr>
            </thead>
            <tbody>
                @for (item of selectedOrder?.items; track item.productId) {
                    <tr>
                        <td class="receipt-bold">{{ item.productName }}</td>
                        <td style="text-align: center;">{{ item.quantity }}</td>
                        <td style="text-align: right;">{{ item.price | number }}</td>
                        <td style="text-align: right; font-weight: bold;">{{ item.total | number }}</td>
                    </tr>
                }
            </tbody>
        </table>

        <div class="receipt-divider"></div>

        <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
            <span>Tổng tiền hàng:</span>
            <span>{{ selectedOrder?.subTotal | number }}</span>
        </div>
        
        @if (selectedOrder?.discount) {
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span>Giảm giá:</span>
              <span>-{{ selectedOrder?.discount | number }}</span>
          </div>
        }
        
        @if (selectedOrder?.tax) {
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span>VAT:</span>
              <span>{{ selectedOrder?.tax | number }}</span>
          </div>
        }

        <div style="display: flex; justify-content: space-between; margin-top: 5px; align-items: flex-end;">
            <span class="receipt-bold" style="font-size: 14px;">THANH TOÁN:</span>
            <span class="receipt-large">{{ selectedOrder?.totalAmount | number }}</span>
        </div>
        
        @if (selectedOrder?.isDebt) {
           <div style="text-align: center; border: 2px solid #000; padding: 5px; margin-top: 10px; font-weight: bold; font-size: 16px;">
             GHI NỢ KHÁCH HÀNG
           </div>
        } @else {
           <div class="receipt-divider"></div>
           <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span>Tiền khách đưa:</span>
              <span>{{ selectedOrder?.cashReceived | number }}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
              <span>Tiền thừa:</span>
              <span>{{ selectedOrder?.changeReturned | number }}</span>
          </div>
        }
        
        <div class="receipt-footer">
            <p style="margin-bottom: 5px;">{{ dataService.shopConfig().footerMessage }}</p>
            @if (dataService.shopConfig().qrCodeImage) {
               <div style="margin: 10px auto; width: 100px; display: flex; flex-direction: column; align-items: center;">
                 <img [src]="dataService.shopConfig().qrCodeImage" style="width: 100px; height: 100px; object-fit: contain;">
                 <p style="font-size: 10px; margin-top: 2px;">Quét để thanh toán</p>
               </div>
            }
            <p style="font-size: 10px; margin-top: 5px;">Powered by FinAssistant</p>
        </div>
    </div>
    }
  `,
  styles: [`
    .animate-scale-in { animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  `]
})
export class OrdersComponent {
  dataService = inject(DataService);
  searchText = ''; startDate = ''; endDate = ''; selectedOrder: Order | null = null;
  constructor() {
    effect(() => {
       const params = this.dataService.navParams();
       if (params && params.orderId) {
          const order = this.dataService.orders().find(o => o.id === params.orderId);
          if (order) { this.searchText = params.orderId; this.selectedOrder = order; }
       }
    });
  }
  filteredOrders = computed(() => {
    const term = this.searchText.toLowerCase();
    let list = this.dataService.orders();
    if (this.startDate) { const start = new Date(this.startDate); start.setHours(0, 0, 0, 0); list = list.filter(o => new Date(o.date) >= start); }
    if (this.endDate) { const end = new Date(this.endDate); end.setHours(23, 59, 59, 999); list = list.filter(o => new Date(o.date) <= end); }
    return list.filter(o => o.id.toLowerCase().includes(term) || o.customerName.toLowerCase().includes(term)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });
  viewOrder(order: Order) { this.selectedOrder = order; }
  quickPrint(order: Order) { this.selectedOrder = order; setTimeout(() => { window.print(); }, 100); }
  closeModal() { this.selectedOrder = null; if (this.dataService.navParams()?.orderId) { this.dataService.navParams.set(null); this.searchText = ''; } }
  deleteOrder() { if (!this.selectedOrder) return; if (confirm(`Xác nhận hủy đơn hàng ${this.selectedOrder.id}?`)) { this.dataService.deleteOrder(this.selectedOrder.id); this.selectedOrder = null; } }
  printOrder() { setTimeout(() => { window.print(); }, 100); }
}
