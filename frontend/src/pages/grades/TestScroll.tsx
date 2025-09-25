import { useEffect, useState } from 'react'

export default function TestScroll() {
  const [computedStyles, setComputedStyles] = useState<string>('')

  useEffect(() => {
    // 检查所有父元素的overflow样式
    const checkOverflow = () => {
      const testDiv = document.getElementById('test-div-1')
      if (!testDiv) return

      let current: HTMLElement | null = testDiv
      const styles: string[] = []
      
      while (current) {
        const computed = window.getComputedStyle(current)
        const overflow = computed.overflow
        const overflowX = computed.overflowX
        const overflowY = computed.overflowY
        
        styles.push(`${current.tagName}.${current.className || 'no-class'}: overflow=${overflow}, overflow-x=${overflowX}, overflow-y=${overflowY}`)
        
        current = current.parentElement
      }
      
      setComputedStyles(styles.join('\n'))
    }

    setTimeout(checkOverflow, 100)
  }, [])

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>横向滚动调试页面</h1>
      
      {/* 测试1：使用!important的内联样式 */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '8px' }}>测试1：强制内联样式（!important）</h2>
        <div 
          id="test-div-1"
          style={{ 
            width: '100%', 
            maxWidth: '600px',
            overflow: 'auto !important',
            overflowX: 'auto !important',
            border: '3px solid red',
            padding: '10px'
          }}
        >
          <div style={{ 
            width: '2000px', 
            height: '100px', 
            background: 'linear-gradient(to right, blue, green, yellow, red)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: '20px'
          }}>
            这是一个2000px宽的内容 - 如果看不到滚动条，说明有父级元素阻止了滚动
          </div>
        </div>
      </div>

      {/* 测试2：iframe隔离测试 */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '8px' }}>测试2：iframe隔离环境</h2>
        <iframe
          srcDoc={`
            <div style="overflow-x: auto; border: 3px solid green; width: 400px;">
              <div style="width: 1000px; height: 50px; background: purple; color: white;">
                iframe内的滚动测试 - 这应该一定能滚动
              </div>
            </div>
          `}
          style={{ width: '100%', height: '100px', border: 'none' }}
        />
      </div>

      {/* 测试3：使用transform来模拟滚动 */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '8px' }}>测试3：使用按钮控制的假滚动</h2>
        <div style={{ 
          width: '100%', 
          maxWidth: '600px',
          overflow: 'hidden',
          border: '3px solid blue',
          position: 'relative'
        }}>
          <div 
            id="fake-scroll-content"
            style={{ 
              width: '2000px', 
              height: '100px', 
              background: 'linear-gradient(to right, orange, pink, cyan)',
              transition: 'transform 0.3s',
              transform: 'translateX(0px)'
            }}
          >
            使用按钮来左右移动这个内容
          </div>
        </div>
        <div style={{ marginTop: '10px' }}>
          <button 
            onClick={() => {
              const el = document.getElementById('fake-scroll-content')
              if (el) {
                const current = parseInt(el.style.transform.replace(/[^\d-]/g, '') || '0')
                el.style.transform = `translateX(${Math.min(0, current + 100)}px)`
              }
            }}
            style={{ marginRight: '10px', padding: '5px 10px' }}
          >
            ← 左移
          </button>
          <button 
            onClick={() => {
              const el = document.getElementById('fake-scroll-content')
              if (el) {
                const current = parseInt(el.style.transform.replace(/[^\d-]/g, '') || '0')
                el.style.transform = `translateX(${Math.max(-1400, current - 100)}px)`
              }
            }}
            style={{ padding: '5px 10px' }}
          >
            右移 →
          </button>
        </div>
      </div>

      {/* 显示计算样式 */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '8px' }}>父元素overflow检查结果：</h2>
        <pre style={{ 
          background: '#f5f5f5', 
          padding: '10px', 
          fontSize: '12px',
          overflowX: 'auto',
          whiteSpace: 'pre-wrap'
        }}>
          {computedStyles || '检查中...'}
        </pre>
      </div>

      {/* 测试4：直接操作scrollLeft */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '8px' }}>测试4：JavaScript控制滚动</h2>
        <div 
          id="js-scroll-test"
          style={{ 
            width: '100%', 
            maxWidth: '600px',
            overflowX: 'scroll',
            border: '3px solid purple'
          }}
        >
          <div style={{ 
            width: '2000px', 
            height: '100px', 
            background: 'linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            color: 'white'
          }}>
            JavaScript控制的滚动内容
          </div>
        </div>
        <div style={{ marginTop: '10px' }}>
          <button 
            onClick={() => {
              const el = document.getElementById('js-scroll-test')
              if (el) {
                el.scrollLeft = 0
              }
            }}
            style={{ marginRight: '10px', padding: '5px 10px' }}
          >
            滚动到开始
          </button>
          <button 
            onClick={() => {
              const el = document.getElementById('js-scroll-test')
              if (el) {
                el.scrollLeft = 1000
              }
            }}
            style={{ padding: '5px 10px' }}
          >
            滚动到中间
          </button>
        </div>
      </div>
    </div>
  )
}
