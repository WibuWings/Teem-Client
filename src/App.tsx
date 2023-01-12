/**
 * @file App component

 */

import React, { useEffect } from 'react'
import { Provider } from 'react-redux'
import { BrowserRouter, HashRouter, Route, Routes, Navigate, Outlet } from 'react-router-dom'
import { ENABLEd_HASH_ROUTER, ENV, VITE_ENV } from './config'
import { rc, RouteKey } from './routes'
import { store } from './store'
import { JoinRoom } from './pages/JoinRoom'
import { Room } from './pages/Room'
import { NotFoundPage } from './pages/NotFound'
import { SocketProvider } from './providers/Socket'
import { PeerProvider } from './providers/Peer'

// Router: WORKAROUND for outside
function RouterComponent(props: { children?: React.ReactNode }) {
  return ENABLEd_HASH_ROUTER ? (
    <HashRouter>{props.children}</HashRouter>
  ) : (
    <BrowserRouter>{props.children}</BrowserRouter>
  )
}

export function App() {
  useEffect(() => {
    console.info(`Run! env: ${ENV}, vite env: ${JSON.stringify(VITE_ENV)}`)
  }, [])

  return (
    <PeerProvider>
      <SocketProvider>
        <Provider store={store}>
          <div className="app" id="app">
            <RouterComponent>
              <Routes>
                <Route
                  index={true}
                  element={<Navigate to={rc(RouteKey.JoinRoom).path} replace />}
                />
                <Route path={rc(RouteKey.JoinRoom).path} element={<JoinRoom />} />
                <Route path={rc(RouteKey.Room).path} element={<Room />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </RouterComponent>
          </div>
        </Provider>
      </SocketProvider>
    </PeerProvider>
  )
}
