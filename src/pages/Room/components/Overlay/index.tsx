import { PAGE_INFO } from '@/constants/page'
import { rc, RouteKey } from '@/routes'
import { getResourceUrl } from '@/transforms/url'
import { Button, Card, Form, Input, Space } from 'antd'
import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as Icon from '@ant-design/icons'

import styles from './style.module.less'

type Props = {
  onEnterUserID: (username: string) => void | Promise<void>
}

export function Overlay(props: Props) {
  const [form] = Form.useForm<{ username: string }>()

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [isOpenMic, setIsOpenMic] = useState(true)
  const [isOpenCamera, setOpenCamera] = useState(true)
  const [mediaStream, setMediaStream] = useState<MediaStream | undefined>()

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

  // get media streams
  const getMediaStreams = async (camera: boolean, mic: boolean) => {
    let All_mediaDevices = navigator.mediaDevices
    if (!All_mediaDevices || !All_mediaDevices.getUserMedia) {
      alert('Camera not supported.')
      return
    }

    try {
      const media = await All_mediaDevices.getUserMedia({
        audio: mic,
        video: camera,
      })

      setMediaStream(media)
      const video = videoRef.current

      if (video) {
        video.srcObject = media
        video.onloadedmetadata = function (e) {
          video.play()
        }
      }
    } catch (err: any) {
      console.log(err.name + ': ' + err.message)
    }
  }

  useEffect(() => {
    if (isOpenCamera || isOpenMic) {
      getMediaStreams(isOpenCamera, isOpenMic)
    }
    if (!isOpenMic) {
      mediaStream?.getAudioTracks()?.[0]?.stop()
    }
    if (!isOpenCamera) {
      mediaStream?.getVideoTracks()?.[0]?.stop()
    }
  }, [isOpenCamera, isOpenMic])
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
