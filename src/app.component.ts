import { Component, inject, signal, ChangeDetectionStrategy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from './services/data.service';
import { DashboardComponent } from './components/dashboard.component';
import { ProductsComponent } from './components/products.component';
import { SalesComponent } from './components/sales.component';
import { SettingsComponent } from './components/settings.component';
import { OrdersComponent } from './components/orders.component';
import { FinanceComponent } from './components/finance.component';
import { CrmComponent } from './components/crm.component'; 

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, 
    FormsModule,
    DashboardComponent,
    ProductsComponent,
    SalesComponent,
    SettingsComponent,
    OrdersComponent,
    FinanceComponent,
    CrmComponent 
  ],
  template: `
    <!-- Offline Notification Banner -->
    @if (!isOnline()) {
      <div class="fixed top-0 left-0 right-0 bg-red-500 text-white text-xs font-bold text-center py-1 z-[200] animate-slide-down shadow-md flex justify-center items-center gap-2 no-print">
        <span class="animate-pulse">📡</span> Bạn đang ngoại tuyến (Offline). Dữ liệu được lưu an toàn trên thiết bị này.
      </div>
    }

    <!-- Main App Layout -->
    <div class="flex h-screen bg-grid-pattern text-slate-900 font-sans overflow-hidden" [class.pt-6]="!isOnline()">
      
      <!-- Premium Sidebar -->
      <aside class="w-20 lg:w-72 bg-gradient-to-b from-slate-900 via-slate-900 to-[--theme-color-950] text-white flex flex-col shadow-2xl z-50 transition-all duration-300 no-print relative">
        <!-- Sidebar Glow -->
        <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[--theme-color-500] via-purple-500 to-pink-500"></div>

        <!-- Brand -->
        <div class="p-6 flex items-center gap-4 border-b border-white/5">
          <div class="w-12 h-12 shrink-0 relative">
            <!-- Modern Logo SVG -->
            <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-lg">
              <defs>
                <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="var(--theme-color-500)" />
                  <stop offset="100%" stop-color="var(--theme-color-300)" />
                </linearGradient>
              </defs>
              <!-- Background Shape -->
              <rect x="10" y="10" width="80" height="80" rx="20" fill="url(#logoGradient)" />
              <!-- Chart Line -->
              <path d="M25 65 L40 50 L55 60 L75 35" stroke="white" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
              <!-- Coin Dot -->
              <circle cx="75" cy="35" r="5" fill="white" />
            </svg>
          </div>
          <div class="hidden lg:block">
            <h1 class="font-extrabold text-lg leading-tight tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-[--theme-color-200]">
              Trợ Lý<br>Tài Chính
            </h1>
            <p class="text-[10px] text-[--theme-color-300] font-bold tracking-widest uppercase mt-1">Phiên bản cá nhân</p>
          </div>
        </div>
        
        <!-- Navigation -->
        <nav class="flex-1 px-3 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          <button (click)="dataService.navigateTo('dashboard')" [class]="getTabClass('dashboard')">
            <span class="text-2xl relative z-10 transition-transform group-hover:scale-110">📊</span>
            <span class="hidden lg:block font-bold text-sm relative z-10">Tổng Quan & Trợ Lý</span>
            @if (dataService.activeTab() === 'dashboard') {
               <div class="absolute inset-0 bg-white/10 rounded-xl border-l-4 border-[--theme-color-500]"></div>
            }
          </button>
          
          <button (click)="dataService.navigateTo('sales')" [class]="getTabClass('sales')">
            <span class="text-2xl relative z-10 transition-transform group-hover:scale-110">🛒</span>
            <span class="hidden lg:block font-bold text-sm relative z-10">Bán Hàng POS</span>
            @if (dataService.activeTab() === 'sales') {
               <div class="absolute inset-0 bg-white/10 rounded-xl border-l-4 border-emerald-500"></div>
            }
          </button>
          
          <button (click)="dataService.navigateTo('crm')" [class]="getTabClass('crm')">
            <span class="text-2xl relative z-10 transition-transform group-hover:scale-110">👥</span>
            <span class="hidden lg:block font-bold text-sm relative z-10">Khách Hàng & Nợ</span>
            @if (dataService.activeTab() === 'crm') {
               <div class="absolute inset-0 bg-white/10 rounded-xl border-l-4 border-pink-500"></div>
            }
          </button>

          <button (click)="dataService.navigateTo('products')" [class]="getTabClass('products')">
            <span class="text-2xl relative z-10 transition-transform group-hover:scale-110">📦</span>
            <span class="hidden lg:block font-bold text-sm relative z-10">Quản Lý Kho</span>
            @if (dataService.activeTab() === 'products') {
               <div class="absolute inset-0 bg-white/10 rounded-xl border-l-4 border-blue-500"></div>
            }
          </button>
          
          <button (click)="dataService.navigateTo('finance')" [class]="getTabClass('finance')">
            <span class="text-2xl relative z-10 transition-transform group-hover:scale-110">💸</span>
            <span class="hidden lg:block font-bold text-sm relative z-10">Tài Chính & Quỹ</span>
            @if (dataService.activeTab() === 'finance') {
               <div class="absolute inset-0 bg-white/10 rounded-xl border-l-4 border-amber-500"></div>
            }
          </button>
          
          <button (click)="dataService.navigateTo('orders')" [class]="getTabClass('orders')">
            <span class="text-2xl relative z-10 transition-transform group-hover:scale-110">🧾</span>
            <span class="hidden lg:block font-bold text-sm relative z-10">Lịch Sử Đơn</span>
            @if (dataService.activeTab() === 'orders') {
               <div class="absolute inset-0 bg-white/10 rounded-xl border-l-4 border-purple-500"></div>
            }
          </button>
          
          <div class="my-4 mx-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          
          <button (click)="dataService.navigateTo('settings')" [class]="getTabClass('settings')">
            <span class="text-2xl relative z-10 transition-transform group-hover:rotate-90 duration-500">⚙️</span>
            <span class="hidden lg:block font-bold text-sm relative z-10">Cài Đặt</span>
            @if (dataService.activeTab() === 'settings') {
               <div class="absolute inset-0 bg-white/10 rounded-xl border-l-4 border-slate-400"></div>
            }
          </button>
        </nav>

        <!-- Status -->
        <div class="p-4 bg-black/20 backdrop-blur-md border-t border-white/5">
           <div class="px-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider" [class]="isOnline() ? 'text-emerald-400' : 'text-red-400'">
             <span class="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" [class]="isOnline() ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'"></span>
             {{ isOnline() ? 'SẴN SÀNG' : 'OFFLINE MODE' }}
           </div>
        </div>
      </aside>

      <!-- Content Area -->
      <main class="flex-1 flex flex-col relative overflow-hidden bg-slate-50/50">
        <!-- Decoration Background Blurs -->
        <div class="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div class="absolute top-[-10%] right-[-5%] w-96 h-96 bg-[--theme-color-500]/10 rounded-full blur-3xl"></div>
          <div class="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-[--theme-color-500]/10 rounded-full blur-3xl"></div>
        </div>

        <!-- Mobile Header -->
        <header class="md:hidden bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 flex justify-between items-center shadow-sm z-40 no-print sticky top-0">
          <div class="flex items-center gap-3">
             <svg viewBox="0 0 100 100" class="w-8 h-8 drop-shadow-md">
              <defs>
                <linearGradient id="logoGradientMob" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="var(--theme-color-500)" />
                  <stop offset="100%" stop-color="var(--theme-color-300)" />
                </linearGradient>
              </defs>
              <rect x="10" y="10" width="80" height="80" rx="20" fill="url(#logoGradientMob)" />
              <path d="M25 65 L40 50 L55 60 L75 35" stroke="white" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            </svg>
            <span class="font-extrabold text-slate-800 text-lg">FinAssistant</span>
          </div>
          <button (click)="toggleMobileMenu()" class="p-2 text-slate-600 hover:bg-slate-100 rounded-lg active:scale-95 transition-transform">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          </button>
        </header>

        <!-- Mobile Menu Overlay -->
        @if (showMobileMenu) {
          <div class="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-40 md:hidden transition-opacity" (click)="toggleMobileMenu()"></div>
          <div class="absolute top-0 right-0 w-3/4 h-full bg-white z-50 p-6 shadow-2xl transform transition-transform md:hidden flex flex-col gap-2 animate-slide-left">
            <h2 class="text-2xl font-extrabold text-slate-800 mb-6 bg-clip-text text-transparent bg-gradient-to-r from-[--theme-color-600] to-[--theme-color-800]">Menu</h2>
            <button (click)="setTabMobile('dashboard')" class="text-left p-4 rounded-xl hover:bg-[--theme-color-50] text-slate-600 font-bold flex items-center gap-3 active:scale-95 transition-transform"><span>📊</span> Tổng Quan</button>
            <button (click)="setTabMobile('sales')" class="text-left p-4 rounded-xl hover:bg-[--theme-color-50] text-slate-600 font-bold flex items-center gap-3 active:scale-95 transition-transform"><span>🛒</span> Bán Hàng</button>
             <button (click)="setTabMobile('crm')" class="text-left p-4 rounded-xl hover:bg-[--theme-color-50] text-slate-600 font-bold flex items-center gap-3 active:scale-95 transition-transform"><span>👥</span> Khách Hàng</button>
            <button (click)="setTabMobile('products')" class="text-left p-4 rounded-xl hover:bg-[--theme-color-50] text-slate-600 font-bold flex items-center gap-3 active:scale-95 transition-transform"><span>📦</span> Kho Hàng</button>
            <button (click)="setTabMobile('finance')" class="text-left p-4 rounded-xl hover:bg-[--theme-color-50] text-slate-600 font-bold flex items-center gap-3 active:scale-95 transition-transform"><span>💸</span> Tài Chính</button>
            <button (click)="setTabMobile('orders')" class="text-left p-4 rounded-xl hover:bg-[--theme-color-50] text-slate-600 font-bold flex items-center gap-3 active:scale-95 transition-transform"><span>🧾</span> Lịch Sử Đơn</button>
            <button (click)="setTabMobile('settings')" class="text-left p-4 rounded-xl hover:bg-[--theme-color-50] text-slate-600 font-bold flex items-center gap-3 active:scale-95 transition-transform"><span>⚙️</span> Cài Đặt</button>
          </div>
        }

        <div class="flex-1 overflow-hidden relative z-10">
          @switch (dataService.activeTab()) {
            @case ('dashboard') { <app-dashboard class="h-full block overflow-y-auto" /> }
            @case ('products') { <app-products class="h-full block overflow-hidden" /> }
            @case ('sales') { <app-sales class="h-full block overflow-hidden" /> }
            @case ('crm') { <app-crm class="h-full block overflow-hidden" /> }
            @case ('finance') { <app-finance class="h-full block overflow-y-auto" /> }
            @case ('orders') { <app-orders class="h-full block overflow-hidden" /> }
            @case ('settings') { <app-settings class="h-full block overflow-y-auto" /> }
          }
        </div>
      </main>
    </div>
  `,
  styles: [`
    .animate-spin-slow { animation: spin 20s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .animate-slide-left { animation: slideLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes slideLeft { from { transform: translateX(100%); } to { transform: translateX(0); } }
    .animate-slide-down { animation: slideDown 0.3s ease-out; }
    @keyframes slideDown { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  `]
})
export class AppComponent {
  dataService = inject(DataService);
  showMobileMenu = false;
  isOnline = signal(true);

  constructor() {
    this.isOnline.set(navigator.onLine);
    window.addEventListener('online', () => this.isOnline.set(true));
    window.addEventListener('offline', () => this.isOnline.set(false));
  }

  getTabClass(tab: string) {
    const base = 'flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all w-full text-left group relative mx-2 mb-1 overflow-hidden ';
    const inactive = 'text-slate-400 hover:text-white hover:bg-white/5 ';
    const active = 'text-white font-bold shadow-lg shadow-black/20 '; 
    return this.dataService.activeTab() === tab ? base + active : base + inactive;
  }

  toggleMobileMenu() {
    this.showMobileMenu = !this.showMobileMenu;
  }

  setTabMobile(tab: string) {
    this.dataService.navigateTo(tab);
    this.showMobileMenu = false;
  }
}