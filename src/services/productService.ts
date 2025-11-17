import httpClient from '@/helpers/httpClient'
import type { AxiosResponse } from 'axios'

export interface ProductResponse {
  productID: number
  code: string
  name: string
  categoryID: number
  unit: string
  basePrice: number
  vatRate: number
  description: string
  isActive: boolean
  createdDate: string
  invoiceItems: unknown[]
}

export interface Product {
  id: number
  code: string
  name: string
  group: string
  categoryID: number
  unit: string
  salesPrice: number
  vatTaxRate: string
  discountRate: number
  discountAmount: number
  description: string
  status: 'active' | 'inactive'
  createdAt: string
}

export interface CreateProductRequest {
  code: string
  name: string
  categoryID: number
  unit: string
  basePrice: number
  vatRate: number
  description: string
  isActive: boolean
}

export interface UpdateProductRequest {
  code: string
  name: string
  categoryID: number
  unit: string
  basePrice: number
  vatRate: number
  description: string
  isActive: boolean
}

export interface CategoryResponse {
  categoryID: number
  code: string
  name: string
  description: string
  vatRate: number
  categoryType: string
  isTaxable: boolean
  isActive: boolean
  createdDate: string
  products: unknown[]
}

export interface CategoryNameResponse {
  categoryID: number
  name: string
}

export interface Category {
  id: number
  name: string
  vatRate: number
}

class ProductService {
  private readonly endpoint = '/Product'

  mapResponseToProduct(response: ProductResponse): Product {
    return {
      id: response.productID,
      code: response.code,
      name: response.name,
      group: 'hang-hoa',
      categoryID: response.categoryID,
      unit: response.unit.toLowerCase(),
      salesPrice: response.basePrice,
      vatTaxRate: `${response.vatRate}%`,
      discountRate: 0,
      discountAmount: 0,
      description: response.description || '',
      status: response.isActive ? 'active' : 'inactive',
      createdAt: response.createdDate,
    }
  }

  async getProducts(): Promise<Product[]> {
    const response: AxiosResponse<ProductResponse[]> = await httpClient.get(this.endpoint)
    return response.data.map(item => this.mapResponseToProduct(item))
  }

  async getProductById(id: number): Promise<Product> {
    const response: AxiosResponse<ProductResponse> = await httpClient.get(`${this.endpoint}/${id}`)
    return this.mapResponseToProduct(response.data)
  }

  async createProduct(data: CreateProductRequest): Promise<ProductResponse> {
    const response: AxiosResponse<ProductResponse> = await httpClient.post(`${this.endpoint}/create`, data)
    return response.data
  }

  async updateProduct(id: number, data: UpdateProductRequest): Promise<ProductResponse> {
    const response: AxiosResponse<ProductResponse> = await httpClient.put(`${this.endpoint}/${id}`, data)
    return response.data
  }

  async deleteProduct(id: number): Promise<void> {
    await httpClient.delete(`${this.endpoint}/${id}`)
  }

  async getCategories(): Promise<Category[]> {
    const response: AxiosResponse<CategoryResponse[]> = await httpClient.get(`${this.endpoint}/categories`)
    return response.data.map(cat => ({
      id: cat.categoryID,
      name: cat.name,
      vatRate: cat.vatRate,
    }))
  }

  async getCategoryById(id: number): Promise<CategoryResponse> {
    const response: AxiosResponse<CategoryResponse> = await httpClient.get(`${this.endpoint}/category/${id}`)
    return response.data
  }
}

export default new ProductService()
