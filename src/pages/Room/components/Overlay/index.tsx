import { PAGE_INFO } from '@/constants/page'
import { rc, RouteKey } from '@/routes'
import { getResourceUrl } from '@/transforms/url'
import { Button, Card, Form, Input, Space } from 'antd'
import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as Icon from '@ant-design/icons'

import styles from './style.module.less'

type Props = {
  stream?: MediaStream
  onEnterUserID: (username: string) => void | Promise<void>
  onToggleCam: (isOpenCam: boolean) => void
  onToggleMic: (isOpenMic: boolean) => void
}

export function Overlay(props: Props) {
  const [form] = Form.useForm<{ username: string }>()

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [isOpenMic, setIsOpenMic] = useState(false)
  const [isOpenCamera, setOpenCamera] = useState(false)

  // enter id
  const handleSubmit = () =>
    form
      .validateFields()
      .then((value) => {
        props.onEnterUserID(value.username)
      })
      .catch((error) => console.log(error))

  // controll handler
  const toggleOpenMic = () => {
    setIsOpenMic((cur) => !cur)
  }
  const toggleOpenCamera = () => {
    setOpenCamera((cur) => !cur)
  }

  useEffect(() => {
    props.onToggleMic(isOpenMic)
  }, [isOpenMic])

  useEffect(() => {
    props.onToggleCam(isOpenCamera)
  }, [isOpenCamera])

  useEffect(() => {
    if (videoRef.current && props.stream) {
      videoRef.current.srcObject = props.stream
      videoRef.current.onloadedmetadata = function (e) {
        videoRef.current?.play()
      }
    }
  }, [videoRef.current, props.stream])
  return (
    <div className={styles['form-wrapper']}>
      <Card className={styles.card}>
        {!isOpenCamera ? (
          <img
            className={styles.image}
            src={getResourceUrl(PAGE_INFO.JOIN_ROOM)}
            alt="some-image"
          />
        ) : (
          <video
            style={{
              backgroundColor: 'black',
            }}
            className={styles.image}
            ref={videoRef}
            muted
          />
        )}
        <Space
          className={styles['btn-control']}
          style={{ marginBottom: 20, width: '100%', justifyContent: 'center' }}
        >
          <Button
            type={isOpenMic ? 'primary' : 'default'}
            onClick={toggleOpenMic}
            icon={isOpenMic ? <Icon.AudioOutlined /> : <Icon.AudioMutedOutlined />}
            size="large"
          ></Button>
          <Button
            type={isOpenCamera ? 'primary' : 'default'}
            onClick={toggleOpenCamera}
            icon={isOpenCamera ? <Icon.CameraOutlined /> : <Icon.CameraOutlined />}
            size="large"
          ></Button>
        </Space>
        <Form layout="inline" initialValues={{ userID: '' }} form={form}>
          <Form.Item
            name="username"
            style={{ flex: 1 }}
            rules={[
              {
                required: true,
                message: 'Please enter a username',
              },
            ]}
          >
            <Input></Input>
          </Form.Item>
          <Button type="primary" onClick={handleSubmit}>
            ENTER NAME ID
          </Button>
        </Form>
      </Card>
    </div>
  )
}
