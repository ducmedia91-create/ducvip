
import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService, Product } from '../services/data.service';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-8 space-y-6 animate-fade-in max-w-7xl mx-auto h-full flex flex-col">
      <div class="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 class="text-2xl font-bold text-slate-800">Kho Hàng</h2>
          <p class="text-slate-500 text-sm">{{ filteredProducts.length }} sản phẩm</p>
        </div>
        <div class="flex gap-4">
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input 
              [(ngModel)]="searchText" 
              placeholder="Tìm tên, mã..." 
              class="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[--theme-color-500] w-64 transition-all"
            >
          </div>
          <button (click)="openModal()" class="bg-[--theme-color-600] hover:bg-[--theme-color-700] text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-[--theme-color-200] transition-all active:scale-95 flex items-center gap-2">
            <span>＋</span> Thêm Sản Phẩm
          </button>
        </div>
      </div>
      
      <!-- Filter Status (Only visible if low stock filter is active) -->
      @if (isLowStockFilter) {
        <div class="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg border border-red-100 w-fit animate-fade-in">
          <span class="font-bold text-sm">⚠️ Đang lọc sản phẩm sắp hết hàng</span>
          <button (click)="clearFilter()" class="text-red-400 hover:text-red-700 font-bold ml-2">✕ Bỏ lọc</button>
        </div>
      }

      <!-- Product Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 overflow-y-auto pb-20">
        @for (product of filteredProducts; track product.id) {
          <div class="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group flex flex-col relative">
            <!-- Image Area -->
            <div class="h-40 bg-slate-100 relative overflow-hidden">
              <img [src]="product.image" class="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" alt="Product">
              <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                <button (click)="editProduct(product)" class="bg-white text-[--theme-color-600] p-2 rounded-lg hover:bg-[--theme-color-50] shadow-lg" title="Sửa chi tiết">✏️</button>
                <button (click)="openRestock(product)" class="bg-white text-emerald-600 p-2 rounded-lg hover:bg-emerald-50 shadow-lg" title="Nhập hàng nhanh">📥</button>
                <button (click)="deleteProduct(product.id)" class="bg-white text-red-600 p-2 rounded-lg hover:bg-red-50 shadow-lg" title="Xóa">🗑️</button>
              </div>
              <span class="absolute top-2 right-2 bg-white/90 backdrop-blur text-xs font-bold px-2 py-1 rounded-lg text-slate-600">
                {{ product.category }}
              </span>
            </div>
            
            <!-- Info Area -->
            <div class="p-4 flex-1 flex flex-col">
              <h3 class="font-bold text-slate-800 line-clamp-2 mb-1">{{ product.name }}</h3>
              <p class="text-xs text-slate-400 mb-4">Mã: {{ product.id }}</p>
              
              <div class="mt-auto flex justify-between items-end">
                <div>
                  <p class="text-xs text-slate-400">Giá bán</p>
                  <p class="text-lg font-bold text-[--theme-color-600]">{{ product.price | number }}</p>
                </div>
                <div class="text-right">
                  <p class="text-xs text-slate-400">Tồn</p>
                  <p class="font-bold" [class]="product.stock < 5 ? 'text-red-500' : 'text-slate-800'">
                    {{ product.stock }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        } @empty {
          <div class="col-span-full flex flex-col items-center justify-center py-20 text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
            <div class="text-6xl mb-4">📦</div>
            <p class="text-lg">Không tìm thấy sản phẩm nào</p>
          </div>
        }
      </div>
    </div>

    <!-- Main Product Modal (Add/Edit) -->
    @if (showModal) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" (click)="closeModal()"></div>
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10 animate-scale-in flex flex-col max-h-[90vh]">
          
          <div class="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 class="font-extrabold text-xl text-slate-800">{{ isEditing ? 'Cập Nhật Sản Phẩm' : 'Thêm Sản Phẩm Mới' }}</h3>
            <button (click)="closeModal()" class="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-600">&times;</button>
          </div>
          
          <div class="p-8 overflow-y-auto space-y-5">
            <!-- Image Upload -->
            <div class="flex justify-center mb-6">
              <label class="w-32 h-32 bg-slate-100 rounded-2xl overflow-hidden border-2 border-dashed border-slate-300 relative group cursor-pointer hover:border-[--theme-color-500] transition-colors">
                <img [src]="form.image || 'https://via.placeholder.com/150'" class="w-full h-full object-cover">
                <div class="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex-col text-white text-xs text-center p-2">
                  <span class="text-2xl mb-1">📷</span>
                  <span>Tải ảnh lên</span>
                </div>
                <input type="file" (change)="onFileSelected($event)" class="hidden" accept="image/*">
              </label>
            </div>

            <div>
              <label class="block text-sm font-bold text-slate-700 mb-2">Tên sản phẩm</label>
              <input [(ngModel)]="form.name" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[--theme-color-500] outline-none transition-all" placeholder="Nhập tên sản phẩm...">
            </div>
            
            <div class="grid grid-cols-2 gap-5">
              <div>
                <label class="block text-sm font-bold text-slate-700 mb-2">Danh mục</label>
                <select [(ngModel)]="form.category" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[--theme-color-500] outline-none">
                  <option value="Điện thoại">Điện thoại</option>
                  <option value="Laptop">Laptop</option>
                  <option value="Phụ kiện">Phụ kiện</option>
                  <option value="Thời trang">Thời trang</option>
                  <option value="Mỹ phẩm">Mỹ phẩm</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-bold text-slate-700 mb-2">Số lượng tồn</label>
                <input type="number" [(ngModel)]="form.stock" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[--theme-color-500] outline-none">
              </div>
            </div>

            <div class="grid grid-cols-2 gap-5">
              <div>
                <label class="block text-sm font-bold text-slate-700 mb-2">Giá nhập</label>
                <input type="number" [(ngModel)]="form.importPrice" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[--theme-color-500] outline-none">
              </div>
              <div>
                <label class="block text-sm font-bold text-slate-700 mb-2">Giá bán</label>
                <input type="number" [(ngModel)]="form.price" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[--theme-color-500] outline-none font-bold text-[--theme-color-600]">
              </div>
            </div>

            <!-- Expense Checkbox (Only for New Products) -->
            @if (!isEditing) {
              <div class="bg-[--theme-color-50] p-4 rounded-xl border border-[--theme-color-100] flex items-start gap-3 animate-fade-in">
                <input type="checkbox" [(ngModel)]="recordExpense" class="mt-1 w-5 h-5 rounded text-[--theme-color-600] focus:ring-[--theme-color-500]">
                <div>
                  <label class="font-bold text-[--theme-color-900] text-sm">Tạo phiếu chi nhập hàng tự động?</label>
                  <p class="text-xs text-[--theme-color-600]">Hệ thống sẽ tạo 1 phiếu chi: Giá nhập x Số lượng tồn</p>
                </div>
              </div>
            }
          </div>

          <div class="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
            <button (click)="closeModal()" class="px-6 py-3 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors">Hủy bỏ</button>
            <button (click)="saveProduct()" class="px-8 py-3 bg-[--theme-color-600] text-white rounded-xl hover:bg-[--theme-color-700] font-bold shadow-lg shadow-[--theme-color-200] transform active:scale-95 transition-all">
              {{ isEditing ? 'Cập Nhật' : 'Lưu Sản Phẩm' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Quick Restock Modal -->
    @if (showRestockModal) {
       <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" (click)="closeRestock()"></div>
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden relative z-10 animate-scale-in">
          <div class="p-6 bg-emerald-50 border-b border-emerald-100">
            <h3 class="font-bold text-xl text-emerald-900">📥 Nhập Hàng Nhanh</h3>
            <p class="text-emerald-600 text-sm truncate">{{ restockForm.name }}</p>
          </div>
          
          <div class="p-6 space-y-4">
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-1">Số lượng nhập thêm</label>
              <input type="number" [(ngModel)]="restockForm.quantity" class="w-full px-4 py-3 border-2 border-emerald-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xl font-bold text-center text-emerald-700" placeholder="0">
            </div>
            
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-1">Giá nhập đơn vị</label>
              <input type="number" [(ngModel)]="restockForm.importPrice" class="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none">
            </div>

            <div class="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm flex justify-between">
              <span>Tổng chi phí:</span>
              <span class="font-bold text-slate-800">{{ (restockForm.quantity * restockForm.importPrice) | number }} đ</span>
            </div>
          </div>

          <div class="p-6 bg-slate-50 border-t border-slate-100 flex gap-4">
            <button (click)="closeRestock()" class="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-200 rounded-xl">Hủy</button>
            <button (click)="saveRestock()" class="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg">Xác nhận</button>
          </div>
        </div>
       </div>
    }
  `,
  styles: [`
    .animate-scale-in { animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes scaleIn { from { transform: scale(0.9) translateY(20px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
    .animate-fade-in { animation: fadeIn 0.5s ease; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  `]
})
export class ProductsComponent {
  dataService = inject(DataService);
  searchText = '';
  isLowStockFilter = false;
  
  showModal = false;
  isEditing = false;
  recordExpense = true;
  form: any = { id: '', name: '', category: 'Khác', price: 0, importPrice: 0, stock: 0, image: '' };
  showRestockModal = false;
  restockForm: any = { id: '', name: '', quantity: 0, importPrice: 0 };

  constructor() {
    effect(() => {
       const params = this.dataService.navParams();
       if (params && params.filter === 'low-stock') {
          this.isLowStockFilter = true;
       }
       if (params && params.searchTerm) {
          this.searchText = params.searchTerm;
       }
    });
  }

  get filteredProducts() {
    const term = this.searchText.toLowerCase();
    let list = this.dataService.products();
    if (this.isLowStockFilter) list = list.filter(p => p.stock < 5);
    return list.filter(p => p.name.toLowerCase().includes(term) || p.id.toLowerCase().includes(term) || p.category.toLowerCase().includes(term));
  }
  
  clearFilter() {
    this.isLowStockFilter = false;
    this.dataService.navParams.set(null);
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 2000000) { alert('File ảnh quá lớn! Vui lòng chọn ảnh < 2MB'); return; }
      const reader = new FileReader();
      reader.onload = (e: any) => { this.form.image = e.target.result; };
      reader.readAsDataURL(file);
    }
  }

  openModal() {
    this.isEditing = false;
    this.recordExpense = true;
    this.form = { name: '', category: 'Khác', price: 0, importPrice: 0, stock: 10, image: '' };
    this.showModal = true;
  }

  editProduct(product: Product) {
    this.isEditing = true;
    this.form = { ...product };
    this.showModal = true;
  }

  closeModal() { this.showModal = false; }

  saveProduct() {
    if (!this.form.name) return;
    if (!this.form.image) this.form.image = `https://picsum.photos/seed/${Date.now()}/200/200`;
    if (this.isEditing) {
      this.dataService.updateProduct(this.form.id, this.form);
    } else {
      const { id, ...newProduct } = this.form;
      const createdProduct = this.dataService.addProduct(newProduct);
      if (this.recordExpense && createdProduct.stock > 0 && createdProduct.importPrice > 0) {
        this.dataService.addTransaction({
          type: 'OUT',
          category: 'Nhập hàng',
          amount: createdProduct.importPrice * createdProduct.stock,
          note: `Nhập kho: ${createdProduct.name} (SL: ${createdProduct.stock})`,
          refId: createdProduct.id
        });
      }
    }
    this.closeModal();
  }

  deleteProduct(id: string) { if(confirm('Bạn có chắc muốn xóa sản phẩm này?')) this.dataService.deleteProduct(id); }

  openRestock(product: Product) {
    this.restockForm = { id: product.id, name: product.name, quantity: 10, importPrice: product.importPrice };
    this.showRestockModal = true;
  }

  closeRestock() { this.showRestockModal = false; }

  saveRestock() {
    if (this.restockForm.quantity <= 0) return;
    const currentProduct = this.dataService.products().find(p => p.id === this.restockForm.id);
    if (currentProduct) {
      this.dataService.updateProduct(this.restockForm.id, {
        stock: currentProduct.stock + this.restockForm.quantity,
        importPrice: this.restockForm.importPrice
      });
      const totalCost = this.restockForm.quantity * this.restockForm.importPrice;
      if (totalCost > 0) {
        this.dataService.addTransaction({
          type: 'OUT',
          category: 'Nhập hàng',
          amount: totalCost,
          note: `Nhập thêm: ${this.restockForm.name} (+${this.restockForm.quantity})`,
          refId: `IMP-${Date.now()}`
        });
      }
    }
    this.closeRestock();
  }
}
