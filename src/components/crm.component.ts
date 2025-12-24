
import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService, Customer } from '../services/data.service';

@Component({
  selector: 'app-crm',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-full flex flex-col md:flex-row bg-slate-50 overflow-hidden">
      
      <!-- List Sidebar (Left) -->
      <div class="w-full md:w-96 bg-white border-r border-slate-200 flex flex-col h-full z-10">
        <!-- Search & Filter -->
        <div class="p-4 border-b border-slate-100 space-y-3 bg-slate-50/50">
          <h2 class="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <span>👥</span> Khách Hàng
          </h2>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input 
              [(ngModel)]="searchText" 
              placeholder="Tìm tên, sđt..." 
              class="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[--theme-color-500] transition-all text-sm"
            >
          </div>
          <div class="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button (click)="filterType = 'ALL'" [class]="getFilterClass('ALL')">Tất cả</button>
            <button (click)="filterType = 'DEBT'" [class]="getFilterClass('DEBT')">Đang nợ</button>
            <button (click)="filterType = 'VIP'" [class]="getFilterClass('VIP')">VIP</button>
          </div>
          <button (click)="openAddModal()" class="w-full py-2.5 bg-[--theme-color-600] text-white rounded-xl font-bold shadow-lg shadow-[--theme-color-200] hover:bg-[--theme-color-700] active:scale-95 transition-all text-sm flex items-center justify-center gap-2">
            <span>＋</span> Thêm Khách Mới
          </button>
        </div>

        <!-- Customer List -->
        <div class="flex-1 overflow-y-auto">
          @for (cust of filteredCustomers(); track cust.id) {
            <div 
              (click)="selectCustomer(cust)" 
              class="p-4 border-b border-slate-50 cursor-pointer hover:bg-[--theme-color-50] transition-colors group relative"
              [class.bg-[--theme-color-50]]="selectedCustomer?.id === cust.id"
            >
              <div class="flex justify-between items-start mb-1">
                <h3 class="font-bold text-slate-800 text-sm group-hover:text-[--theme-color-700]">{{ cust.name }}</h3>
                <span class="text-[10px] font-bold px-1.5 py-0.5 rounded border" [class]="getRankBadge(cust.totalSpent).class">
                  {{ getRankBadge(cust.totalSpent).label }}
                </span>
              </div>
              <p class="text-xs text-slate-500 font-mono mb-2">{{ cust.phone }}</p>
              
              <div class="flex justify-between items-end text-xs">
                <div>
                   <p class="text-slate-400">Chi tiêu</p>
                   <p class="font-bold text-slate-700">{{ cust.totalSpent | number }}</p>
                </div>
                @if (cust.debt > 0) {
                  <div class="text-right">
                    <p class="text-red-400 font-bold">Nợ: {{ cust.debt | number }}</p>
                  </div>
                }
              </div>
              
              <!-- Selection Indicator -->
              @if (selectedCustomer?.id === cust.id) {
                <div class="absolute left-0 top-0 bottom-0 w-1 bg-[--theme-color-600]"></div>
              }
            </div>
          } @empty {
            <div class="p-8 text-center text-slate-400 text-sm">
              Không tìm thấy khách hàng
            </div>
          }
        </div>
      </div>

      <!-- Detail View (Right) -->
      <div class="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 relative">
        @if (selectedCustomer) {
          <!-- Header -->
          <div class="bg-white p-6 border-b border-slate-200 flex justify-between items-start shadow-sm z-10">
            <div class="flex items-center gap-4">
              <div class="w-16 h-16 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-2xl shadow-inner text-slate-500">
                {{ selectedCustomer.name.charAt(0).toUpperCase() }}
              </div>
              <div>
                <h2 class="text-2xl font-extrabold text-slate-800">{{ selectedCustomer.name }}</h2>
                <div class="flex items-center gap-2 text-sm text-slate-500 mt-1">
                  <span>📞 {{ selectedCustomer.phone }}</span>
                  <span class="w-1 h-1 bg-slate-300 rounded-full"></span>
                  <span>📍 {{ selectedCustomer.address || 'Chưa có địa chỉ' }}</span>
                </div>
              </div>
            </div>
            
            <div class="flex flex-col items-end gap-2">
               <div class="text-right">
                 <p class="text-xs text-slate-400 uppercase font-bold tracking-wider">Hạng thành viên</p>
                 <div class="flex items-center gap-2 justify-end">
                    <span class="text-2xl">{{ getRankBadge(selectedCustomer.totalSpent).icon }}</span>
                    <span class="font-black text-lg text-transparent bg-clip-text bg-gradient-to-r" [class]="getRankBadge(selectedCustomer.totalSpent).textClass">
                      {{ getRankBadge(selectedCustomer.totalSpent).label }}
                    </span>
                 </div>
               </div>
               <div class="flex gap-2 mt-2">
                 <button (click)="openEditModal()" class="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50">Sửa</button>
                 <button (click)="deleteCustomer()" class="px-3 py-1.5 border border-red-200 rounded-lg text-xs font-bold text-red-500 hover:bg-red-50">Xóa</button>
               </div>
            </div>
          </div>

          <!-- Stats & Debt Actions -->
          <div class="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
             <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
               <p class="text-slate-400 text-xs font-bold uppercase">Tổng chi tiêu</p>
               <p class="text-2xl font-extrabold text-[--theme-color-600] mt-1">{{ selectedCustomer.totalSpent | number }} đ</p>
             </div>
             
             <!-- DEBT BOX -->
             <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
               <div class="absolute right-0 top-0 p-2 opacity-10 text-6xl group-hover:scale-110 transition-transform">📒</div>
               <p class="text-slate-400 text-xs font-bold uppercase">Dư nợ hiện tại</p>
               <p class="text-2xl font-extrabold mt-1" [class]="selectedCustomer.debt > 0 ? 'text-red-500' : 'text-emerald-500'">
                 {{ selectedCustomer.debt | number }} đ
               </p>
               
               @if (selectedCustomer.debt > 0) {
                 <button (click)="openPayDebtModal()" class="mt-3 w-full py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors">
                   Thanh toán nợ
                 </button>
               }
             </div>

             <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
               <p class="text-slate-400 text-xs font-bold uppercase">Ghé thăm cuối</p>
               <p class="text-lg font-bold text-slate-700 mt-1">{{ selectedCustomer.lastVisit | date:'dd/MM/yyyy' }}</p>
               <p class="text-xs text-slate-400">{{ selectedCustomer.lastVisit | date:'HH:mm' }}</p>
             </div>
          </div>

          <!-- History Tab -->
          <div class="flex-1 px-6 pb-6 overflow-hidden flex flex-col">
            <h3 class="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span>📜</span> Lịch sử mua hàng
            </h3>
            <div class="bg-white rounded-2xl border border-slate-100 flex-1 overflow-y-auto shadow-sm">
               <table class="w-full text-left">
                 <thead class="bg-slate-50 text-xs uppercase text-slate-400 font-bold sticky top-0">
                   <tr>
                     <th class="px-4 py-3">Mã Đơn</th>
                     <th class="px-4 py-3">Ngày</th>
                     <th class="px-4 py-3 text-right">Giá trị</th>
                     <th class="px-4 py-3 text-center">Trạng thái</th>
                   </tr>
                 </thead>
                 <tbody class="divide-y divide-slate-50 text-sm">
                   @for (order of customerOrders(); track order.id) {
                     <tr class="hover:bg-slate-50">
                       <td class="px-4 py-3 font-mono font-bold text-[--theme-color-600] cursor-pointer hover:underline" (click)="dataService.navigateTo('orders', {orderId: order.id})">
                         {{ order.id }}
                       </td>
                       <td class="px-4 py-3 text-slate-600">{{ order.date | date:'dd/MM/yyyy' }}</td>
                       <td class="px-4 py-3 text-right font-bold">{{ order.totalAmount | number }}</td>
                       <td class="px-4 py-3 text-center">
                         @if (order.isDebt) {
                           <span class="bg-red-100 text-red-600 px-2 py-1 rounded text-xs font-bold">Ghi nợ</span>
                         } @else {
                           <span class="bg-emerald-100 text-emerald-600 px-2 py-1 rounded text-xs font-bold">Đã trả</span>
                         }
                       </td>
                     </tr>
                   } @empty {
                     <tr><td colspan="4" class="p-8 text-center text-slate-400">Chưa có đơn hàng nào</td></tr>
                   }
                 </tbody>
               </table>
            </div>
          </div>

        } @else {
          <!-- Empty State -->
          <div class="flex-1 flex flex-col items-center justify-center text-slate-300">
            <div class="text-6xl mb-4 grayscale opacity-50">👥</div>
            <p class="text-lg font-medium">Chọn một khách hàng để xem chi tiết</p>
          </div>
        }
      </div>
    </div>

    <!-- Add/Edit Customer Modal -->
    @if (showModal) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" (click)="showModal = false"></div>
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative z-10 animate-scale-in">
          <div class="p-6 bg-slate-50 border-b border-slate-100">
            <h3 class="font-bold text-xl text-slate-800">{{ isEditing ? 'Cập Nhật' : 'Thêm Khách Mới' }}</h3>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-1">Tên khách hàng</label>
              <input [(ngModel)]="form.name" class="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-[--theme-color-500] outline-none">
            </div>
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-1">Số điện thoại</label>
              <input [(ngModel)]="form.phone" class="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-[--theme-color-500] outline-none">
            </div>
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-1">Địa chỉ</label>
              <input [(ngModel)]="form.address" class="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-[--theme-color-500] outline-none">
            </div>
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-1">Ghi chú</label>
              <textarea [(ngModel)]="form.notes" class="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-[--theme-color-500] outline-none" rows="2"></textarea>
            </div>
          </div>
          <div class="p-6 border-t border-slate-100 flex justify-end gap-3">
            <button (click)="showModal = false" class="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-xl">Hủy</button>
            <button (click)="saveCustomer()" class="px-6 py-2 bg-[--theme-color-600] text-white font-bold rounded-xl hover:bg-[--theme-color-700] shadow-lg">Lưu</button>
          </div>
        </div>
      </div>
    }

    <!-- Pay Debt Modal -->
    @if (showDebtModal) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" (click)="showDebtModal = false"></div>
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden relative z-10 animate-scale-in">
           <div class="p-6 bg-red-50 border-b border-red-100 text-center">
             <h3 class="font-bold text-lg text-red-800">Thanh Toán Nợ</h3>
             <p class="text-sm text-red-600">Khách: {{ selectedCustomer?.name }}</p>
             <p class="text-2xl font-extrabold text-red-600 mt-2">{{ selectedCustomer?.debt | number }} đ</p>
           </div>
           
           <div class="p-6">
             <label class="block text-sm font-bold text-slate-700 mb-2">Số tiền khách trả</label>
             <input type="number" [(ngModel)]="debtPaymentAmount" class="w-full px-4 py-3 border-2 border-red-100 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-xl font-bold text-center">
             
             <button (click)="debtPaymentAmount = selectedCustomer?.debt || 0" class="mt-2 text-xs text-[--theme-color-600] font-bold hover:underline">Trả hết toàn bộ</button>
           </div>

           <div class="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
             <button (click)="showDebtModal = false" class="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-200 rounded-xl">Hủy</button>
             <button (click)="confirmDebtPayment()" class="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg">Xác nhận</button>
           </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .animate-scale-in { animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  `]
})
export class CrmComponent {
  dataService = inject(DataService);
  searchText = '';
  filterType: 'ALL' | 'DEBT' | 'VIP' = 'ALL';
  selectedCustomer: Customer | null = null;
  showModal = false;
  isEditing = false;
  form: any = { name: '', phone: '', address: '', notes: '' };
  showDebtModal = false;
  debtPaymentAmount = 0;

  filteredCustomers = computed(() => {
    const term = this.searchText.toLowerCase();
    let list = this.dataService.customers();
    if (this.filterType === 'DEBT') list = list.filter(c => c.debt > 0);
    if (this.filterType === 'VIP') list = list.filter(c => c.totalSpent >= 10000000);
    return list.filter(c => c.name.toLowerCase().includes(term) || c.phone.includes(term));
  });

  customerOrders = computed(() => {
    if (!this.selectedCustomer) return [];
    return this.dataService.orders()
      .filter(o => o.customerId === this.selectedCustomer!.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

  getFilterClass(type: string) {
    const base = "px-4 py-1.5 rounded-lg text-xs font-bold border transition-all whitespace-nowrap ";
    if (this.filterType === type) return base + "bg-[--theme-color-600] text-white border-[--theme-color-600] shadow-md";
    return base + "bg-white text-slate-500 border-slate-200 hover:bg-slate-50";
  }

  getRankBadge(spent: number) {
    if (spent >= 50000000) return { label: 'DIAMOND', class: 'bg-cyan-100 text-cyan-700 border-cyan-200', icon: '💎', textClass: 'from-cyan-400 to-blue-600' };
    if (spent >= 20000000) return { label: 'GOLD', class: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: '👑', textClass: 'from-yellow-400 to-orange-500' };
    if (spent >= 5000000) return { label: 'SILVER', class: 'bg-slate-200 text-slate-700 border-slate-300', icon: '🥈', textClass: 'from-slate-400 to-slate-600' };
    return { label: 'MEMBER', class: 'bg-slate-100 text-slate-500 border-slate-200', icon: '👤', textClass: 'from-slate-400 to-slate-500' };
  }

  selectCustomer(c: Customer) { this.selectedCustomer = c; }

  openAddModal() { this.isEditing = false; this.form = { name: '', phone: '', address: '', notes: '' }; this.showModal = true; }
  openEditModal() { if (!this.selectedCustomer) return; this.isEditing = true; this.form = { ...this.selectedCustomer }; this.showModal = true; }
  
  saveCustomer() {
    if (!this.form.name || !this.form.phone) { alert('Vui lòng nhập tên và số điện thoại'); return; }
    if (this.isEditing) {
      this.dataService.updateCustomer(this.form.id, this.form);
      this.selectedCustomer = this.dataService.customers().find(c => c.id === this.form.id) || null;
    } else { this.dataService.addCustomer(this.form); }
    this.showModal = false;
  }

  deleteCustomer() {
    if (!this.selectedCustomer) return;
    if (confirm('Xóa khách hàng này? Dữ liệu lịch sử sẽ mất liên kết.')) {
      this.dataService.deleteCustomer(this.selectedCustomer.id);
      this.selectedCustomer = null;
    }
  }

  openPayDebtModal() { if (!this.selectedCustomer) return; this.debtPaymentAmount = this.selectedCustomer.debt; this.showDebtModal = true; }

  confirmDebtPayment() {
    if (!this.selectedCustomer || this.debtPaymentAmount <= 0) return;
    this.dataService.addTransaction({
      type: 'IN',
      category: 'Thu nợ khách hàng',
      amount: this.debtPaymentAmount,
      note: `Thu nợ từ ${this.selectedCustomer.name}`,
      refId: this.selectedCustomer.id
    });
    const newDebt = Math.max(0, this.selectedCustomer.debt - this.debtPaymentAmount);
    this.dataService.updateCustomer(this.selectedCustomer.id, { debt: newDebt });
    this.selectedCustomer = { ...this.selectedCustomer, debt: newDebt };
    this.showDebtModal = false;
  }
}
