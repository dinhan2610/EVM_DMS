# 🔧 Fix XLSX Import Error in Vite

## ❌ Lỗi Gặp Phải

```
Uncaught SyntaxError: The requested module '/node_modules/.vite/deps/xlsx.js?v=66352fc7' 
does not provide an export named 'default'
```

---

## 🔍 Nguyên Nhân

XLSX library sử dụng **CommonJS** module system, nhưng Vite mong đợi **ES Modules**.  
Khi import static (`import XLSX from 'xlsx'`), Vite không thể resolve được export.

---

## ✅ Giải Pháp 1: Dynamic Import (Khuyến nghị)

### Before (❌ Lỗi)
```typescript
import * as XLSX from 'xlsx'

const handleFileUpload = (file: File) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    const workbook = XLSX.read(data, { type: 'array' })
    // ...
  }
  reader.readAsArrayBuffer(file)
}
```

### After (✅ Hoạt động)
```typescript
// Không import ở đầu file

const handleFileUpload = async (file: File) => {
  const reader = new FileReader()
  
  reader.onload = async (e) => {
    // Dynamic import XLSX khi cần dùng
    const XLSX = await import('xlsx')
    
    const workbook = XLSX.read(data, { type: 'array' })
    const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })
    // ...
  }
  
  reader.readAsArrayBuffer(file)
}
```

**Ưu điểm**:
- ✅ Code splitting: Chỉ load XLSX khi user import Excel
- ✅ Performance: Giảm bundle size ban đầu
- ✅ Tương thích Vite: Không cần config thêm

---

## ✅ Giải Pháp 2: Vite Config (Optional)

Nếu muốn dùng static import, cần config Vite:

### vite.config.ts
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['xlsx'],
    esbuildOptions: {
      target: 'esnext',
    },
  },
})
```

**Lưu ý**: 
- Cần clear cache: `rm -rf node_modules/.vite`
- Restart dev server: `npm run dev`

---

## 🚀 Cách Đã Áp Dụng

### 1. Loại Bỏ Static Import
```diff
- import * as XLSX from 'xlsx'
```

### 2. Thêm Dynamic Import
```typescript
const handleFileUpload = useCallback(async (file: File) => {
  const reader = new FileReader()

  reader.onload = async (e) => {
    try {
      // Dynamic import
      const XLSX = await import('xlsx')
      
      // Parse Excel
      const data = new Uint8Array(e.target?.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: 'array' })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })
      
      // Process data...
    } catch (error) {
      console.error('Excel import error:', error)
    }
  }

  reader.readAsArrayBuffer(file)
}, [])
```

### 3. Vite Config (Đã thêm optimizeDeps)
```typescript
// vite.config.ts
export default defineConfig({
  optimizeDeps: {
    include: ['xlsx'],
    esbuildOptions: {
      target: 'esnext',
    },
  },
})
```

---

## 🧪 Testing

### 1. Start Dev Server
```bash
npm run dev
```

### 2. Navigate to Create Statement
```
http://localhost:5173/statements/new
```

### 3. Test Excel Import
- Drag & drop file `.xlsx`
- Hoặc click "Chọn file Excel"
- Kiểm tra console: Không có lỗi XLSX

### 4. Expected Result
```
✓ File uploaded successfully
✓ Data parsed to JSON
✓ Items displayed in DataGrid
```

---

## 📦 Alternative Libraries

Nếu vẫn gặp vấn đề, có thể thử:

### 1. **xlsx-js-style** (Fork of XLSX)
```bash
npm install xlsx-js-style
```

### 2. **exceljs** (Pure ESM)
```bash
npm install exceljs
```

### 3. **papaparse** (CSV only)
```bash
npm install papaparse
```

---

## 🐛 Troubleshooting

### Lỗi: "Cannot find module 'xlsx'"
```bash
npm install xlsx --legacy-peer-deps
rm -rf node_modules/.vite
npm run dev
```

### Lỗi: "XLSX is not defined"
- Kiểm tra dynamic import: `const XLSX = await import('xlsx')`
- Đảm bảo `async/await` đúng syntax

### Lỗi: "reader.onload is not a function"
- FileReader API: Đảm bảo `new FileReader()`
- Check browser compatibility

---

## 📚 References

- [XLSX Documentation](https://docs.sheetjs.com/)
- [Vite CommonJS Handling](https://vitejs.dev/guide/dep-pre-bundling.html)
- [MDN FileReader API](https://developer.mozilla.org/en-US/docs/Web/API/FileReader)

---

## ✅ Kết Luận

**Dynamic import** là giải pháp tốt nhất cho XLSX + Vite:
- ✅ Không cần config phức tạp
- ✅ Better performance (code splitting)
- ✅ Tương thích 100% với Vite

**Trạng thái hiện tại**: ✅ Fixed & Working
