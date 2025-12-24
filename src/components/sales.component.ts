
import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService, Product, OrderItem, Order, Customer } from '../services/data.service';

interface HeldOrder {
  id: number;
  timestamp: Date;
  customerName: string;
  items: OrderItem[];
}

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-full flex flex-col md:flex-row bg-slate-100 overflow-hidden no-print">
      
      <!-- Left: Product Catalog -->
      <div class="flex-1 flex flex-col h-full overflow-hidden">
        <!-- Header Search -->
        <div class="p-6 bg-white shadow-sm z-10 flex gap-4 items-center">
          <div class="relative flex-1">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">🔍</span>
            <input 
              [(ngModel)]="searchText" 
              placeholder="Tìm kiếm sản phẩm..." 
              class="w-full pl-12 pr-4 py-3 bg-slate-100 border-0 rounded-2xl focus:ring-2 focus:ring-[--theme-color-500] outline-none text-slate-800 placeholder-slate-400 font-medium transition-all"
            >
          </div>
          <div class="flex gap-2">
             <button (click)="filterCategory = ''" class="px-4 py-2 rounded-xl font-bold text-sm transition-colors" [class]="filterCategory === '' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'">Tất cả</button>
             <button (click)="filterCategory = 'Điện thoại'" class="px-4 py-2 rounded-xl font-bold text-sm transition-colors" [class]="filterCategory === 'Điện thoại' ? 'bg-[--theme-color-600] text-white' : 'bg-white text-slate-600 hover:bg-slate-50'">Điện thoại</button>
             <button (click)="filterCategory = 'Phụ kiện'" class="px-4 py-2 rounded-xl font-bold text-sm transition-colors" [class]="filterCategory === 'Phụ kiện' ? 'bg-[--theme-color-600] text-white' : 'bg-white text-slate-600 hover:bg-slate-50'">Phụ kiện</button>
          </div>
        </div>
        
        <!-- Grid -->
        <div class="flex-1 overflow-y-auto p-6 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 content-start">
          @for (product of filteredProducts(); track product.id) {
            <div 
              (click)="addToCart(product)"
              class="bg-white rounded-2xl p-4 cursor-pointer border border-transparent hover:border-[--theme-color-500] shadow-sm hover:shadow-xl transition-all active:scale-95 flex flex-col h-72 group relative overflow-hidden"
              [class.opacity-60]="product.stock === 0"
              [class.pointer-events-none]="product.stock === 0"
            >
              <div class="h-40 -mx-4 -mt-4 mb-3 overflow-hidden bg-slate-50 relative">
                <img [src]="product.image" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
                <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2">
                  <span class="text-white text-xs font-bold">{{ product.category }}</span>
                </div>
              </div>
              <div class="flex-1 flex flex-col justify-between">
                <div>
                  <h4 class="font-bold text-slate-800 line-clamp-2 text-sm leading-snug">{{ product.name }}</h4>
                  <span class="text-xs text-slate-400 font-mono">{{ product.id }}</span>
                </div>
                <div class="flex justify-between items-end mt-2">
                  <span class="font-extrabold text-[--theme-color-600] text-lg">{{ product.price | number }}</span>
                  <span class="text-[10px] font-bold px-2 py-1 rounded-full" [class]="product.stock > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'">
                    {{ product.stock > 0 ? 'Kho: ' + product.stock : 'Hết hàng' }}
                  </span>
                </div>
              </div>
              @if(getItemQty(product.id) > 0) {
                <div class="absolute top-2 right-2 bg-[--theme-color-600] text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-lg text-sm z-10 animate-bounce-short">
                  {{ getItemQty(product.id) }}
                </div>
              }
            </div>
          } @empty {
             <div class="col-span-full text-center py-20 text-slate-400">Không tìm thấy sản phẩm phù hợp</div>
          }
        </div>
      </div>

      <!-- Right: Cart / POS -->
      <div class="w-full md:w-[450px] bg-white shadow-2xl z-20 flex flex-col h-full border-l border-slate-200">
        <!-- Cart Header -->
        <div class="p-6 bg-white border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <div class="flex items-center gap-2">
              <h3 class="font-extrabold text-xl text-slate-800">Đơn Hàng</h3>
              @if (heldOrders().length > 0) {
                 <button (click)="showHeldOrders = !showHeldOrders" class="bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-lg font-bold animate-pulse hover:bg-orange-200">
                   Đang chờ: {{ heldOrders().length }}
                 </button>
              }
            </div>
            <div class="flex items-center gap-2 text-xs text-slate-500 mt-1">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {{ today | date:'HH:mm dd/MM/yyyy' }}
            </div>
          </div>
          <div class="flex gap-2">
            @if (completedOrder) {
              <button (click)="printLastOrder()" class="text-[--theme-color-600] bg-[--theme-color-50] hover:bg-[--theme-color-100] px-3 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-1" title="In hóa đơn vừa thanh toán">
                <span>🖨️</span> In lại
              </button>
            }
            @if (dataService.cart().length > 0) {
              <button (click)="holdCurrentOrder()" class="bg-orange-50 text-orange-600 hover:bg-orange-100 px-3 py-2 rounded-lg text-sm font-bold transition-colors" title="Lưu tạm đơn này">
                ⏸️ Lưu
              </button>
            }
            <button (click)="clearCart()" class="text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg text-sm font-bold transition-colors">
              🗑️ Xóa
            </button>
          </div>
        </div>
        
        <!-- Held Orders Dropdown -->
        @if (showHeldOrders && heldOrders().length > 0) {
          <div class="bg-orange-50 border-b border-orange-100 max-h-48 overflow-y-auto animate-slide-in">
             @for (held of heldOrders(); track held.id; let i = $index) {
               <div class="p-3 border-b border-orange-100 flex justify-between items-center hover:bg-orange-100 cursor-pointer" (click)="restoreOrder(i)">
                  <div>
                    <p class="font-bold text-orange-800 text-sm">{{ held.customerName || 'Khách lẻ' }}</p>
                    <p class="text-xs text-orange-600">{{ held.items.length }} sản phẩm • {{ held.timestamp | date:'HH:mm' }}</p>
                  </div>
                  <span class="text-xl text-orange-400">↩️</span>
               </div>
             }
          </div>
        }

        <!-- Cart Items -->
        <div class="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
          @for (item of dataService.cart(); track item.productId) {
            <div class="flex gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 animate-slide-in group hover:border-[--theme-color-200] transition-colors">
              <div class="flex-1">
                <p class="font-bold text-slate-800 text-sm line-clamp-2">{{ item.productName }}</p>
                <div class="flex items-center gap-3 mt-3">
                   <div class="flex items-center bg-slate-100 rounded-lg p-1">
                     <button (click)="decreaseQty(item.productId)" class="w-7 h-7 rounded bg-white shadow-sm hover:bg-slate-50 flex items-center justify-center font-bold text-slate-600 transition-colors">-</button>
                     <span class="font-bold text-sm w-8 text-center">{{ item.quantity }}</span>
                     <button (click)="increaseQty(item.productId)" class="w-7 h-7 rounded bg-[--theme-color-600] shadow-md shadow-[--theme-color-200] hover:bg-[--theme-color-700] flex items-center justify-center font-bold text-white transition-colors">+</button>
                   </div>
                   <div class="text-xs text-slate-400">x {{ item.price | number }}</div>
                </div>
              </div>
              <div class="text-right flex flex-col justify-between items-end">
                <p class="font-bold text-[--theme-color-600] text-lg">{{ item.total | number }}</p>
                <button (click)="removeFromCart(item.productId)" class="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          } @empty {
            <div class="h-full flex flex-col items-center justify-center text-slate-300 space-y-4 select-none">
              <div class="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-4xl grayscale opacity-50">🛒</div>
              <p class="font-medium">Chưa có sản phẩm nào</p>
              <p class="text-xs text-slate-400 max-w-[200px] text-center">Chọn sản phẩm từ danh sách bên trái để thêm vào đơn hàng</p>
            </div>
          }
        </div>

        <!-- Footer / Calculation -->
        <div class="p-6 bg-white shadow-[0_-4px_30px_rgba(0,0,0,0.08)] z-20 space-y-4">
          <!-- Discount & Tax Controls -->
          <div class="grid grid-cols-2 gap-4">
             <div class="bg-slate-50 p-2 rounded-xl border border-slate-100">
               <label class="text-xs text-slate-500 font-bold block mb-1 ml-1">Giảm giá (VNĐ)</label>
               <input type="number" [(ngModel)]="discount" class="w-full bg-transparent font-bold text-slate-800 outline-none text-right px-2" placeholder="0">
             </div>
             <div class="bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-center justify-between px-3 cursor-pointer" (click)="toggleTax()">
               <div>
                 <label class="text-xs text-slate-500 font-bold block">Thuế VAT</label>
                 <span class="text-xs font-bold text-[--theme-color-600]">{{ currentTaxRate() }}%</span>
               </div>
               <div class="w-5 h-5 rounded border flex items-center justify-center" [class]="hasTax ? 'bg-[--theme-color-600] border-[--theme-color-600] text-white' : 'border-slate-300'">
                 <span *ngIf="hasTax" class="text-xs">✓</span>
               </div>
             </div>
          </div>

          <div class="space-y-2 text-sm pt-2">
            <div class="flex justify-between text-slate-500">
              <span>Tạm tính</span>
              <span class="font-medium">{{ subTotal() | number }}</span>
            </div>
            <div class="flex justify-between text-slate-500" *ngIf="discount > 0">
              <span>Giảm giá</span>
              <span class="text-red-500 font-medium">-{{ discount | number }}</span>
            </div>
             <div class="flex justify-between text-slate-500" *ngIf="hasTax">
              <span>Thuế ({{ currentTaxRate() }}%)</span>
              <span class="font-medium">{{ taxAmount() | number }}</span>
            </div>
            <div class="flex justify-between items-baseline pt-3 border-t border-dashed border-slate-300">
              <span class="text-lg font-bold text-slate-800">Tổng cộng</span>
              <span class="text-2xl font-extrabold text-[--theme-color-600]">{{ finalTotal() | number }} đ</span>
            </div>
          </div>

          <button 
            (click)="initCheckout()" 
            [disabled]="dataService.cart().length === 0"
            class="w-full py-4 bg-gradient-to-r from-[--theme-color-600] to-[--theme-color-500] hover:from-[--theme-color-700] hover:to-[--theme-color-600] disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed text-white rounded-2xl font-bold shadow-lg shadow-[--theme-color-200] transition-all active:scale-95 flex items-center justify-center gap-3 text-lg group"
          >
            <span>THANH TOÁN</span> 
            <span class="bg-white/20 rounded-full w-6 h-6 flex items-center justify-center text-xs group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </div>
      </div>
    </div>
    
    <!-- Payment Modal (Hidden for brevity, existing code) -->
    @if (showPaymentModal) {
      <div class="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6">
        <div class="absolute inset-0 bg-slate-900/70 backdrop-blur-sm transition-opacity" (click)="cancelCheckout()"></div>
        <div class="bg-white rounded-t-3xl md:rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative z-10 animate-scale-in flex flex-col max-h-[90vh]">
          
          <div class="p-6 bg-slate-50 border-b border-slate-100 text-center relative">
            <button (click)="cancelCheckout()" class="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">✕</button>
            <h3 class="font-bold text-slate-500 uppercase text-xs tracking-wider mb-1">Xác nhận thanh toán</h3>
            <div class="text-4xl font-extrabold text-[--theme-color-600]">{{ finalTotal() | number }}</div>
          </div>

          <div class="p-6 space-y-6 overflow-y-auto">
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-2">Khách hàng</label>
              <div class="relative">
                <div class="flex gap-2">
                   <div class="relative flex-1">
                     <input 
                        [ngModel]="selectedCustomer ? selectedCustomer.name : customerName"
                        (ngModelChange)="customerName = $event; selectedCustomer = null"
                        class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[--theme-color-500] outline-none transition-all pr-8"
                        placeholder="Nhập tên hoặc chọn..."
                      >
                      @if (selectedCustomer) {
                        <button (click)="selectedCustomer = null; customerName = ''" class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500">✕</button>
                      }
                   </div>
                   <button (click)="showCustomerPicker = !showCustomerPicker" class="px-3 bg-[--theme-color-50] text-[--theme-color-600] rounded-xl hover:bg-[--theme-color-100] transition-colors" title="Chọn khách quen">👤</button>
                </div>
                @if (showCustomerPicker) {
                  <div class="absolute top-full left-0 right-0 mt-2 bg-white shadow-xl rounded-xl border border-slate-100 max-h-48 overflow-y-auto z-20">
                     @for (cust of dataService.customers(); track cust.id) {
                       <div (click)="selectCustomerForOrder(cust)" class="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50">
                          <p class="font-bold text-sm text-slate-800">{{ cust.name }}</p>
                          <p class="text-xs text-slate-500">{{ cust.phone }}</p>
                       </div>
                     }
                  </div>
                }
              </div>
            </div>
            
            @if (selectedCustomer) {
              <div class="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                <input type="checkbox" [(ngModel)]="isDebtOrder" class="w-5 h-5 text-amber-600 rounded focus:ring-amber-500">
                <div>
                   <label class="font-bold text-amber-800 text-sm block">Ghi vào sổ nợ</label>
                   <p class="text-xs text-amber-600">Không thu tiền ngay, cộng vào nợ của khách</p>
                </div>
              </div>
            }

            @if (!isDebtOrder) {
              <div class="animate-fade-in">
                <label class="block text-sm font-bold text-slate-700 mb-2">Tiền khách đưa</label>
                <div class="relative">
                  <input 
                    type="number" 
                    [(ngModel)]="cashReceived" 
                    class="w-full px-4 py-3 bg-white border-2 border-[--theme-color-100] rounded-xl focus:ring-2 focus:ring-[--theme-color-500] outline-none font-mono text-xl font-bold text-slate-800"
                    placeholder="0"
                  >
                  <div class="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                     <button (click)="suggestCash(0)" class="text-xs bg-slate-100 text-slate-600 px-2 py-1.5 rounded-lg font-bold hover:bg-slate-200 transition-colors">{{ finalTotal() | number }}</button>
                     <button (click)="suggestCash(500000)" class="text-xs bg-slate-100 text-slate-600 px-2 py-1.5 rounded-lg font-bold hover:bg-slate-200 transition-colors">500k</button>
                  </div>
                </div>
                
                <div class="flex gap-2 mt-2 overflow-x-auto pb-1 scrollbar-hide">
                   <button *ngFor="let m of [100000, 200000, 500000]" (click)="cashReceived = m" class="flex-shrink-0 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium hover:bg-[--theme-color-50] hover:border-[--theme-color-200] hover:text-[--theme-color-700] transition-colors">
                     {{ m | number }}
                   </button>
                </div>
              </div>

              <div class="flex justify-between items-center p-4 rounded-xl border transition-colors" [class]="(cashReceived - finalTotal()) >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'">
                <span class="font-medium" [class]="(cashReceived - finalTotal()) >= 0 ? 'text-emerald-800' : 'text-slate-500'">Tiền thừa trả khách</span>
                <span class="text-xl font-bold" [class]="(cashReceived - finalTotal()) >= 0 ? 'text-emerald-700' : 'text-slate-300'">
                  {{ (cashReceived - finalTotal()) > 0 ? (cashReceived - finalTotal() | number) : 0 }}
                </span>
              </div>
            }
          </div>

          <div class="p-6 border-t border-slate-100 bg-white mt-auto">
             <div class="grid grid-cols-2 gap-3">
              <button 
                (click)="finishOrder(false)" 
                [disabled]="!isDebtOrder && cashReceived < finalTotal()"
                class="py-4 bg-emerald-50 text-emerald-700 border border-emerald-100 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed rounded-2xl font-bold hover:bg-emerald-100 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <span>✅</span> {{ isDebtOrder ? 'Lưu Nợ' : 'Chỉ Thanh Toán' }}
              </button>

              <button 
                (click)="finishOrder(true)" 
                [disabled]="!isDebtOrder && cashReceived < finalTotal()"
                class="py-4 bg-[--theme-color-600] text-white disabled:bg-slate-300 disabled:cursor-not-allowed rounded-2xl font-bold shadow-lg hover:bg-[--theme-color-700] transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <span>🖨️</span> In Hóa Đơn
              </button>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- RECEIPT TEMPLATE (Same as before) -->
    <div id="printable-area" class="hidden">
        <div class="receipt-header">
            <div style="font-size: 32px; margin-bottom: 5px;">🛍️</div>
            <div class="receipt-title">{{ dataService.shopConfig().shopName }}</div>
            <div class="receipt-info">{{ dataService.shopConfig().address }}</div>
            <div class="receipt-info">Hotline: <b>{{ dataService.shopConfig().phone }}</b></div>
        </div>
        <div class="receipt-divider"></div>
        <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
           <span>Số: #{{ completedOrder?.id }}</span>
           <span>{{ completedOrder?.date | date:'dd/MM/yy HH:mm' }}</span>
        </div>
        <div style="font-size: 12px; margin-bottom: 8px;">
           Khách: <span class="receipt-bold">{{ completedOrder?.customerName }}</span>
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
                @for (item of completedOrder?.items; track item.productId) {
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
            <span>{{ completedOrder?.subTotal | number }}</span>
        </div>
        @if (completedOrder?.discount) {
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span>Giảm giá:</span>
              <span>-{{ completedOrder?.discount | number }}</span>
          </div>
        }
        @if (completedOrder?.tax) {
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span>VAT ({{ completedOrder?.taxRate }}%):</span>
              <span>{{ completedOrder?.tax | number }}</span>
          </div>
        }
        <div style="display: flex; justify-content: space-between; margin-top: 5px; align-items: flex-end;">
            <span class="receipt-bold" style="font-size: 14px;">THANH TOÁN:</span>
            <span class="receipt-large">{{ completedOrder?.totalAmount | number }}</span>
        </div>
        @if (completedOrder?.isDebt) {
           <div style="text-align: center; border: 2px solid #000; padding: 5px; margin-top: 10px; font-weight: bold; font-size: 16px;">
             GHI NỢ KHÁCH HÀNG
           </div>
        } @else {
           <div class="receipt-divider"></div>
           <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span>Tiền khách đưa:</span>
              <span>{{ completedOrder?.cashReceived | number }}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
              <span>Tiền thừa:</span>
              <span>{{ completedOrder?.changeReturned | number }}</span>
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
  `,
  styles: [`
    .animate-slide-in { animation: slideIn 0.3s ease-out; }
    @keyframes slideIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
    .animate-scale-in { animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .animate-bounce-short { animation: bounceShort 0.5s; }
    @keyframes bounceShort { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
    .animate-fade-in { animation: fadeIn 0.3s ease; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  `]
})
export class SalesComponent {
  dataService = inject(DataService);
  searchText = '';
  filterCategory = '';
  // Removed local cartItems, using dataService.cart
  heldOrders = signal<HeldOrder[]>([]);
  showHeldOrders = false;
  today = new Date();
  discount = 0;
  hasTax = false;
  currentTaxRate = computed(() => this.dataService.shopConfig().taxRate || 0);
  showPaymentModal = false;
  customerName = '';
  selectedCustomer: Customer | null = null;
  showCustomerPicker = false;
  isDebtOrder = false;
  cashReceived = 0;
  completedOrder: any = null; 

  subTotal = computed(() => this.dataService.cart().reduce((sum, item) => sum + item.total, 0));
  taxAmount = computed(() => {
    if (!this.hasTax) return 0;
    const taxable = this.subTotal() - this.discount;
    return taxable > 0 ? Math.round(taxable * (this.currentTaxRate() / 100)) : 0;
  });
  finalTotal = computed(() => {
    const total = this.subTotal() - this.discount + this.taxAmount();
    return total > 0 ? total : 0;
  });

  constructor() {
    const saved = localStorage.getItem('pitc_held_orders');
    if (saved) { try { this.heldOrders.set(JSON.parse(saved)); } catch(e) {} }
    effect(() => { localStorage.setItem('pitc_held_orders', JSON.stringify(this.heldOrders())); });
  }

  filteredProducts = computed(() => {
    const term = this.searchText.toLowerCase();
    let list = this.dataService.products();
    if (this.filterCategory) list = list.filter(p => p.category === this.filterCategory);
    return list.filter(p => p.name.toLowerCase().includes(term) || p.id.toLowerCase().includes(term));
  });

  getItemQty(id: string): number {
    const item = this.dataService.cart().find(i => i.productId === id);
    return item ? item.quantity : 0;
  }

  addToCart(product: Product) {
    this.dataService.addToCart(product);
  }

  increaseQty(id: string) { const product = this.dataService.products().find(p => p.id === id); if (product) this.addToCart(product); }
  decreaseQty(id: string) {
    const existing = this.dataService.cart().find(i => i.productId === id);
    if (!existing) return;
    if (existing.quantity > 1) {
      this.dataService.cart.update(items => items.map(i => i.productId === id ? { ...i, quantity: i.quantity - 1, total: (i.quantity - 1) * i.price } : i));
    } else { this.removeFromCart(id); }
  }
  removeFromCart(id: string) { this.dataService.removeFromCart(id); }

  clearCart() {
    if (this.dataService.cart().length > 0 && confirm('Xóa toàn bộ giỏ hàng?')) {
      this.dataService.clearCart(); this.discount = 0; this.hasTax = false; this.customerName = ''; this.selectedCustomer = null;
    }
  }

  holdCurrentOrder() {
    const currentItems = this.dataService.cart();
    if (currentItems.length === 0) return;
    this.heldOrders.update(prev => [...prev, { id: Date.now(), timestamp: new Date(), customerName: this.customerName, items: currentItems }]);
    this.dataService.clearCart(); this.customerName = ''; this.selectedCustomer = null; this.discount = 0; this.hasTax = false;
  }

  restoreOrder(index: number) {
    const orderToRestore = this.heldOrders()[index];
    if (this.dataService.cart().length > 0) { if(!confirm('Đơn hàng hiện tại chưa lưu sẽ bị mất. Tiếp tục?')) return; }
    this.dataService.cart.set(orderToRestore.items);
    this.customerName = orderToRestore.customerName || '';
    this.heldOrders.update(prev => prev.filter((_, i) => i !== index));
    this.showHeldOrders = false;
  }

  toggleTax() { this.hasTax = !this.hasTax; }
  suggestCash(amount: number) { this.cashReceived = amount > 0 ? amount : this.finalTotal(); }
  
  initCheckout() {
    this.showPaymentModal = true; this.cashReceived = this.finalTotal(); this.showCustomerPicker = false; this.isDebtOrder = false;
  }
  
  selectCustomerForOrder(c: Customer) { this.selectedCustomer = c; this.customerName = c.name; this.showCustomerPicker = false; }
  cancelCheckout() { this.showPaymentModal = false; }

  finishOrder(printInvoice: boolean = false) {
    const order = this.dataService.createOrder({
      customerName: this.selectedCustomer ? this.selectedCustomer.name : (this.customerName || 'Khách lẻ'),
      customerId: this.selectedCustomer?.id,
      items: this.dataService.cart(),
      cashReceived: this.isDebtOrder ? 0 : this.cashReceived,
      subTotal: this.subTotal(),
      discount: this.discount,
      tax: this.taxAmount(),
      totalAmount: this.finalTotal(),
      isDebt: this.isDebtOrder
    });
    this.completedOrder = { ...order, taxRate: this.currentTaxRate() };
    this.showPaymentModal = false; this.dataService.clearCart(); this.discount = 0; this.customerName = ''; this.selectedCustomer = null; this.isDebtOrder = false;
    if (printInvoice) setTimeout(() => { window.print(); }, 100);
  }

  printLastOrder() { if (this.completedOrder) setTimeout(() => window.print(), 100); }
}
