import { Button, Card, Input, Space, Typography } from 'antd'
import React, { useEffect, useState } from 'react'
import * as Icon from '@ant-design/icons'
import styles from './style.module.less'
import { MessageFrom, MessageType } from '@/models/message'
import moment from 'moment'
import { FORMAT } from '@/constants/date'
import { Form } from 'antd'
import io from 'socket.io-client'
const socket = io('localhost:3000', {
  withCredentials: true,
  extraHeaders: {
    'my-custom-header': 'abcd',
  },
})

type Props = {
  isCollapsed: boolean
  onCollapse: () => void
}

export function IncallMessage(props: Props) {
  const [messages, setMessages] = useState<{ message: string; user: any }[]>([])
  const [form] = Form.useForm<{ message: string }>()
  const handleSubmit = () => {
    form
      .validateFields()
      .then((value) => {
        if (value.message) {
          socket.emit('chat message', {
            message: value.message,
            user: new Date(),
          })
        }
      })
      .catch((err) => console.log(err))
  }

  const [isConnected, setIsConnected] = useState(socket.connected)

  useEffect(() => {
    socket.on('connect', () => {
      setIsConnected(true)
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
    })

    socket.on('chat message', function (msg) {
      setMessages((cur) => [...cur, msg])
    })

    return () => {
      socket.off('connect')
      socket.off('disconnect')
      socket.off('chat message')
    }
  }, [])

  const sendPing = () => {
    socket.emit('ping')
  }

  return (
    <Card
      title="In-call message"
      className={styles.drawer}
      extra={
        <Button icon={<Icon.CloseOutlined />} type="text" onClick={props.onCollapse}></Button>
      }
      bodyStyle={{ display: 'flex', flexDirection: 'column', flex: 1 }}
    >
      <div className={styles['message-container']}>
        {messages.map((message, idx) => (
          <Message
            key={idx}
            data={message.message}
            type={MessageType.Text}
            from={MessageFrom.Me}
          />
        ))}
      </div>
      <Space.Compact className={styles['message-input']}>
        <Button type="default" icon={<Icon.PaperClipOutlined />}></Button>
        <Form style={{ flex: 1 }} form={form}>
          <Form.Item noStyle name="message">
            <Input style={{ width: '100%' }}></Input>
          </Form.Item>
        </Form>
        <Button type="primary" icon={<Icon.SendOutlined />} onClick={handleSubmit}></Button>
      </Space.Compact>
    </Card>
  )
}

export type MessageProps<Type> = {
  data: Type
  type: MessageType
  from: MessageFrom
}

export function Message<Type>(props: MessageProps<Type>) {
  const [isVisibleTime, setIsVisibleTime] = useState(false)
  const isOther = props.from === MessageFrom.Other
  return (
    <div
      style={{
        border: `1px solid ${isOther ? '#f5f5f5' : '#1890ff'}`,
        backgroundColor: isOther ? '#f5f5f5' : '#1890ff',
        maxWidth: '80%',
        alignSelf: isOther ? 'start' : 'end',
        padding: 8,
        borderRadius: 8,
      }}
      onMouseOver={() => setIsVisibleTime(true)}
      onMouseLeave={() => setIsVisibleTime(false)}
    >
      <Space direction="vertical">
        <Typography.Text style={{ color: isOther ? undefined : 'white' }}>
          {props.data}
        </Typography.Text>
        {isVisibleTime && (
          <Typography.Text italic type="secondary">
            {moment(new Date()).format(`${FORMAT.VI.TIME}`)}
          </Typography.Text>
        )}
      </Space>
    </div>
  )
}
