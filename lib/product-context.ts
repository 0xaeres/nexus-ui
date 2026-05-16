'use client'
import { createContext, useContext } from 'react'
import type { ProductId, UserRole } from './data'
import { NEXUS_PRODUCTS, NEXUS_USERS, NEXUS_CURRENT_USER_ID } from './data'

export type ProductPerms = {
  canManageSources: boolean
  canRunCouncil: boolean
  canOnboard: boolean
  isOrgAdmin: boolean
  settingsReadOnly: boolean
}

export type ProductContextValue = {
  currentProductId: ProductId
  currentProduct: typeof NEXUS_PRODUCTS[number] | undefined
  currentUser: typeof NEXUS_USERS[number]
  perms: ProductPerms
  debugRole: UserRole | null
}

export function getPerms(role: UserRole): ProductPerms {
  return {
    canManageSources: role !== 'sme',
    canRunCouncil:    role !== 'sme',
    canOnboard:       role === 'org_admin',
    isOrgAdmin:       role === 'org_admin',
    settingsReadOnly: role === 'sme',
  }
}

export const ProductContext = createContext<ProductContextValue>({
  currentProductId: 'forge',
  currentProduct: NEXUS_PRODUCTS[0],
  currentUser: NEXUS_USERS.find(u => u.id === NEXUS_CURRENT_USER_ID)!,
  perms: getPerms('org_admin'),
  debugRole: null,
})

export function useProduct() { return useContext(ProductContext) }
