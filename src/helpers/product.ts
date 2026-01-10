// Legacy ecommerce product helper - kept for potential future use
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getDiscountAmount = (product: any): number => {
  return product.sale?.type == 'amount' ? product.sale.discount : product.sale?.type == 'percent' ? (product.price / 100) * product.sale.discount : 0
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getCalculatedPrice = (product: any): number => {
  return getPreciseCurrency(product.price - getDiscountAmount(product))
}

export const getPreciseCurrency = (price: number): number => {
  return parseFloat(price.toFixed(2))
}
