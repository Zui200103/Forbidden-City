// joystick.js
const VirtualJoystick = () => {
    const [joystickPos, setJoystickPos] = React.useState({ x: 0, y: 0 });
    const [isTouching, setIsTouching] = React.useState(false);
    const [basePos, setBasePos] = React.useState({ x: 0, y: 0 });
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
                y: Math.sin(angle) * maxDistance
            };
        }
        return { x: deltaX, y: deltaY };
    }, []);

    const emitMovement = React.useCallback((x, y) => {
        const event = new CustomEvent('joystickMove', {
            detail: {
                x: x / maxDistance,
                y: y / maxDistance
            }
        });
        window.dispatchEvent(event);
    }, []);

    const handleTouchStart = (e) => {
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
        if (!isTouching) return;
        e.preventDefault();
        
        const touch = e.touches[0];
        const newPos = calculateJoystickPosition(touch.clientX, touch.clientY, basePos.x, basePos.y);
        setJoystickPos(newPos);
        emitMovement(newPos.x, newPos.y);
    };

    const handleTouchEnd = () => {
        setIsTouching(false);
        setJoystickPos({ x: 0, y: 0 });
        emitMovement(0, 0);
    };

    return React.createElement('div', {
        style: {
            position: 'fixed',
            bottom: '2rem',
            left: '2rem',
            touchAction: 'none'
        }
    },
        React.createElement('div', {
            style: {
                position: 'relative',
                width: joystickSize + 'px',
                height: joystickSize + 'px',
                borderRadius: '50%',
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                backdropFilter: 'blur(4px)'
            },
            onTouchStart: handleTouchStart,
            onTouchMove: handleTouchMove,
            onTouchEnd: handleTouchEnd
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
                    transition: 'transform 0.075s'
                }
            })
        )
    );
};

// 渲染搖桿組件
const container = document.getElementById('joystick-container');
const root = ReactDOM.createRoot(container);
root.render(React.createElement(VirtualJoystick));