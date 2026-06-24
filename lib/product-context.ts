'use client'
import { createContext, useContext } from 'react'
import type { Permissions, Product, ProductId, ProductRole, User, UserRole } from './types'

export type ProductPerms = Permissions

type ProductContextValue = {
  currentProductId: ProductId
  currentProduct: Product | undefined
  products: Product[]
  currentUser: User
  perms: ProductPerms
  memberships: Record<ProductId, ProductRole>
  // True while /me + /products are loading on app boot
  loading: boolean
}

export function getPerms(role: UserRole, productRole?: ProductRole | null): ProductPerms {
  const isOrgAdmin = role === 'admin'
  const canWriteProduct = isOrgAdmin || productRole === 'owner' || productRole === 'editor'
  return {
    canManageSources: canWriteProduct,
    canRunCouncil: canWriteProduct,
    canOnboard: true,
    isOrgAdmin,
    settingsReadOnly: !isOrgAdmin,
  }
}

// Sane defaults for the first paint before /me + /products resolve.
const PLACEHOLDER_USER: User = {
  id: 'unknown',
  name: 'Loading...',
  role: 'viewer',
  products: [],
}

export const ProductContext = createContext<ProductContextValue>({
  currentProductId: '',
  currentProduct: undefined,
  products: [],
  currentUser: PLACEHOLDER_USER,
  perms: getPerms('viewer'),
  memberships: {},
  loading: true,
})

export function useProduct() {
  return useContext(ProductContext)
}
