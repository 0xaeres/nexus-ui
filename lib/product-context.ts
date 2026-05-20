'use client'
import { createContext, useContext } from 'react'
import type { Permissions, Product, ProductId, User, UserRole } from './types'

export type ProductPerms = Permissions

export type ProductContextValue = {
  currentProductId: ProductId
  currentProduct: Product | undefined
  currentUser: User
  perms: ProductPerms
  debugRole: UserRole | null
  // True while /me + /products are loading on app boot
  loading: boolean
}

export function getPerms(role: UserRole): ProductPerms {
  return {
    canManageSources: role !== 'sme',
    canRunCouncil: role !== 'sme',
    canOnboard: role === 'org_admin',
    isOrgAdmin: role === 'org_admin',
    settingsReadOnly: role === 'sme',
  }
}

// Sane defaults for the first paint before /me + /products resolve.
const PLACEHOLDER_USER: User = {
  id: 'unknown',
  name: 'Loading...',
  role: 'sme',
  products: [],
}

export const ProductContext = createContext<ProductContextValue>({
  currentProductId: 'forge',
  currentProduct: undefined,
  currentUser: PLACEHOLDER_USER,
  perms: getPerms('sme'),
  debugRole: null,
  loading: true,
})

export function useProduct() {
  return useContext(ProductContext)
}
