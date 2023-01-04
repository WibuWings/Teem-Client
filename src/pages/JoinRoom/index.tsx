import { PAGE_INFO } from '@/constants/page'
import { rc, RouteKey } from '@/routes'
import { getResourceUrl } from '@/transforms/url'
import { Button, Card, Form, Input } from 'antd'
import React from 'react'
import { useNavigate } from 'react-router-dom'

import styles from './style.module.less'

export function JoinRoom() {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  return (
    <div className={styles['form-wrapper']}>
      <Card className={styles.card}>
        <img
          className={styles.image}
          src={getResourceUrl(PAGE_INFO.JOIN_ROOM)}
          alt="some-image"
        />
        <div>
          <h1>Some description</h1>
        </div>
        <Form layout="inline">
          <Form.Item
            name="roomID"
            style={{ flex: 1 }}
            rules={[
              {
                required: true,
                message: 'Please enter a room ID',
              },
            ]}
          >
            <Input></Input>
          </Form.Item>
          <Button
            type="primary"
            onClick={() => {
              navigate(rc(RouteKey.Room).path)
            }}
          >
            JOIN ROOM
          </Button>
        </Form>
      </Card>
    </div>
  )
}
