
import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService, Transaction } from '../services/data.service';

@Component({
  selector: 'app-finance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 md:p-8 space-y-6 animate-fade-in max-w-7xl mx-auto pb-32">
      <!-- Header & Utilities -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 class="text-3xl font-extrabold text-slate-800 flex items-center gap-2">
            Tài Chính & Sổ Quỹ
            <span class="text-xs bg-[--theme-color-100] text-[--theme-color-700] px-2 py-1 rounded-lg font-bold">PRO</span>
          </h2>
          <p class="text-slate-500 mt-1">Quản lý dòng tiền thông minh</p>
        </div>
        
        <div class="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <button (click)="openCalculator()" class="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2.5 rounded-xl font-bold shadow-sm flex items-center gap-2 whitespace-nowrap transition-transform active:scale-95">
            <span>🧮</span> Máy Tính
          </button>
          <button (click)="exportCSV()" class="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2.5 rounded-xl font-bold shadow-sm flex items-center gap-2 whitespace-nowrap transition-transform active:scale-95">
            <span>📥</span> Xuất Excel
          </button>
          <button (click)="openModal()" class="bg-[--theme-color-600] hover:bg-[--theme-color-700] text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-[--theme-color-200] transition-transform active:scale-95 flex items-center gap-2 whitespace-nowrap">
            <span>＋</span> Tạo Phiếu
          </button>
        </div>
      </div>

      <!-- Smart Dashboard Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <!-- Net Cash Flow -->
        <div class="bg-slate-900 text-white rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
          <div class="absolute bottom-0 left-0 right-0 h-24 opacity-30 pointer-events-none">
             <svg viewBox="0 0 100 20" preserveAspectRatio="none" class="w-full h-full">
               <path [attr.d]="cashFlowSparkline()" fill="none" stroke="#4ade80" stroke-width="0.5" />
               <path [attr.d]="cashFlowSparkline(true)" fill="url(#gradSpark)" stroke="none" />
               <defs>
                 <linearGradient id="gradSpark" x1="0" x2="0" y1="0" y2="1">
                   <stop offset="0%" stop-color="#4ade80" stop-opacity="0.5"/>
                   <stop offset="100%" stop-color="#4ade80" stop-opacity="0"/>
                 </linearGradient>
               </defs>
             </svg>
          </div>
          
          <div class="relative z-10 flex flex-col h-full justify-between">
            <div>
              <p class="text-slate-400 font-bold text-xs uppercase tracking-widest">Dòng Tiền Thực Tế</p>
              <h3 class="text-4xl font-extrabold mt-2 tracking-tight">{{ dataService.currentCash() | number }} <span class="text-lg opacity-50">đ</span></h3>
            </div>
            
            <div class="mt-6 flex items-center gap-3">
              <div class="bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm border border-white/5 flex items-center gap-2">
                 <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                 <span class="text-xs font-bold text-emerald-300">Tiền mặt an toàn</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Income Analysis -->
        <div class="bg-white rounded-3xl p-6 shadow-lg border border-slate-100 flex flex-col justify-between group hover:border-emerald-200 transition-colors">
          <div>
            <div class="flex justify-between items-start mb-2">
               <p class="text-slate-500 font-bold text-xs uppercase">Tổng Thu (Tháng {{currentMonth}})</p>
               <span class="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-md font-bold">↗ Thu vào</span>
            </div>
            <h3 class="text-3xl font-extrabold text-slate-800">{{ monthlyStats().income | number }}</h3>
          </div>
          
          <div class="mt-4">
             <div class="flex justify-between text-xs text-slate-400 mb-1">
               <span>Tiến độ mục tiêu (Giả định)</span>
               <span>75%</span>
             </div>
             <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
               <div class="h-full bg-emerald-500 rounded-full w-[75%] relative overflow-hidden">
                 <div class="absolute inset-0 bg-white/30 animate-[shimmer_2s_infinite]"></div>
               </div>
             </div>
          </div>
        </div>

        <!-- Expense Analysis -->
        <div class="bg-white rounded-3xl p-6 shadow-lg border border-slate-100 flex flex-col justify-between group hover:border-red-200 transition-colors">
          <div>
            <div class="flex justify-between items-start mb-2">
               <p class="text-slate-500 font-bold text-xs uppercase">Tổng Chi (Tháng {{currentMonth}})</p>
               <span class="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-md font-bold">↘ Chi ra</span>
            </div>
            <h3 class="text-3xl font-extrabold text-slate-800">{{ monthlyStats().expense | number }}</h3>
          </div>
          
          <div class="mt-4">
             <div class="flex justify-between text-xs text-slate-400 mb-1">
               <span>Tỷ lệ Chi/Thu</span>
               <span [class]="(monthlyStats().expense / (monthlyStats().income || 1)) > 0.8 ? 'text-red-500 font-bold' : 'text-slate-500'">
                 {{ (monthlyStats().expense / (monthlyStats().income || 1) * 100) | number:'1.0-0' }}%
               </span>
             </div>
             <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
               <div class="h-full rounded-full transition-all duration-1000" 
                    [class]="(monthlyStats().expense / (monthlyStats().income || 1)) > 0.8 ? 'bg-red-500' : 'bg-blue-500'"
                    [style.width.%]="(monthlyStats().expense / (monthlyStats().income || 1)) * 100">
               </div>
             </div>
          </div>
        </div>
      </div>

      <!-- Quick Templates -->
      <div class="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        <button (click)="useTemplate('Tiền điện/nước', 0, 'OUT')" class="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-[--theme-color-300] transition-all shadow-sm whitespace-nowrap group">
          <span class="text-lg grayscale group-hover:grayscale-0">⚡</span> <span class="font-bold text-sm text-slate-600">Điện nước</span>
        </button>
        <button (click)="useTemplate('Mặt bằng', 0, 'OUT')" class="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-[--theme-color-300] transition-all shadow-sm whitespace-nowrap group">
          <span class="text-lg grayscale group-hover:grayscale-0">🏠</span> <span class="font-bold text-sm text-slate-600">Mặt bằng</span>
        </button>
        <button (click)="useTemplate('Lương nhân viên', 0, 'OUT')" class="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-[--theme-color-300] transition-all shadow-sm whitespace-nowrap group">
          <span class="text-lg grayscale group-hover:grayscale-0">👥</span> <span class="font-bold text-sm text-slate-600">Lương NV</span>
        </button>
        <button (click)="useTemplate('Thu nhập khác', 0, 'IN')" class="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-[--theme-color-300] transition-all shadow-sm whitespace-nowrap group">
          <span class="text-lg grayscale group-hover:grayscale-0">💰</span> <span class="font-bold text-sm text-slate-600">Thu khác</span>
        </button>
      </div>

      <!-- Transaction List with Visual Cues -->
      <div class="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden flex flex-col">
        <div class="p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center bg-slate-50/50 gap-4">
          <h3 class="font-bold text-lg text-slate-800 flex items-center gap-2">
             <span>📜</span> Lịch Sử Giao Dịch
          </h3>
          <div class="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
            <button (click)="filterType = 'ALL'" class="px-4 py-1.5 rounded-lg text-xs font-bold transition-all" [class]="filterType === 'ALL' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:bg-slate-50'">Tất cả</button>
            <button (click)="filterType = 'IN'" class="px-4 py-1.5 rounded-lg text-xs font-bold transition-all" [class]="filterType === 'IN' ? 'bg-emerald-500 text-white shadow' : 'text-slate-500 hover:bg-slate-50'">Thu</button>
            <button (click)="filterType = 'OUT'" class="px-4 py-1.5 rounded-lg text-xs font-bold transition-all" [class]="filterType === 'OUT' ? 'bg-red-500 text-white shadow' : 'text-slate-500 hover:bg-slate-50'">Chi</button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead class="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
              <tr>
                <th class="px-6 py-4">Thời gian</th>
                <th class="px-6 py-4">Nội dung</th>
                <th class="px-6 py-4 w-48">Giá trị</th>
                <th class="px-6 py-4 text-right">Số tiền</th>
                <th class="px-6 py-4 text-center">Tác vụ</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (trans of filteredTransactions(); track trans.id) {
                <tr class="hover:bg-slate-50 transition-colors group relative">
                  <td class="px-6 py-4">
                     <div class="font-bold text-slate-700 text-sm">{{ trans.date | date:'dd/MM' }}</div>
                     <div class="text-xs text-slate-400 font-mono">{{ trans.date | date:'HH:mm' }}</div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-2">
                       <span class="w-2 h-2 rounded-full" [class]="trans.type === 'IN' ? 'bg-emerald-500' : 'bg-red-500'"></span>
                       <span class="font-bold text-slate-800 text-sm">{{ trans.category }}</span>
                    </div>
                    <div class="text-xs text-slate-500 mt-1 pl-4 truncate max-w-[200px]">
                      {{ trans.note || 'Không có ghi chú' }}
                       @if (isOrderRef(trans.refId)) {
                        <button (click)="goToOrder(trans.refId!)" class="text-[--theme-color-600] hover:underline font-bold ml-1">#{{trans.refId}}</button>
                      }
                    </div>
                  </td>
                  <td class="px-6 py-4 align-middle">
                     <div class="h-1.5 bg-slate-100 rounded-full w-full overflow-hidden flex">
                        <div class="h-full rounded-full opacity-60" 
                             [class]="trans.type === 'IN' ? 'bg-emerald-500' : 'bg-red-500'"
                             [style.width.%]="getMagnitudePercent(trans.amount)">
                        </div>
                     </div>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <span class="font-bold font-mono text-sm" [class]="trans.type === 'IN' ? 'text-emerald-600' : 'text-red-600'">
                       {{ trans.type === 'IN' ? '+' : '-' }}{{ trans.amount | number }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-center">
                    <div class="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       @if (!trans.refId) {
                         <button (click)="duplicateTransaction(trans)" class="p-1.5 text-slate-400 hover:text-[--theme-color-600] hover:bg-[--theme-color-50] rounded-lg transition-colors" title="Sao chép">📋</button>
                         <button (click)="deleteTransaction(trans.id)" class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Xóa">🗑️</button>
                       } @else {
                         <span class="text-[10px] text-slate-300 font-bold bg-slate-100 px-2 py-1 rounded">AUTO</span>
                       }
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="px-6 py-12 text-center">
                    <div class="flex flex-col items-center text-slate-300">
                      <span class="text-4xl mb-2 opacity-50">🍃</span>
                      <span class="text-sm">Chưa có giao dịch nào</span>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    @if (showModal) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" (click)="showModal = false"></div>
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative z-10 animate-scale-in">
          <div class="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
            <h3 class="font-bold text-xl text-slate-800">Tạo Phiếu Mới</h3>
            <button (click)="showModal = false" class="text-slate-400 hover:text-slate-600">✕</button>
          </div>
          
          <div class="p-6 space-y-5">
            <div class="flex bg-slate-100 p-1.5 rounded-2xl">
              <button (click)="form.type = 'IN'" class="flex-1 py-3 rounded-xl font-bold transition-all text-sm" [class]="form.type === 'IN' ? 'bg-white text-emerald-600 shadow-md transform scale-[1.02]' : 'text-slate-500 hover:text-slate-700'">Thu Nhập (+)</button>
              <button (click)="form.type = 'OUT'" class="flex-1 py-3 rounded-xl font-bold transition-all text-sm" [class]="form.type === 'OUT' ? 'bg-white text-red-600 shadow-md transform scale-[1.02]' : 'text-slate-500 hover:text-slate-700'">Chi Phí (-)</button>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Số tiền</label>
              <div class="relative">
                 <input type="number" [(ngModel)]="form.amount" class="w-full px-4 py-4 border-2 border-slate-100 rounded-2xl focus:border-[--theme-color-500] focus:ring-4 focus:ring-[--theme-color-500]/10 outline-none text-2xl font-bold font-mono text-slate-800" placeholder="0">
                 <button (click)="openCalculatorInModal()" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[--theme-color-600] p-2">🧮</button>
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Danh mục</label>
              <select [(ngModel)]="form.category" class="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[--theme-color-500] outline-none font-medium text-slate-700 appearance-none">
                @if (form.type === 'IN') {
                  <option value="Thu nhập khác">Thu nhập khác</option>
                  <option value="Đầu tư thêm">Đầu tư thêm vốn</option>
                  <option value="Hoàn tiền">Được hoàn tiền</option>
                  <option value="Thưởng">Tiền thưởng</option>
                } @else {
                  <option value="Tiền điện/nước">Tiền điện / nước / net</option>
                  <option value="Mặt bằng">Thuê mặt bằng</option>
                  <option value="Lương nhân viên">Lương nhân viên</option>
                  <option value="Nhập hàng">Nhập hàng hóa</option>
                  <option value="Ăn uống">Ăn uống / Tiếp khách</option>
                  <option value="Sửa chữa">Sửa chữa / Bảo trì</option>
                  <option value="Marketing">Quảng cáo / Marketing</option>
                  <option value="Chi khác">Chi phí khác</option>
                }
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ghi chú</label>
              <textarea [(ngModel)]="form.note" class="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[--theme-color-500] outline-none text-sm font-medium" rows="2" placeholder="Chi tiết..."></textarea>
            </div>
          </div>

          <div class="p-6 bg-slate-50 border-t border-slate-100 flex gap-4">
            <button (click)="saveTransaction()" class="w-full py-4 bg-[--theme-color-600] text-white rounded-2xl font-bold hover:bg-[--theme-color-700] shadow-lg shadow-[--theme-color-200] transition-all active:scale-95 text-lg">
              Lưu Giao Dịch
            </button>
          </div>
        </div>
      </div>
    }
    
    <!-- Calculator Modal -->
    @if (showCalculator) {
      <div class="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-0 md:p-4 pointer-events-none">
        <div class="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px] pointer-events-auto transition-opacity" (click)="showCalculator = false"></div>
        <div class="bg-white md:rounded-3xl rounded-t-3xl shadow-2xl w-full max-w-xs pointer-events-auto animate-slide-up overflow-hidden border border-slate-200">
           <div class="bg-slate-900 p-6 text-right">
             <div class="text-slate-400 text-xs font-mono h-4">{{ calcEquation }}</div>
             <div class="text-white text-4xl font-mono font-bold truncate tracking-widest">{{ calcDisplay }}</div>
           </div>
           
           <div class="grid grid-cols-4 gap-1 p-1 bg-slate-100">
             <button (click)="calcInput('C')" class="col-span-1 p-4 bg-red-100 text-red-600 font-bold rounded-lg hover:bg-red-200">C</button>
             <button (click)="calcInput('/')" class="p-4 bg-white text-[--theme-color-600] font-bold rounded-lg hover:bg-slate-50 shadow-sm">÷</button>
             <button (click)="calcInput('*')" class="p-4 bg-white text-[--theme-color-600] font-bold rounded-lg hover:bg-slate-50 shadow-sm">×</button>
             <button (click)="calcInput('DEL')" class="p-4 bg-slate-200 text-slate-600 font-bold rounded-lg hover:bg-slate-300">⌫</button>

             <button (click)="calcInput('7')" class="p-4 bg-white text-slate-800 font-bold rounded-lg hover:bg-slate-50 shadow-sm text-xl">7</button>
             <button (click)="calcInput('8')" class="p-4 bg-white text-slate-800 font-bold rounded-lg hover:bg-slate-50 shadow-sm text-xl">8</button>
             <button (click)="calcInput('9')" class="p-4 bg-white text-slate-800 font-bold rounded-lg hover:bg-slate-50 shadow-sm text-xl">9</button>
             <button (click)="calcInput('-')" class="p-4 bg-white text-[--theme-color-600] font-bold rounded-lg hover:bg-slate-50 shadow-sm text-xl">-</button>

             <button (click)="calcInput('4')" class="p-4 bg-white text-slate-800 font-bold rounded-lg hover:bg-slate-50 shadow-sm text-xl">4</button>
             <button (click)="calcInput('5')" class="p-4 bg-white text-slate-800 font-bold rounded-lg hover:bg-slate-50 shadow-sm text-xl">5</button>
             <button (click)="calcInput('6')" class="p-4 bg-white text-slate-800 font-bold rounded-lg hover:bg-slate-50 shadow-sm text-xl">6</button>
             <button (click)="calcInput('+')" class="p-4 bg-white text-[--theme-color-600] font-bold rounded-lg hover:bg-slate-50 shadow-sm text-xl">+</button>

             <button (click)="calcInput('1')" class="p-4 bg-white text-slate-800 font-bold rounded-lg hover:bg-slate-50 shadow-sm text-xl">1</button>
             <button (click)="calcInput('2')" class="p-4 bg-white text-slate-800 font-bold rounded-lg hover:bg-slate-50 shadow-sm text-xl">2</button>
             <button (click)="calcInput('3')" class="p-4 bg-white text-slate-800 font-bold rounded-lg hover:bg-slate-50 shadow-sm text-xl">3</button>
             <button (click)="calcResult()" class="row-span-2 bg-[--theme-color-600] text-white font-bold rounded-lg hover:bg-[--theme-color-700] shadow-lg text-xl">=</button>

             <button (click)="calcInput('0')" class="col-span-2 p-4 bg-white text-slate-800 font-bold rounded-lg hover:bg-slate-50 shadow-sm text-xl">0</button>
             <button (click)="calcInput('.')" class="p-4 bg-white text-slate-800 font-bold rounded-lg hover:bg-slate-50 shadow-sm text-xl">.</button>
           </div>
           
           @if (isCalcForInput) {
             <button (click)="useCalcResult()" class="w-full py-3 bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-colors">
               Dùng kết quả này
             </button>
           }
        </div>
      </div>
    }
  `,
  styles: [`
    .animate-scale-in { animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .animate-slide-up { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
    .scrollbar-hide::-webkit-scrollbar { display: none; }
  `]
})
export class FinanceComponent {
  dataService = inject(DataService);
  showModal = false; showCalculator = false; filterType = 'ALL'; currentMonth = new Date().getMonth() + 1;
  form = { type: 'OUT' as 'IN' | 'OUT', amount: 0, category: 'Chi khác', note: '' };
  calcDisplay = '0'; calcEquation = ''; isCalcForInput = false;

  totalIncome = computed(() => this.dataService.transactions().filter(t => t.type === 'IN').reduce((s, t) => s + t.amount, 0));
  totalExpense = computed(() => this.dataService.transactions().filter(t => t.type === 'OUT').reduce((s, t) => s + t.amount, 0));
  monthlyStats = computed(() => {
    const now = new Date();
    const trans = this.dataService.transactions().filter(t => { const d = new Date(t.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
    const inc = trans.filter(t => t.type === 'IN').reduce((s,t) => s + t.amount, 0);
    const exp = trans.filter(t => t.type === 'OUT').reduce((s,t) => s + t.amount, 0);
    return { income: inc, expense: exp, profit: inc - exp };
  });
  
  cashFlowSparkline = computed(() => (fill: boolean = false) => {
    const transactions = this.dataService.transactions();
    const now = new Date(); const daysMap = new Map<number, number>();
    for(let i=29; i>=0; i--) { const d = new Date(); d.setDate(now.getDate() - i); daysMap.set(d.getDate(), 0); }
    transactions.forEach(t => { const d = new Date(t.date); if (daysMap.has(d.getDate())) { const val = t.type === 'IN' ? t.amount : -t.amount; daysMap.set(d.getDate(), (daysMap.get(d.getDate()) || 0) + val); } });
    const values = Array.from(daysMap.values());
    if (values.length < 2) return '';
    const min = Math.min(...values); const max = Math.max(...values); const range = max - min || 1;
    const points = values.map((val, i) => { const x = (i / (values.length - 1)) * 100; const y = 20 - ((val - min) / range) * 15 - 2; return `${x},${y}`; });
    let d = `M ${points.join(' L ')}`; if (fill) { d += ` L 100,20 L 0,20 Z`; } return d;
  });

  filteredTransactions = computed(() => {
    let list = this.dataService.transactions(); if (this.filterType !== 'ALL') { list = list.filter(t => t.type === this.filterType); }
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

  maxTransAmount = computed(() => Math.max(...this.filteredTransactions().map(t => t.amount), 1));
  getMagnitudePercent(amount: number) { return Math.max((amount / this.maxTransAmount()) * 100, 2); }

  openModal() { this.form = { type: 'OUT', amount: 0, category: 'Chi khác', note: '' }; this.showModal = true; }
  saveTransaction() { if (this.form.amount <= 0) return; this.dataService.addTransaction({ type: this.form.type, amount: this.form.amount, category: this.form.category, note: this.form.note }); this.showModal = false; }
  deleteTransaction(id: string) { if(confirm('Xóa giao dịch này? Số dư sẽ thay đổi.')) { this.dataService.deleteTransaction(id); } }
  duplicateTransaction(trans: Transaction) { this.form = { type: trans.type, amount: trans.amount, category: trans.category, note: trans.note + ' (Sao chép)' }; this.showModal = true; }
  useTemplate(category: string, amount: number, type: 'IN' | 'OUT') { this.form = { type, amount, category, note: '' }; this.showModal = true; }
  isOrderRef(refId?: string): boolean { return !!refId && refId.startsWith('HD'); }
  goToOrder(orderId: string) { this.dataService.navigateTo('orders', { orderId: orderId }); }

  exportCSV() {
    const rows = [['Mã', 'Ngày', 'Loại', 'Danh mục', 'Số tiền', 'Ghi chú'], ...this.dataService.transactions().map(t => [t.id, new Date(t.date).toLocaleDateString('vi-VN'), t.type, t.category, t.amount, t.note])];
    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const link = document.createElement("a"); link.setAttribute("href", encodeURI(csvContent)); link.setAttribute("download", `finance_report_${new Date().toISOString().slice(0,10)}.csv`); document.body.appendChild(link); link.click(); document.body.removeChild(link);
  }

  openCalculator() { this.isCalcForInput = false; this.calcDisplay = '0'; this.calcEquation = ''; this.showCalculator = true; }
  openCalculatorInModal() { this.isCalcForInput = true; this.calcDisplay = '0'; this.calcEquation = ''; this.showCalculator = true; }
  calcInput(val: string) {
    if (val === 'C') { this.calcDisplay = '0'; this.calcEquation = ''; return; }
    if (val === 'DEL') { this.calcDisplay = this.calcDisplay.length > 1 ? this.calcDisplay.slice(0, -1) : '0'; return; }
    if (['+', '-', '*', '/'].includes(val)) { this.calcEquation = this.calcDisplay + ' ' + val; this.calcDisplay = '0'; } else { if (this.calcDisplay === '0' && val !== '.') this.calcDisplay = val; else this.calcDisplay += val; }
  }
  calcResult() { try { if (!this.calcEquation) return; const result = Function('"use strict";return (' + this.calcEquation + ' ' + this.calcDisplay + ')')(); this.calcDisplay = String(result); this.calcEquation = ''; } catch(e) { this.calcDisplay = 'Error'; } }
  useCalcResult() { this.calcResult(); const val = parseFloat(this.calcDisplay); if (!isNaN(val)) { this.form.amount = val; } this.showCalculator = false; }
}
