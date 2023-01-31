import { PAGE_INFO } from '@/constants/page'
import { rc, RouteKey } from '@/routes'
import { getResourceUrl } from '@/transforms/url'
import { Button, Card, Form, Input, Carousel } from 'antd'
import React from 'react'
import { useNavigate } from 'react-router-dom'

import styles from './style.module.less'

export function JoinRoom() {
  const navigate = useNavigate()
  const [form] = Form.useForm<{ roomCode: string }>()

  const handleJoinRoom = () =>
    form
      .validateFields()
      .then((value) => {
        navigate({ pathname: rc(RouteKey.Room).path, search: `?roomCode=${value.roomCode}` })
      })
      .catch((e) => console.error(e))
  return (
    <div className={styles['form-wrapper'] }
     style = {{ backgroundImage: `url("${getResourceUrl(PAGE_INFO.BACKGROUND)}") `   }}  >
     
      <Card 
        className={styles.card} 
        style ={{backgroundColor: 'transparent', 
        border: '1px solid transparent', 
      }}>  

         <img 
          className={styles.image}
          src={getResourceUrl(PAGE_INFO.JOIN_ROOM)}
          alt="some-image"
    
          />
       
        <div>
          <h1  style={{
            color: '#FFFFFF' , 
            textAlign: "center" }}>
              Welcome to Teem2ting, let's create a meeting and discover us ...
            </h1>
        </div>
        <div>
          <h3 style={{color: '#FFFFFF'}}>Create or join room with code</h3>
        </div>

        <Form layout="inline" form={form} >
          <Form.Item
            name="roomCode"
            style={{ flex: 1, fontWeight:500, }}
            
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
            <Input></Input>
          </Form.Item>
          <Button type="primary" onClick={handleJoinRoom} style={{fontWeight:600}}>
            JOIN ROOM
          </Button>
        </Form>
      </Card>

    </div>
  

  )
}
