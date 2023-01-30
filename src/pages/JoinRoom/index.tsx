import { PAGE_INFO } from '@/constants/page'
import { useSocketContext } from '@/hooks'
import { rc, RouteKey } from '@/routes'
import { getResourceUrl } from '@/transforms/url'
import { Button, Card, Form, Input } from 'antd'
import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import styles from './style.module.less'

export function JoinRoom() {
  const navigate = useNavigate()
  const { socket } = useSocketContext()
  const [form] = Form.useForm<{ roomCode: string }>()

  useEffect(() => {
    if (socket.disconnected) {
      socket.connect()
    }
  }, [socket])

  const handleJoinRoom = () =>
    form
      .validateFields()
      .then((value) => {
        navigate({ pathname: rc(RouteKey.Room).path, search: `?roomCode=${value.roomCode}` })
      })
      .catch((e) => console.error(e))
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
        <Form layout="inline" form={form}>
          <Form.Item
            name="roomCode"
            style={{ width: '100%' }}
            rules={[
              {
                required: true,
                message: 'Please enter a room ID',
              },
              {
                pattern: /^[a-zA-Z0-9-_]+$/,
                message: 'roomCode contains only characters a-z, - , and digits',
              },
            ]}
          >
            <Input.Search
              enterButton={<Button type="primary">JOIN ROOM</Button>}
              onSearch={handleJoinRoom}
              style={{ width: '100%' }}
              autoFocus={true}
            ></Input.Search>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
