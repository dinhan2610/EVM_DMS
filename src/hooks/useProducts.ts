import { useState, useEffect } from 'react'
import productService, { type Product } from '@/services/productService'

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await productService.getProducts()
      setProducts(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products')
      console.error('Error fetching products:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchProductById = async (id: number): Promise<Product | null> => {
    setLoading(true)
    setError(null)
    try {
      const data = await productService.getProductById(id)
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch product')
      console.error('Error fetching product:', err)
      return null
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  return {
    products,
    loading,
    error,
    refetch: fetchProducts,
    fetchProductById,
  }
}
