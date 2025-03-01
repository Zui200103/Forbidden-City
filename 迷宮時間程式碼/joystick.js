// joystick.js
const VirtualJoystick = () => {
  const [joystickPos, setJoystickPos] = React.useState({ x: 0, y: 0 });
  const [isTouching, setIsTouching] = React.useState(false);
  const [basePos, setBasePos] = React.useState({ x: 0, y: 0 });
  
  // 新增狀態以儲存自訂位置
  const [joystickPosition, setJoystickPosition] = React.useState(() => {
    // 嘗試從 localStorage 讀取儲存的位置，如果沒有則使用預設值
    const savedPosition = localStorage.getItem('joystickPosition');
    return savedPosition ? JSON.parse(savedPosition) : { bottom: '2rem', left: '2rem' };
  });
  
  // 新增一個狀態來控制是否處於編輯模式
  const [isEditing, setIsEditing] = React.useState(false);
  
  // 檢測是否為移動設備
  const [isMobileDevice, setIsMobileDevice] = React.useState(false);
  
  // 在組件掛載時檢測設備類型
  React.useEffect(() => {
    const checkMobile = () => {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
             (window.matchMedia && window.matchMedia('(max-width: 767px)').matches);
    };
    
    setIsMobileDevice(checkMobile());
    
    // 監聽視窗大小變化以更新設備類型
    const handleResize = () => {
      setIsMobileDevice(checkMobile());
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const joystickSize = 100;
  const handleSize = 40;
  const maxDistance = 35;

  const calculateJoystickPosition = React.useCallback((touchX, touchY, baseX, baseY) => {
    const deltaX = touchX - baseX;
    const deltaY = touchY - baseY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance > maxDistance) {
      const angle = Math.atan2(deltaY, deltaX);
      return {
        x: Math.cos(angle) * maxDistance,
        y: Math.sin(angle) * maxDistance,
      };
    }
    return { x: deltaX, y: deltaY };
  }, []);

  const emitMovement = React.useCallback((x, y) => {
    const normalizedX = x / maxDistance;
    const normalizedY = y / maxDistance;
    console.log("Emitting movement:", { x: normalizedX, y: normalizedY });

    const event = new CustomEvent('joystickMove', {
      detail: { x: normalizedX, y: normalizedY },
    });
    window.dispatchEvent(event);
  }, []);

  const handleTouchStart = (e) => {
    // 如果在編輯模式，不觸發搖桿移動
    if (isEditing) return;
    
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const baseX = rect.left + rect.width / 2;
    const baseY = rect.top + rect.height / 2;

    setBasePos({ x: baseX, y: baseY });
    setIsTouching(true);

    const newPos = calculateJoystickPosition(touch.clientX, touch.clientY, baseX, baseY);
    setJoystickPos(newPos);
    emitMovement(newPos.x, newPos.y);
  };

  const handleTouchMove = (e) => {
    if (!isTouching || isEditing) return;
    e.preventDefault();

    const touch = e.touches[0];
    const newPos = calculateJoystickPosition(touch.clientX, touch.clientY, basePos.x, basePos.y);
    setJoystickPos(newPos);
    emitMovement(newPos.x, newPos.y);
  };

  const handleTouchEnd = () => {
    // 如果在編輯模式，不觸發搖桿結束事件
    if (isEditing) return;
    
    console.log("Joystick released");
    setIsTouching(false);
    setJoystickPos({ x: 0, y: 0 });

    // 新增 joystickEnd 事件
    const endEvent = new CustomEvent('joystickEnd', {
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(endEvent);
    emitMovement(0, 0);
  };
  
  // 處理拖動搖桿位置的邏輯
  const handleJoystickDrag = (e) => {
    if (!isEditing) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // 計算新位置（相對於視窗）
    const newPosition = {
      left: Math.max(0, Math.min(viewportWidth - joystickSize, touch.clientX - joystickSize / 2)),
      bottom: Math.max(0, Math.min(viewportHeight - joystickSize, viewportHeight - touch.clientY - joystickSize / 2))
    };
    
    // 轉換為CSS單位
    const positionStyle = {
      left: `${newPosition.left}px`,
      bottom: `${newPosition.bottom}px`
    };
    
    // 更新位置狀態
    setJoystickPosition(positionStyle);
    
    // 儲存到 localStorage
    localStorage.setItem('joystickPosition', JSON.stringify(positionStyle));
  };
  
  // 切換編輯模式 - 確保這是一個正確的處理函數
  const toggleEditMode = (e) => {
    e.preventDefault(); // 阻止默認行為
    e.stopPropagation(); // 阻止事件冒泡
    console.log("Toggle edit mode clicked, current state:", isEditing);
    setIsEditing(!isEditing);
  };

  // 只有在移動設備上並且不在編輯模式時才渲染搖桿
  const renderJoystick = () => {
    if (!isMobileDevice && !isEditing) return null;
    
    return React.createElement(
      'div',
      {
        style: {
          position: 'fixed',
          bottom: joystickPosition.bottom,
          left: joystickPosition.left,
          touchAction: 'none',
          transition: isEditing ? 'none' : 'all 0.3s ease',
          zIndex: 1000,
          display: (isMobileDevice || isEditing) ? 'block' : 'none'
        },
      },
      [
        // 搖桿本體
        React.createElement(
          'div',
          {
            key: 'joystick',
            style: {
              position: 'relative',
              width: joystickSize + 'px',
              height: joystickSize + 'px',
              borderRadius: '50%',
              backgroundColor: isEditing ? 'rgba(0, 100, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)',
              backdropFilter: 'blur(4px)',
              border: isEditing ? '2px dashed #0088ff' : 'none',
            },
            onTouchStart: isEditing ? handleJoystickDrag : handleTouchStart,
            onTouchMove: isEditing ? handleJoystickDrag : handleTouchMove,
            onTouchEnd: handleTouchEnd,
          },
          React.createElement('div', {
            style: {
              position: 'absolute',
              width: handleSize + 'px',
              height: handleSize + 'px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
              left: '50%',
              top: '50%',
              transform: `translate(calc(-50% + ${joystickPos.x}px), calc(-50% + ${joystickPos.y}px))`,
              transition: 'transform 0.075s',
            },
          })
        ),
        
        // 編輯模式提示
        isEditing && React.createElement(
          'div',
          {
            key: 'edit-message',
            style: {
              position: 'absolute',
              top: '-60px',
              left: '0',
              width: '120px',
              padding: '5px',
              background: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              borderRadius: '4px',
              fontSize: '12px',
              textAlign: 'center',
            }
          },
          '拖動搖桿到你喜歡的位置'
        )
      ]
    );
  };
  
  // 添加滑鼠事件支援
  const handleButtonClick = (e) => {
    console.log("Button clicked");
    toggleEditMode(e);
  };
  
  // 渲染編輯按鈕（固定在左上角）
  const renderEditButton = () => {
    // 只在移動設備上或編輯模式顯示編輯按鈕
    if (!isMobileDevice && !isEditing) return null;
    
    return React.createElement(
      'button',
      {
        onClick: handleButtonClick, // 使用新的處理函數
        onTouchStart: (e) => {
          e.preventDefault();
          handleButtonClick(e);
        },
        style: {
          position: 'fixed',
          top: '10px',
          left: '10px',
          padding: '8px',
          background: isEditing ? '#ff3333' : '#0088ff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '12px',
          cursor: 'pointer',
          zIndex: 1001,
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          userSelect: 'none', // 防止文字被選中
          touchAction: 'manipulation', // 優化觸控行為
        }
      },
      isEditing ? '完成' : '調整'
    );
  };

  // 為移動設備渲染搖桿和編輯按鈕
  // 為桌面設備僅在編輯模式下渲染
  return React.createElement(
    React.Fragment,
    null,
    [
      // 使用陣列確保兩個元素都能被正確渲染
      renderEditButton(),
      renderJoystick()
    ]
  );
};

// 渲染搖桿組件
const container = document.getElementById('joystick-container');
const root = ReactDOM.createRoot(container);
root.render(React.createElement(VirtualJoystick));
