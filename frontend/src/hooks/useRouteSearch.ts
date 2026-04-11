import { useState, useCallback } from 'react'
import { routeApi, type Route, type RouteMode, type UserType } from '../api'
import polyline from '@mapbox/polyline'

export interface SearchParams {
  origin: string
  destination: string
  originCoords: [number, number] | null
  destCoords: [number, number] | null
  userType: UserType
  budget: number | null
  routeMode: RouteMode
}

export function useRouteSearch() {
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ailaMessage, setAilaMessage] = useState<string | null>(null)
  const [noResultsInBudget, setNoResultsInBudget] = useState(false)

  const search = useCallback(async (params: SearchParams) => {
    if (!params.origin || !params.destination) {
      setError('Lagay muna ang simula at patutunguhan!')
      return
    }
    setLoading(true)
    setError(null)
    setRoutes([])
    setNoResultsInBudget(false)

    try {
      const originStr = params.originCoords
        ? `${params.originCoords[0]},${params.originCoords[1]}`
        : params.origin
      const destStr = params.destCoords
        ? `${params.destCoords[0]},${params.destCoords[1]}`
        : params.destination

      const data = await routeApi.search({
        origin: originStr,
        destination: destStr,
        user_type: params.userType,
        route_mode: params.routeMode,
        ...(params.budget ? { budget: params.budget } : {}),
      })

      if (data.error) {
        setError(data.error)
        setAilaMessage('Ay, may problema. Subukan mo ulit ha? 😅')
        return
      }

      if (data.no_results_in_budget) {
        setNoResultsInBudget(true)
        setAilaMessage(`Wala akong nakitang ruta na under ₱${params.budget}. Subukan nating taasan? 🤔`)
        return
      }

      // Decode polyline geometries into lat/lng paths
      const decoded = data.routes.map((route) => ({
        ...route,
        legs: route.legs.map((leg) => ({
          ...leg,
          path: leg.geometry ? polyline.decode(leg.geometry) as [number, number][] : [],
        })),
      }))

      setRoutes(decoded)
      setAilaMessage(data.aila_tip || '🎉 Nahanap ko na ang ruta!')
    } catch (e: any) {
      const msg = e?.response?.data?.detail || 'Hindi makakonek sa server. 📡'
      setError(msg)
      setAilaMessage('Nag-disconnect yata tayo. Subukan mo ulit!')
    } finally {
      setLoading(false)
    }
  }, [])

  const clear = useCallback(() => {
    setRoutes([])
    setError(null)
    setAilaMessage(null)
    setNoResultsInBudget(false)
  }, [])

  return { routes, loading, error, ailaMessage, noResultsInBudget, search, clear, setAilaMessage }
}