import { Typography } from 'antd'
import React from 'react'
import styles from './style.module.less'
export function PrepairRoom() {
  return (
    <div className={styles.loading}>
      <div className={styles.animation}>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
      <Typography.Text className={styles.text} disabled>
        Loading...
      </Typography.Text>
    </div>
  )
}
