import { Button, Space } from 'antd'
import React, { useState } from 'react'
import { UserFrame } from '../UserFrame'
import styles from './style.module.less'

export function UserGrid() {
  const numberOfUser = 5

  const calculateColumn = (numUser: number): number => {
    return Math.ceil(Math.sqrt(numUser))
  }

  const calculateRow = (numUser: number): number => {
    return Math.ceil(numUser / Math.ceil(Math.sqrt(numUser)))
  }

  return (
    <div
      className={styles['user-grid']}
      style={{
        gridTemplateColumns: `repeat(${calculateColumn(numberOfUser)},1fr)`,
        gridTemplateRows: `repeat(${calculateRow(numberOfUser)}, 1fr)`,
      }}
    >
      {[...Array(numberOfUser).keys()].map((value) => (
        <UserFrame key={value} />
      ))}
    </div>
  )
}
