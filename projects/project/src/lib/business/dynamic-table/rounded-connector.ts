/**
 * 创建圆角连接线参数接口
 */
interface RoundedLineOptions {
  color?: string;
  width?: number;
  radius?: number;
  path: number[][];
  container: HTMLElement | string;
}

/**
 * 创建简单圆角连接线参数接口
 */
interface SimpleRoundedLineOptions {
  color?: string;
  width?: number;
  radius?: number;
  container: HTMLElement | string;
  startX?: number;
  startY?: number;
  lineWidth?: number;
  lineHeight?: number;
}

/**
 * 创建圆角连接线
 * @param {RoundedLineOptions} options - 配置参数
 * @param {string} options.color - 线条颜色
 * @param {number} options.width - 线条宽度(px)
 * @param {number} options.radius - 拐角弧度(px)
 * @param {Array} options.path - 路径点数组，格式为[[x1,y1], [x2,y2], ...]
 * @param {HTMLElement|string} options.container - 容器元素或选择器
 * @returns {SVGElement} - 创建的SVG元素
 */
export function createRoundedLine(options: RoundedLineOptions): SVGElement | null {
    const {
        color = '#32d8e7',
        width = 2,
        radius = 20,
        path = [],
        container
    } = options;
    
    // 获取容器元素
    const containerElement = typeof container === 'string' 
        ? document.querySelector(container) 
        : container;
    
    if (!containerElement || path.length < 2) {
        console.error('容器不存在或路径点不足');
        return null;
    }
    
    // 创建SVG元素
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.overflow = 'visible';
    
    // 创建路径
    const svgPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    svgPath.setAttribute('fill', 'none');
    svgPath.setAttribute('stroke', color);
    svgPath.setAttribute('stroke-width', width.toString());
    
    // 构建路径数据
    let pathData = `M ${path[0][0]},${path[0][1]}`;
    
    for (let i = 1; i < path.length; i++) {
        const current = path[i];
        const prev = path[i-1];
        
        // 如果是最后一个点或只有两个点，直接连接
        if (i === path.length - 1 || path.length === 2) {
            pathData += ` L ${current[0]},${current[1]}`;
            continue;
        }
        
        const next = path[i+1];
        
        // 计算当前点到上一个点的方向
        const dirFromPrev = [current[0] - prev[0], current[1] - prev[1]];
        // 计算下一个点到当前点的方向
        const dirToNext = [next[0] - current[0], next[1] - current[1]];
        
        // 判断是否需要创建圆角
        // 当方向发生变化时创建圆角
        if ((dirFromPrev[0] !== 0 && dirToNext[1] !== 0) || 
            (dirFromPrev[1] !== 0 && dirToNext[0] !== 0)) {
            
            // 计算进入和离开圆角的点
            const enterRadius = [
                current[0] - Math.sign(dirFromPrev[0]) * Math.min(Math.abs(dirFromPrev[0]), radius),
                current[1] - Math.sign(dirFromPrev[1]) * Math.min(Math.abs(dirFromPrev[1]), radius)
            ];
            
            const exitRadius = [
                current[0] + Math.sign(dirToNext[0]) * Math.min(Math.abs(dirToNext[0]), radius),
                current[1] + Math.sign(dirToNext[1]) * Math.min(Math.abs(dirToNext[1]), radius)
            ];
            
            // 添加到路径：直线到进入点，然后二次贝塞尔曲线到离开点
            pathData += ` L ${enterRadius[0]},${enterRadius[1]}`;
            pathData += ` Q ${current[0]},${current[1]} ${exitRadius[0]},${exitRadius[1]}`;
            
            // 更新当前点到圆角出口点
            path[i] = exitRadius;
        } else {
            // 如果没有转弯，直接连接
            pathData += ` L ${current[0]},${current[1]}`;
        }
    }
    
    svgPath.setAttribute('d', pathData);
    svg.appendChild(svgPath);
    containerElement.appendChild(svg);
    
    return svg;
}

/**
 * 创建简单圆角连接线
 * @param {SimpleRoundedLineOptions} options - 配置参数
 * @param {string} options.color - 线条颜色
 * @param {number} options.width - 线条宽度(px)
 * @param {number} options.radius - 拐角弧度(px)
 * @param {HTMLElement|string} options.container - 容器元素或选择器
 * @param {number} options.startX - 起始X坐标，默认为0
 * @param {number} options.startY - 起始Y坐标，默认为0
 * @param {number} options.lineWidth - 线条宽度，用于计算水平线长度
 * @param {number} options.lineHeight - 线条高度，用于计算垂直线长度
 * @returns {SVGElement} - 创建的SVG元素
 */
export function createSimpleRoundedLine(options: SimpleRoundedLineOptions): SVGElement | null {
    const {
        color = '#32d8e7',
        width = 2,
        radius = 20,
        container,
        startX = 0,
        startY = 0,
        lineWidth = 300,  // 默认宽度
        lineHeight = 100  // 默认高度
    } = options;
    
    // 计算终点坐标
    const endX = startX + lineWidth;
    const cornerY = startY + lineHeight;
    
    // 计算路径点
    const path = [
        [startX, startY],           // 起始点
        [endX - radius, startY],    // 水平线终点前的点
        [endX, cornerY],            // 拐角后的点
        [endX, cornerY + lineHeight] // 结束点，默认向下再延伸一个lineHeight
    ];
    
    return createRoundedLine({
        color,
        width,
        radius,
        path,
        container
    });
} 