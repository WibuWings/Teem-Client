import { Button, Space } from 'antd'
import { type } from 'os'
import React, { ReactElement, useState } from 'react'
import { OverflowUser, UserFrame } from '../UserFrame'
import styles from './style.module.less'

const MAX_USER_COLUMN = 3
export function UserGrid<Type>({
  pinUser,
  users = [],
  renderItems,
}: {
  pinUser?: Type
  users: Type[]
  renderItems: (item: Type, index: number) => ReactElement
}): ReactElement {
  const calculateColumn = (numUser: number): number => {
    return Math.ceil(Math.sqrt(numUser))
  }
  const calculateRow = (numUser: number): number => {
    return Math.ceil(numUser / Math.ceil(Math.sqrt(numUser)))
  }
  return (
    <div className={styles.wrapper}>
      {pinUser !== undefined ? (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'strecth',
            justifyContent: 'center',
            gap: '20px',
          }}
        >
          <div style={{ height: '64%', backgroundColor: 'yellow' }}>
            {renderItems(pinUser, 0)}
          </div>
          <div
            style={{
              height: '20%',
              gap: '4px',
              display: 'grid',
              gridTemplateColumns: `repeat(${MAX_USER_COLUMN + 1},1fr)`,
              gridTemplateRows: `repeat(1, 1fr)`,
            }}
          >
            {users
              .filter((u) => u != pinUser)
              .slice(0, MAX_USER_COLUMN)
              .map(renderItems)}
            {users.length - 1 - MAX_USER_COLUMN > 0 && (
              <OverflowUser numberOverflow={users.length - 1 - MAX_USER_COLUMN} />
            )}
          </div>
        </div>
      ) : (
        <div
          className={styles['user-grid']}
          style={{
            gridTemplateColumns: `repeat(${calculateColumn(users.length)},1fr)`,
            gridTemplateRows: `repeat(${calculateRow(users.length)}, 1fr)`,
          }}
        >
          {users.map(renderItems)}
        </div>
      )}
    </div>
  )
}
