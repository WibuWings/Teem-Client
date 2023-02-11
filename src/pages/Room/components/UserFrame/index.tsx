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
  isTurnOnCamera,
  isYou,
}: {
  user: Type
  isPin: boolean
  stream?: MediaStream
  muted: boolean
  isTurnOnCamera: boolean
  isYou: boolean
  onClickPin: (user: Type) => void
}): ReactElement {
  const params = useParams()

  // auto resize video
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const [isShowPinButton, setIsShowPinButton] = useState(false)


  useEffect(() => {
    const video = videoRef.current 

    if (video) {
      if (!stream ) {
        video.srcObject = null
      } else {
        stream.clone();
        video.srcObject = stream
        video.onloadedmetadata = function (e) {
          video.play()
        }
      }
    }
    else 
    {
      console.log(' video ' + (user as User).username + ' undefined')
    }

  }, [videoRef.current, stream])

  return (
    <div
      className={styles['user-frame']}
      onMouseOver={(e) => {
        setIsShowPinButton(true)
      }}
      onMouseOut={(e) => {
        setIsShowPinButton(false)
      }}
      style={{
        alignItems: 'center',
        justifyItems: 'center',
        backgroundColor: '#C5C5C5',
        borderRadius: '32px',
      }}
    >
      <Space
        style={{
          position: 'absolute',
          visibility: isShowPinButton ? 'visible' : 'hidden',
          zIndex: 1000,
          top: '20px',
          left: '20px',
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
      {stream === undefined ||
      
      stream?.getVideoTracks()?.[0]?.muted ||
      stream?.getVideoTracks()?.[0]?.readyState === 'ended' ?(
        <div style={{ height: '100%', width: '100%', position: 'relative' }}>
          <img
            className={styles.image}
            src={getResourceUrl(PAGE_INFO.USER_FRAME)}
            style={{
              height: '100%',
              width: '100%',
              objectFit: 'cover',
              position: 'absolute',
              top: '50%',
              right: '50%',
              minHeight: '10px',
              minWidth: '10px',
              maxHeight: '100px',
              maxWidth: '100px',
              marginTop: '-50px',
              marginRight: '-50px',
            }}
          />
          <h3
            style={{
              color: 'white',
              position: 'absolute',
              bottom: '0%',
              marginBottom: '24px',
              marginLeft: '24px',
              zIndex: 10,
            }}
          >
            {isYou ? 'You' : (user as User).username}
          </h3>
        </div>
      ) : (
        <div style={{ height: '100%', width: '100%', position: 'relative' }}>
          <video
            ref={videoRef}
            autoPlay
            muted={muted}
            playsInline
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              width: '100%',
              objectFit: 'contain',
              borderRadius: '32px',
              backgroundColor: 'transparent',
              maxHeight: window.innerHeight - 80,
              maxWidth: window.innerWidth - 40,
              minHeight: '30px',
              minWidth: '30px',
            }}
          />
          <h3
            style={{
              color: 'white',
              position: 'absolute',
              bottom: '0%',
              marginBottom: '24px',
              marginLeft: '24px',
            }}
          >
            {isYou ? 'You' : (user as User).username}
          </h3>
          {/* {stream?.getAudioTracks()?.[0]?.readyState === 'live' && (
            <Icon.AudioOutlined
              style={{
                color: 'white',
                position: 'absolute',
                bottom: '0%',
                marginBottom: '24px',
                right: '24px',
              }}
            ></Icon.AudioOutlined>
          )} */}
        </div>
      )}
    </div>
  )
}

export function OverflowUser({ numberOverflow }: { numberOverflow: number }) {
  return (
    <div className={styles['user-frame']}>
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <h3
          style={{
            color: 'white',
            textAlign: 'center',
          }}
        >
          + {numberOverflow} participants
        </h3>
      </div>
    </div>
  )
}
