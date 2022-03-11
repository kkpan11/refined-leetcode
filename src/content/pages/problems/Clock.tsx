import React, { FC, useEffect, useState } from 'react'
import styled from 'styled-components/macro'

import { LeetCodeApi, SuccessCheckReturnType } from './leetcode-api'
import { sleep, submissionOnMarkChange } from './utils'
import { findElement } from '../../utils'
import { useTimer } from './useTimer'

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 14px;
`

const Content = styled.div`
  border-radius: 3px 0 0 3px;
  border: 1px solid palevioletred;
  border-right-width: 0;
  margin-left: 15px;
  padding: 6px 15px;
`

const Button = styled.button<{ primary?: boolean }>`
  background: transparent;
  border-radius: 0 3px 3px 0;
  border: 1px solid palevioletred;
  color: palevioletred;
  margin-right: 15px;
  padding: 6px 15px;
  width: 100px;
  text-align: center;
  cursor: pointer;
`

const Clock: FC = () => {
  const [leetCodeApi] = useState(new LeetCodeApi(location.origin))
  const [hidden, setHidden] = useState(false)

  const { time, isDone, done, restart } = useTimer()

  const handleHidden = () => {
    setHidden(hidden => !hidden)
  }

  async function getSubmissionId(): Promise<string> {
    return new Promise(function (resolve, reject) {
      const originalSend = XMLHttpRequest.prototype.send
      XMLHttpRequest.prototype.send = function (...args) {
        XMLHttpRequest.prototype.send = originalSend
        originalSend.apply(this, args)
        this.addEventListener('load', function () {
          try {
            const data = JSON.parse(this.responseText)
            resolve(data.submission_id + '')
          } catch (error) {
            reject(error)
          }
        })
      }
    })
  }

  async function check(
    submissionId: string,
    retry = 1
  ): Promise<SuccessCheckReturnType> {
    if (retry > 10) throw new Error('获取提交状态结果超时')

    await sleep(1000 + retry * 500)
    const state = await leetCodeApi.check(submissionId)

    if (state.state === 'SUCCESS') {
      return state
    } else {
      return await check(submissionId, retry + 1)
    }
  }

  useEffect(() => {
    let cancel: (() => void) | null = null

    void (async function () {
      const submitBtn = await findElement('.submit__-6u9')
      const handleClick: EventListenerOrEventListenerObject = async () => {
        const submissionId = await getSubmissionId()
        const state = await check(submissionId)

        if (state.status_msg === 'Accepted') {
          // 提交成功
          done(async time => {
            // 对当前提交添加备注
            await leetCodeApi.submissionCreateOrUpdateSubmissionComment(
              submissionId,
              'RED',
              time.map(t => t.toString().padStart(2, '0')).join(' : ')
            )

            submissionOnMarkChange(submissionId)
          })

          setHidden(false)
        }
      }

      submitBtn.addEventListener('click', handleClick)
      cancel = () => {
        submitBtn.removeEventListener('click', handleClick)
      }
    })()
    return () => {
      if (cancel) cancel()
    }
  }, [])

  return (
    <Container>
      {!hidden && (
        <Content>
          {`${isDone ? '本次耗时: ' : ''}${time
            .map(t => t.toString().padStart(2, '0'))
            .join(' : ')}`}
        </Content>
      )}
      {!isDone ? (
        <Button
          onClick={handleHidden}
          style={
            hidden ? { borderTopLeftRadius: 3, borderBottomLeftRadius: 3 } : {}
          }
        >
          {hidden ? '显示计时' : '隐藏'}
        </Button>
      ) : (
        <Button onClick={restart}>重新开始</Button>
      )}
    </Container>
  )
}

export default Clock
