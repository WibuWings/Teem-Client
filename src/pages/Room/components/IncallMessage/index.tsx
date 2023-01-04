import { Button, Card, Input, Space } from 'antd'
import React from 'react'
import * as Icon from '@ant-design/icons'
import styles from './style.module.less'

type Props = {
  isCollapsed: boolean
  onCollapse: () => void
}

export function IncallMessage(props: Props) {
  return (
    <Card
      title="In-call message"
      className={styles.drawer}
      extra={
        <Button icon={<Icon.CloseOutlined />} type="text" onClick={props.onCollapse}></Button>
      }
      bodyStyle={{ display: 'flex', flexDirection: 'column', flex: 1 }}
    >
      <div className={styles['message-container']}>some message</div>
      <Space.Compact className={styles['message-input']}>
        <Input style={{ width: '100%' }}></Input>
        <Button type="primary" icon={<Icon.SendOutlined />}></Button>
      </Space.Compact>
    </Card>
  )
}
