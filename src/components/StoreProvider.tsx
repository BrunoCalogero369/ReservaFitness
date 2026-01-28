'use client'
import { ReactNode, useState } from 'react'
import { Provider } from 'react-redux'
import { makeStore, AppStore } from '../lib/store'

interface Props {
  children: ReactNode
}

export default function StoreProvider({ children }: Props) {
  // Usamos un estado para guardar el store. 
  // La función dentro de useState solo se ejecuta UNA VEZ al montar.
  const [store] = useState(() => makeStore())

  return <Provider store={store}>{children}</Provider>
}