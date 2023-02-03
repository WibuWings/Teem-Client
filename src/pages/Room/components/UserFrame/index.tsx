import { Button, Card, Space, Spin } from 'antd'
import React, { ReactElement, useEffect, useRef, useState } from 'react'
import * as Icon from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { rc, RouteKey } from '@/routes'
import styles from './style.module.less'
import { getResourceUrl } from '@/transforms/url'
import { PAGE_INFO } from '@/constants/page'
import { User } from '../../model'


export function UserFrame<Type>({
  user,
  isPin,
  onClickPin,
  stream,
  muted,
  isTurnOnCamera
}: {
  user: Type
  isPin: boolean
  stream?: MediaStream
  muted: boolean
  isTurnOnCamera:boolean
  onClickPin: (user: Type) => void
}): ReactElement {
  const params = useParams()
  const navigate = useNavigate()
  // auto resize video
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [isOpenMic, setIsOpenMic] = useState(false)

  const [isOpenCam, setIsOpenCam] = useState(false)

  // controll handler
  const toggleOpenMic = () => {
    setIsOpenMic((cur) => !cur)
  }
  const leaveCall = () => {
    navigate(rc(RouteKey.JoinRoom).path)
  }

  useEffect(() => {
    const video = videoRef.current
    if (video) {
      if (!stream) {
        video.srcObject = null
      } else {
        video.srcObject = stream
        video.onloadedmetadata = function (e) {
          video.play()
        }
      }
    }
  }, [videoRef.current, stream])

  return (
    <div
      className={styles['user-frame']}
      onMouseOver={(e) => {
        setIsOpenCam(true)
      }}
      onMouseOut={(e) => {
        setIsOpenCam(false)
      }}
      style = {{alignItems: 'center', justifyItems: 'center', backgroundColor: '#C5C5C5',  borderRadius: '32px',}}
    >
    
      <Space
        style={{
          position: 'absolute',
          visibility: isOpenCam ? 'visible' : 'hidden',
          zIndex: 1000,
          marginTop: '20px',
          marginLeft: '20px'
        }}
      >
        <Button
          type={isPin ? 'primary' : 'default'}
          onClick={() => {
            onClickPin(user)
          }}
          icon={<Icon.PushpinOutlined />}
          size="small"
        ></Button>
      </Space>      
      {isTurnOnCamera === false ? 
      (
        <div style={{height:'100%', width:'100%', position: 'relative',  }}>
          <img
          className={styles.image}
          src={getResourceUrl(PAGE_INFO.USER_FRAME)}
          style={{ 
            height: '100px', 
            width: '100px', 
            objectFit: 'cover',
            position: 'absolute', 
            top : '50%', 
            right: '50%', 
            marginTop: '-50px', 
            marginRight: '-50px'}}
        />
        <h3 style={{
          color: 'white' , 
          position: 'absolute', 
          bottom: '0%',
          marginBottom: '24px', 
          marginLeft: '24px'}}>
          {(user as User).username}
        </h3>
        </div>
       
      ):
      (
        <div style={{height:'100%', width:'100%', position: 'relative',}}>
          <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{ 
            height: '100%', 
            width: '100%', 
            objectFit: 'contain', 
            borderRadius: '32px',
            backgroundColor: 'transparent',
            maxHeight: window.innerHeight - 80 ,
            maxWidth: window.innerWidth - 40,
          }}
        />
        <h3 style={{
          color: 'white' , 
          position: 'absolute', 
          bottom: '0%',
          marginBottom: '24px', 
          marginLeft: '24px'}}>
          {(user as User).username}
        </h3>
        </div>

      )}
     
    </div>
  )
}

export function OverflowUser({ numberOverflow }: { numberOverflow: number }) {
  return <div className={styles['user-frame']}>+{numberOverflow}</div>
}
