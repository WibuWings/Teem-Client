import { Button, Card, Input, Space, Typography, Upload } from 'antd'
import React, { useEffect, useState } from 'react'
import * as Icon from '@ant-design/icons'
import styles from './style.module.less'
import { MessageFrom } from '@/models/message'
import moment from 'moment'
import { FORMAT } from '@/constants/date'
import { Form } from 'antd'
import { useAppDispatch, useAppSelector, useSocketContext } from '@/hooks'
import { pushMessage } from '../../slice'
import { SOCKET_EVENT } from '@/providers/Socket'
import { useUploadFileMutation } from '../../apiSlice'
import { MessageType } from '../../model'
import { http } from '@/services/axiosHelper'
import axios from 'axios'
import { isDev } from '@/config'

type Props = {
  isCollapsed: boolean
  onCollapse: () => void
}

export function IncallMessage(props: Props) {
  const { socket } = useSocketContext()
  const roomInfo = useAppSelector((state) => state.room)
  const dispatch = useAppDispatch()
  const [upload, { isLoading: isLoadingUpload }] = useUploadFileMutation()
  const [form] = Form.useForm<{ message: string }>()
  const handleSubmit = () => {
    form
      .validateFields()
      .then((value) => {
        socket?.emit(SOCKET_EVENT.EMIT.SEND_MESSAGE, {
          message: value.message,
        })
        form.setFieldValue('message', '')
      })
      .catch((err) => console.log(err))
  }

  useEffect(() => {
    socket?.on(SOCKET_EVENT.ON.RECEIVE_MESSAGE, (data: any) => {
      dispatch(pushMessage(data))
    })

    // remove listen
    return () => {
      socket?.off(SOCKET_EVENT.ON.RECEIVE_MESSAGE)
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
            type={message.typeMessage}
            from={message.sender.socketId === socket?.id ? MessageFrom.Me : MessageFrom.Other}
          />
        ))}
      </div>
      <Space.Compact className={styles['message-input']}>
        <Upload
          beforeUpload={(e) => {
            console.log(e)
            const formData = new FormData()
            formData.append('files', e)
            upload(formData)
              .unwrap()
              .then((value) => {
                socket?.emit(SOCKET_EVENT.EMIT.SEND_MESSAGE, {
                  message: value.data.url,
                  typeMessage: MessageType.File,
                })
              })
              .catch((e) => console.log(e))
            return false
          }}
          showUploadList={false}
          maxCount={1}
        >
          <Button
            loading={isLoadingUpload}
            type="default"
            icon={<Icon.PaperClipOutlined />}
          ></Button>
        </Upload>
        <Form style={{ flex: 1 }} form={form} initialValues={{ message: '' }}>
          <Form.Item noStyle name="message" rules={[{ required: true }]}>
            <Input.Search
              enterButton={<Button type="primary" icon={<Icon.SendOutlined />}></Button>}
              onSearch={handleSubmit}
              style={{ width: '100%' }}
              autoFocus={true}
            ></Input.Search>
          </Form.Item>
        </Form>
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
  const [isVisibleDownLoad, setIsVisibleDownLoad] = useState(false)
  const isOther = props.from === MessageFrom.Other
  const splitedMessage = (props.data as string).split('/')

  const handleDownload = () => {
    http
      .request({
        url: (isDev ? 'http://' : 'https://') + (props.data as string),
        method: 'GET',
        responseType: 'blob', // important
      })
      .then((response) => {
        const href = URL.createObjectURL(response.data)

        // create "a" HTML element with href to file & click
        const link = document.createElement('a')
        link.href = href
        link.setAttribute('download', splitedMessage[splitedMessage.length - 1]) //or any other extension
        document.body.appendChild(link)
        link.click()

        // clean up "a" element & remove ObjectURL
        document.body.removeChild(link)
        URL.revokeObjectURL(href)
      })
  }
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
          display: 'flex',
          gap: 8,
          flexDirection: !isOther ? 'row-reverse' : 'row',
          borderRadius: 8,
        }}
        onMouseOver={() => {
          setIsVisibleTime(true)
          setIsVisibleDownLoad(true)
        }}
        onMouseLeave={() => {
          setIsVisibleTime(false)
          setIsVisibleDownLoad(false)
        }}
      >
        <Space direction="vertical">
          <Typography.Text style={{ color: isOther ? undefined : 'white' }}>
            {props.type === MessageType.File
              ? splitedMessage[splitedMessage.length - 1]
              : props.data}
            {props.type === MessageType.File && (
              <Typography.Text strong italic style={{ color: isOther ? undefined : 'white' }}>
                {' (file)'}
              </Typography.Text>
            )}
          </Typography.Text>
          {isVisibleTime && (
            <Typography.Text italic type="secondary">
              {moment(new Date()).format(`${FORMAT.VI.TIME}`)}
            </Typography.Text>
          )}
        </Space>
        {props.type === MessageType.File && isVisibleDownLoad && (
          <Space>
            <Button onClick={() => handleDownload()} icon={<Icon.DownloadOutlined />}></Button>
          </Space>
        )}
      </div>
    </div>
  )
}
