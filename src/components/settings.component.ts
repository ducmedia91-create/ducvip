
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService, ShopConfig, APP_THEMES, GithubConfig } from '../services/data.service';
import { SwUpdate } from '@angular/service-worker';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-8 space-y-8 animate-fade-in max-w-4xl mx-auto pb-20">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 class="text-3xl font-extrabold text-slate-800">Cài Đặt Ứng Dụng</h2>
        
        @if (deferredPrompt) {
          <button (click)="installPwa()" class="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-rose-200 animate-bounce hover:scale-105 transition-transform flex items-center gap-2">
            <span>📲</span> Cài Ứng Dụng
          </button>
        }
      </div>

      <!-- APP UPDATE SECTION -->
      <div class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-xl overflow-hidden text-white relative border border-slate-700">
        <div class="absolute top-0 right-0 w-64 h-64 bg-[--theme-color-500] rounded-full blur-[100px] opacity-20 -mr-16 -mt-16 pointer-events-none"></div>
        
        <div class="p-6 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-white/10 backdrop-blur-sm">
              🚀
            </div>
            <div>
              <h3 class="font-bold text-lg text-white">Phiên Bản Ứng Dụng</h3>
              <div class="flex items-center gap-2 mt-1">
                <span class="px-2 py-0.5 rounded text-xs font-bold bg-[--theme-color-500] text-white">v{{ appVersion }}</span>
                <span class="text-xs text-slate-400">Trạng thái: {{ updateStatus }}</span>
              </div>
              @if (lastCheckDate) {
                <p class="text-[10px] text-slate-400 mt-1 italic">Đã kiểm tra: {{ lastCheckDate | date:'HH:mm dd/MM/yyyy' }}</p>
              }
            </div>
          </div>
          
          @if (updateAvailable) {
            <button 
              (click)="activateUpdate()" 
              class="px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all active:scale-95 shadow-lg min-w-[180px] animate-pulse"
            >
              🎉 Cập nhật ngay
            </button>
          } @else {
            <button 
              (click)="checkForUpdate()" 
              [disabled]="isCheckingUpdate"
              class="px-6 py-3 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-100 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg min-w-[180px] justify-center"
            >
              @if (isCheckingUpdate) {
                <div class="w-4 h-4 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin"></div>
                <span>Đang kiểm tra...</span>
              } @else {
                <span>🔄 Kiểm tra cập nhật</span>
              }
            </button>
          }
        </div>
      </div>

       <!-- GITHUB SYNC SECTION -->
      <div class="bg-slate-900 text-white rounded-2xl shadow-xl overflow-hidden border border-slate-700">
        <div class="p-6 border-b border-white/10 flex items-center gap-3">
          <span class="text-3xl">🐙</span>
          <div>
            <h3 class="font-bold text-lg">Đồng Bộ GitHub</h3>
            <p class="text-slate-400 text-sm">Lưu dữ liệu lên Repository riêng của bạn</p>
          </div>
        </div>
        
        <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="col-span-2 md:col-span-1">
             <label class="block text-xs font-bold text-slate-400 mb-2 uppercase">GitHub Username</label>
             <input [(ngModel)]="githubConfig.owner" class="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl focus:border-[--theme-color-500] outline-none text-white font-mono" placeholder="username">
          </div>
          <div class="col-span-2 md:col-span-1">
             <label class="block text-xs font-bold text-slate-400 mb-2 uppercase">Repository Name</label>
             <input [(ngModel)]="githubConfig.repo" class="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl focus:border-[--theme-color-500] outline-none text-white font-mono" placeholder="repo-name">
          </div>
          <div class="col-span-2">
             <label class="block text-xs font-bold text-slate-400 mb-2 uppercase">Personal Access Token</label>
             <input [(ngModel)]="githubConfig.token" type="password" class="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl focus:border-[--theme-color-500] outline-none text-white font-mono" placeholder="ghp_...">
             <p class="text-[10px] text-slate-500 mt-2">Token cần quyền <b>Repo (Full control)</b>. Dữ liệu sẽ được lưu tại file <code>{{ githubConfig.path }}</code>.</p>
          </div>
          
          <div class="col-span-2 flex justify-between items-center border-t border-white/10 pt-4 mt-2">
             <div class="text-xs text-slate-400">
                @if (githubConfig.lastSync) {
                   <span class="text-emerald-400">Lần cuối: {{ githubConfig.lastSync | date:'HH:mm dd/MM' }}</span>
                } @else {
                   <span>Chưa đồng bộ</span>
                }
             </div>
             <div class="flex gap-3">
               <button (click)="pullFromGithub()" class="px-4 py-2 bg-slate-700 text-white rounded-xl font-bold hover:bg-slate-600 text-sm flex items-center gap-2">
                 <span>⬇️</span> Tải Về
               </button>
               <button (click)="saveToGithub()" class="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 text-sm flex items-center gap-2">
                 <span>⬆️</span> Lưu Lên GitHub
               </button>
             </div>
          </div>
        </div>
      </div>
      
      <!-- THEME SELECTOR -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
         <div class="p-6 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
          <span class="text-2xl">🎨</span>
          <div>
            <h3 class="font-bold text-lg text-slate-800">Giao Diện & Màu Sắc</h3>
            <p class="text-slate-500 text-sm">Chọn màu chủ đạo cho ứng dụng</p>
          </div>
        </div>
        <div class="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
           @for (theme of themes; track theme.id) {
             <div 
               (click)="selectTheme(theme.id)"
               class="cursor-pointer border-2 rounded-xl p-3 flex flex-col items-center gap-2 transition-all hover:bg-slate-50"
               [class.border-[--theme-color-500]]="shopConfig.themeId === theme.id"
               [class.bg-[--theme-color-50]]="shopConfig.themeId === theme.id"
               [class.border-transparent]="shopConfig.themeId !== theme.id"
             >
                <div class="w-12 h-12 rounded-full shadow-md" [style.background-color]="theme.colors[500]"></div>
                <span class="text-sm font-bold text-slate-700">{{ theme.name }}</span>
             </div>
           }
        </div>
      </div>
      
       <!-- Shop Info Section -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div class="p-6 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
          <span class="text-2xl">🖨️</span>
          <div>
            <h3 class="font-bold text-lg text-slate-800">Thông Tin Cửa Hàng & In Ấn</h3>
            <p class="text-slate-500 text-sm">Thông tin này sẽ xuất hiện trên hóa đơn</p>
          </div>
        </div>
        
        <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="col-span-2">
            <label class="block text-sm font-bold text-slate-700 mb-2">Tên cửa hàng</label>
            <input [(ngModel)]="shopConfig.shopName" class="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[--theme-color-500] outline-none">
          </div>
          <div>
            <label class="block text-sm font-bold text-slate-700 mb-2">Số điện thoại</label>
            <input [(ngModel)]="shopConfig.phone" class="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[--theme-color-500] outline-none">
          </div>
          <div>
            <label class="block text-sm font-bold text-slate-700 mb-2">Thuế VAT Mặc định (%)</label>
            <input type="number" [(ngModel)]="shopConfig.taxRate" class="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[--theme-color-500] outline-none" placeholder="0">
          </div>
          <div class="col-span-2">
            <label class="block text-sm font-bold text-slate-700 mb-2">Khổ giấy in</label>
            <select [(ngModel)]="shopConfig.printerWidth" class="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[--theme-color-500] outline-none bg-white">
              <option value="80mm">Khổ K80 (80mm) - Máy in nhiệt to</option>
              <option value="58mm">Khổ K58 (58mm) - Máy in nhiệt nhỏ</option>
            </select>
          </div>
          <div class="col-span-2">
            <label class="block text-sm font-bold text-slate-700 mb-2">Địa chỉ</label>
            <input [(ngModel)]="shopConfig.address" class="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[--theme-color-500] outline-none">
          </div>
          <div class="col-span-2">
            <label class="block text-sm font-bold text-slate-700 mb-2">Lời chào cuối hóa đơn</label>
            <input [(ngModel)]="shopConfig.footerMessage" class="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[--theme-color-500] outline-none">
          </div>

          <!-- QR CODE UPLOAD -->
          <div class="col-span-2 border-t border-slate-100 pt-4 mt-2">
            <label class="block text-sm font-bold text-slate-700 mb-2">Mã QR Thanh Toán (In trên hóa đơn)</label>
            <div class="flex items-start gap-4">
              <label class="w-32 h-32 bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-[--theme-color-500] hover:bg-[--theme-color-50] transition-all relative overflow-hidden">
                @if (shopConfig.qrCodeImage) {
                  <img [src]="shopConfig.qrCodeImage" class="w-full h-full object-contain">
                  <div class="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center text-white font-bold text-xs transition-opacity">Đổi ảnh</div>
                } @else {
                  <div class="text-center">
                    <span class="text-2xl">📷</span>
                    <p class="text-[10px] text-slate-500 mt-1">Tải ảnh QR</p>
                  </div>
                }
                <input type="file" (change)="onQrSelected($event)" class="hidden" accept="image/*">
              </label>
              <div class="flex-1 text-sm text-slate-500">
                <p class="font-bold text-slate-800">Tải lên ảnh QR Ngân hàng / Momo / VietQR của bạn.</p>
                <p class="mt-1">Ảnh này sẽ được in ở cuối hóa đơn để khách quét thanh toán.</p>
                
                <div class="flex gap-3 mt-3">
                  @if (shopConfig.qrCodeImage) {
                    <button (click)="removeQr()" class="text-red-500 font-bold text-xs px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50">Xóa QR hiện tại</button>
                  }
                  <button (click)="showPreview = true" class="text-[--theme-color-600] font-bold text-xs px-3 py-1.5 border border-[--theme-color-200] rounded-lg hover:bg-[--theme-color-50] flex items-center gap-1">
                    <span>👁️</span> Xem thử mẫu in
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="col-span-2 flex justify-end">
            <button (click)="saveShopConfig()" class="bg-[--theme-color-600] text-white px-6 py-2 rounded-xl font-bold hover:bg-[--theme-color-700] shadow-lg shadow-[--theme-color-200]">Lưu Thông Tin</button>
          </div>
        </div>
      </div>
      
      <!-- PERSISTENT STORAGE SECTION -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden relative">
        <div class="p-6 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
          <span class="text-3xl">💾</span>
          <div>
            <h3 class="font-bold text-lg text-slate-800">Lưu Trữ Dữ Liệu</h3>
            <p class="text-slate-500 text-sm">Quản lý nơi lưu trữ Database của bạn</p>
          </div>
        </div>
        
        <div class="p-6">
          @if (dataService.isFileConnected()) {
            <div class="flex items-center gap-4 bg-emerald-50 border border-emerald-100 p-4 rounded-xl mb-4">
              <div class="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-2xl shadow-lg shadow-emerald-200 text-white">✅</div>
              <div>
                <p class="font-bold text-emerald-800">Đã kết nối tệp dữ liệu</p>
                <p class="text-sm text-slate-600">Hệ thống đang tự động lưu vào ổ cứng.</p>
                @if (dataService.lastSaveTime()) {
                  <p class="text-xs text-slate-400 mt-1">Đã lưu lúc: {{ dataService.lastSaveTime() | date:'HH:mm:ss' }}</p>
                }
              </div>
            </div>
          } @else {
             <div class="bg-amber-50 border border-amber-100 p-4 rounded-xl mb-6 flex gap-3">
               <div class="text-2xl">⚠️</div>
               <div>
                  <p class="font-bold text-amber-800 mb-1">Đang dùng bộ nhớ tạm</p>
                  <p class="text-sm text-slate-600">Dữ liệu có thể mất nếu xóa lịch sử web. Hãy kết nối tệp để an toàn hơn.</p>
               </div>
             </div>
          }

          <div class="grid md:grid-cols-2 gap-4">
            <button (click)="connectExistingFile()" class="p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-3 group">
              <div class="w-10 h-10 bg-[--theme-color-100] text-[--theme-color-600] rounded-lg flex items-center justify-center text-xl">📂</div>
              <div class="text-left">
                <p class="font-bold text-slate-700">Mở tệp đã có</p>
                <p class="text-xs text-slate-400">Chọn file .json trên máy</p>
              </div>
            </button>

            <button (click)="createNewFile()" class="p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-3 group">
              <div class="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center text-xl">➕</div>
              <div class="text-left">
                <p class="font-bold text-slate-700">Tạo tệp lưu trữ mới</p>
                <p class="text-xs text-slate-400">Tạo file mới để bắt đầu</p>
              </div>
            </button>
          </div>
        </div>
      </div>
      
      <!-- Manual Data Management -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div class="p-6 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
          <span class="text-2xl">📦</span>
          <div>
            <h3 class="font-bold text-lg text-slate-800">Sao Lưu Thủ Công</h3>
            <p class="text-slate-500 text-sm">Tải file về máy để chuyển sang máy khác</p>
          </div>
        </div>
        
        <div class="p-6 space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button (click)="backupData()" class="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3 hover:bg-emerald-100 transition-colors group">
              <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm">📥</div>
              <div class="text-left">
                <p class="font-bold text-emerald-800 group-hover:text-emerald-900">Sao Lưu Dữ Liệu</p>
                <p class="text-xs text-emerald-600">Tải về máy file .json</p>
              </div>
            </button>

            <label class="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3 hover:bg-blue-100 transition-colors cursor-pointer group">
              <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm">📤</div>
              <div class="text-left">
                <p class="font-bold text-blue-800 group-hover:text-blue-900">Khôi Phục Dữ Liệu</p>
                <p class="text-xs text-blue-600">Tải lên file backup</p>
              </div>
              <input type="file" class="hidden" accept=".json" (change)="restoreData($event)">
            </label>
          </div>

          <div class="pt-4 border-t border-slate-100 mt-4">
             <button (click)="resetData()" class="w-full px-4 py-4 bg-red-50 text-red-600 border border-red-100 rounded-xl hover:bg-red-100 font-bold transition-colors flex items-center justify-center gap-2">
              <span>⚠️</span> Xóa Dữ Liệu Kinh Doanh (Giữ lại cấu hình ứng dụng)
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- PREVIEW MODAL -->
    @if (showPreview) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm" (click)="showPreview = false">
        <div class="bg-white p-6 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
           <div class="flex justify-between items-center mb-4">
             <h3 class="font-bold text-lg">Xem Trước Hóa Đơn</h3>
             <button (click)="showPreview = false" class="text-slate-400 hover:text-slate-600">✕</button>
           </div>
           
           <!-- MOCK RECEIPT -->
           <div class="bg-white text-black p-4 shadow-lg border border-slate-200 mx-auto font-mono text-sm leading-relaxed" 
                [style.width]="shopConfig.printerWidth === '58mm' ? '58mm' : '80mm'"
                style="min-height: 400px; box-sizing: content-box;">
              
               <div class="text-center mb-4">
                  <div class="text-3xl mb-1">🛍️</div>
                  <div class="text-lg font-black uppercase">{{ shopConfig.shopName || 'Tên Cửa Hàng' }}</div>
                  <div class="text-xs">{{ shopConfig.address || 'Địa chỉ...' }}</div>
                  <div class="text-xs font-bold">Hotline: {{ shopConfig.phone || '...' }}</div>
               </div>
               
               <div class="border-b border-dashed border-black my-2"></div>
               
               <div class="flex justify-between text-xs mb-1">
                 <span>Số: #HD-DEMO</span>
                 <span>{{ today | date:'dd/MM/yy HH:mm' }}</span>
               </div>
               <div class="text-xs mb-2">Khách: <b>Khách lẻ</b></div>
               
               <div class="border-b border-dashed border-black my-2"></div>
               
               <table class="w-full text-xs text-left mb-2">
                 <thead>
                   <tr class="border-b border-black">
                     <th class="pb-1 w-[40%]">Tên SP</th>
                     <th class="pb-1 text-center">SL</th>
                     <th class="pb-1 text-right">ĐG</th>
                     <th class="pb-1 text-right">TT</th>
                   </tr>
                 </thead>
                 <tbody>
                   <tr>
                     <td class="pt-1 font-bold">Sản phẩm mẫu A</td>
                     <td class="pt-1 text-center">2</td>
                     <td class="pt-1 text-right">50,000</td>
                     <td class="pt-1 text-right font-bold">100,000</td>
                   </tr>
                   <tr>
                     <td class="pt-1 font-bold">Sản phẩm mẫu B</td>
                     <td class="pt-1 text-center">1</td>
                     <td class="pt-1 text-right">150,000</td>
                     <td class="pt-1 text-right font-bold">150,000</td>
                   </tr>
                 </tbody>
               </table>
               
               <div class="border-b border-dashed border-black my-2"></div>
               
               <div class="flex justify-between text-xs mb-1">
                 <span>Tổng tiền hàng:</span>
                 <span>250,000</span>
               </div>
               <div class="flex justify-between text-base font-bold mt-2">
                 <span>THANH TOÁN:</span>
                 <span>250,000</span>
               </div>
               
               <div class="border-b border-dashed border-black my-2"></div>
               
               <div class="text-center mt-4 text-xs">
                 <p class="mb-2 italic">{{ shopConfig.footerMessage || 'Xin cảm ơn quý khách!' }}</p>
                 
                 @if (shopConfig.qrCodeImage) {
                   <div class="flex flex-col items-center gap-1">
                     <img [src]="shopConfig.qrCodeImage" class="w-24 h-24 object-contain border border-slate-200 p-1">
                     <span class="text-[10px] font-bold">Quét để thanh toán</span>
                   </div>
                 } @else {
                   <div class="border border-dashed border-slate-300 p-2 text-[10px] text-slate-400">
                     (Chưa có mã QR - Hãy tải ảnh lên)
                   </div>
                 }
                 
                 <p class="mt-2 text-[9px]">Powered by FinAssistant</p>
               </div>
           </div>
           
           <p class="text-center text-slate-400 text-xs mt-4">Đây là hình ảnh mô phỏng khi in ra giấy</p>
        </div>
      </div>
    }
  `
})
export class SettingsComponent {
  dataService = inject(DataService);
  swUpdate = inject(SwUpdate);
  
  shopConfig: ShopConfig = { shopName: '', address: '', phone: '', footerMessage: '', printerWidth: '80mm', taxRate: 0, qrCodeImage: '', themeId: 'indigo' };
  githubConfig: GithubConfig = { enabled: false, token: '', owner: '', repo: '', path: 'fin_assistant_data.json' };
  themes = APP_THEMES;
  deferredPrompt: any;
  showPreview = false;
  today = new Date();
  
  // App Version Logic
  appVersion = '2.0.0';
  isCheckingUpdate = false;
  updateAvailable = false;
  updateStatus = 'Sẵn sàng';
  lastCheckDate = '';

  constructor() {
    this.shopConfig = { ...this.dataService.shopConfig() };
    this.githubConfig = { ...this.dataService.githubConfig() };
    
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
    });

    if (this.swUpdate.isEnabled) {
      this.updateStatus = 'Đang chạy (SW Active)';
      this.swUpdate.versionUpdates.subscribe(evt => {
        switch (evt.type) {
          case 'VERSION_DETECTED': this.updateStatus = 'Đang tải bản mới...'; break;
          case 'VERSION_READY': this.updateAvailable = true; this.updateStatus = 'Đã tải xong (Chờ Reset)'; break;
          case 'VERSION_INSTALLATION_FAILED': this.updateStatus = 'Lỗi cập nhật'; break;
        }
      });
    } else {
      this.updateStatus = 'Chế độ Dev (Không có SW)';
    }
  }
  
  selectTheme(id: string) {
    this.shopConfig.themeId = id;
    this.dataService.applyTheme(id);
  }

  async installPwa() {
    if (!this.deferredPrompt) return;
    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    if (outcome === 'accepted') this.deferredPrompt = null;
  }

  async connectExistingFile() { await this.dataService.connectToFile(); }
  async createNewFile() { await this.dataService.createNewFile(); }

  async checkForUpdate() {
    if (!this.swUpdate.isEnabled) {
      alert('⚠️ Tính năng này chỉ hoạt động khi ứng dụng đã được ĐÓNG GÓI (Build) và triển khai lên web.');
      return;
    }
    this.isCheckingUpdate = true;
    try {
      const hasUpdate = await this.swUpdate.checkForUpdate();
      this.lastCheckDate = new Date().toISOString();
      if (!hasUpdate) alert('Bạn đang sử dụng phiên bản mới nhất.');
    } catch (err) { alert('Lỗi kiểm tra cập nhật. Hãy kiểm tra kết nối mạng.'); } 
    finally { this.isCheckingUpdate = false; }
  }

  activateUpdate() {
    this.swUpdate.activateUpdate().then(() => document.location.reload());
  }

  saveShopConfig() {
    this.dataService.updateShopConfig(this.shopConfig);
    alert('Đã lưu thông tin cửa hàng!');
  }

  // GITHUB ACTIONS
  async saveToGithub() {
      this.dataService.updateGithubConfig({ ...this.githubConfig, enabled: true });
      const result = await this.dataService.syncToGithub();
      alert(result.message);
  }

  async pullFromGithub() {
      if(confirm('CẢNH BÁO: Dữ liệu hiện tại sẽ bị thay thế bằng dữ liệu từ GitHub. Bạn có chắc chắn không?')) {
          this.dataService.updateGithubConfig({ ...this.githubConfig, enabled: true });
          const result = await this.dataService.pullFromGithub();
          alert(result.message);
          if(result.success) window.location.reload();
      }
  }

  onQrSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 1000000) { alert('File ảnh quá lớn! Vui lòng chọn ảnh < 1MB'); return; }
      const reader = new FileReader();
      reader.onload = (e: any) => { this.shopConfig.qrCodeImage = e.target.result; };
      reader.readAsDataURL(file);
    }
  }

  removeQr() { this.shopConfig.qrCodeImage = ''; }

  backupData() {
    const data = {
      products: localStorage.getItem('pitc_products'),
      orders: localStorage.getItem('pitc_orders'),
      transactions: localStorage.getItem('pitc_transactions'),
      shop: localStorage.getItem('pitc_shop'),
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_finassistant_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  restoreData(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    if (!confirm('CẢNH BÁO: Dữ liệu hiện tại sẽ bị ghi đè. Bạn có chắc chắn không?')) return;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.products) localStorage.setItem('pitc_products', data.products);
        if (data.orders) localStorage.setItem('pitc_orders', data.orders);
        if (data.transactions) localStorage.setItem('pitc_transactions', data.transactions);
        if (data.shop) localStorage.setItem('pitc_shop', data.shop);
        alert('Khôi phục dữ liệu thành công!');
        window.location.reload();
      } catch (err) { alert('File backup lỗi!'); }
    };
    reader.readAsText(file);
  }

  resetData() {
    if(confirm('CẢNH BÁO: Thao tác này sẽ xóa sạch dữ liệu kinh doanh. Bạn có chắc chắn không?')) {
      localStorage.setItem('pitc_products', '[]');
      localStorage.setItem('pitc_customers', '[]');
      localStorage.setItem('pitc_orders', '[]');
      localStorage.setItem('pitc_transactions', '[]');
      localStorage.removeItem('pitc_held_orders');
      localStorage.removeItem('pitc_github');
      alert('Đã xóa dữ liệu kinh doanh thành công!');
      window.location.reload();
    }
  }
}
