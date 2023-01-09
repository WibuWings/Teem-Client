import { Button, Card, Input, Space, Typography } from 'antd'
import React, { useEffect, useState } from 'react'
import * as Icon from '@ant-design/icons'
import styles from './style.module.less'
import { MessageFrom, MessageType } from '@/models/message'
import moment from 'moment'
import { FORMAT } from '@/constants/date'
import { Form } from 'antd'
import { useAppDispatch, useAppSelector, useSocketContext } from '@/hooks'
import { pushMessage } from '../../slice'
import { SOCKET_EVENT } from '@/providers/Socket'

type Props = {
  isCollapsed: boolean
  onCollapse: () => void
}

export function IncallMessage(props: Props) {
  const { socket } = useSocketContext()
  const roomInfo = useAppSelector((state) => state.room)
  const dispatch = useAppDispatch()
  const [form] = Form.useForm<{ message: string }>()
  const handleSubmit = () => {
    form
      .validateFields()
      .then((value) => {
        socket.emit(SOCKET_EVENT.EMIT.SEND_MESSAGE, {
          roomCode: roomInfo.code,
          message: value.message,
        })
        form.setFieldValue('message', '')
      })
      .catch((err) => console.log(err))
  }

  useEffect(() => {
    socket.on(SOCKET_EVENT.ON.RECEIVE_MESSAGE, (data: any) => {
      dispatch(pushMessage(data))
    })

    // remove listen
    return () => {
      socket.off(SOCKET_EVENT.ON.RECEIVE_MESSAGE)
    }
  }, [])

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
        {roomInfo.messages.map((message, idx) => (
          <Message
            sender={message.sender.username}
            key={idx}
            data={message.content}
            type={MessageType.Text}
            from={message.sender.socketId === socket.id ? MessageFrom.Me : MessageFrom.Other}
          />
        ))}
      </div>
      <Space.Compact className={styles['message-input']}>
        <Button type="default" icon={<Icon.PaperClipOutlined />}></Button>
        <Form style={{ flex: 1 }} form={form} initialValues={{ message: '' }}>
          <Form.Item noStyle name="message" rules={[{ required: true }]}>
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
  sender: string
}

export function Message<Type>(props: MessageProps<Type>) {
  const [isVisibleTime, setIsVisibleTime] = useState(false)
  const isOther = props.from === MessageFrom.Other
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isOther ? 'row' : 'row-reverse',
        gap: 10,
        alignSelf: isOther ? 'start' : 'end',
      }}
    >
      <Typography.Text>{props.sender}</Typography.Text>
      <div
        style={{
          border: `1px solid ${isOther ? '#f5f5f5' : '#1890ff'}`,
          backgroundColor: isOther ? '#f5f5f5' : '#1890ff',
          maxWidth: '80%',
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
    </div>
  )
}
